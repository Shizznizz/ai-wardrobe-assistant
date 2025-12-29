# CLAUDE.md - AI Assistant Guide for Wardrobe Wizardry

## Project Overview

**Wardrobe Wizardry** is a proprietary fashion-tech application owned by Daniel Deurloo (Shizznizz). The application provides personalized fashion experiences through AI-powered outfit recommendations, virtual wardrobe management, and an AI stylist named "Olivia Bloom."

**Repository**: ai-wardrobe-assistant
**Owner**: Shizznizz (Daniel Deurloo)
**License**: Proprietary (see LICENSE and CONTRIBUTING.md)
**Contact**: danieldeurloo@hotmail.com

### Core Features
- Virtual wardrobe digitization and management
- Smart outfit generation based on weather, occasions, and personal style
- AI stylist (Olivia Bloom) for personalized fashion advice
- Virtual try-on capabilities using TensorFlow body segmentation
- Style quizzes and personality-based recommendations
- Fashion trend integration (global and local)
- Calendar-based outfit planning

---

## Tech Stack

### Frontend Framework
- **React 18.3+** with TypeScript
- **Vite 5.4+** for build tooling and dev server
- **React Router 6.26+** for client-side routing

### UI & Styling
- **Tailwind CSS 3.4+** for utility-first styling
- **shadcn/ui** component library (Radix UI primitives)
- **Framer Motion 12+** for animations
- **next-themes** for theme management
- **Lucide React** for icons

### State Management
- React Context API (multiple providers)
- **TanStack Query (React Query)** for server state
- Custom hooks for shared state logic

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **@supabase/supabase-js** client library
- Row Level Security (RLS) for data access control

### AI/ML Libraries
- **@huggingface/transformers** for NLP/embeddings
- **@tensorflow/tfjs** and **@tensorflow-models/body-pix** for body segmentation
- Custom AI services for outfit recommendations

### Form Handling
- **React Hook Form** with **Zod** validation
- **@hookform/resolvers** for schema integration

### Additional Libraries
- **date-fns** for date manipulation
- **recharts** for data visualization
- **react-beautiful-dnd** for drag-and-drop
- **sonner** for toast notifications

---

## Directory Structure

```
/
├── public/                     # Static assets
├── src/
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── shared/           # Shared/common components
│   │   ├── auth/             # Authentication components
│   │   ├── wardrobe/         # Wardrobe management
│   │   ├── outfits/          # Outfit builder & calendar
│   │   ├── chat/             # Olivia chat interface
│   │   ├── fitting-room/     # Virtual try-on
│   │   ├── profile/          # User profile
│   │   ├── preferences/      # User settings
│   │   ├── quizzes/          # Style quizzes
│   │   ├── style-planner/    # Outfit planning
│   │   ├── shop-try/         # Shop & try features
│   │   ├── weather/          # Weather components
│   │   ├── admin/            # Admin dashboard
│   │   ├── home/             # Landing page
│   │   ├── pitch/            # Marketing pitch
│   │   ├── olivia/           # Olivia AI components
│   │   ├── onboarding/       # User onboarding
│   │   └── header/           # Navigation header
│   ├── pages/                # Page-level components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # Business logic services
│   ├── integrations/         # Third-party integrations
│   │   └── supabase/         # Supabase client & types
│   ├── lib/                  # Utility libraries
│   │   └── wardrobe/         # Wardrobe-specific utilities
│   ├── utils/                # General utilities
│   ├── data/                 # Static data/constants
│   ├── App.tsx               # Root application component
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
├── supabase/
│   ├── functions/            # Supabase Edge Functions
│   └── migrations/           # Database migrations
├── .env                      # Environment variables
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── components.json           # shadcn/ui configuration
```

---

## Key Architectural Patterns

### 1. Provider Architecture
The app uses multiple context providers for global state:

```tsx
<AuthProvider>                    // Authentication state
  <UserDataProvider>              // User profile & preferences
    <LocationProvider>            // Geographic location
      <OutfitProvider>            // Outfit creation state
        <Router>...</Router>
      </OutfitProvider>
    </LocationProvider>
  </UserDataProvider>
</AuthProvider>
```

**Location**: `src/App.tsx:32-39`

### 2. Route Protection
All authenticated routes use `<ProtectedRoute>` wrapper:
- Public routes: `/`, `/auth`, `/pitch`
- Protected routes: All other pages require authentication
- Admin route: `/admin-dashboard` (additional role checks)

**Location**: `src/App.tsx:45-102`

### 3. Page Layout Pattern
All pages are wrapped in `<PageLayout>` for consistent structure:
```tsx
<PageLayout><MyWardrobe /></PageLayout>
```

**Location**: `src/components/shared/PageLayout.tsx`

### 4. Import Aliases
The codebase uses path aliases defined in `tsconfig.json`:
- `@/*` → `./src/*`
- `@/components` → `./src/components`
- `@/hooks` → `./src/hooks`
- `@/lib` → `./src/lib`
- `@/utils` → `./src/utils`

**Always use these aliases for imports!**

---

## Database Schema

### Supabase Tables (Key Entities)

#### User-Related
- `profiles` - Extended user profile data
- `user_preferences` - User settings, style preferences, seasonal settings
- `style_quiz_results` - Results from style personality quizzes

#### Wardrobe
- `wardrobe_items` - Clothing items in user's virtual wardrobe
- `outfit_logs` - Saved/created outfits with metadata

#### Social/Admin
- `fashion_trends` - Global and local fashion trends
- `daily_suggestions` - AI-generated outfit suggestions
- `smart_reminders` - Outfit reminders based on events/weather

### Row Level Security (RLS)
All tables use RLS policies to ensure users can only access their own data.

**Migration Files**: `supabase/migrations/`

---

## Core Services

### Location: `src/services/`

- **AdminService.ts** - Admin dashboard functionality
- **DailySuggestionsService.ts** - AI outfit suggestions
- **FashionTrendsService.ts** - Trend data management
- **LocationService.ts** - Geographic location handling
- **QuizService.ts** - Style quiz logic
- **SmartRemindersService.ts** - Reminder creation/management
- **UserDataService.ts** - User profile CRUD operations
- **WeatherService.ts** - Weather API integration

**Pattern**: Services handle business logic and Supabase interactions

---

## Custom Hooks

### Location: `src/hooks/`

**Authentication**
- `useAuth.tsx` - Authentication state and methods
- `useAuthRequired.tsx` - Force authentication modal

**Data Management**
- `useUserData.tsx` - User profile/preferences provider
- `useLocationStorage.tsx` - Location persistence
- `useOutfitContext.tsx` - Outfit builder state
- `useCalendarState.tsx` - Calendar state management

**AI Features**
- `useOliviaAssistant.tsx` - Olivia AI chat functionality
- `useOliviaOutfitSuggestions.tsx` - AI outfit recommendations

**UI/UX**
- `use-mobile.tsx` - Responsive breakpoint detection
- `use-toast.ts` - Toast notification hooks
- `useOptimizedImage.tsx` - Image loading optimization
- `usePerformanceMonitor.tsx` - Performance tracking

**Onboarding**
- `useOnboardingState.tsx` - New user flow management

---

## Type System

### Location: `src/lib/types.ts`

**Key Type Definitions:**
```typescript
// User
interface User
interface UserPreferences
interface StyleQuizResult

// Wardrobe
interface ClothingItem
type ClothingType, ClothingColor, ClothingMaterial
type ClothingSeason = 'spring' | 'summer' | 'autumn' | 'winter' | 'all'
type ClothingOccasion

// Weather
interface WeatherInfo

// Body Types
type BodyType = 'hourglass' | 'rectangle' | 'triangle' | 'inverted-triangle' | 'oval' | 'not-specified'
```

**Supabase Generated Types**: `src/integrations/supabase/types.ts`

---

## Styling Conventions

### Tailwind CSS
- **Configuration**: `tailwind.config.ts`
- **Global Styles**: `src/index.css`
- **Theme**: CSS variables for colors (supports light/dark mode)
- **Base Color**: Slate
- **Plugins**: `@tailwindcss/typography`, `tailwindcss-animate`

### Component Styling Pattern
```tsx
import { cn } from '@/lib/utils'

<div className={cn("base-classes", conditionalClass && "additional-class")}>
```

### shadcn/ui Components
- Location: `src/components/ui/`
- Customizable via `components.json`
- Use `cn()` utility for conditional classes

---

## Authentication Flow

### Supabase Auth
1. **Entry Point**: `/auth` page
2. **Provider**: `AuthProvider` from `src/hooks/useAuth.tsx`
3. **Protection**: `ProtectedRoute` component wraps authenticated routes
4. **Session**: Managed by Supabase client
5. **User Data**: Fetched via `UserDataProvider` after auth

### Auth Methods
- Email/password
- OAuth providers (configured in Supabase)

### User Initialization Flow
1. User signs up/in
2. Profile created in `profiles` table
3. Default preferences created in `user_preferences`
4. Onboarding flow guides initial setup

---

## Environment Variables

### Required Variables (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

**Note**: All Vite env vars must be prefixed with `VITE_`

---

## Development Workflow

### Installation
```bash
npm install
# or
bun install
```

### Development
```bash
npm run dev        # Start dev server (port 8080)
npm run build      # Production build
npm run build:dev  # Development build
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Code Quality
- **TypeScript**: Strict mode disabled for flexibility
  - `noImplicitAny: false`
  - `strictNullChecks: false`
  - `skipLibCheck: true`
- **ESLint**: Configured with React hooks rules

### Git Workflow
- Main branch: `main` (or as specified)
- Feature branches: Use descriptive names
- Branch naming: Follow `claude/feature-name-xxxxx` for AI-generated branches

---

## AI Assistant Guidelines

### When Making Changes

#### 1. Always Read Before Editing
- **Never propose changes to files you haven't read**
- Use `Read` tool before making modifications
- Understand existing patterns before adding new code

#### 2. Follow Existing Patterns
- Match the coding style of surrounding code
- Use existing hooks/services instead of creating duplicates
- Maintain consistency with component structure

#### 3. Type Safety
- Add proper TypeScript types for new features
- Update `src/lib/types.ts` for shared types
- Update `src/integrations/supabase/types.ts` if schema changes

#### 4. Component Creation
- UI primitives → `src/components/ui/`
- Feature components → `src/components/{feature}/`
- Shared components → `src/components/shared/`
- Page components → `src/pages/`

#### 5. State Management
- Global state → Create context provider in `src/hooks/`
- Component state → Use React hooks
- Server state → Use TanStack Query
- Form state → Use React Hook Form + Zod

#### 6. Styling
- Use Tailwind utility classes
- Leverage existing shadcn/ui components
- Use `cn()` for conditional classes
- Follow dark mode support patterns

#### 7. Database Changes
- Create new migration files in `supabase/migrations/`
- Follow naming: `YYYYMMDD_description.sql`
- Include RLS policies for new tables
- Update types after schema changes

#### 8. Service Layer
- Add business logic to `src/services/`
- Services should handle Supabase interactions
- Keep components focused on UI

#### 9. Imports
- Always use `@/` alias for local imports
- Group imports: external → React → local
- Example:
  ```tsx
  import { useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { useAuth } from '@/hooks/useAuth'
  ```

#### 10. Error Handling
- Use toast notifications (`sonner`) for user feedback
- Handle Supabase errors gracefully
- Provide meaningful error messages

### Testing Changes
- Test authentication flows
- Verify RLS policies work correctly
- Check responsive design
- Test dark/light theme support
- Validate form submissions

### Common Pitfalls to Avoid
- ❌ Don't bypass RLS policies
- ❌ Don't hardcode user IDs or secrets
- ❌ Don't create inline styles (use Tailwind)
- ❌ Don't ignore TypeScript errors
- ❌ Don't duplicate existing utilities/hooks
- ❌ Don't break existing provider hierarchy
- ❌ Don't modify `.env` without documenting

### Performance Considerations
- Use `useOptimizedImage` for image loading
- Implement lazy loading for heavy components
- Monitor with `usePerformanceMonitor` if needed
- Optimize bundle size (check Vite build output)

---

## Key Files Reference

### Configuration
- `vite.config.ts` - Build configuration, dev server
- `tsconfig.json` - TypeScript settings, path aliases
- `tailwind.config.ts` - Tailwind theme and plugins
- `components.json` - shadcn/ui configuration
- `.env` - Environment variables

### Core Application
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Root component with providers and routes
- `src/index.css` - Global styles and CSS variables

### Supabase Integration
- `src/integrations/supabase/client.ts` - Supabase client instance
- `src/integrations/supabase/types.ts` - Database types

### Utilities
- `src/lib/utils.ts` - General utility functions
- `src/utils/imageProcessing.ts` - Image manipulation
- `src/utils/backgroundRemoval.ts` - AI background removal
- `src/utils/outfitTracking.ts` - Outfit analytics

---

## Olivia AI Stylist

### Character Profile
- **Name**: Olivia Bloom
- **Role**: AI fashion stylist
- **Personality**: Confident, kind, knowledgeable
- **Expertise**: Personal styling, color harmony, trend integration

### Implementation
- Chat interface: `src/components/chat/`
- AI logic: `src/hooks/useOliviaAssistant.tsx`
- Outfit suggestions: `src/hooks/useOliviaOutfitSuggestions.tsx`

### Guidelines for AI Interactions
- Maintain Olivia's professional yet friendly tone
- Provide personalized recommendations
- Consider user preferences and style quiz results
- Integrate weather and occasion context
- Balance trends with personal style

---

## Troubleshooting

### Common Issues

**Build Errors**
- Clear `node_modules` and reinstall
- Check TypeScript errors (may be warnings in this project)
- Verify all env vars are set

**Authentication Issues**
- Check Supabase credentials in `.env`
- Verify RLS policies in database
- Check network requests in DevTools

**Styling Issues**
- Rebuild Tailwind: `npm run dev` (Vite HMR)
- Check CSS variable definitions in `index.css`
- Verify theme provider is active

**Type Errors**
- Regenerate Supabase types if schema changed
- Check `@/lib/types.ts` for type definitions
- May need to use type assertions (project has relaxed TS)

---

## Contributing (For Authorized Developers)

**IMPORTANT**: This is a proprietary project. Contributions require explicit written permission from Daniel Deurloo.

### If Authorized:
1. Contact: danieldeurloo@hotmail.com
2. Follow git workflow specified above
3. Write clear commit messages
4. Document significant changes
5. Update this CLAUDE.md if architecture changes

---

## Additional Resources

### Documentation
- [Vite Docs](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query/)

### Project-Specific
- README.md - Project vision and setup
- CONTRIBUTING.md - Contribution policy
- LICENSE - Proprietary license terms

---

## Version History

**Last Updated**: 2025-12-29
**Codebase Version**: ~459 TypeScript files
**React Version**: 18.3.1
**Node Version**: Requires Node.js (use nvm)

---

## Notes for AI Assistants

### Best Practices
1. **Always explore** before making assumptions
2. **Read existing code** to understand patterns
3. **Ask clarifying questions** if requirements are unclear
4. **Document changes** in commit messages
5. **Test thoroughly** before marking tasks complete
6. **Respect the architecture** - don't introduce unnecessary complexity
7. **Keep it simple** - match existing patterns rather than over-engineering

### Working with This Codebase
- The project has relaxed TypeScript settings - prioritize working code
- Supabase is central - understand RLS policies before data operations
- Context providers are layered - respect the provider hierarchy
- Components are organized by feature - keep related code together
- shadcn/ui provides base components - customize rather than replace

### Success Criteria
✅ Code works in development (`npm run dev`)
✅ No critical TypeScript errors (warnings may be acceptable)
✅ Follows existing patterns and conventions
✅ Respects authentication and RLS policies
✅ Maintains responsive design and theme support
✅ Provides good user experience with proper feedback

---

*This document is maintained for AI assistants working on the Wardrobe Wizardry codebase. Keep it updated as the architecture evolves.*
