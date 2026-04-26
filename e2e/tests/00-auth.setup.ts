/**
 * Auth Setup — runs once before all tests.
 * Logs in each role via API, saves tokens to .auth/*.json storage state files.
 * Subsequent tests load these files to skip re-login.
 */
import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import { apiLogin, injectToken } from '../fixtures/helpers';
import { CREDENTIALS, STATE } from '../fixtures/constants';

// ensure auth dir exists
const authDir = 'e2e/.auth';
if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

// ─── Super Admin ──────────────────────────────────────────────────────────────
setup('save super-admin session', async ({ page }) => {
  const { token, user } = await apiLogin(
    CREDENTIALS.superAdmin.email,
    CREDENTIALS.superAdmin.password,
    true,
  );
  await injectToken(page, token, user, true);
  await page.context().storageState({ path: STATE.superAdmin });
  console.log('✅ Super-admin session saved');
});

// ─── Admin ────────────────────────────────────────────────────────────────────
setup('save admin session', async ({ page }) => {
  const { token, user } = await apiLogin(
    CREDENTIALS.admin.email,
    CREDENTIALS.admin.password,
  );
  await injectToken(page, token, user);
  await page.context().storageState({ path: STATE.admin });
  console.log('✅ Admin session saved');
});

// ─── Teacher ──────────────────────────────────────────────────────────────────
setup('save teacher session', async ({ page }) => {
  const { token, user } = await apiLogin(
    CREDENTIALS.teacher.email,
    CREDENTIALS.teacher.password,
  );
  await injectToken(page, token, user);
  await page.context().storageState({ path: STATE.teacher });
  console.log('✅ Teacher session saved');
});

// ─── Student ──────────────────────────────────────────────────────────────────
setup('save student session', async ({ page }) => {
  const { token, user } = await apiLogin(
    CREDENTIALS.student.email,
    CREDENTIALS.student.password,
  );
  await injectToken(page, token, user);
  await page.context().storageState({ path: STATE.student });
  console.log('✅ Student session saved');
});

// ─── Parent ───────────────────────────────────────────────────────────────────
setup('save parent session', async ({ page }) => {
  const { token, user } = await apiLogin(
    CREDENTIALS.parent.email,
    CREDENTIALS.parent.password,
  );
  await injectToken(page, token, user);
  await page.context().storageState({ path: STATE.parent });
  console.log('✅ Parent session saved');
});
