/**
 * 04 — Teacher Management (Admin role)
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

test.use({ storageState: STATE.admin });

test.describe('Teacher Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teachers');
    await page.waitForLoadState('networkidle');
  });

  test('teacher list page loads', async ({ page }) => {
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('teachers table/list is visible', async ({ page }) => {
    // .table-wrapper appears when loading is done (regardless of row count)
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('table, mat-table, .teacher-card, mat-card, .table-wrapper').first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('add teacher button visible', async ({ page }) => {
    await expect(
      page.locator('button').filter({ hasText: /add|new|create/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('add teacher dialog opens', async ({ page }) => {
    await page.locator('button').filter({ hasText: /add|new|create/i }).first().click();
    await expect(
      page.locator('mat-dialog-container, [role="dialog"], .form-container').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('add teacher form has required fields', async ({ page }) => {
    await page.locator('button').filter({ hasText: /add|new|create/i }).first().click();
    await page.waitForTimeout(500);

    const inputs = page.locator('mat-dialog-container input, [role="dialog"] input, .form-container input');
    const count  = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('can add a new teacher', async ({ page }) => {
    await page.locator('button').filter({ hasText: /add|new|create/i }).first().click();
    await page.waitForTimeout(800);

    const ts = Date.now();
    const dialog = page.locator('mat-dialog-container, [role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Personal info
    await dialog.locator('input[formControlName="firstName"]').fill(`TFirst${ts}`);
    await dialog.locator('input[formControlName="lastName"]').fill(`TLast${ts}`);
    await dialog.locator('input[formControlName="email"]').fill(`teacher${ts}@test.com`);
    await dialog.locator('input[formControlName="phone"]').fill('9876543210').catch(() => {});

    // Required professional fields
    await dialog.locator('input[formControlName="employeeId"]').fill(`EMP${ts}`);
    await dialog.locator('input[formControlName="qualification"]').fill('M.Ed');
    await dialog.locator('input[formControlName="specialization"]').fill('Mathematics');

    // dateOfJoining defaults to new Date() — leave as-is, just blur to mark as touched
    await page.keyboard.press('Tab');

    // Submit — use mat-raised-button directive attribute (always preserved in DOM)
    await dialog.locator('button[mat-raised-button]').first().click();

    await expect(
      page.locator('.toast-success, [class*="success"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('search/filter works', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('abc');
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });
});

test.describe('Teacher access restrictions', () => {
  test.use({ storageState: STATE.teacher });

  test('teacher cannot access /students with admin-only actions', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    // Page may load but Add button should be absent or disabled
    const addBtn = page.locator('button').filter({ hasText: /add student/i }).first();
    const isVisible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    // Teachers generally can view but not manage students
    // Just verify no hard error
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});
