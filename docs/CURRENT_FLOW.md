# Current Product Flow

**Last Updated**: 2025-12-29
**Purpose**: Single source of truth for understanding how Wardrobe Wizardry currently works

---

## 1. Routes & Pages

### Public Routes (no authentication required)
- `/` — **Home**: Landing page with hero, features, Olivia intro, testimonials, Instant Outfit Moment (for first-time users)
- `/auth` — **Auth**: Sign in / Sign up with Supabase email/password authentication
- `/pitch` — **Pitch**: Marketing pitch page

### Protected Routes (authentication required)
All protected routes use `<ProtectedRoute>` wrapper that redirects to `/auth` if not authenticated.

**Core Features**:
- `/my-wardrobe` — **MyWardrobe**: Virtual wardrobe management, add/edit/delete clothing items
- `/mix-and-match` — **MixAndMatch**: Outfit builder with drag-and-drop, save outfits
- `/style-planner` — **StylePlanner**: Calendar-based outfit planning, schedule outfits for events
- `/fitting-room` — **FittingRoom**: Virtual try-on using TensorFlow.js body segmentation
- `/shop-and-try` — **ShopAndTry**: Browse fashion items, virtual try-on integration

**User Profile & Settings**:
- `/profile` — **Profile**: User profile management, settings, preferences
- `/premium` — **Premium**: Premium features showcase and upgrade flow

**Quizzes & Discovery**:
- `/quizzes` — **Quizzes**: Hub for style quizzes
- `/find-your-style` — **StyleQuiz**: Interactive style quiz (personality tags, body type, color preferences)
- `/quiz-results` — **QuizResults**: Display quiz results and recommendations

**Admin**:
- `/admin-dashboard` — **AdminDashboard**: Admin analytics and management (additional role check via `profiles.is_admin`)

---

## 2. Authentication Flow

### Provider Hierarchy
```
<AuthProvider>                    # Supabase auth state
  <UserDataProvider>              # User profile + preferences
    <LocationProvider>            # Geographic location
      <OutfitProvider>            # Outfit creation state
        <Router>...</Router>
      </OutfitProvider>
    </LocationProvider>
  </UserDataProvider>
</AuthProvider>
```

### Sign Up Flow
1. User visits `/auth` → clicks "Sign Up" tab
2. Enters email + password → Supabase creates account
3. Success → useAuth detects new session
4. Auth page checks for `user_preferences` record
5. **If no preferences**: Redirect to `/quizzes` (onboarding)
6. **If preferences exist**: Redirect to `/` (home)

### Sign In Flow
1. User visits `/auth` → enters credentials
2. Supabase validates → session created
3. Same preference check as sign up
4. Redirect to `/quizzes` or `/`

### Sign Out Flow
1. User clicks sign out (in header/profile)
2. `signOut()` from useAuth → Supabase session cleared
3. User redirected to `/` (public home page)

### Protected Route Behavior
- `<ProtectedRoute>` checks `isAuthenticated` from useAuth
- If loading: Shows spinner
- If not authenticated: Navigates to `/auth` with `replace: true`
- If authenticated: Renders children

### Premium User Logic
- All authenticated users are premium EXCEPT `danieldeurloo@hotmail.com` (owner account)
- Premium status checked in AuthProvider via email comparison
- Admin status fetched from `profiles.is_admin` column

---

## 3. Primary User Journeys

### First-Time User (Logged Out)
1. Lands on `/` (Home page)
2. Sees **Instant Outfit Moment** feature (NEW):
   - Select Style Vibe (6 options), Occasion (4 options), Weather (auto + manual)
   - Click "Generate 3 Outfits" → see 3 outfit suggestions with reasoning
   - Click "Save Outfit" → Toast prompts to sign up (no blocking modal)
3. Clicks "Get Started" or "Sign Up"
4. Redirected to `/auth` → creates account
5. After signup → redirected to `/quizzes`
6. Completes style quiz → results saved to `user_preferences` and `quiz_results`
7. Redirected to `/my-wardrobe` to upload clothing items
8. Starts building virtual wardrobe

### First-Time User (Logged In, Empty Wardrobe)
1. Completes auth + quiz flow
2. Visits `/` (Home) → sees **Instant Outfit Moment** (empty wardrobe detected)
3. Generates outfits → can save them
4. Sees secondary CTA: "Upload 5 items to personalize these" → redirects to `/my-wardrobe`
5. Uploads clothing items
6. Once wardrobe has items, Instant Outfit Moment is hidden
7. Can now use Mix & Match, Style Planner, Fitting Room with personal items

### Returning User (Has Wardrobe)
1. Signs in → redirected to `/` (home)
2. **Instant Outfit Moment is hidden** (feature is for first-timers only)
3. Navigates to core features:
   - `/my-wardrobe` — manage clothing items
   - `/mix-and-match` — create outfits from wardrobe
   - `/style-planner` — plan outfits for calendar events
   - `/fitting-room` — virtual try-on with uploaded items
4. Receives AI suggestions based on preferences, weather, occasions

---

## 4. Data Model Summary (Supabase Tables)

### User & Profile
- **profiles** — Extended user profile (id, is_admin, created_at)
- **user_preferences** — User settings, style preferences, seasonal preferences, body type, colors, pronouns
- **quiz_results** / **user_quiz_results** — Style quiz results, personality tags

### Wardrobe & Items
- **clothing_items** — Primary wardrobe table (name, type, color, material, season, occasions, image_url, times_worn, favorite)
- **wardrobe_items** — Legacy/fallback wardrobe table (item_data JSON, user_id)

### Outfits & Planning
- **outfits** — Saved outfit combinations (name, items, occasion, season)
- **outfit_logs** — Outfit history and usage tracking
- **outfit_usage** — Usage statistics
- **outfit_feedback** — User feedback on outfit suggestions
- **activities** — Calendar activities linked to outfits (date, time_of_day, outfit_id, weather_condition)
- **calendar_events** — Scheduled outfits for specific dates

### AI & Recommendations
- **daily_suggestions** — AI-generated daily outfit suggestions
- **fashion_trends** — Global and local fashion trend data
- **smart_reminders** — Event-based outfit reminders
- **olivia_learning_data** — User interaction data for AI personalization

### Shopping & Wishlist
- **wishlist** — Saved items user wants to buy
- **daily_drop_clicks** — Analytics for shop item clicks (country, device, conversion tracking)

### Challenges & Social (Placeholder)
- **challenge_entries** — User submissions for style challenges (status, votes)

### Admin & Limits
- **user_chat_limits** — Chat message limits for non-premium users
- **vto_testers** — Virtual try-on beta testers

### Functions
- **clean_old_reminders** — Supabase function to clean up old reminders
- **get_admin_analytics** — Supabase function for admin dashboard data
- **increment_message_count** — Track user chat usage

---

## 5. AI Implementation: Real vs Mocked

### Real AI/ML
✅ **TensorFlow.js Body Segmentation** (`@tensorflow/tfjs`, `@tensorflow-models/body-pix`)
   - Used in Fitting Room for virtual try-on
   - Segments user body from uploaded photos
   - Runs in-browser, no API calls

### Mocked/Local AI
❌ **Weather Data** (`WeatherService.ts`)
   - Comment: "You would typically call a real weather API here"
   - Currently uses `generateRandomWeather()` with seasonal logic
   - Cached for 30 minutes
   - No real API integration

❌ **Olivia AI Stylist**
   - Personality and responses are hardcoded messages
   - No LLM or NLP integration
   - Uses localStorage for basic personalization (last feedback)
   - Outfit recommendations use static logic (style preferences + weather)

❌ **Instant Outfit Generation** (`InstantOutfitService.ts`)
   - Local database of curated outfits
   - Matches style vibe + occasion + weather condition
   - Fallback generator for uncovered combinations
   - No generative AI or API calls

❌ **Style Quiz Results**
   - Scoring and recommendations are rule-based
   - No machine learning model
   - Results stored in Supabase but not used for adaptive AI

### Placeholder AI
⚠️ **Hugging Face Transformers** (`@huggingface/transformers` in package.json)
   - Dependency installed but **NOT USED** in any component
   - Intended for future NLP/embeddings features
   - No active implementation

⚠️ **Olivia Learning Data Table**
   - Table exists in database
   - Not actively populated or used for learning
   - Intended for future personalization features

---

## 6. Unfinished, Broken, or Placeholder Features

### Incomplete Features
1. **Chat Message Limits**
   - `user_chat_limits` table exists
   - `increment_message_count` function exists
   - But no actual chat interface implemented (Olivia uses toast notifications only)

2. **Style Challenges**
   - `challenge_entries` table exists with voting system
   - No UI for creating, viewing, or participating in challenges
   - Appears to be planned social feature

3. **Admin Analytics**
   - `get_admin_analytics` function exists
   - Admin dashboard page exists (`/admin-dashboard`)
   - Unclear if analytics are fully functional

4. **Virtual Try-On Testers**
   - `vto_testers` table exists
   - No visible beta program or tester management UI

5. **Daily Drops / Shopping**
   - `daily_drop_clicks` table tracks engagement
   - Shop & Try page exists but integration with actual stores unclear
   - Conversion tracking in place but no revenue pipeline visible

### Working Features (Verified)
✅ **Authentication** — Supabase email/password works
✅ **Route Protection** — ProtectedRoute redirects correctly
✅ **Wardrobe Management** — CRUD operations on `clothing_items`
✅ **Outfit Builder** — Mix & Match with drag-and-drop
✅ **Style Quiz** — Collects preferences, saves to database
✅ **Instant Outfit Moment** — Generates 3 outfits based on selectors (NEW)
✅ **Virtual Try-On** — TensorFlow body segmentation functional
✅ **Responsive Design** — Mobile-first layouts throughout

### Known Limitations
- **No Test Suite** — `package.json` has no test script
- **Relaxed TypeScript** — `noImplicitAny: false`, `strictNullChecks: false`
- **No Real Weather API** — Using mocked data
- **No LLM Integration** — Olivia is scripted, not conversational
- **No Image Recognition** — Clothing items require manual categorization (color, type, season)
- **No Outfit Photos** — Outfit cards are text-based (item lists only)

---

## 7. Key Business Logic Patterns

### Wardrobe Check Pattern
Used to determine if user is first-time (empty wardrobe) or returning:
```typescript
1. Try querying clothing_items table
2. If error, fallback to wardrobe_items table
3. If any items exist → hasWardrobeItems = true
4. Used to show/hide Instant Outfit Moment
```

### Outfit Generation Pattern
```typescript
1. User selects Style Vibe + Occasion + Weather
2. Service looks up curated outfit from local database
3. If match found, return up to 3 outfits
4. If no match, generate fallback outfits
5. Display with reasoning/styling advice
```

### Row Level Security (RLS)
- All tables enforce user-scoped access
- Users can only query/modify their own data
- RLS policies use `auth.uid() = user_id`

### Provider Data Flow
1. **AuthProvider** — Supabase session state
2. **UserDataProvider** — Fetches profile + preferences once authenticated
3. **LocationProvider** — Stores user's geographic location (for weather)
4. **OutfitProvider** — Manages outfit creation state across pages

---

## 8. Critical Files Reference

### Routing & Auth
- `src/App.tsx` — Route definitions, provider hierarchy
- `src/components/auth/ProtectedRoute.tsx` — Route guard
- `src/hooks/useAuth.tsx` — Auth state and methods
- `src/pages/Auth.tsx` — Sign in/up page

### Core Features
- `src/pages/Home.tsx` — Landing page with Instant Outfit Moment
- `src/pages/MyWardrobe.tsx` — Wardrobe management
- `src/pages/MixAndMatch.tsx` — Outfit builder
- `src/pages/StylePlanner.tsx` — Calendar outfit planning
- `src/pages/FittingRoom.tsx` — Virtual try-on

### Services
- `src/services/WeatherService.ts` — Weather data (mocked)
- `src/services/InstantOutfitService.ts` — Outfit generation (local)
- `src/services/UserDataService.ts` — User CRUD operations

### Data Hooks
- `src/hooks/useUserData.tsx` — User profile & preferences
- `src/hooks/useWardrobeData.tsx` — Wardrobe items
- `src/hooks/useOliviaAssistant.tsx` — Olivia toast notifications

### UI Components
- `src/components/home/InstantOutfitMoment.tsx` — NEW feature for first-time users
- `src/components/ui/` — shadcn/ui base components
- `src/components/shared/PageLayout.tsx` — Consistent page wrapper

---

## 9. Environment & Deployment

### Required Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key (safe for client)
- `VITE_SUPABASE_PROJECT_ID` — Supabase project identifier

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State**: React Context API + TanStack Query
- **AI/ML**: TensorFlow.js (body segmentation)
- **Routing**: React Router 6

### Build Commands
- `npm run dev` — Dev server (port 8080)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript validation

---

## 10. Next Steps for Developers

### To Add Real AI
1. Replace `WeatherService.ts` with real API (OpenWeatherMap, WeatherAPI)
2. Integrate LLM for Olivia (OpenAI, Anthropic, or local Llama)
3. Use Hugging Face transformers for outfit compatibility scoring
4. Add image recognition for auto-categorizing wardrobe items

### To Complete Features
1. Build chat interface for Olivia (use `user_chat_limits` table)
2. Implement style challenges (create, vote, leaderboard)
3. Connect shop integration to real affiliate/e-commerce APIs
4. Add outfit photos/mockups (generate or user-uploaded)

### To Improve
1. Add test suite (Jest + React Testing Library)
2. Tighten TypeScript config (`strictNullChecks: true`)
3. Implement proper error boundaries
4. Add analytics/telemetry (PostHog, Mixpanel)
5. Optimize image loading (lazy loading, WebP)

---

**Document Maintained By**: AI Assistants (Claude)
**Purpose**: Keep this updated as features are added/changed
