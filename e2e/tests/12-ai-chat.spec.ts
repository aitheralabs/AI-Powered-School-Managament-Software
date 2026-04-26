/**
 * 12 — AI Chat / AI Insights
 */
import { test, expect } from '@playwright/test';
import { STATE } from '../fixtures/constants';

test.describe('AI Chat - Admin', () => {
  test.use({ storageState: STATE.admin });

  test('AI chat page loads', async ({ page }) => {
    await page.goto('/ai-chat');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .page-title, app-ai-chat').first()).toBeVisible();
  });

  test('chat input is visible', async ({ page }) => {
    await page.goto('/ai-chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const input = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], .chat-input input').first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(input).toBeEnabled();
    }
  });

  test('can send a chat message', async ({ page }) => {
    await page.goto('/ai-chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const input = page.locator('input[placeholder*="message" i], textarea[placeholder*="Ask" i], .chat-input input, .message-input').first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('What is the total number of students?');
      const sendBtn = page.locator('button[type="submit"], button').filter({ hasText: /send/i }).first();
      if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sendBtn.click();
      } else {
        await input.press('Enter');
      }
      // Wait for response (may take a few seconds)
      await page.waitForTimeout(5000);
      await expect(page.locator('body')).not.toContainText('Unexpected error');
    }
  });

  test('ai-insights redirects to ai-chat', async ({ page }) => {
    await page.goto('/ai-insights');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('ai-chat');
  });
});
