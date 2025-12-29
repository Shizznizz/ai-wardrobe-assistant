# Current Product Flow

**Last Updated**: 2025-12-29
**Purpose**: Single source of truth for understanding how Wardrobe Wizardry currently works

---

## 1. Routes & Pages

### Public Routes (no auth required)
- `/` — Home (Instant Outfit Moment for first-time users)
- `/auth` — Sign in / Sign up
- `/pitch` — Marketing pitch

### Protected Routes (auth required, use `<ProtectedRoute>`)
**Core**: `/my-wardrobe`, `/mix-and-match`, `/style-planner`, `/fitting-room`, `/shop-and-try`
**User**: `/profile`, `/premium`
**Quizzes**: `/quizzes`, `/find-your-style`, `/quiz-results`
**Admin**: `/admin-dashboard` (requires `profiles.is_admin`)

**Evidence**: `src/App.tsx:40-102`

---

## 2. Authentication Flow

### Provider Hierarchy
```
<AuthProvider> → <UserDataProvider> → <LocationProvider> → <OutfitProvider> → <Router>
```
**Evidence**: `src/App.tsx:33-37`

### Sign Up/In Flow
1. User visits `/auth` → enters credentials
2. Supabase creates session
3. Check for `user_preferences` record
4. **No preferences**: Redirect to `/quizzes`
5. **Has preferences**: Redirect to `/`

**Evidence**: `src/pages/Auth.tsx:30-55`

### Protected Route Behavior
- Checks `isAuthenticated` from useAuth
- If not authenticated: Navigate to `/auth` with `replace: true`
- Shows loading spinner while checking

**Evidence**: `src/components/auth/ProtectedRoute.tsx:10-35`

### Premium Logic
- All authenticated users are premium EXCEPT `danieldeurloo@hotmail.com`
- Admin status from `profiles.is_admin`

**Evidence**: `src/hooks/useAuth.tsx:38-39,42-54`

---

## 3. Primary User Journeys

### First-Time User (Logged Out)
1. Lands on `/` → sees Instant Outfit Moment
2. Selects Style Vibe + Occasion + Weather → "Generate 3 Outfits"
3. Click "Save" → Toast prompts signup (no blocking modal)
4. Signs up → redirected to `/quizzes` → completes style quiz
5. Redirected to `/my-wardrobe` to upload items

**Evidence**: `src/pages/Home.tsx:87,123` (shows Instant Outfit Moment when `!isAuthenticated`)

### First-Time User (Logged In, Empty Wardrobe)
1. Completes auth + quiz → visits `/`
2. Sees Instant Outfit Moment (wardrobe check queries `clothing_items` table)
3. Generates outfits → can save
4. Sees CTA: "Upload 5 items to personalize these"

**Evidence**: `src/pages/Home.tsx:55-80` (wardrobe check), `src/components/home/InstantOutfitMoment.tsx:209-219` (upload CTA)

### Returning User (Has Wardrobe)
1. Signs in → redirected to `/`
2. Instant Outfit Moment is **hidden** (feature for first-timers only)
3. Uses: My Wardrobe, Mix & Match, Style Planner, Fitting Room

**Evidence**: `src/pages/Home.tsx:87` (`showInstantOutfit = !hasWardrobeItems`)

---

## 4. Data Model (19 Supabase Tables Used in Src)

**User & Profile**: `profiles`, `user_preferences`, `quiz_results`, `user_quiz_results`
**Wardrobe**: `clothing_items`, `wardrobe_items`
**Outfits**: `outfits`, `outfit_logs`, `outfit_usage`, `outfit_feedback`, `activities`, `calendar_events`
**AI/Recommendations**: `daily_suggestions`, `fashion_trends`, `smart_reminders`
**Social/Shopping**: `challenge_entries`, `avatars`, `user-models`
**Limits**: `user_chat_limits`

**Evidence**: Extracted from `grep -r "\.from(" src` (19 unique table names)

**Note**: Supabase types file defines 22 tables + 3 functions, but only 19 tables are actively queried in frontend code.

---

## 5. AI Implementation: Real vs Mocked (WITH EVIDENCE)

### ❌ Mocked: Weather Data
- **Claim**: No real weather API
- **Evidence**: `src/services/WeatherService.ts:38-40`
  ```typescript
  // Comment: "You would typically call a real weather API here"
  const weatherData = generateRandomWeather(city, country);
  ```
- **How it works**: `generateRandomWeather()` at line 66 uses seasonal logic (month-based), random temps within ranges
- **Cached**: 30 minutes

### ⚠️ PARTIAL: Olivia AI Stylist
- **Frontend**: Scripted toast notifications, no LLM
  - **Evidence**: `src/hooks/useOliviaAssistant.tsx:48-95` (hardcoded messages)
- **Backend**: Real OpenAI GPT-4o-mini integration EXISTS but unclear if used
  - **Evidence**: `supabase/functions/chat-with-olivia/index.ts:419-434`
  - Uses `gpt-4o-mini` model
  - Includes elaborate context (wardrobe, weather, calendar, trends)
  - Chat limits table (`user_chat_limits`) exists
  - **BUT**: No `OliviaChatDialog` component found in src, no frontend calls to this Edge Function

**Verdict**: Olivia appears scripted in current frontend, but real LLM backend exists (possibly unused or hidden feature)

### ❌ Local: Instant Outfit Generation
- **Evidence**: `src/services/InstantOutfitService.ts:16`
  ```typescript
  const outfitDatabase: Record<...> = { /* hardcoded outfits */ }
  ```
- **How it works**: Static database lookup by style vibe + occasion + weather
- **Fallback**: `generateFallbackOutfits()` at line 327 for uncovered combinations
- **No AI**: Pure local matching logic

### ❌ Unused: Hugging Face Transformers
- **Evidence**: `package.json:16` (`@huggingface/transformers` installed)
- **Evidence**: `grep -r "transformers\|HuggingFace" src` (0 results)
- **Verdict**: Dependency present but **NOT USED** anywhere in frontend code

### ⚠️ UNCLEAR: TensorFlow.js Body Segmentation
- **Claim in docs**: Used for virtual try-on in Fitting Room
- **Package installed**: `@tensorflow/tfjs`, `@tensorflow-models/body-pix` in `package.json:46-47`
- **Evidence**: `grep -r "tensorflow\|body.*pix" src` (0 results in src)
- **Actual implementation**: Background removal uses BRIA-RMBG via Supabase Edge Function
  - **Evidence**: `src/utils/backgroundRemoval.ts:33` calls `supabase.functions.invoke('remove-background')`
  - Uses BRIA-RMBG 1.4 model (not TensorFlow body-pix)

**Verdict**: TensorFlow packages installed but **NOT USED** in frontend. Background removal is handled by Supabase Edge Function with BRIA-RMBG model.

---

## 6. Unfinished/Broken/Placeholder Features

### Incomplete (Tables Exist, No UI)
1. **Chat Interface** — `user_chat_limits` table + `chat-with-olivia` Edge Function exist, but no frontend chat component
2. **Style Challenges** — `challenge_entries` table exists, no UI for creating/voting/viewing
3. **VTO Beta** — `vto_testers` table exists, no tester management UI
4. **Daily Drops** — Analytics tracking in place, no visible shopping integration

**Evidence**:
- Chat: `supabase/functions/chat-with-olivia/index.ts` (full LLM implementation)
- Challenges: Table in `src/integrations/supabase/types.ts:97-129`
- No components: `grep -r "OliviaChatDialog\|ChallengeEntry" src` (0 results)

### Working Features
✅ Auth, route protection, wardrobe CRUD, outfit builder, style quiz, instant outfits, background removal (via Edge Function), responsive design

### Known Limitations
- No test suite (`package.json:12` has no `test` script)
- Relaxed TypeScript (`tsconfig.json:12,17` — `noImplicitAny: false`, `strictNullChecks: false`)
- Weather data is mocked
- Olivia frontend is scripted (LLM backend exists but unused)
- TensorFlow installed but unused (background removal uses different AI model)

---

## 7. Critical Files Reference

### Routing & Auth
- `src/App.tsx` — Routes, provider hierarchy
- `src/components/auth/ProtectedRoute.tsx` — Route guard
- `src/hooks/useAuth.tsx` — Auth state
- `src/pages/Auth.tsx` — Sign in/up

### Core Features
- `src/pages/Home.tsx` — Landing + Instant Outfit Moment
- `src/pages/MyWardrobe.tsx` — Wardrobe management
- `src/pages/FittingRoom.tsx` — Virtual try-on

### Services
- `src/services/WeatherService.ts` — Mocked weather (line 40: `generateRandomWeather`)
- `src/services/InstantOutfitService.ts` — Local outfit database (line 16)
- `src/services/UserDataService.ts` — User CRUD

### Hooks
- `src/hooks/useAuth.tsx` — Auth state
- `src/hooks/useUserData.tsx` — Profile & preferences
- `src/hooks/useWardrobeData.tsx` — Wardrobe items
- `src/hooks/useOliviaAssistant.tsx` — Scripted Olivia toasts

### Utilities
- `src/utils/backgroundRemoval.ts` — BRIA-RMBG via Edge Function (line 33)

### Edge Functions (Real AI)
- `supabase/functions/chat-with-olivia/index.ts` — OpenAI GPT-4o-mini integration (line 419-434) **[UNUSED IN FRONTEND]**
- `supabase/functions/remove-background/` — BRIA-RMBG 1.4 background removal

---

## 8. Environment & Deployment

### Required Env Vars
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Anon key
- `VITE_SUPABASE_PROJECT_ID` — Project ID

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State**: React Context + TanStack Query
- **AI (Backend)**: OpenAI GPT-4o-mini (unused in frontend)
- **AI (Active)**: BRIA-RMBG 1.4 for background removal

### Build Commands
```bash
npm run dev        # Dev server (port 8080)
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # TypeScript validation (relaxed config)
```

---

## 9. Next Steps for Developers

### To Add Real AI
1. Replace `WeatherService.ts` with real API (OpenWeatherMap)
2. **Connect existing Olivia LLM backend** to frontend (create chat UI component)
3. Use Hugging Face transformers for outfit compatibility scoring
4. Add image recognition for auto-categorizing wardrobe items

### To Complete Features
1. Build chat interface for Olivia (backend already exists!)
2. Implement style challenges UI
3. Connect shop integration to real e-commerce
4. Add outfit photos/mockups

### To Improve
1. Add test suite
2. Tighten TypeScript (`strictNullChecks: true`)
3. Add analytics
4. Optimize images

---

**Evidence-Based Documentation**
All claims verified against codebase with file paths and line numbers where applicable.
