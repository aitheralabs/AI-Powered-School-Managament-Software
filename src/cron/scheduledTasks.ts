/**
 * Scheduled Tasks
 *
 * All recurring background jobs for the SaaS platform.
 * Uses node-cron (already installed).
 *
 * Schedule summary:
 *   Every day at 08:00 — trial expiry warnings
 *   Every day at 08:30 — dunning escalation
 *   Every day at 09:00 — overage / limit alerts
 *
 * Call startScheduledTasks() once at server startup (in app.ts / index.ts).
 */

import cron from 'node-cron';
import { dunningService } from '../services/dunningService';

let started = false;

export function startScheduledTasks(): void {
  if (started) return; // guard against double-start in hot-reload dev
  started = true;

  // ── Trial expiry warnings ── 08:00 daily ─────────────────
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running trial expiry warnings…');
    try {
      await dunningService.runTrialWarnings();
    } catch (err) {
      console.error('[Cron] Trial warnings failed:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // ── Dunning escalation ── 08:30 daily ─────────────────────
  cron.schedule('30 8 * * *', async () => {
    console.log('[Cron] Running dunning escalation…');
    try {
      await dunningService.runDunning();
    } catch (err) {
      console.error('[Cron] Dunning escalation failed:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // ── Overage / limit alerts ── 09:00 daily ─────────────────
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running overage alerts…');
    try {
      await dunningService.runOverageAlerts();
    } catch (err) {
      console.error('[Cron] Overage alerts failed:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('✅ Scheduled tasks started (trial warnings, dunning, overage alerts)');
}
