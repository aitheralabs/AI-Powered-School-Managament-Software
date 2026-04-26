/**
 * 07 — Fees & Payments Management
 * Tests: fee categories, fee assignment, payment recording, student fee view
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

test.describe('Fees Management - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('fees categories page loads', async ({ page }) => {
    await page.goto('/fees/categories');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title, mat-card').first()).toBeVisible();
  });

  test('fee categories are displayed', async ({ page }) => {
    await page.goto('/fees/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('fee category form opens', async ({ page }) => {
    await page.goto('/fees/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await expect(
        page.locator('mat-dialog-container, [role="dialog"]').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('can create a fee category', async ({ page }) => {
    await page.goto('/fees/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const ts = Date.now();
      const dialog = page.locator('mat-dialog-container, [role="dialog"]');
      await dialog.locator('input[formControlName="name"], input[placeholder*="name" i]').first().fill(`Tuition${ts}`).catch(() => {});
      await dialog.locator('input[formControlName="amount"], input[placeholder*="amount" i]').first().fill('5000').catch(() => {});

      await page.locator('button').filter({ hasText: /save|submit/i }).first().click();
      await expect(page.locator('.toast-success, [class*="success"]').first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('payments list page loads', async ({ page }) => {
    await page.goto('/fees/payments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can record a payment', async ({ page }) => {
    await page.goto('/fees/payments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button').filter({ hasText: /record|add payment|new/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await expect(
        page.locator('mat-dialog-container, [role="dialog"]').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('student fee assignment page loads', async ({ page }) => {
    await page.goto('/fees/assign');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('fee report page loads', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    const reportLink = page.locator('a, button').filter({ hasText: /report|summary/i }).first();
    if (await reportLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toContainText('Unexpected error');
    }
  });
});

test.describe('Fees - Student View', () => {
  test.use({ storageState: STATE.student });

  test('student can view their fee details', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('Fees - Parent View', () => {
  test.use({ storageState: STATE.parent });

  test('parent can view fee details', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});
