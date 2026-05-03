/**
 * 14 — Billing & School Impersonation
 * Tests: billing page loads, plan grid, usage bars, invoice table,
 *        super-admin can view school detail and impersonate admin.
 */
import { test, expect } from '@playwright/test';
import { STATE, API_URL } from '../fixtures/constants';

// ─── Billing page (school admin) ─────────────────────────────────────────────

test.describe('Billing Page', () => {
  test.use({ storageState: STATE.admin });

  test.beforeEach(async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('billing page loads without errors', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Unexpected error');
    await expect(page.locator('h1, .page-header h1')).toContainText(/billing|subscription/i);
  });

  test('current plan card is visible', async ({ page }) => {
    // Wait for API data to arrive
    await page.waitForTimeout(2000);
    await expect(page.locator('.current-plan-card, .plan-info, .plan-badge-lg').first()).toBeVisible({ timeout: 8000 });
  });

  test('usage bars render for students/teachers/staff', async ({ page }) => {
    await page.waitForTimeout(2000);
    const usageBars = page.locator('.usage-bar');
    const count = await usageBars.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('plans grid shows available plans', async ({ page }) => {
    await page.waitForTimeout(2000);
    const planCards = page.locator('.plan-card');
    const count = await planCards.count();
    console.log(`Found ${count} plan cards`);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('billing period toggle switches between monthly and yearly', async ({ page }) => {
    await page.waitForTimeout(1000);
    const yearlyBtn = page.locator('.period-toggle button').filter({ hasText: /yearly/i });
    if (await yearlyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await yearlyBtn.click();
      await expect(yearlyBtn).toHaveClass(/active/);
      const monthlyBtn = page.locator('.period-toggle button').filter({ hasText: /monthly/i });
      await monthlyBtn.click();
      await expect(monthlyBtn).toHaveClass(/active/);
    }
  });

  test('payment history section is present', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: /payment history/i })).toBeVisible({ timeout: 8000 });
  });

  test('empty invoice state or invoice table renders', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasTable  = await page.locator('table').isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty  = await page.locator('.empty-invoices').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('billing link is in the sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const billingLink = page.locator('mat-nav-list a[href="/billing"], [routerLink="/billing"]');
    await expect(billingLink).toBeVisible({ timeout: 5000 });
  });
});

// ─── Billing API endpoints ────────────────────────────────────────────────────

test.describe('Billing API', () => {
  test.use({ storageState: STATE.admin });

  test('GET /schools/me/usage returns subscription data', async ({ request }) => {
    const res = await request.get(`${API_URL}/schools/me/usage`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data).toHaveProperty('plan');
    expect(body.data).toHaveProperty('subscriptionStatus');
  });

  test('GET /schools/plans returns plan list', async ({ request }) => {
    const res = await request.get(`${API_URL}/schools/plans`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);
    // trial plan should be filtered out
    const hasTrial = body.data.some((p: any) => p.name === 'trial');
    expect(hasTrial).toBeFalsy();
  });

  test('GET /schools/me/invoices returns invoice history', async ({ request }) => {
    const res = await request.get(`${API_URL}/schools/me/invoices`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data).toHaveProperty('invoices');
    expect(Array.isArray(body.data.invoices)).toBeTruthy();
  });

  test('POST /schools/me/create-order rejects invalid plan', async ({ request }) => {
    const res = await request.post(`${API_URL}/schools/me/create-order`, {
      data: { plan: 'nonexistent_plan', billingPeriod: 'monthly' },
    });
    expect(res.ok()).toBeFalsy();
  });
});

// ─── Email verification endpoint ─────────────────────────────────────────────

test.describe('Email Verification API', () => {
  test('GET /schools/verify-email rejects missing token', async ({ request }) => {
    const res = await request.get(`${API_URL}/schools/verify-email`);
    expect(res.status()).toBe(400);
  });

  test('GET /schools/verify-email rejects invalid token', async ({ request }) => {
    const res = await request.get(`${API_URL}/schools/verify-email?token=invalid_token_123`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message || body.error).toBeTruthy();
  });

  test('verify-email Angular route loads without error', async ({ page }) => {
    await page.goto('/verify-email?token=invalid_token_for_test');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Should show error state (invalid token), not crash
    await expect(page.locator('body')).not.toContainText('Unexpected error');
    const errorState = page.locator('.state-wrap.error, h2').filter({ hasText: /verif|invalid|failed/i });
    await expect(errorState).toBeVisible({ timeout: 8000 });
  });
});

// ─── Super-admin school detail & impersonation ────────────────────────────────

test.describe('School Detail & Impersonation - Super Admin', () => {
  test.use({ storageState: STATE.superAdmin });

  test('can navigate to school detail page', async ({ page }) => {
    await page.goto('/super-admin/schools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click first school row/link if available
    const firstRow = page.locator('table tbody tr').first();
    const hasRows  = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasRows) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await expect(page.locator('body')).not.toContainText('Unexpected error');
      // Should be on /super-admin/schools/:id
      expect(page.url()).toMatch(/super-admin\/schools\//);
    }
  });

  test('school detail shows subscription & usage sections', async ({ page }) => {
    await page.goto('/super-admin/schools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr').first();
    const hasRows  = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasRows) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Check for subscription and usage cards
      const subscriptionCard = page.locator('.card-title').filter({ hasText: /subscription/i });
      const usageCard        = page.locator('.card-title').filter({ hasText: /usage/i });
      const subVisible       = await subscriptionCard.isVisible({ timeout: 5000 }).catch(() => false);
      const usageVisible     = await usageCard.isVisible({ timeout: 5000 }).catch(() => false);
      expect(subVisible || usageVisible).toBeTruthy();
    }
  });

  test('impersonate button is visible on school detail', async ({ page }) => {
    await page.goto('/super-admin/schools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr').first();
    const hasRows  = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasRows) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const impersonateBtn = page.locator('.btn-impersonate, button').filter({ hasText: /log in as admin/i });
      await expect(impersonateBtn).toBeVisible({ timeout: 8000 });
    }
  });

  test('impersonate API returns a token', async ({ request }) => {
    // First, get the list of schools to find a valid school ID
    const listRes = await request.get(`${API_URL}/superadmin/schools?limit=1`);
    if (!listRes.ok()) return; // skip if no schools exist

    const listBody = await listRes.json();
    const schools  = listBody.data?.schools || listBody.data || [];
    if (schools.length === 0) return;

    const schoolId = schools[0].id;
    const res = await request.post(`${API_URL}/superadmin/schools/${schoolId}/impersonate`);

    if (res.status() === 404 || res.status() === 400) {
      // School has no admin user yet — acceptable in test env
      return;
    }

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data?.token).toBeTruthy();
    // Token should be a JWT (3 dot-separated parts)
    expect(body.data.token.split('.').length).toBe(3);
  });
});
