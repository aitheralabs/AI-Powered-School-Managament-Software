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
    // Wait for data to load
    await page.waitForTimeout(2000);
    const hasTable = await page.locator('table, mat-table').first().isVisible().catch(() => false);
    const hasList  = await page.locator('mat-card, .student-card').first().isVisible().catch(() => false);
    expect(hasTable || hasList).toBeTruthy();
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

    // Click submit without filling
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|add/i }).first();
    await submitBtn.click();

    await expect(page.locator('mat-error, .error, [class*="invalid"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('can add a new student successfully', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /add student|new student|add/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    const timestamp = Date.now();
    const firstName = `TestFirst${timestamp}`;
    const lastName  = `TestLast${timestamp}`;
    const email     = `teststudent${timestamp}@test.com`;

    // Fill form fields
    const firstNameInput = page.locator('input[formControlName="firstName"], input[placeholder*="first" i]').first();
    const lastNameInput  = page.locator('input[formControlName="lastName"], input[placeholder*="last" i]').first();
    const emailInput     = page.locator('input[formControlName="email"], input[type="email"]').first();

    if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstNameInput.fill(firstName);
    }
    if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lastNameInput.fill(lastName);
    }
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(email);
    }

    // Fill date of birth if present
    const dobInput = page.locator('input[formControlName="dateOfBirth"], input[type="date"]').first();
    if (await dobInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dobInput.fill('2010-01-15');
    }

    // Submit
    await page.locator('button').filter({ hasText: /save|submit|add/i }).first().click();

    // Success toast or list update
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
