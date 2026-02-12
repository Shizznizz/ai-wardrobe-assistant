# Persistence Bugs — P0 / P1

**Date:** 2026-02-12
**Auditor:** Claude (automated)

---

## P0 Bugs (Data Correctness / Security)

### P0-1: Fallback outfit queries leak data cross-user + include soft-deleted rows

**Files:**
- `src/hooks/useSeasonalOutfits.ts:68-71`
- `src/hooks/useTrendingOutfits.ts:43-46`

**Repro:**
1. Log in as User A with outfits
2. Trigger the seasonal/trending fallback (e.g. when the edge function returns no data)
3. The fallback query `supabase.from('outfits').select('*').limit(10)` runs with NO `user_id` and NO `deleted_at` filter

**Impact:** RLS at the DB level prevents returning other users' rows, so no actual cross-user leak. However:
- Soft-deleted outfits ARE returned and rendered
- The query intent is clearly wrong — should be scoped to user

**Fix:** Add `.eq('user_id', user.id).is('deleted_at', null)` to both fallback queries.

---

### P0-2: OutfitTabSection soft-delete missing user_id guard

**File:** `src/components/outfits/mix-match/OutfitTabSection.tsx:170-172`

**Repro:**
1. User clicks delete on an outfit
2. The soft-delete query is `.from('outfits').update({ deleted_at: ... }).eq('id', outfitToDelete)` — NO `.eq('user_id', user.id)`

**Impact:** RLS prevents actual cross-user mutation, but the missing user_id guard means the client code is relying entirely on RLS. Defense-in-depth requires the client to also filter.

**Fix:** Add `.eq('user_id', user.id)` to the update query.

---

### P0-3: Edge functions accept userId from request body — no JWT verification

**FIXED** (2026-02-12) — see `supabase/functions/_shared/auth.ts` and each function below.

**Functions patched:**

| Edge Function | File | Status |
|---------------|------|--------|
| `chat-with-olivia` | `supabase/functions/chat-with-olivia/index.ts` | **FIXED** — `requireUser(req)` + `enforceUserIdMatch()` |
| `generate-instant-outfits` | `supabase/functions/generate-instant-outfits/index.ts` | **FIXED** — `requireUser(req)` + `enforceUserIdMatch()` |
| `save-outfit-feedback` | `supabase/functions/save-outfit-feedback/index.ts` | **FIXED** — `requireUser(req)` + `enforceUserIdMatch()` |
| `analyze-user-patterns` | `supabase/functions/analyze-user-patterns/index.ts` | **FIXED** — `requireUser(req)` (no body userId) |
| `generate-style-summary` | `supabase/functions/generate-style-summary/index.ts` | **FIXED** — `requireUser(req)` (no body userId) |

**Shared helper:** `supabase/functions/_shared/auth.ts` — exports `requireUser(req)`, `enforceUserIdMatch()`, `authErrorResponse()`, `AuthError`.

**What changed:**
- Each function now extracts the JWT from `Authorization: Bearer <token>` and calls `supabase.auth.getUser(token)` to verify identity
- `userId` is taken ONLY from the verified JWT (`user.id`), never from the request body
- If `body.userId` is present and doesn't match the JWT user, the function returns 403
- Missing or invalid tokens return 401
- SERVICE_ROLE_KEY is still used for DB operations, but all queries use the verified `user.id`

**Client compatibility:** No client changes needed — Supabase JS `functions.invoke()` automatically attaches the session JWT in the Authorization header.

---

## P1 Bugs (Stale Data / UX Degradation)

### P1-1: 12 client queries missing `deleted_at` filter

Soft-deleted clothing items and outfits appear in:

| # | File | Line | Table |
|---|------|------|-------|
| 1 | `src/components/fitting-room/OutfitCustomizationSection.tsx` | 36 | clothing_items |
| 2 | `src/components/fitting-room/OutfitSelectionSection.tsx` | 44 | clothing_items |
| 3 | `src/components/fitting-room/OutfitSelectionSection.tsx` | 73 | outfits |
| 4 | `src/components/fitting-room/OutfitSelectionTabs.tsx` | 44 | outfits |
| 5 | `src/components/OutfitMatchModal.tsx` | 40 | clothing_items |
| 6 | `src/services/SmartRemindersService.ts` | 113 | clothing_items |
| 7 | `src/components/outfits/OutfitCalendar.tsx` | 152 | outfits |
| 8 | `src/components/outfits/calendar/OutfitLogForm.tsx` | 61 | outfits |
| 9 | `src/components/outfits/calendar/OutfitSelectorDialog.tsx` | 48 | outfits |
| 10 | `src/components/outfits/mix-match/OutfitItemReplacement.tsx` | 38 | clothing_items |
| 11 | `src/components/showroom/OutfitSelectionSection.tsx` | 46 | outfits |
| 12 | `src/components/olivia/DailySuggestionsWidget.tsx` | 49 | outfits |

**Repro:** Soft-delete an outfit or clothing item, then navigate to the Fitting Room, Calendar, or Outfit Log Form. The deleted item still appears.

**Fix:** Add `.is('deleted_at', null)` to each query.

---

### P1-2: localStorage keys not scoped by user — cross-user data leak on shared browser

**Affected keys:**

| Key | File | Data Leaked |
|-----|------|-------------|
| `savedOutfits` | `OutfitMatchModal.tsx:191` | Locally cached outfit objects |
| `completedQuizzes` | `QuizResult.tsx:60` | Quiz completion state (backup only — primary persistence is DB via `saveQuizResult()`) |
| `style_summary_cache` | `QuizResults.tsx:71` | AI-generated style summary |
| `weatherPreferences` | `MixAndMatch.tsx:36` | User's weather location |
| `olivia_seasonal_outfits` | `useSeasonalOutfits.tsx:30` | Cached seasonal outfit data |

**Repro:**
1. User A logs in, completes quizzes, saves outfits
2. User A logs out
3. User B logs in on same browser
4. User B sees User A's quiz completion status, cached AI summary, and locally saved outfits

**Fix:** Prefix all localStorage keys with `user.id` (e.g. `savedOutfits_${userId}`), and clear non-scoped keys on logout.

---

### P1-3: Double-submit unprotected on outfit creation

**Files:**
- `src/components/OutfitBuilder.tsx:140` — `handleSaveOutfit` has no in-flight guard
- `src/components/OutfitMatchModal.tsx:160` — `handleSaveOutfit` has no in-flight guard

**Repro:** Double-click "Save Outfit" button rapidly. Two identical outfits are created.

**Fix:** Add `isSaving` state guard (same pattern as ShopAndTry fixpack).

---

### P1-4: OutfitBuilder upsert doesn't check user_id

**File:** `src/components/OutfitBuilder.tsx:146`

```typescript
const { data: existingOutfit } = await supabase
  .from('outfits')
  .select('id')
  .eq('id', newOutfit.id)
  .maybeSingle();
```

**Issue:** The existence check uses only `.eq('id', ...)` without `.eq('user_id', user.id)`. If an outfit ID collides (unlikely with UUIDs but defense-in-depth), the update could target a wrong row. RLS prevents actual damage.

**Fix:** Add `.eq('user_id', user.id)` to the check.

---

## Summary

| Severity | Count | Category |
|----------|-------|----------|
| **P0** | 3 (1 FIXED) | Missing user_id on client queries (2 open), edge functions accepting unverified userId (**FIXED** — 5 functions now enforce JWT) |
| **P1** | 4 | Missing deleted_at (12 queries), localStorage not user-scoped (5 keys), double-submit (2 handlers), missing user_id guard (1 upsert) |

---

*Report generated 2026-02-12*
