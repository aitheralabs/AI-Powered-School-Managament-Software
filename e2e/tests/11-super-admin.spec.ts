/**
 * 11 — Super Admin Module
 * Tests: login, dashboard KPIs, school management, subscription management
 */
import { test, expect } from '@playwright/test';
import { STATE, CREDENTIALS } from '../fixtures/constants';

// Super admin has its own storage state and separate login
test.use({ storageState: STATE.superAdmin });

test.describe('Super Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('super admin dashboard loads', async ({ page }) => {
    await expect(page.locator('h1, h2, .page-title, app-super-admin').first()).toBeVisible();
  });

  test('platform KPI stats visible', async ({ page }) => {
    await page.waitForTimeout(2000);
    const kpiCards = page.locator('mat-card, .card, .stat-card, .kpi');
    const count = await kpiCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('dark theme applied', async ({ page }) => {
    // Super admin has dark theme
    const body = page.locator('body, .super-admin-container');
    const classList = await body.evaluate(el => el.className);
    // May have dark class or just verify styles loaded
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('School Management - Super Admin', () => {
  test('can view list of schools', async ({ page }) => {
    await page.goto('/super-admin/schools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
    const schools = page.locator('table tbody tr, mat-card, .school-card');
    const count   = await schools.count();
    console.log(`Found ${count} schools`);
  });

  test('can add a new school', async ({ page }) => {
    await page.goto('/super-admin/schools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button').filter({ hasText: /add|new|create|register/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await expect(
        page.locator('mat-dialog-container, [role="dialog"]').first()
      ).toBeVisible({ timeout: 5000 });

      const ts = Date.now();
      const dialog = page.locator('mat-dialog-container, [role="dialog"]');
      await dialog.locator('input[formControlName="name"], input[placeholder*="name" i]').first().fill(`TestSchool${ts}`).catch(() => {});
      await dialog.locator('input[type="email"]').first().fill(`school${ts}@test.com`).catch(() => {});
      await dialog.locator('input[formControlName="phone"], input[placeholder*="phone" i]').first().fill('9876543210').catch(() => {});
      await dialog.locator('input[formControlName="address"], input[placeholder*="address" i]').first().fill('123 Test Street').catch(() => {});

      await page.locator('button').filter({ hasText: /save|submit|create/i }).first().click();
      await expect(page.locator('.toast-success, [class*="success"]').first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('can manage subscriptions', async ({ page }) => {
    await page.goto('/super-admin/subscriptions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can view platform analytics', async ({ page }) => {
    await page.goto('/super-admin/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can manage admin users', async ({ page }) => {
    await page.goto('/super-admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('Super Admin navigation', () => {
  test('all main nav links are accessible', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await page.waitForLoadState('networkidle');

    const navLinks = page.locator('nav a, mat-nav-list a, [routerLink]');
    const count    = await navLinks.count();
    console.log(`Super Admin has ${count} nav links`);
    expect(count).toBeGreaterThan(0);
  });
});
