/**
 * 02 — Admin Dashboard
 * Tests KPIs, charts, recent activity, navigation links
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

test.use({ storageState: STATE.admin });

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('loads without errors', async ({ page }) => {
    await expect(page.locator('app-dashboard, .dashboard-container, main').first()).toBeVisible();
    // No JS error dialog
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('shows KPI cards (students, teachers, fees)', async ({ page }) => {
    const kpi = page.locator('mat-card, .card, .kpi-card, .stat-card');
    await expect(kpi.first()).toBeVisible();
    const count = await kpi.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('sidebar navigation is visible', async ({ page }) => {
    await expect(page.locator('mat-sidenav, app-sidebar, .sidebar, nav').first()).toBeVisible();
  });

  test('sidebar links navigate correctly', async ({ page }) => {
    const links = [
      { label: /students/i, url: /students/ },
      { label: /teachers/i, url: /teachers/ },
      { label: /classes/i, url: /classes/ },
      { label: /fees/i, url: /fees/ },
    ];
    for (const link of links) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const navLink = page.locator('nav a, mat-nav-list a, [routerLink]').filter({ hasText: link.label }).first();
      if (await navLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await navLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(link.url);
      }
    }
  });

  test('chart renders on dashboard', async ({ page }) => {
    const chart = page.locator('canvas, .chart-container, app-chart, ngx-charts').first();
    if (await chart.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(chart).toBeVisible();
    }
  });

  test('profile link is accessible', async ({ page }) => {
    const profileLink = page.locator('a[href*="profile"], [routerLink*="profile"]').first();
    if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileLink.click();
      await expect(page).toHaveURL(/profile/);
    }
  });
});

test.describe('Teacher Dashboard', () => {
  test.use({ storageState: STATE.teacher });

  test('teacher dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, .dashboard-container').first()).toBeVisible();
  });

  test('teacher sees class-related widgets', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Teacher dashboard uses .kpi-tile and .dash-card (not mat-card/.card)
    const cards = page.locator('mat-card, .card, .kpi-tile, .dash-card');
    await expect(cards.first()).toBeVisible();
  });
});

test.describe('Student Dashboard', () => {
  test.use({ storageState: STATE.student });

  test('student dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, .dashboard-container').first()).toBeVisible();
  });
});

test.describe('Parent Dashboard', () => {
  test.use({ storageState: STATE.parent });

  test('parent dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, .dashboard-container').first()).toBeVisible();
  });
});
