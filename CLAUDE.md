# CLAUDE.md

## Project Snapshot

- **Wardrobe Wizardry**: Proprietary fashion-tech app (owner: Daniel Deurloo / Shizznizz)
- **Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase + TensorFlow.js
- **Core features**: Virtual wardrobe, AI outfit suggestions (Olivia Bloom), virtual try-on, style quizzes
- **Auth**: Supabase Auth + Row Level Security (RLS) on all tables
- **State**: Context providers (Auth → UserData → Location → Outfit) + TanStack Query for server state
- **Routing**: React Router 6 with `<ProtectedRoute>` wrapper for authenticated pages
- **Import aliases**: `@/*` → `./src/*` (always use these, never relative paths)
- **Contact**: danieldeurloo@hotmail.com (proprietary, see CONTRIBUTING.md and LICENSE)

---

## How to Run Locally

```bash
# Install dependencies
npm install
# or
bun install

# Start dev server (port 8080)
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Preview production build
npm run preview

# Lint
npm run lint

# Typecheck (manual)
npx tsc --noEmit
```

**Note**: No test suite configured yet.

---

## Key Directories & Files

### Directory Structure
- `src/pages/` — Page-level components (Home, MyWardrobe, MixAndMatch, Profile, etc.)
- `src/components/` — Feature components organized by domain (wardrobe, outfits, chat, auth, etc.)
- `src/components/ui/` — shadcn/ui base components (Button, Card, Dialog, etc.)
- `src/components/shared/` — Shared components (PageLayout, PageHeader, etc.)
- `src/hooks/` — Custom React hooks (useAuth, useUserData, useOliviaAssistant, etc.)
- `src/services/` — Business logic & Supabase operations (UserDataService, WeatherService, etc.)
- `src/lib/types.ts` — Shared TypeScript types (User, ClothingItem, WeatherInfo, etc.)
- `src/integrations/supabase/` — Supabase client + auto-generated types
- `src/utils/` — General utilities (imageProcessing, backgroundRemoval, outfitTracking)
- `supabase/migrations/` — Database migration SQL files
- `supabase/functions/` — Supabase Edge Functions

### Critical Files
- `src/App.tsx` — Provider hierarchy + route definitions (public: `/`, `/auth`, `/pitch`; protected: all others)
- `src/hooks/useAuth.tsx` — AuthProvider & auth methods
- `src/hooks/useUserData.tsx` — UserDataProvider (profile & preferences)
- `src/components/auth/ProtectedRoute.tsx` — Route guard for authenticated pages
- `src/integrations/supabase/client.ts` — Supabase client singleton
- `vite.config.ts` — Build config (dev server on port 8080, path aliases)
- `tsconfig.json` — TypeScript config (relaxed: `noImplicitAny: false`, `strictNullChecks: false`)
- `tailwind.config.ts` — Tailwind theme (slate base color, dark mode support)
- `components.json` — shadcn/ui config

---

## Environment Variables

**Required** (all prefixed with `VITE_`):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

**Never commit `.env` to version control.**

---

## Non-Negotiable Rules

### Security
1. **Never commit secrets or credentials** (API keys, tokens, `.env` file, etc.)
2. **Never bypass RLS policies** — All Supabase tables enforce user-scoped access; do not disable or circumvent RLS
3. **Never hardcode user IDs or sensitive data** in code
4. **Do not modify auth guards** (`ProtectedRoute`, `AuthProvider`) unless explicitly asked
5. **Do not change RLS assumptions** (users can only access their own data) without explicit request

### Code Integrity
1. **Always read files before editing** — Use Read tool first, never propose changes blindly
2. **Use `@/` import aliases** — Never use relative paths like `../../components/foo`
3. **Follow existing patterns** — Match component structure, hook usage, service patterns
4. **Respect provider hierarchy** — `AuthProvider` → `UserDataProvider` → `LocationProvider` → `OutfitProvider`
5. **Keep components in correct directories**:
   - UI primitives → `src/components/ui/`
   - Feature components → `src/components/{feature}/`
   - Shared components → `src/components/shared/`
   - Pages → `src/pages/`

### Database
1. **Create migrations for schema changes** — Add to `supabase/migrations/` with format `YYYYMMDD_description.sql`
2. **Include RLS policies for new tables** — Every table must have user-scoped RLS
3. **Update types after schema changes** — Regenerate `src/integrations/supabase/types.ts` if needed

---

## Change Workflow

### Branching
1. **Always use a feature branch** — Never commit directly to `main`
2. **Branch naming**: `claude/feature-name-xxxxx` for AI-generated branches (or as specified in task)
3. Check out the branch specified in the task instructions (e.g., `claude/add-claude-documentation-MiJKb`)

### Commits
1. **Write clear, descriptive commit messages**:
   ```
   <type>: <short summary>

   <optional body with details>
   ```
   Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`
2. **Commit logical units of work** — Don't batch unrelated changes
3. **Never commit broken code** — Ensure code runs before committing

### Pull Requests
Before pushing, verify:
- [ ] Code runs locally (`npm run dev`)
- [ ] No critical TypeScript errors (warnings acceptable due to relaxed config)
- [ ] Auth flows work (if touched auth)
- [ ] RLS policies enforced (if touched database)
- [ ] Responsive design intact (if touched UI)
- [ ] Dark/light theme support maintained (if touched styling)
- [ ] Used `@/` import aliases (no relative imports)
- [ ] No secrets or `.env` committed
- [ ] Followed existing patterns (component structure, hook usage, etc.)

### Pushing
```bash
# Stage changes
git add <files>

# Commit with message
git commit -m "type: description"

# Push to remote (use -u for first push)
git push -u origin <branch-name>
```

**Branch must start with `claude/` and end with matching session ID, or push will fail with 403.**

---

## Architecture Quick Reference

### Provider Stack (see `src/App.tsx`)
```tsx
<AuthProvider>
  <UserDataProvider>
    <LocationProvider>
      <OutfitProvider>
        <Router>...</Router>
      </OutfitProvider>
    </LocationProvider>
  </UserDataProvider>
</AuthProvider>
```

### Page Layout Pattern
```tsx
<PageLayout><YourPage /></PageLayout>
```

### Protected Routes
```tsx
<Route path="/your-route" element={
  <ProtectedRoute>
    <PageLayout><YourPage /></PageLayout>
  </ProtectedRoute>
} />
```

### Import Pattern
```tsx
// External
import { useState } from 'react'
// UI components
import { Button } from '@/components/ui/button'
// Hooks/utils
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
```

### Styling Pattern
```tsx
import { cn } from '@/lib/utils'

<div className={cn("base-classes", condition && "conditional-class")} />
```

### Database Tables (Key)
- `profiles` — User profile data
- `user_preferences` — User settings & style preferences
- `wardrobe_items` — Clothing items
- `outfit_logs` — Saved outfits
- `style_quiz_results` — Quiz results
- `fashion_trends` — Trend data
- `daily_suggestions` — AI outfit suggestions
- `smart_reminders` — Event-based reminders

All tables have RLS policies ensuring users can only access their own data.

---

## Troubleshooting

**Build fails**: Clear `node_modules`, reinstall, verify `.env` vars set
**Auth issues**: Check Supabase credentials in `.env`, verify RLS policies in database
**Type errors**: Check `src/lib/types.ts` and `src/integrations/supabase/types.ts` (project has relaxed TS, some errors acceptable)
**Styling broken**: Restart dev server (Vite HMR), check `src/index.css` CSS variables

---

**Last updated**: 2025-12-29
**Codebase**: ~459 TypeScript files, React 18.3.1, Node.js required (use nvm)
