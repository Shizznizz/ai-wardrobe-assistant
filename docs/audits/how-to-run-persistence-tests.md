# How to Run Persistence E2E Tests

## Prerequisites

1. **Node.js** installed (same version used for the app)
2. **Playwright** installed (already in devDependencies):
   ```bash
   npx playwright install chromium
   ```
3. **Dev server running** on `http://localhost:8080`:
   ```bash
   npm run dev
   ```
4. **Two test accounts** provisioned in Supabase Auth (see below)

## Test Accounts

The tests require two Supabase Auth accounts. Create them once via the Supabase Dashboard or CLI:

| Account | Default Email | Default Password |
|---------|---------------|------------------|
| User A  | `e2e-user-a@wardrobewiz.test` | `TestPass123!` |
| User B  | `e2e-user-b@wardrobewiz.test` | `TestPass456!` |

To use custom credentials, set environment variables:

```bash
export TEST_USER_A_EMAIL=your-a@example.com
export TEST_USER_A_PASSWORD=YourPasswordA
export TEST_USER_B_EMAIL=your-b@example.com
export TEST_USER_B_PASSWORD=YourPasswordB
```

**Important:** For Supabase projects with email confirmation enabled, either:
- Disable "Confirm email" in Supabase Dashboard → Auth → Settings, OR
- Create users via the Supabase Dashboard (which auto-confirms them)

## Running the Tests

```bash
# Run all persistence tests
npm run test:e2e

# Run with visible browser (headed mode)
npx playwright test --headed

# Run a specific test
npx playwright test -g "clothing item"

# Run with debug mode (step through)
npx playwright test --debug
```

## What the Tests Cover

| # | Scenario | Proves |
|---|----------|--------|
| 1 | User A adds clothing item → refresh → item persists | `clothing_items` INSERT is durable |
| 2 | User A creates outfit → refresh → outfit persists | `outfits` INSERT is durable |
| 3 | User A logs outfit worn → refresh → log persists | `outfit_logs` INSERT is durable |
| 4 | User B logs in → cannot see User A data | RLS isolation on all 3 tables |
| 5 | Soft-delete item/outfit → gone from lists, logs safe | `deleted_at` filter works; no crash on orphaned log |

## Test Architecture

- **Sequential execution** (`workers: 1`) — tests share a test-run ID to avoid collisions
- **Real Supabase backend** — no mocks, tests hit the actual database
- **Cleanup** — `beforeAll`/`afterAll` hooks remove test data using a unique `RUN_ID`
- **Dual verification** — UI assertions + direct Supabase client queries

## Viewing Results

```bash
# Open the HTML report after a run
npx playwright show-report
```

Failed tests automatically capture screenshots in `test-results/`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Supabase auth failed" | Verify test accounts exist and passwords are correct |
| Timeout on sign-in | Ensure dev server is running on port 8080 |
| Tests pass locally but fail in CI | Set env vars for test credentials; ensure Chromium is installed |
| "Cannot find module" | Run `npm install` to ensure `@playwright/test` is installed |
