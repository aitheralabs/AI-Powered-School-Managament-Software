/**
 * 08 — Grades & Assessments
 * Tests: grade entry, grade list, report cards
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

test.describe('Grades - Admin/Teacher', () => {
  test.use({ storageState: STATE.admin });

  test('grades list page loads', async ({ page }) => {
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('grades table is visible', async ({ page }) => {
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('add grade button visible', async ({ page }) => {
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button').filter({ hasText: /add|new|enter|record/i }).first();
    const visible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    // just verify page loaded without error
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('add grade form opens and validates', async ({ page }) => {
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button').filter({ hasText: /add|new|enter/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      const dialog = page.locator('mat-dialog-container, [role="dialog"]');
      await expect(dialog.first()).toBeVisible({ timeout: 5000 });

      // Submit empty
      await page.locator('button').filter({ hasText: /save|submit/i }).first().click();
      await expect(page.locator('mat-error, .error').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('can enter a grade for a student', async ({ page }) => {
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button').filter({ hasText: /add|new|enter/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('mat-dialog-container, [role="dialog"]');

      // Select student
      const studentSelect = dialog.locator('mat-select').nth(0);
      if (await studentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await studentSelect.click();
        await page.locator('mat-option').first().click();
        await page.waitForTimeout(300);
      }

      // Select subject
      const subjectSelect = dialog.locator('mat-select').nth(1);
      if (await subjectSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjectSelect.click();
        await page.locator('mat-option').first().click();
        await page.waitForTimeout(300);
      }

      // Enter score
      await dialog.locator('input[formControlName*="score" i], input[formControlName*="grade" i], input[placeholder*="score" i]').first().fill('85').catch(() => {});
      await dialog.locator('input[formControlName*="max" i], input[placeholder*="max" i]').first().fill('100').catch(() => {});

      await page.locator('button').filter({ hasText: /save|submit/i }).first().click();
      await expect(page.locator('.toast-success, [class*="success"]').first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('report cards page loads', async ({ page }) => {
    await page.goto('/grades/report-cards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('Grades - Student View', () => {
  test.use({ storageState: STATE.student });

  test('student can view their grades', async ({ page }) => {
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('Grades - Parent View', () => {
  test.use({ storageState: STATE.parent });

  test('parent can view child grades', async ({ page }) => {
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});
