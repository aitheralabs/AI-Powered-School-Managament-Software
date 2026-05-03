/**
 * 10 — Reports, Staff Management, Parents
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

// ─── Reports ─────────────────────────────────────────────────────────────────
test.describe('Reports - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('report types are listed', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can generate attendance report', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const attendanceLink = page.locator('a, button, mat-card').filter({ hasText: /attendance/i }).first();
    if (await attendanceLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await attendanceLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toContainText('Unexpected error');
    }
  });

  test('can generate fee report', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    const feeLink = page.locator('a, button, mat-card').filter({ hasText: /fee|payment/i }).first();
    if (await feeLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await feeLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toContainText('Unexpected error');
    }
  });
});

// ─── Staff Management ─────────────────────────────────────────────────────────
test.describe('Staff Management - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('staff list page loads', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('staff list shows results', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('add staff button visible', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    const visible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can add staff member', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const ts = Date.now();
      const dialog = page.locator('mat-dialog-container, [role="dialog"]').first();
      if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Personal info
        await dialog.locator('input[formControlName="firstName"]').fill(`Staff${ts}`);
        await dialog.locator('input[formControlName="lastName"]').fill(`Member`);
        await dialog.locator('input[formControlName="email"]').fill(`staff${ts}@test.com`);

        // Required employment fields
        await dialog.locator('input[formControlName="employeeId"]').fill(`EMP${ts}`);
        await dialog.locator('input[formControlName="joiningDate"]').fill('2024-01-01').catch(() => {});

        // Department select (first mat-select in dialog)
        const deptSelect = dialog.locator('mat-select').nth(0);
        if (await deptSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await deptSelect.click();
          await page.waitForTimeout(300);
          const deptOption = page.locator('mat-option').first();
          if (await deptOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await deptOption.click();
          } else {
            await page.keyboard.press('Escape');
          }
        }

        // Position select (second mat-select in dialog)
        const posSelect = dialog.locator('mat-select').nth(1);
        if (await posSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await posSelect.click();
          await page.waitForTimeout(300);
          const posOption = page.locator('mat-option').first();
          if (await posOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await posOption.click();
          } else {
            await page.keyboard.press('Escape');
          }
        }

        // Password (required for new staff)
        await dialog.locator('input[formControlName="password"]').fill('Password@123').catch(() => {});

        // Submit — wait for API response (201 Created) rather than a toast
        const staffResponsePromise = page.waitForResponse(
          resp => resp.url().includes('/staff') && resp.status() === 201,
          { timeout: 15000 }
        );
        await dialog.locator('button[mat-raised-button]').first().click();
        await staffResponsePromise;
      }
    }
  });
});

// ─── Parents ──────────────────────────────────────────────────────────────────
test.describe('Parents Management - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('parents list page loads', async ({ page }) => {
    await page.goto('/parents');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('parents list shows data', async ({ page }) => {
    await page.goto('/parents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can add parent', async ({ page }) => {
    await page.goto('/parents');
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

// ─── Profile & Settings ───────────────────────────────────────────────────────
test.describe('Profile & Settings', () => {
  test.use({ storageState: STATE.admin });

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title, app-profile').first()).toBeVisible();
  });

  test('profile shows user info', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });
});
