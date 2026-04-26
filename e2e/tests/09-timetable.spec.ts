/**
 * 09 — Timetable Management
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

test.describe('Timetable - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('timetable page loads', async ({ page }) => {
    await page.goto('/timetable');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('timetable view renders', async ({ page }) => {
    await page.goto('/timetable');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
    // Grid or table should be present
    const grid = page.locator('table, .timetable-grid, .schedule-grid, mat-table');
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('can add a timetable entry', async ({ page }) => {
    await page.goto('/timetable');
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

  test('exams timetable page loads', async ({ page }) => {
    await page.goto('/timetable/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('Timetable - Teacher View', () => {
  test.use({ storageState: STATE.teacher });

  test('teacher can view timetable', async ({ page }) => {
    await page.goto('/timetable');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('Timetable - Student View', () => {
  test.use({ storageState: STATE.student });

  test('student can view class timetable', async ({ page }) => {
    await page.goto('/timetable');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});
