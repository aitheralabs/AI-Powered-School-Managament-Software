import { Page, expect } from '@playwright/test';
import { API_URL } from './constants';

// ─── API Login helper (returns token) ─────────────────────────────────────────
export async function apiLogin(
  email: string,
  password: string,
  superAdmin = false,
): Promise<{ token: string; user: any }> {
  const endpoint = superAdmin
    ? `${API_URL}/superadmin/login`
    : `${API_URL}/auth/login`;

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await resp.json();
  if (!json.success) throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
  const token = json.data?.token ?? json.token;
  const user  = json.data?.user  ?? json.user;
  return { token, user };
}

// ─── Inject token into Angular app via localStorage ───────────────────────────
export async function injectToken(page: Page, token: string, user: any, superAdmin = false) {
  await page.goto('/');
  await page.evaluate(
    ({ token, user, superAdmin }) => {
      if (superAdmin) {
        localStorage.setItem('superAdminToken', token);
        localStorage.setItem('superAdminUser', JSON.stringify(user));
      } else {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    { token, user, superAdmin },
  );
}

// ─── Navigate and wait for page to be stable ──────────────────────────────────
export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

// ─── Wait for toast message ────────────────────────────────────────────────────
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator('.toast-message, .mat-snack-bar-container, ngx-toastr')).toContainText(text);
}

// ─── Fill a Material input field ─────────────────────────────────────────────
export async function fillField(page: Page, label: string, value: string) {
  const field = page.locator(`[placeholder="${label}"], [formcontrolname], mat-form-field`).filter({ hasText: label }).first();
  const input = field.locator('input, textarea').first();
  await input.fill(value);
}

// ─── Click a button containing text ──────────────────────────────────────────
export async function clickButton(page: Page, text: string) {
  await page.locator(`button`).filter({ hasText: text }).first().click();
}

// ─── Assert table has at least one row ────────────────────────────────────────
export async function expectTableHasRows(page: Page) {
  await expect(page.locator('table tbody tr, mat-row').first()).toBeVisible();
}

// ─── API helper — make authenticated request ──────────────────────────────────
export async function apiRequest(
  method: string,
  path: string,
  token: string,
  body?: object,
): Promise<any> {
  const resp = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return resp.json();
}
