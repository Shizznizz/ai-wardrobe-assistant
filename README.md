# Copyright & Usage Notice

This application, **"Wardrobe Wizardry"**, is a proprietary fashion-tech concept by **Daniel Deurloo (Shizznizz)**. All rights reserved.

**Unauthorized use, reproduction, or commercial distribution is strictly prohibited.**

This project is protected under a **custom proprietary license**. For licensing inquiries, please contact: 📧 danieldeurloo@hotmail.com

---

# Wardrobe Wizardry

**Wardrobe Wizardry** reimagines how people interact with their clothing by offering a personalized fashion experience that adapts to individual style, occasion needs, and real-time weather conditions.

## What It Does

A fashion-tech application that provides:
- **Virtual Wardrobe Management**: Digitize and organize your entire clothing collection
- **Smart Outfit Generator**: AI-powered outfit recommendations based on personal style, weather, and occasions
- **Olivia Bloom AI Stylist**: Your personal AI fashion assistant that learns your preferences
- **Virtual Try-On Experience**: Visualize outfits on your own photos using TensorFlow body segmentation
- **Style Quizzes**: Discover your personal style through interactive assessments

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State**: React Context + TanStack Query
- **AI/ML**: TensorFlow.js + Hugging Face Transformers
- **Routing**: React Router 6 with protected routes

---

## Local Setup

### Prerequisites

- Node.js (recommended: install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or bun package manager
- Supabase account with a project created

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-wardrobe-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     ```bash
     cp .env.example .env
     ```
   - Update `.env` with your values (see Environment Variables section below)

4. **Start the development server**
   ```bash
   npm run dev
   ```
   - App will be available at `http://localhost:8080`

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server on port 8080

# Building
npm run build        # Production build
npm run build:dev    # Development build (with source maps)
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking (no emit)
```

**Note**: No test suite is currently configured.

---

## Environment Variables

All environment variables must be prefixed with `VITE_` for Vite to expose them to the client.

Create a `.env` file in the project root with the following variables (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public API key (safe for client-side) |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project identifier |

**Security**: Never commit the `.env` file to version control. It is listed in `.gitignore`.

---

## Deployment

### Lovable Platform (Recommended)

1. Visit the [Lovable Project Dashboard](https://lovable.dev/projects/2816d45f-fbe4-4db2-a015-05ea9f4af6a6)
2. Click **Share → Publish**
3. Your app will be deployed automatically

### Alternative: Netlify/Vercel

1. Build the production bundle: `npm run build`
2. Deploy the `dist/` directory to your hosting provider
3. Set environment variables in your hosting dashboard
4. Configure redirects for client-side routing (e.g., `_redirects` file for Netlify)

**Custom Domain**: See [Lovable docs](https://docs.lovable.dev/tips-tricks/custom-domain/) for custom domain setup.

---

## Project Structure

```
/
├── src/
│   ├── components/     # React components (organized by feature)
│   ├── pages/          # Page-level components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Business logic & Supabase operations
│   ├── lib/            # Utility libraries & types
│   ├── integrations/   # Supabase client & generated types
│   └── App.tsx         # Root component with providers & routes
├── supabase/
│   ├── migrations/     # Database schema migrations
│   └── functions/      # Supabase Edge Functions
├── public/             # Static assets
└── .env                # Environment variables (not committed)
```

See `CLAUDE.md` for detailed architecture documentation.

---

## Troubleshooting

**Build fails or dependencies won't install**
- Clear `node_modules/` and `package-lock.json`, then reinstall: `rm -rf node_modules package-lock.json && npm install`
- Ensure you're using a compatible Node.js version (Node 18+ recommended)

**"Supabase client error" or authentication fails**
- Verify all three `VITE_SUPABASE_*` variables are set correctly in `.env`
- Check that your Supabase project is active and credentials are valid
- Restart the dev server after changing `.env`

**TypeScript errors in the editor**
- Run `npm run typecheck` to see all type errors
- This project uses relaxed TypeScript settings (`noImplicitAny: false`), some warnings are expected

**Styles not applying or theme broken**
- Restart the Vite dev server (Ctrl+C, then `npm run dev`)
- Check that `src/index.css` is imported in `main.tsx`
- Verify Tailwind classes are not being purged incorrectly

**"Module not found" or import errors**
- Ensure you're using `@/*` import aliases (configured in `tsconfig.json`)
- Check that the file path exists and is correctly cased (Linux/macOS are case-sensitive)

---

## Contributing

**IMPORTANT**: This is a proprietary project. Contributions require explicit written permission from Daniel Deurloo.

For collaboration inquiries:
- **Email**: danieldeurloo@hotmail.com
- **Subject**: "Wardrobe Wizardry Collaboration"

See `CONTRIBUTING.md` for full policy details.

---

## License

Proprietary. All rights reserved. See `LICENSE` file for details.

---

## Meet Olivia – Your AI Stylist

At the heart of Wardrobe Wizardry is **Olivia Bloom** – your personal AI fashion stylist who transforms how you dress every day.

### How Olivia Helps You Shine

- **Personalized Style Guidance**: Analyzes your wardrobe items, color preferences, body shape, and personal style
- **Weather-Adaptive Recommendations**: Checks local forecast to suggest outfits that are both stylish and practical
- **Occasion-Specific Styling**: Ensures you're dressed appropriately for job interviews, dates, or weekend brunch
- **Trend Integration**: Introduces trending elements that complement your existing wardrobe

Olivia's approach is confident yet kind, mixing high-fashion knowledge with practical advice. Her suggestions feel like they're coming from a stylish friend who truly gets your style journey.

---

**Project URL**: https://lovable.dev/projects/2816d45f-fbe4-4db2-a015-05ea9f4af6a6
