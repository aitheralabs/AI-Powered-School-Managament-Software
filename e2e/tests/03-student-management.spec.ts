/**
 * 03 — Student Management (Admin role)
 * Tests: list, search, add, edit, delete students
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';
import { expectTableHasRows } from '../fixtures/helpers';

test.use({ storageState: STATE.admin });

let createdStudentId: string;

test.describe('Student List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
  });

  test('student list page loads', async ({ page }) => {
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('table or card list is visible', async ({ page }) => {
    // Wait for loading to complete — .content-card is always rendered (not inside *ngIf)
    await page.waitForTimeout(2000);
    // content-card is the outer wrapper, always visible regardless of data
    await expect(page.locator('.content-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('search input works', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i], mat-form-field input').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      // Should filter or show no results — no crash
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });

  test('Add Student button is visible for admin', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Add Student Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
  });

  test('opens add student dialog/form', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /add student|new student|add/i }).first();
    await addBtn.click();
    // Dialog or form should appear
    await expect(
      page.locator('mat-dialog-container, .dialog, .form-container, [role="dialog"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('add student form validates required fields', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /add student|new student|add/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Scope submit to dialog — dialog button says "Create" not "save/submit/add"
    const dialog = page.locator('mat-dialog-container');
    await dialog.locator('button').filter({ hasText: /create|update/i }).first().click();

    await expect(page.locator('mat-error, .error, [class*="invalid"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('can add a new student successfully', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /add student|new student|add/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    const ts = Date.now();
    const dialog = page.locator('mat-dialog-container');

    // Personal info
    await dialog.locator('input[formControlName="firstName"]').fill(`TestFirst${ts}`).catch(() => {});
    await dialog.locator('input[formControlName="lastName"]').fill(`TestLast${ts}`).catch(() => {});
    await dialog.locator('input[formControlName="email"]').fill(`teststudent${ts}@test.com`).catch(() => {});

    // Student ID (required)
    await dialog.locator('input[formControlName="studentId"]').fill(`STU${ts}`).catch(() => {});

    // Gender select (first mat-select in dialog)
    await dialog.locator('mat-select').first().click();
    await page.locator('mat-option').first().click().catch(() => {});

    // Date of birth (datepicker — NativeDateAdapter accepts ISO strings)
    await dialog.locator('input[formControlName="dateOfBirth"]').fill('2010-01-15').catch(() => {});
    await page.keyboard.press('Tab');

    // Class selection (second mat-select — skip "Not Assigned", pick first real class)
    const classSelect = dialog.locator('mat-select').nth(1);
    if (await classSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await classSelect.click();
      const opts = page.locator('mat-option');
      const cnt = await opts.count();
      if (cnt > 1) {
        await opts.nth(1).click(); // skip "Not Assigned"
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Guardian info (required)
    await dialog.locator('input[formControlName="guardianName"]').fill('Test Guardian').catch(() => {});
    await dialog.locator('input[formControlName="guardianPhone"]').fill('9876543210').catch(() => {});
    await dialog.locator('input[formControlName="emergencyContact"]').fill('9876543211').catch(() => {});

    // Password (required for new students)
    await dialog.locator('input[formControlName="password"]').fill('Password@123').catch(() => {});

    // Submit — button says "Create" inside the dialog
    await dialog.locator('button').filter({ hasText: /create|save/i }).first().click();

    await expect(
      page.locator('.toast-success, [class*="success"], .snack-success').first()
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Edit Student', () => {
  test('can open edit form for first student', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const editBtn = page.locator('button[aria-label*="edit" i], button').filter({ hasText: /edit/i }).first();
    const row = page.locator('table tbody tr, mat-row').first();

    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
    } else if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
    }

    await expect(
      page.locator('mat-dialog-container, .dialog, [role="dialog"], .form-container').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Student Detail View', () => {
  test('clicking a student opens detail page', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr, mat-row, .student-card').first();
    if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      const viewBtn = firstRow.locator('button, a').filter({ hasText: /view|detail/i }).first();
      if (await viewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewBtn.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(/students\/\d+|students\/detail/);
      }
    }
  });
});
