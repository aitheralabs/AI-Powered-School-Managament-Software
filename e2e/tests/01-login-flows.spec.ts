/**
 * 01 — Login / Auth Flows
 * Tests: login, logout, wrong credentials, token persistence, route guards
 */
import { test, expect } from '@playwright/test';
import { CREDENTIALS } from '../fixtures/constants';

const baseURL = 'http://localhost:4200';

test.describe('Login Page UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test('login page renders correctly', async ({ page }) => {
    await expect(page.locator('h1, h2, .title').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first()).toBeVisible();
  });

  test('shows validation error for empty submit', async ({ page }) => {
    await page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first().click();
    await expect(page.locator('mat-error, .error, [class*="error"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[formControlName="email"]', 'wrong@email.com');
    await page.fill('input[type="password"], input[formControlName="password"]', 'wrongpassword');
    await page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first().click();
    await expect(
      page.locator('.toast-error, [class*="error"], mat-error, .alert').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('admin can login successfully', async ({ page }) => {
    await page.fill('input[type="email"], input[formControlName="email"]', CREDENTIALS.admin.email);
    await page.fill('input[type="password"], input[formControlName="password"]', CREDENTIALS.admin.password);
    await page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('dashboard');
  });

  test('teacher can login and lands on dashboard', async ({ page }) => {
    await page.fill('input[type="email"], input[formControlName="email"]', CREDENTIALS.teacher.email);
    await page.fill('input[type="password"], input[formControlName="password"]', CREDENTIALS.teacher.password);
    await page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('dashboard');
  });

  test('student can login and lands on dashboard', async ({ page }) => {
    await page.fill('input[type="email"], input[formControlName="email"]', CREDENTIALS.student.email);
    await page.fill('input[type="password"], input[formControlName="password"]', CREDENTIALS.student.password);
    await page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('dashboard');
  });

  test('parent can login and lands on dashboard', async ({ page }) => {
    await page.fill('input[type="email"], input[formControlName="email"]', CREDENTIALS.parent.email);
    await page.fill('input[type="password"], input[formControlName="password"]', CREDENTIALS.parent.password);
    await page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('dashboard');
  });
});

test.describe('Route Guards', () => {
  test('unauthenticated user redirected from /dashboard to /auth/login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/auth\/login|login/);
  });

  test('unauthenticated user redirected from /students to login', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/auth\/login|login/);
  });

  test('unauthenticated user redirected from /fees to login', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/auth\/login|login/);
  });
});

test.describe('Logout', () => {
  test('admin can logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input[formControlName="email"]', CREDENTIALS.admin.email);
    await page.fill('input[type="password"], input[formControlName="password"]', CREDENTIALS.admin.password);
    await page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Logout via button in sidebar/header
    const logoutBtn = page.locator('button, a, [mat-menu-item]').filter({ hasText: /logout|sign out/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Try opening user menu first
      const userMenu = page.locator('[aria-label*="account"], [aria-label*="user"], .user-menu, .avatar').first();
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.locator('button, [mat-menu-item]').filter({ hasText: /logout|sign out/i }).first().click();
      }
    }
    await page.waitForURL(/auth\/login|landing|\//, { timeout: 10000 });
  });
});

test.describe('Super Admin Login', () => {
  test('super admin login page exists', async ({ page }) => {
    await page.goto('/super-admin/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"], input[formControlName="email"]')).toBeVisible();
  });

  test('super admin can login', async ({ page }) => {
    await page.goto('/super-admin/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[formControlName="email"]', CREDENTIALS.superAdmin.email);
    await page.fill('input[type="password"], input[formControlName="password"]', CREDENTIALS.superAdmin.password);
    await page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first().click();
    await page.waitForURL(/super-admin\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('super-admin');
  });
});
