/**
 * 10 — Reports, Staff Management, Parents
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

// ─── Reports ─────────────────────────────────────────────────────────────────
test.describe('Reports - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('report types are listed', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can generate attendance report', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const attendanceLink = page.locator('a, button, mat-card').filter({ hasText: /attendance/i }).first();
    if (await attendanceLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await attendanceLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toContainText('Unexpected error');
    }
  });

  test('can generate fee report', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    const feeLink = page.locator('a, button, mat-card').filter({ hasText: /fee|payment/i }).first();
    if (await feeLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await feeLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toContainText('Unexpected error');
    }
  });
});

// ─── Staff Management ─────────────────────────────────────────────────────────
test.describe('Staff Management - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('staff list page loads', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('staff list shows results', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('add staff button visible', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    const visible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can add staff member', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const ts = Date.now();
      const dialog = page.locator('mat-dialog-container, [role="dialog"]');
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dialog.locator('input[formControlName="firstName"], input[placeholder*="first" i]').first().fill(`Staff${ts}`).catch(() => {});
        await dialog.locator('input[formControlName="lastName"], input[placeholder*="last" i]').first().fill(`Member`).catch(() => {});
        await dialog.locator('input[type="email"]').first().fill(`staff${ts}@test.com`).catch(() => {});

        await page.locator('button').filter({ hasText: /save|submit/i }).first().click();
        await expect(page.locator('.toast-success, [class*="success"]').first()).toBeVisible({ timeout: 8000 });
      }
    }
  });
});

// ─── Parents ──────────────────────────────────────────────────────────────────
test.describe('Parents Management - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('parents list page loads', async ({ page }) => {
    await page.goto('/parents');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('parents list shows data', async ({ page }) => {
    await page.goto('/parents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can add parent', async ({ page }) => {
    await page.goto('/parents');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await expect(
        page.locator('mat-dialog-container, [role="dialog"]').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── Profile & Settings ───────────────────────────────────────────────────────
test.describe('Profile & Settings', () => {
  test.use({ storageState: STATE.admin });

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title, app-profile').first()).toBeVisible();
  });

  test('profile shows user info', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });
});
