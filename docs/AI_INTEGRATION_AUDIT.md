# AI/LLM Integration Readiness Audit

**Date**: 2025-12-29
**Purpose**: Map current AI/LLM implementation, identify integration points, and assess readiness for extending AI features

---

## 1. Instant Outfit Moment: Current Implementation

### Data Source
- **Service**: `src/services/InstantOutfitService.ts`
- **Method**: Local static database lookup (NO AI)
- **Database**: Hardcoded `outfitDatabase` object (lines 16-288)
  - Structure: `outfitDatabase[StyleVibe][Occasion][WeatherCondition]` → array of outfits
  - Contains ~24 pre-curated outfits across combinations
  - Fallback: `generateFallbackOutfits()` for uncovered combinations (lines 322-368)

### Generation Logic
```typescript
// Line 302-320
export function generateInstantOutfits(
  styleVibe: StyleVibe,
  occasion: Occasion,
  weather: WeatherInfo | null,
  manualWeather?: WeatherCondition
): InstantOutfit[]
```
- No external API calls
- No machine learning models
- Pure JavaScript object lookup

### Save Functionality
- **File**: `src/components/home/InstantOutfitMoment.tsx`
- **Line**: 100 (`setSavedOutfits(prev => new Set(prev).add(outfitId))`)
- **Persistence**: **UI-only** (React state, NOT saved to Supabase)
- **Behavior**:
  - Logged out: Toast notification prompts signup (line 90-96)
  - Logged in: Updates local state only, does NOT insert into `outfits` or `outfit_logs` tables

### AI Integration Opportunity
**Status**: Ready for LLM replacement
**Current inputs available**: `styleVibe`, `occasion`, `weather` (mocked), `hasWardrobeItems` (boolean)
**Potential**: Could call OpenAI API to generate personalized outfits instead of static lookup

---

## 2. Existing OpenAI/LLM Integrations

### Active LLM Features (Backend Only)

#### A. Olivia Chat (`chat-with-olivia`)
- **File**: `supabase/functions/chat-with-olivia/index.ts` (484 lines)
- **Model**: OpenAI GPT-4o-mini (line 426)
- **Frontend**: `src/components/outfits/OliviaStyleChatDialog.tsx` (lines 153-158)
- **Invocation**: `supabase.functions.invoke('chat-with-olivia', { body: { messages, userId } })`
- **Context Provided**:
  - User preferences, wardrobe items (50 most recent)
  - Outfits (15 favorites/most worn)
  - Outfit logs (5 most recent)
  - Profile info, pronouns
  - Learning data (20 recent entries)
  - Calendar events (next 5)
  - Fashion trends (5 current season)
  - Weather data
- **Rate Limiting**: YES (enforced via `user_chat_limits` table)
  - Free users: 5 messages/day
  - Premium users: Unlimited
  - Logic: Lines 27-63 (checks count, resets daily)

#### B. Daily Suggestions (`generate-daily-suggestions`)
- **File**: `supabase/functions/generate-daily-suggestions/index.ts` (237 lines)
- **Model**: OpenAI (via API, line 18: `OPENAI_API_KEY`)
- **Usage**: Scheduled Edge Function (batch processing for all users with reminders enabled)
- **Context**: Wardrobe, outfits, preferences, weather, trends
- **Frontend Access**: `src/services/DailySuggestionsService.ts` queries `daily_suggestions` table
- **No direct invocation** from frontend (runs server-side on schedule)

#### C. Seasonal Outfits (`generate-seasonal-outfits`)
- **File**: `supabase/functions/generate-seasonal-outfits/index.ts` (356 lines)
- **Model**: OpenAI (line 36: `OPENAI_API_KEY`)
- **Frontend**: `src/hooks/useSeasonalOutfits.tsx` calls `supabase.functions.invoke('generate-seasonal-outfits')`
- **Context**: Location, wardrobe items, existing outfits, preferences

### Other Edge Functions (No LLM)
- `analyze-user-patterns` (178 lines) - Pattern analysis, no OpenAI
- `sync-fashion-trends` (197 lines) - Trend syncing, mentions GPT but unclear usage
- `get-trending-outfits` (152 lines) - Database queries only
- `remove-background` (159 lines) - BRIA-RMBG 1.4 model (not OpenAI)
- `get-weather` (109 lines) - Weather API (mocked in practice)
- `save-outfit-feedback` (71 lines) - Database insert only
- `generate-image` (247 lines) - Image generation (implementation unclear)

---

## 3. Supabase Environment Variables & Server-Side Runtime

### Frontend (Client-Side)
- **File**: `src/integrations/supabase/client.ts`
- **Lines**: 7-8
- **HARDCODED VALUES** (NOT using `import.meta.env`):
  ```typescript
  const supabaseUrl = 'https://aaiyxtbovepseasghtth.supabase.co';
  const supabaseAnonKey = 'eyJhbGci...'; // Anon key
  ```
- **Security**: Anon key is safe for client-side (RLS enforced)
- **Issue**: URL and key are committed to source control (should use env vars)

### Edge Functions (Server-Side)
All Edge Functions use `Deno.env.get()` for environment variables:
- **Common vars**:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, bypasses RLS)
  - `SUPABASE_ANON_KEY` (some functions)
  - `OPENAI_API_KEY` (3 functions: chat, daily suggestions, seasonal outfits)
  - `OPENWEATHER_API_KEY` (generate-seasonal-outfits, unused in practice)

**Evidence**:
- `chat-with-olivia/index.ts:17-18`
- `generate-daily-suggestions/index.ts:16-17`
- `generate-seasonal-outfits/index.ts:36-39`

### Runtime Environment
- **Platform**: Supabase Edge Functions (Deno runtime)
- **Deployment**: Managed by Supabase
- **No custom server**: All backend logic runs as Edge Functions
- **Frontend**: Static React app (Vite build)

---

## 4. Rate Limiting Implementation

### Database Table: `user_chat_limits`
- **Schema**: `src/integrations/supabase/types.ts:610-625`
  ```typescript
  {
    id: string
    user_id: string
    message_count: number
    last_message_at: string
    is_premium: boolean
    created_at: string
    updated_at: string
  }
  ```

### Backend Enforcement
- **File**: `supabase/functions/chat-with-olivia/index.ts`
- **Lines**: 27-63
- **Logic**:
  1. Query `user_chat_limits` table for user (line 28-32)
  2. Check if last message was today (line 40-46)
  3. Reset count if new day, otherwise use existing count
  4. Block request if free user (is_premium=false) has sent 5+ messages (line 50-63)
  5. Return 429 status with `limitReached: true`
  6. Update count after successful message (line 443-458)

### Frontend Display
- **File**: `src/components/outfits/OliviaStyleChatDialog.tsx`
- **Lines**: 63-100
- **Behavior**:
  - Fetches message count on dialog open (line 68-72)
  - Shows upgrade prompt if limit reached (line 88-90)
  - Updates count from API response (line 171-173)
  - Disables input when limit reached (line 176-178)

### Current Usage
- **Only used for**: Olivia chat feature
- **Not used for**: Instant Outfit Moment, daily suggestions, seasonal outfits
- **Premium bypass**: Admin users or users with `is_premium=true` in table

---

## 5. AI Integration Readiness Assessment

### Ready to Extend ✅
1. **Instant Outfit Moment** → Could replace static database with OpenAI API
   - Inputs: `styleVibe`, `occasion`, `weather`, `user_id` (if authenticated)
   - Output: 3 outfit suggestions (title, items, reasoning)
   - Rate limiting: Could reuse `user_chat_limits` pattern

2. **Additional Olivia features** → Backend already has OpenAI integration
   - Could add outfit feedback analysis
   - Could add style learning from saved outfits
   - Could add trend prediction

### Partially Implemented ⚠️
1. **Daily Suggestions** → Backend LLM exists, frontend queries table
   - Scheduled processing works
   - Could add real-time suggestions via Edge Function invocation

2. **Seasonal Outfits** → Frontend hook exists, Edge Function ready
   - Hook: `src/hooks/useSeasonalOutfits.tsx`
   - Could expand to more occasions

### Blockers ❌
1. **Hardcoded Supabase credentials** in frontend (should use env vars)
2. **No persistence** for Instant Outfit saves (UI state only)
3. **Weather is mocked** (not real API despite OPENWEATHER_API_KEY)

---

## 6. Recommendations for AI Enhancement

### Immediate Actions
1. **Fix environment variables**:
   - Move `supabaseUrl` and `supabaseAnonKey` to `.env` and use `import.meta.env.VITE_*`
   - Update `src/integrations/supabase/client.ts` (lines 7-8)

2. **Add persistence for Instant Outfit saves**:
   - Insert into `outfits` table when logged-in user clicks Save
   - Show saved outfits in My Wardrobe or separate section

3. **Add rate limiting to Instant Outfit generation**:
   - If implementing AI generation, reuse `user_chat_limits` pattern
   - Free users: 10 generations/day
   - Premium users: Unlimited

### Future Enhancements
1. **Replace Instant Outfit static DB with LLM**:
   - Create new Edge Function: `generate-instant-outfit`
   - Use OpenAI GPT-4o-mini with context: `styleVibe`, `occasion`, `weather`, minimal wardrobe hints
   - Return 3 outfits in same format as current service

2. **Implement real weather API**:
   - Use `OPENWEATHER_API_KEY` that's already defined
   - Replace `generateRandomWeather()` in `src/services/WeatherService.ts:38-40`

3. **Add outfit compatibility scoring**:
   - Use ML model (local or API) to score outfit combinations
   - Could use Hugging Face transformers (already installed but unused)

---

## 7. File Reference Summary

### Services & Logic
- `src/services/InstantOutfitService.ts` — Static outfit database (16-368)
- `src/services/WeatherService.ts` — Mocked weather (38-40)
- `src/services/DailySuggestionsService.ts` — Queries daily_suggestions table

### Components
- `src/components/home/InstantOutfitMoment.tsx` — Instant Outfit UI (save logic: 88-102)
- `src/components/outfits/OliviaStyleChatDialog.tsx` — Olivia chat UI (invokes Edge Function: 153-158)

### Edge Functions (LLM)
- `supabase/functions/chat-with-olivia/index.ts` — OpenAI GPT-4o-mini (419-434)
- `supabase/functions/generate-daily-suggestions/index.ts` — OpenAI integration (18, 86+)
- `supabase/functions/generate-seasonal-outfits/index.ts` — OpenAI integration (36)

### Database
- `src/integrations/supabase/client.ts` — Supabase client (hardcoded values: 7-8)
- `src/integrations/supabase/types.ts` — Schema types (user_chat_limits: 610-625)

### Hooks
- `src/hooks/useSeasonalOutfits.tsx` — Calls generate-seasonal-outfits Edge Function

---

**End of Audit**
