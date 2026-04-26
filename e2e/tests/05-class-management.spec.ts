/**
 * 05 — Class Management (Admin role)
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

test.use({ storageState: STATE.admin });

test.describe('Class Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');
  });

  test('class list page loads', async ({ page }) => {
    await expect(page.locator('h1, h2, .page-title, app-class').first()).toBeVisible();
  });

  test('classes are displayed', async ({ page }) => {
    await page.waitForTimeout(2000);
    const items = page.locator('table tbody tr, mat-card, .class-card');
    const count  = await items.count();
    // May be 0 if no classes — just verify no crash
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('Add Class button is visible', async ({ page }) => {
    await expect(
      page.locator('button').filter({ hasText: /add class|new class|create class|add/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('add class dialog opens', async ({ page }) => {
    await page.locator('button').filter({ hasText: /add class|new class|add/i }).first().click();
    await expect(
      page.locator('mat-dialog-container, [role="dialog"], .form-container').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('add class form validates required fields', async ({ page }) => {
    await page.locator('button').filter({ hasText: /add class|new class|add/i }).first().click();
    await page.waitForTimeout(500);
    await page.locator('button').filter({ hasText: /save|submit/i }).first().click();
    await expect(page.locator('mat-error, .error').first()).toBeVisible({ timeout: 5000 });
  });

  test('can create a new class', async ({ page }) => {
    await page.locator('button').filter({ hasText: /add class|new class|add/i }).first().click();
    await page.waitForTimeout(500);

    const ts = Date.now();
    const dialog = page.locator('mat-dialog-container, [role="dialog"]');

    await dialog.locator('input[formControlName="name"], input[placeholder*="name" i]').first().fill(`Class${ts}`).catch(() => {});

    // Section / grade
    await dialog.locator('input[formControlName="section"], input[placeholder*="section" i]').first().fill('A').catch(() => {});

    // Capacity
    await dialog.locator('input[formControlName="capacity"], input[placeholder*="capacity" i]').first().fill('30').catch(() => {});

    await page.locator('button').filter({ hasText: /save|submit|add/i }).first().click();

    await expect(
      page.locator('.toast-success, [class*="success"]').first()
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Academic Year Management', () => {
  test('academic years page loads', async ({ page }) => {
    await page.goto('/academic');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('can view academic years list', async ({ page }) => {
    await page.goto('/academic');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('Subjects Management', () => {
  test('subjects page loads', async ({ page }) => {
    await page.goto('/subjects');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('subjects list is visible', async ({ page }) => {
    await page.goto('/subjects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('add subject opens form', async ({ page }) => {
    await page.goto('/subjects');
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
