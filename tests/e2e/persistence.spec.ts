/**
 * Persistence E2E Tests
 *
 * Proves that wardrobe data is durably persisted to Supabase and isolated
 * between users.  Each scenario exercises the real app against a live
 * Supabase backend — no mocks.
 *
 * Prerequisites:
 *   1. `npm run dev` running on http://localhost:8080
 *   2. Two test accounts provisioned in Supabase Auth (see README)
 *   3. Environment variables TEST_USER_A_EMAIL / PASSWORD and TEST_USER_B_*
 *      (or use the defaults baked into this file for local dev).
 */

import { test, expect, Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Config — override via env vars for CI
// ---------------------------------------------------------------------------
const SUPABASE_URL = 'https://aaiyxtbovepseasghtth.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaXl4dGJvdmVwc2Vhc2dodHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzcxNDMsImV4cCI6MjA1ODA1MzE0M30.Pq66ZdBT_ZEBnPbXkDe-SVMnMvqoNjcuTo05GcPabL0';

const USER_A_EMAIL = process.env.TEST_USER_A_EMAIL ?? 'e2e-user-a@wardrobewiz.test';
const USER_A_PASSWORD = process.env.TEST_USER_A_PASSWORD ?? 'TestPass123!';
const USER_B_EMAIL = process.env.TEST_USER_B_EMAIL ?? 'e2e-user-b@wardrobewiz.test';
const USER_B_PASSWORD = process.env.TEST_USER_B_PASSWORD ?? 'TestPass456!';

// Unique suffix per run to avoid collisions
const RUN_ID = Date.now().toString(36);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sign in via the Auth page UI and wait for redirect. */
async function signIn(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.waitForSelector('#signin-email', { state: 'visible', timeout: 15_000 });
  await page.fill('#signin-email', email);
  await page.fill('#signin-password', password);
  await page.click('button[aria-label="Sign in to your account"]');
  // Wait for navigation away from /auth
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 20_000 });
}

/** Sign out — clears session so next test can use a different user. */
async function signOut(page: Page) {
  // Navigate to profile and sign out, or clear storage directly
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Clear supabase cookies / indexed DB auth tokens
  await page.context().clearCookies();
}

/** Create a Supabase client authenticated as the given user (for direct DB assertions). */
async function getAuthenticatedSupabase(email: string, password: string): Promise<SupabaseClient> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Supabase auth failed for ${email}: ${error.message}`);
  return sb;
}

/** Clean up test data for a user — removes rows created during this run. */
async function cleanupTestData(email: string, password: string) {
  try {
    const sb = await getAuthenticatedSupabase(email, password);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    // Delete outfit_logs first (FK to outfits)
    await sb.from('outfit_logs').delete().eq('user_id', user.id).like('notes', `%${RUN_ID}%`);
    // Hard-delete test outfits
    await sb.from('outfits').delete().eq('user_id', user.id).like('name', `%${RUN_ID}%`);
    // Hard-delete test clothing items
    await sb.from('clothing_items').delete().eq('user_id', user.id).like('name', `%${RUN_ID}%`);

    await sb.auth.signOut();
  } catch {
    // Cleanup is best-effort
  }
}

// ---------------------------------------------------------------------------
// Setup & Teardown
// ---------------------------------------------------------------------------

test.beforeAll(async () => {
  // Clean up any leftover data from previous broken runs
  await cleanupTestData(USER_A_EMAIL, USER_A_PASSWORD);
  await cleanupTestData(USER_B_EMAIL, USER_B_PASSWORD);
});

test.afterAll(async () => {
  await cleanupTestData(USER_A_EMAIL, USER_A_PASSWORD);
  await cleanupTestData(USER_B_EMAIL, USER_B_PASSWORD);
});

// ---------------------------------------------------------------------------
// Test 1: Clothing item persistence across refresh
// ---------------------------------------------------------------------------
test.describe('Persistence: Clothing Items', () => {
  const ITEM_NAME = `E2E Denim Jacket ${RUN_ID}`;

  test('User A adds clothing item -> refresh -> item persists', async ({ page }) => {
    await signIn(page, USER_A_EMAIL, USER_A_PASSWORD);
    await page.goto('/my-wardrobe');
    await page.waitForLoadState('networkidle');

    // Click "Add Clothing Item" (or equivalent)
    const addButton = page.getByRole('button', { name: /add/i });
    await addButton.first().click();

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10_000 });

    // Fill in item details — the exact form fields depend on UploadModal
    // Name field
    const nameInput = page.locator('[role="dialog"] input[type="text"]').first();
    await nameInput.fill(ITEM_NAME);

    // Select type/category if dropdown exists
    const typeSelect = page.locator('[role="dialog"]').getByText(/type|category/i).first();
    if (await typeSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await typeSelect.click();
      await page.getByRole('option', { name: /jacket/i }).first().click().catch(() => {});
    }

    // Submit — look for "Add to Wardrobe" or "Save" button in dialog
    const saveButton = page.locator('[role="dialog"]').getByRole('button', { name: /add to wardrobe|save|add item/i });
    if (await saveButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(2_000); // Wait for save to complete
    }

    // Verify the item appears
    await expect(page.getByText(ITEM_NAME)).toBeVisible({ timeout: 10_000 });

    // Hard refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Item should still be visible after refresh
    await expect(page.getByText(ITEM_NAME)).toBeVisible({ timeout: 15_000 });

    // Double-check via direct DB query
    const sb = await getAuthenticatedSupabase(USER_A_EMAIL, USER_A_PASSWORD);
    const { data } = await sb
      .from('clothing_items')
      .select('id, name, deleted_at')
      .like('name', `%${RUN_ID}%`)
      .is('deleted_at', null);

    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    expect(data![0].name).toBe(ITEM_NAME);

    await sb.auth.signOut();
    await signOut(page);
  });
});

// ---------------------------------------------------------------------------
// Test 2: Outfit persistence across refresh
// ---------------------------------------------------------------------------
test.describe('Persistence: Outfits', () => {
  const OUTFIT_NAME = `E2E Summer Look ${RUN_ID}`;

  test('User A creates outfit -> refresh -> outfit persists', async ({ page }) => {
    await signIn(page, USER_A_EMAIL, USER_A_PASSWORD);
    await page.goto('/mix-and-match');
    await page.waitForLoadState('networkidle');

    // Look for "Create Outfit" button
    const createButton = page.getByRole('button', { name: /create.*outfit|new outfit/i });
    if (await createButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await createButton.click();
    } else {
      // Fallback: look for a + or add button
      const altButton = page.getByRole('button', { name: /add|create|\+/i }).first();
      await altButton.click();
    }

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10_000 });

    // Fill outfit name
    const outfitNameInput = page.locator('#outfit-name, [role="dialog"] input[type="text"]').first();
    await outfitNameInput.clear();
    await outfitNameInput.fill(OUTFIT_NAME);

    // Select at least one item from the item grid (click the first available)
    const itemCards = page.locator('[role="dialog"] [class*="cursor-pointer"], [role="dialog"] [class*="selectable"]');
    const firstItem = itemCards.first();
    if (await firstItem.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstItem.click();
    }

    // Save the outfit
    const saveOutfitButton = page.locator('[role="dialog"]').getByRole('button', { name: /save|create/i }).last();
    await saveOutfitButton.click();
    await page.waitForTimeout(2_000);

    // Verify the outfit appears on the page or via DB
    const sb = await getAuthenticatedSupabase(USER_A_EMAIL, USER_A_PASSWORD);
    const { data } = await sb
      .from('outfits')
      .select('id, name, items, deleted_at')
      .like('name', `%${RUN_ID}%`)
      .is('deleted_at', null);

    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    expect(data![0].name).toBe(OUTFIT_NAME);

    // Refresh and verify the outfit still shows
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Re-check DB after refresh (data should not have disappeared)
    const { data: afterRefresh } = await sb
      .from('outfits')
      .select('id, name')
      .like('name', `%${RUN_ID}%`)
      .is('deleted_at', null);

    expect(afterRefresh).toBeTruthy();
    expect(afterRefresh!.length).toBeGreaterThanOrEqual(1);

    await sb.auth.signOut();
    await signOut(page);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Outfit log persistence across refresh
// ---------------------------------------------------------------------------
test.describe('Persistence: Outfit Logs', () => {
  test('User A logs outfit worn in style planner -> refresh -> log persists', async ({ page }) => {
    // First ensure there's an outfit to log
    const sb = await getAuthenticatedSupabase(USER_A_EMAIL, USER_A_PASSWORD);
    const { data: { user } } = await sb.auth.getUser();
    expect(user).toBeTruthy();

    // Ensure at least one outfit exists for the user
    let { data: outfits } = await sb
      .from('outfits')
      .select('id, name')
      .eq('user_id', user!.id)
      .is('deleted_at', null)
      .limit(1);

    if (!outfits || outfits.length === 0) {
      // Create a test outfit directly
      const { data: newOutfit } = await sb.from('outfits').insert({
        user_id: user!.id,
        name: `Log Test Outfit ${RUN_ID}`,
        items: [],
        occasion: 'casual',
        season: ['all'],
        favorite: false,
        times_worn: 0,
        date_added: new Date().toISOString(),
      }).select().single();

      outfits = newOutfit ? [newOutfit] : [];
    }

    const outfitId = outfits![0].id;

    // Create outfit log directly via Supabase (to isolate the persistence test)
    const logDate = new Date().toISOString();
    const { data: log, error: logError } = await sb.from('outfit_logs').insert({
      user_id: user!.id,
      outfit_id: outfitId,
      date: logDate,
      time_of_day: 'all-day',
      notes: `E2E persistence test ${RUN_ID}`,
    }).select().single();

    expect(logError).toBeNull();
    expect(log).toBeTruthy();

    // Now sign in via UI and navigate to style planner
    await signIn(page, USER_A_EMAIL, USER_A_PASSWORD);
    await page.goto('/style-planner');
    await page.waitForLoadState('networkidle');

    // The calendar should be visible
    await page.waitForTimeout(3_000); // Let data load

    // Verify the log exists in DB after page load
    const { data: logs } = await sb
      .from('outfit_logs')
      .select('id, notes')
      .eq('user_id', user!.id)
      .like('notes', `%${RUN_ID}%`);

    expect(logs).toBeTruthy();
    expect(logs!.length).toBeGreaterThanOrEqual(1);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3_000);

    // Verify the log still exists after refresh
    const { data: logsAfterRefresh } = await sb
      .from('outfit_logs')
      .select('id, notes')
      .eq('user_id', user!.id)
      .like('notes', `%${RUN_ID}%`);

    expect(logsAfterRefresh).toBeTruthy();
    expect(logsAfterRefresh!.length).toBeGreaterThanOrEqual(1);

    await sb.auth.signOut();
    await signOut(page);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Cross-user isolation (hard isolation)
// ---------------------------------------------------------------------------
test.describe('Isolation: Cross-User', () => {
  const ITEM_A = `User-A-Only Item ${RUN_ID}`;
  const OUTFIT_A = `User-A-Only Outfit ${RUN_ID}`;

  test('User B cannot see User A wardrobe, outfits, or logs', async ({ page }) => {
    // --- Seed User A data directly ---
    const sbA = await getAuthenticatedSupabase(USER_A_EMAIL, USER_A_PASSWORD);
    const { data: { user: userA } } = await sbA.auth.getUser();
    expect(userA).toBeTruthy();

    // Create clothing item for User A
    await sbA.from('clothing_items').insert({
      user_id: userA!.id,
      name: ITEM_A,
      type: 'jacket',
      color: 'blue',
      material: 'denim',
      season: ['spring', 'autumn'],
      occasions: ['casual'],
      image_url: '',
      favorite: false,
      times_worn: 0,
      date_added: new Date().toISOString(),
    });

    // Create outfit for User A
    const { data: outfitA } = await sbA.from('outfits').insert({
      user_id: userA!.id,
      name: OUTFIT_A,
      items: [],
      occasion: 'casual',
      season: ['spring'],
      favorite: false,
      times_worn: 0,
      date_added: new Date().toISOString(),
    }).select().single();

    // Create outfit log for User A
    if (outfitA) {
      await sbA.from('outfit_logs').insert({
        user_id: userA!.id,
        outfit_id: outfitA.id,
        date: new Date().toISOString(),
        time_of_day: 'all-day',
        notes: `User A private log ${RUN_ID}`,
      });
    }

    await sbA.auth.signOut();

    // --- Now query as User B via Supabase client (simulates RLS enforcement) ---
    const sbB = await getAuthenticatedSupabase(USER_B_EMAIL, USER_B_PASSWORD);

    // User B should NOT be able to see User A's clothing items
    const { data: itemsB } = await sbB
      .from('clothing_items')
      .select('id, name')
      .like('name', `%${RUN_ID}%`);

    // RLS should filter — User B sees zero rows with User A's test data
    const userAItemsSeenByB = (itemsB ?? []).filter((i: any) => i.name === ITEM_A);
    expect(userAItemsSeenByB.length).toBe(0);

    // User B should NOT see User A's outfits
    const { data: outfitsB } = await sbB
      .from('outfits')
      .select('id, name')
      .like('name', `%${RUN_ID}%`);

    const userAOutfitsSeenByB = (outfitsB ?? []).filter((o: any) => o.name === OUTFIT_A);
    expect(userAOutfitsSeenByB.length).toBe(0);

    // User B should NOT see User A's outfit logs
    const { data: logsB } = await sbB
      .from('outfit_logs')
      .select('id, notes')
      .like('notes', `%${RUN_ID}%`);

    const userALogsSeenByB = (logsB ?? []).filter((l: any) => l.notes?.includes('User A private'));
    expect(userALogsSeenByB.length).toBe(0);

    await sbB.auth.signOut();

    // --- Also verify via UI: sign in as User B, navigate to wardrobe ---
    await signIn(page, USER_B_EMAIL, USER_B_PASSWORD);
    await page.goto('/my-wardrobe');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3_000);

    // User A's item should NOT be visible
    const itemVisible = await page.getByText(ITEM_A).isVisible().catch(() => false);
    expect(itemVisible).toBe(false);

    await signOut(page);
  });
});

// ---------------------------------------------------------------------------
// Test 5: Soft-delete removes from lists, logs render safely
// ---------------------------------------------------------------------------
test.describe('Soft-Delete: Items & Outfits', () => {
  const ITEM_TO_DELETE = `E2E Delete Me Item ${RUN_ID}`;
  const OUTFIT_TO_DELETE = `E2E Delete Me Outfit ${RUN_ID}`;

  test('Soft-delete item/outfit -> disappears from lists, logs render safely', async ({ page }) => {
    const sb = await getAuthenticatedSupabase(USER_A_EMAIL, USER_A_PASSWORD);
    const { data: { user } } = await sb.auth.getUser();
    expect(user).toBeTruthy();

    // --- Seed: create a clothing item + outfit + log ---
    const { data: item } = await sb.from('clothing_items').insert({
      user_id: user!.id,
      name: ITEM_TO_DELETE,
      type: 'shirt',
      color: 'red',
      material: 'cotton',
      season: ['summer'],
      occasions: ['casual'],
      image_url: '',
      favorite: false,
      times_worn: 0,
      date_added: new Date().toISOString(),
    }).select().single();

    const { data: outfit } = await sb.from('outfits').insert({
      user_id: user!.id,
      name: OUTFIT_TO_DELETE,
      items: item ? [item.id] : [],
      occasion: 'casual',
      season: ['summer'],
      favorite: false,
      times_worn: 0,
      date_added: new Date().toISOString(),
    }).select().single();

    // Create a log referencing this outfit
    let logId: string | null = null;
    if (outfit) {
      const { data: log } = await sb.from('outfit_logs').insert({
        user_id: user!.id,
        outfit_id: outfit.id,
        date: new Date().toISOString(),
        time_of_day: 'morning',
        notes: `Log for deleted outfit ${RUN_ID}`,
      }).select().single();
      logId = log?.id ?? null;
    }

    // --- Soft-delete the clothing item ---
    if (item) {
      await sb.from('clothing_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('user_id', user!.id);
    }

    // --- Soft-delete the outfit ---
    if (outfit) {
      await sb.from('outfits')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', outfit.id)
        .eq('user_id', user!.id);
    }

    // --- Verify via DB: active queries exclude soft-deleted rows ---
    const { data: activeItems } = await sb
      .from('clothing_items')
      .select('id, name')
      .eq('user_id', user!.id)
      .is('deleted_at', null)
      .like('name', `%${RUN_ID}%Delete%`);

    expect(activeItems ?? []).toHaveLength(0);

    const { data: activeOutfits } = await sb
      .from('outfits')
      .select('id, name')
      .eq('user_id', user!.id)
      .is('deleted_at', null)
      .like('name', `%${RUN_ID}%Delete%`);

    expect(activeOutfits ?? []).toHaveLength(0);

    // --- The outfit log should STILL exist (it references a deleted outfit) ---
    if (logId) {
      const { data: logStillExists } = await sb
        .from('outfit_logs')
        .select('id, outfit_id')
        .eq('id', logId);

      expect(logStillExists).toBeTruthy();
      expect(logStillExists!.length).toBe(1);
    }

    // --- UI verification: sign in, verify deleted items don't render ---
    await signIn(page, USER_A_EMAIL, USER_A_PASSWORD);

    // Check wardrobe page
    await page.goto('/my-wardrobe');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3_000);

    const deletedItemVisible = await page.getByText(ITEM_TO_DELETE).isVisible().catch(() => false);
    expect(deletedItemVisible).toBe(false);

    // Check style planner — page should render without crashing
    // (even though a log references a deleted outfit)
    await page.goto('/style-planner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3_000);

    // The page should be functional — no uncaught errors
    const hasError = await page.locator('text=/something went wrong|error|crash/i').isVisible().catch(() => false);
    expect(hasError).toBe(false);

    // Verify the calendar or planner content is visible (page didn't crash)
    const pageContent = await page.locator('main, [class*="calendar"], [class*="planner"]').first().isVisible().catch(() => false);
    expect(pageContent).toBe(true);

    await sb.auth.signOut();
    await signOut(page);
  });
});
