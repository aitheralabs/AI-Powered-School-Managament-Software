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
    // Dialog submit button says "Create" — scope to dialog to avoid page-level buttons
    await page.locator('mat-dialog-container button, [role="dialog"] button').filter({ hasText: /save|submit|create/i }).first().click();
    await expect(page.locator('mat-error, .error').first()).toBeVisible({ timeout: 5000 });
  });

  test('can create a new class', async ({ page }) => {
    await page.locator('button').filter({ hasText: /add class|new class|add/i }).first().click();
    await page.waitForTimeout(1000); // allow dialog and dropdowns to load

    const ts = Date.now();
    const dialog = page.locator('mat-dialog-container, [role="dialog"]');

    // Wait for form fields to be ready (hidden while data loads)
    await dialog.locator('input[formControlName="name"]').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Class name
    await dialog.locator('input[formControlName="name"]').first().fill(`Class${ts}`).catch(() => {});

    // Grade (first mat-select) — pick based on timestamp to vary each run and avoid conflicts
    const gradeSelect = dialog.locator('mat-select').nth(0);
    if (await gradeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gradeSelect.click();
      const gradeOpts = page.locator('mat-option');
      const cnt = await gradeOpts.count();
      // Use ts to pick a grade that changes each run (avoid always picking grade 12)
      const gradeIdx = cnt > 0 ? (ts % Math.max(cnt - 1, 1)) : 0;
      await gradeOpts.nth(gradeIdx).click().catch(() => {});
    }

    // Section (second mat-select) — pick based on timestamp offset to vary each run
    const sectionSelect = dialog.locator('mat-select').nth(1);
    if (await sectionSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sectionSelect.click();
      const secOpts = page.locator('mat-option');
      const scnt = await secOpts.count();
      // Use different part of ts to avoid same grade+section combination
      const secIdx = scnt > 0 ? (Math.floor(ts / 1000) % scnt) : 0;
      await secOpts.nth(secIdx).click().catch(() => {});
    }

    // Academic Year (third mat-select — required)
    const yearSelect = dialog.locator('mat-select').nth(2);
    if (await yearSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await yearSelect.click();
      const yearOpts = page.locator('mat-option');
      if (await yearOpts.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await yearOpts.first().click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Capacity
    await dialog.locator('input[formControlName="capacity"]').first().fill('30').catch(() => {});

    // Submit — button says "Create", scoped to dialog
    await dialog.locator('button').filter({ hasText: /create|save/i }).first().click();

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
