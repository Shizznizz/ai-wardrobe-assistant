# Persistence Reliability Report

**Date:** 2026-02-12
**Auditor:** Claude (automated)
**Scope:** Personalized Journey Persistence Contract

---

## A. Data Isolation & RLS Audit

### User-Owned Tables & RLS Policies

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Enforces `auth.uid() = user_id`? |
|-------|:-----------:|:------:|:------:|:------:|:------:|:--------------------------------:|
| `profiles` | Yes | Yes | Yes | Yes | No | `id = auth.uid()` |
| `user_preferences` | Yes | Yes | Yes | Yes | No | Yes |
| `clothing_items` | Yes | Yes | Yes | Yes | Yes | Yes |
| `outfits` | Yes | Yes | Yes | Yes | Yes | Yes |
| `outfit_logs` | Yes | Yes | Yes | Yes | Yes | Yes |
| `wishlist` | Yes | Yes | Yes | No | Yes | Yes |
| `user_quiz_results` | Yes | Yes | Yes | Yes | No | Yes |
| `daily_suggestions` | Yes | Yes | Yes | No | No | Yes |
| `smart_reminders` | Yes | Yes | Yes | Yes | Yes | Yes |
| `fashion_trends` | Yes | Yes | No | No | No | Global (no user_id) |
| `user_chat_limits` | Yes | Yes | Yes | Yes | No | Yes |
| `instant_outfits_saved` | Yes | Yes | Yes | No | Yes | Yes |

### Edge Function Auth Verification

| Edge Function | Verifies JWT? | Trusts client userId? | Notes |
|---------------|:-------------:|:---------------------:|-------|
| `chat-with-olivia` | **YES** (FIXED) | No | `requireUser(req)` + `enforceUserIdMatch()` via `_shared/auth.ts` |
| `generate-daily-suggestions` | N/A (service role) | N/A | Runs as cron, iterates user_chat_limits |
| `generate-instant-outfits` | **YES** (FIXED) | No | `requireUser(req)` + `enforceUserIdMatch()` via `_shared/auth.ts` |
| `generate-seasonal-outfits` | N/A (service role) | N/A | Service role; queries without user scope |
| `get-trending-outfits` | N/A (service role) | N/A | Aggregates outfit_usage across all users (intentional) |
| `save-outfit-feedback` | **YES** (FIXED) | No | `requireUser(req)` + `enforceUserIdMatch()` via `_shared/auth.ts` |
| `analyze-user-patterns` | **YES** (FIXED) | No | `requireUser(req)` via `_shared/auth.ts` |
| `generate-style-summary` | **YES** (FIXED) | No | `requireUser(req)` via `_shared/auth.ts` |

> **FIXED (2026-02-12):** All 5 user-scoped edge functions now verify the JWT from the `Authorization` header and use only the verified `user.id`. The `_shared/auth.ts` helper was added to centralize this logic. See `persistence-bugs-p0-p1.md` P0-3 for full details.

### Client-Side user_id Filtering Gaps

| File | Line | Table | Issue |
|------|------|-------|-------|
| `src/hooks/useSeasonalOutfits.ts` | 68-71 | `outfits` | **P0**: Fallback query has NO `user_id` filter AND no `deleted_at` filter |
| `src/hooks/useTrendingOutfits.ts` | 43-46 | `outfits` | **P0**: Fallback query has NO `user_id` filter AND no `deleted_at` filter |
| `src/components/olivia/DailySuggestionsWidget.tsx` | 49 | `outfits` | Uses `.in('id', ...)` — IDs from user-scoped `daily_suggestions`, but missing `deleted_at` |

> **Note:** RLS at the database level prevents cross-user data leaks for the first two items, but the intent is clearly incorrect and the queries return soft-deleted rows.

---

## B. Persistence Reliability — Page-by-Page

### /my-wardrobe

| Aspect | Detail |
|--------|--------|
| **Read path** | `useWardrobeData` → `supabase.from('clothing_items').select('*').eq('user_id', user.id).is('deleted_at', null)` |
| **Write path** | `addClothingItem` → `supabase.from('clothing_items').insert(...)` |
| **Delete path** | `deleteClothingItem` → soft-delete via `.update({ deleted_at: ... })` |
| **Tables** | `clothing_items` |
| **Fake saves** | None |
| **localStorage** | None |
| **Risks** | None identified |

### /mix-and-match

| Aspect | Detail |
|--------|--------|
| **Read path** | `useWardrobeData` → clothing_items + outfits (both filtered by user_id + deleted_at) |
| **Write path** | `addOutfit` → `supabase.from('outfits').insert(...)` |
| **Tables** | `clothing_items`, `outfits` |
| **Fake saves** | None |
| **localStorage** | `weatherPreferences` — NOT scoped by user ID (**P1**) |
| **Risks** | Weather prefs persist across user sessions on same browser |

### /style-planner

| Aspect | Detail |
|--------|--------|
| **Read path** | `useCalendarState` → `getOutfitLogs(user.id)` from `outfit_logs` |
| **Write path** | `addOutfitLog` → `saveSBOutfitLog(user.id, log)` to `outfit_logs` |
| **Delete path** | `deleteOutfitLog` → `supabase.from('outfit_logs').delete()` |
| **Tables** | `outfit_logs`, `outfits` (for validation) |
| **Fake saves** | None (localStorage paths removed in fixpack) |
| **localStorage** | None remaining |
| **Risks** | Outfit validation checks outfits with deleted_at filter — correct |

### /profile

| Aspect | Detail |
|--------|--------|
| **Read path** | `supabase.from('user_preferences').select('*').eq('user_id', userId)` + `profiles` table |
| **Write path** | `saveUserPreferences` in `client.ts` — upsert pattern |
| **Tables** | `user_preferences`, `profiles` |
| **Fake saves** | None |
| **localStorage** | None |
| **Risks** | None identified |

### /quizzes + /quiz-results

| Aspect | Detail |
|--------|--------|
| **Read path** | `QuizService.getUserQuizResults(userId)` from `user_quiz_results` |
| **Write path** | `QuizService.saveQuizResult(userId, ...)` to `user_quiz_results` |
| **Tables** | `user_quiz_results`, `user_preferences` |
| **Fake saves** | None |
| **localStorage** | `CACHE_KEY` for style summary (24h TTL), `RATE_LIMIT_KEY` — NOT scoped by user (**P1**) |
| **Risks** | Summary cache key `style_summary_cache` not user-scoped — User B could see User A's cached summary |

### /shop-and-try

| Aspect | Detail |
|--------|--------|
| **Read path** | Mock data only (no DB reads for item display) |
| **Write path (wardrobe)** | `addClothingItem` via `useWardrobeData` — persists to `clothing_items` |
| **Write path (wishlist)** | `persistWishlistItem` → `supabase.from('wishlist').insert(...)` |
| **Write path (look)** | `addOutfit` via `useWardrobeData` — only includes real DB IDs |
| **Tables** | `clothing_items`, `wishlist`, `outfits` |
| **Fake saves** | None remaining (all fixed in fixpack) |
| **localStorage** | None |
| **Risks** | None after fixpack |

### /fitting-room

| Aspect | Detail |
|--------|--------|
| **Read path** | `useShowroom` (mock data) + fitting-room components query DB directly |
| **Write path** | `handleSaveLook` → `supabase.from('outfits').insert(...)` with empty items (demo data) |
| **Tables** | `outfits`, `clothing_items` (read for customization) |
| **Fake saves** | None remaining |
| **localStorage** | `previewOutfit` — transient, NOT user-scoped (**P2**) |
| **Risks** | Fitting room DB queries missing `deleted_at` filter (see Section C) |

---

## C. Soft-Delete Filter Audit

### Missing `.is('deleted_at', null)` on SELECT queries

| File | Line | Table | Severity |
|------|------|-------|----------|
| `src/components/fitting-room/OutfitCustomizationSection.tsx` | 36 | `clothing_items` | **P1** |
| `src/components/fitting-room/OutfitSelectionSection.tsx` | 44 | `clothing_items` | **P1** |
| `src/components/fitting-room/OutfitSelectionSection.tsx` | 73 | `outfits` | **P1** |
| `src/components/fitting-room/OutfitSelectionTabs.tsx` | 44 | `outfits` | **P1** |
| `src/components/OutfitMatchModal.tsx` | 40 | `clothing_items` | **P1** |
| `src/services/SmartRemindersService.ts` | 113 | `clothing_items` | **P1** |
| `src/components/outfits/OutfitCalendar.tsx` | 152 | `outfits` | **P1** |
| `src/components/outfits/calendar/OutfitLogForm.tsx` | 61 | `outfits` | **P1** |
| `src/components/outfits/calendar/OutfitSelectorDialog.tsx` | 48 | `outfits` | **P1** |
| `src/components/outfits/mix-match/OutfitItemReplacement.tsx` | 38 | `clothing_items` | **P1** |
| `src/components/showroom/OutfitSelectionSection.tsx` | 46 | `outfits` | **P1** |
| `src/components/olivia/DailySuggestionsWidget.tsx` | 49 | `outfits` | **P1** |
| `src/hooks/useSeasonalOutfits.ts` | 69 | `outfits` | **P0** (also missing user_id) |
| `src/hooks/useTrendingOutfits.ts` | 44 | `outfits` | **P0** (also missing user_id) |

### Correctly filtered (confirmed)

| File | Line | Table |
|------|------|-------|
| `src/hooks/useWardrobeData.tsx` | 28, 115 | clothing_items, outfits |
| `src/hooks/useOutfitContext.tsx` | 59, 93 | outfits, clothing_items |
| `src/pages/Home.tsx` | 78, 88 | clothing_items |
| `src/components/OutfitGrid.tsx` | 48 | outfits |
| `src/hooks/useCalendarState.tsx` | 81 | outfits (validation) |
| `supabase/functions/chat-with-olivia` | 147-148 | clothing_items, outfits |
| `supabase/functions/generate-daily-suggestions` | 45-46 | clothing_items, outfits |
| `supabase/functions/generate-seasonal-outfits` | 178, 224 | outfits |
| `supabase/functions/get-trending-outfits` | 93 | outfits |

---

## D. localStorage Audit

### User-Scoped (Correct)

| Key Pattern | File | Scoped By |
|-------------|------|-----------|
| `olivia_chat_{userId\|guest}` | `OliviaChatPanel.tsx` | user.id |
| `selectedActivity` | `StyleQuiz.tsx` | Session-only, harmless |

### NOT User-Scoped (Risk of Cross-User Leak)

| Key | File | Risk | Severity |
|-----|------|------|----------|
| `savedOutfits` | `OutfitMatchModal.tsx:191` | User B sees User A's locally cached outfits | **P1** |
| `weatherPreferences` | `MixAndMatch.tsx:36` | User B sees User A's weather location | **P1** |
| `style_summary_cache` | `QuizResults.tsx:71` | User B sees User A's cached AI summary | **P1** |
| `olivia_seasonal_outfits` | `useSeasonalOutfits.tsx:30` | User B sees User A's seasonal outfit cache | **P1** |
| `previewOutfit` | `OutfitGrid.tsx:104` | Transient, low risk | **P2** |
| `olivia-onboarding-completed` | `useOnboardingState.tsx:6` | User B sees User A's onboarding state | **P2** |
| `olivia-hide-tips` | `useOliviaAssistant.tsx:25` | User B sees User A's tip preference | **P2** |
| `olivia-last-feedback` | `useOliviaAssistant.tsx:30` | User B sees User A's feedback | **P2** |
| `oliviaTipsProgress` | `OliviaTips.tsx:42` | User B sees User A's tip progress | **P2** |
| `completedQuizzes` | `QuizResult.tsx:60` | User B sees User A's quiz completion state | **P1** |

---

## E. Double-Submit & Race Condition Audit

### Protected (have in-flight guards)

| Handler | File | Guard |
|---------|------|-------|
| `handleSaveToWardrobe` | `ShopAndTry.tsx` | `isSavingWardrobe` |
| `persistWishlistItem` | `ShopAndTry.tsx` | `isSavingWishlist` |
| `handleSaveLook` | `ShopAndTry.tsx` | `isSavingLook` |
| `handleSaveLook` | `useShowroom.tsx` | `isSavingLook` |

### Unprotected (potential double-submit)

| Handler | File | Risk |
|---------|------|------|
| `handleSaveOutfit` | `OutfitBuilder.tsx:140` | No in-flight guard — double-click creates duplicate outfits |
| `handleSaveOutfit` | `OutfitMatchModal.tsx:160` | No in-flight guard |
| `handleToggleFavorite` | `OutfitGrid.tsx:130` | No guard — rapid clicks cause race condition |

---

## F. Integrity Summary

### Outfit Items Referencing Real IDs

| Context | Status | Notes |
|---------|--------|-------|
| Mix & Match outfit creation | **OK** | Items come from user's wardrobe (real IDs) |
| Shop & Try Save Look | **OK** (fixed) | Uses `savedItemIds` map to translate mock → real DB IDs |
| Fitting Room Save Look | **OK** (fixed) | Saves with empty items array (demo data, not real IDs) |
| OutfitBuilder | **OK** | Uses wardrobe items |

### Tombstone Handling (Deleted Outfit References)

| Context | Status | Notes |
|---------|--------|-------|
| `useCalendarState.validateOutfit` | **OK** | Checks `deleted_at IS NULL` before validating |
| OutfitLogForm / OutfitSelectorDialog | **NOT OK** | Lists include soft-deleted outfits (missing filter) |
| OutfitCalendar outfit existence check | **NOT OK** | Missing `deleted_at` filter |

---

*Report generated 2026-02-12*
