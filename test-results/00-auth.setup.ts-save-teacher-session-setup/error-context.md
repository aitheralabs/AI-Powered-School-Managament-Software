# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 00-auth.setup.ts >> save teacher session
- Location: e2e\tests\00-auth.setup.ts:39:6

# Error details

```
TypeError: fetch failed
```

# Test source

```ts
  1  | import { Page, expect } from '@playwright/test';
  2  | import { API_URL } from './constants';
  3  | 
  4  | // ─── API Login helper (returns token) ─────────────────────────────────────────
  5  | export async function apiLogin(
  6  |   email: string,
  7  |   password: string,
  8  |   superAdmin = false,
  9  | ): Promise<{ token: string; user: any }> {
  10 |   const endpoint = superAdmin
  11 |     ? `${API_URL}/superadmin/login`
  12 |     : `${API_URL}/auth/login`;
  13 | 
> 14 |   const resp = await fetch(endpoint, {
     |                ^ TypeError: fetch failed
  15 |     method: 'POST',
  16 |     headers: { 'Content-Type': 'application/json' },
  17 |     body: JSON.stringify({ email, password }),
  18 |   });
  19 |   const json = await resp.json();
  20 |   if (!json.success) throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
  21 |   const token = json.data?.token ?? json.token;
  22 |   const user  = json.data?.user  ?? json.user;
  23 |   return { token, user };
  24 | }
  25 | 
  26 | // ─── Inject token into Angular app via localStorage ───────────────────────────
  27 | export async function injectToken(page: Page, token: string, user: any, superAdmin = false) {
  28 |   await page.goto('/');
  29 |   await page.evaluate(
  30 |     ({ token, user, superAdmin }) => {
  31 |       if (superAdmin) {
  32 |         localStorage.setItem('superAdminToken', token);
  33 |         localStorage.setItem('superAdminUser', JSON.stringify(user));
  34 |       } else {
  35 |         localStorage.setItem('token', token);
  36 |         localStorage.setItem('user', JSON.stringify(user));
  37 |       }
  38 |     },
  39 |     { token, user, superAdmin },
  40 |   );
  41 | }
  42 | 
  43 | // ─── Navigate and wait for page to be stable ──────────────────────────────────
  44 | export async function gotoAndWait(page: Page, path: string) {
  45 |   await page.goto(path);
  46 |   await page.waitForLoadState('networkidle');
  47 | }
  48 | 
  49 | // ─── Wait for toast message ────────────────────────────────────────────────────
  50 | export async function expectToast(page: Page, text: string | RegExp) {
  51 |   await expect(page.locator('.toast-message, .mat-snack-bar-container, ngx-toastr')).toContainText(text);
  52 | }
  53 | 
  54 | // ─── Fill a Material input field ─────────────────────────────────────────────
  55 | export async function fillField(page: Page, label: string, value: string) {
  56 |   const field = page.locator(`[placeholder="${label}"], [formcontrolname], mat-form-field`).filter({ hasText: label }).first();
  57 |   const input = field.locator('input, textarea').first();
  58 |   await input.fill(value);
  59 | }
  60 | 
  61 | // ─── Click a button containing text ──────────────────────────────────────────
  62 | export async function clickButton(page: Page, text: string) {
  63 |   await page.locator(`button`).filter({ hasText: text }).first().click();
  64 | }
  65 | 
  66 | // ─── Assert table has at least one row ────────────────────────────────────────
  67 | export async function expectTableHasRows(page: Page) {
  68 |   await expect(page.locator('table tbody tr, mat-row').first()).toBeVisible();
  69 | }
  70 | 
  71 | // ─── API helper — make authenticated request ──────────────────────────────────
  72 | export async function apiRequest(
  73 |   method: string,
  74 |   path: string,
  75 |   token: string,
  76 |   body?: object,
  77 | ): Promise<any> {
  78 |   const resp = await fetch(`${API_URL}${path}`, {
  79 |     method,
  80 |     headers: {
  81 |       'Content-Type': 'application/json',
  82 |       Authorization: `Bearer ${token}`,
  83 |     },
  84 |     body: body ? JSON.stringify(body) : undefined,
  85 |   });
  86 |   return resp.json();
  87 | }
  88 | 
```