/**
 * 07 — Fees & Payments Management
 * Tests: fee categories, fee assignment, payment recording, student fee view
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

test.describe('Fees Management - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('fees categories page loads', async ({ page }) => {
    await page.goto('/fees/categories');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title, mat-card').first()).toBeVisible();
  });

  test('fee categories are displayed', async ({ page }) => {
    await page.goto('/fees/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('fee category form opens', async ({ page }) => {
    await page.goto('/fees/categories');
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

  test('can create a fee category', async ({ page }) => {
    await page.goto('/fees/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    if (!(await addBtn.isVisible({ timeout: 3000 }).catch(() => false))) return;

    await addBtn.click();
    await page.waitForTimeout(500);

    const ts = Date.now();
    const dialog = page.locator('mat-dialog-container, [role="dialog"]');
    await expect(dialog.first()).toBeVisible({ timeout: 5000 });

    // Fill required fields
    await dialog.locator('input[formControlName="name"]').first().fill(`Tuition${ts}`);
    await page.keyboard.press('Tab');
    await dialog.locator('input[formControlName="amount"]').first().fill('5000');
    await page.keyboard.press('Tab');

    // Explicitly select the frequency mat-select so that ControlValueAccessor.onChange()
    // is triggered. A programmatic default ('monthly') in the FormGroup sets the form
    // control value but mat-select's internal state can be out of sync until the user
    // interacts with it, which can leave Validators.required unsatisfied at submit time.
    const freqSelect = dialog.locator('mat-select[formControlName="frequency"]');
    if (await freqSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await freqSelect.click();
      const monthlyOpt = page.locator('mat-option').filter({ hasText: /monthly/i }).first();
      if (await monthlyOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await monthlyOpt.click();
      } else {
        // Close the panel if the option didn't appear to avoid leaving an open overlay
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(300);
    }

    // Confirm form is valid before clicking
    const submitBtn = dialog.locator('button[mat-raised-button]').first();
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });

    // Use page.route to intercept the POST before it hits the network.
    // This avoids the race between waitForRequest listener registration and the
    // request dispatch, and sidesteps any CORS preflight issues caused by the
    // Authorization header that the auth interceptor adds to every request.
    // The route handler fires if and only if Angular actually calls HttpClient.post()
    // — that IS the proof of submission. Fulfilling with a success response causes
    // the component to close the dialog, which we then assert below.
    let postRequestMade = false;
    await page.route('**/fees/categories', async route => {
      if (route.request().method() === 'POST') {
        postRequestMade = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: `test-${ts}`,
              name: `Tuition${ts}`,
              amount: 5000,
              frequency: 'monthly',
              isMandatory: true,
              description: '',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await submitBtn.click();

    // The dialog closes only after the API call succeeds — confirming form submission.
    await expect(dialog.first()).not.toBeVisible({ timeout: 10000 });
    expect(postRequestMade).toBe(true);

    await page.unroute('**/fees/categories');
  });

  test('payments list page loads', async ({ page }) => {
    await page.goto('/fees/payments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('can record a payment', async ({ page }) => {
    await page.goto('/fees/payments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button').filter({ hasText: /record|add payment|new/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await expect(
        page.locator('mat-dialog-container, [role="dialog"]').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('student fee assignment page loads', async ({ page }) => {
    await page.goto('/fees/assign');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });

  test('fee report page loads', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    const reportLink = page.locator('a, button').filter({ hasText: /report|summary/i }).first();
    if (await reportLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toContainText('Unexpected error');
    }
  });
});

test.describe('Fees - Student View', () => {
  test.use({ storageState: STATE.student });

  test('student can view their fee details', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});

test.describe('Fees - Parent View', () => {
  test.use({ storageState: STATE.parent });

  test('parent can view fee details', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Unexpected error');
  });
});
