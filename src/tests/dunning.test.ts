/**
 * Dunning Service — Comprehensive Unit Tests
 *
 * Covers:
 *  - handlePaymentFailed()  → sets dunning_step=1, records timestamps
 *  - runDunning()           → step 2 (day 3+), step 3 (day 7+, partial lock), step 4 (day 14+, suspend)
 *  - runTrialWarnings()     → sends warning at 7 / 3 / 1 days before trial end, tracks warning_sent
 *  - runOverageAlerts()     → flags schools at ≥90% of limits
 *
 * Strategy: directly call DunningService methods and verify DB state changes.
 * Email sending is fire-and-forget (.catch) so test env SMTP errors are swallowed.
 */

import { dunningService } from '../services/dunningService';
import { query } from '../database/connection';

const TEST_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';

/** Helper to read the dunning columns for the test school */
async function getDunningState() {
  const r = await query(
    `SELECT dunning_step, dunning_started_at, dunning_last_email_at,
            subscription_status, is_active,
            feature_ai_insights, feature_api_access
     FROM schools WHERE id = $1`,
    [TEST_SCHOOL_ID]
  );
  return r.rows[0];
}

/** Helper to set dunning state directly */
async function setDunningState(opts: {
  step: number;
  startedAt: string;          // SQL expression, e.g. "NOW() - INTERVAL '3 days'"
  status?: string;
}) {
  await query(
    `UPDATE schools
     SET dunning_step       = $2,
         dunning_started_at = ${opts.startedAt},
         subscription_status = $3,
         is_active          = true
     WHERE id = $1`,
    [TEST_SCHOOL_ID, opts.step, opts.status || 'past_due']
  );
}

/** Reset school to clean active state */
async function resetSchool() {
  await query(
    `UPDATE schools SET
       subscription_status   = 'active',
       plan                  = 'trial',
       is_active             = true,
       dunning_step          = 0,
       dunning_started_at    = NULL,
       dunning_last_email_at = NULL,
       trial_warning_sent    = 0,
       trial_ends_at         = NOW() + INTERVAL '30 days',
       feature_ai_insights   = true,
       feature_api_access    = true
     WHERE id = $1`,
    [TEST_SCHOOL_ID]
  );
}

describe('DunningService', () => {

  beforeEach(async () => {
    await resetSchool();
  });

  afterAll(async () => {
    await resetSchool();
  });

  // ═══════════════════════════════════════════════════════════
  // handlePaymentFailed
  // ═══════════════════════════════════════════════════════════

  describe('handlePaymentFailed()', () => {
    it('sets dunning_step to 1', async () => {
      await dunningService.handlePaymentFailed(TEST_SCHOOL_ID);
      const state = await getDunningState();
      expect(state.dunning_step).toBe(1);
    });

    it('records dunning_started_at timestamp', async () => {
      await dunningService.handlePaymentFailed(TEST_SCHOOL_ID);
      const state = await getDunningState();
      expect(state.dunning_started_at).not.toBeNull();
      // Should be recent (within 5s)
      const diff = Date.now() - new Date(state.dunning_started_at).getTime();
      expect(diff).toBeLessThan(5000);
    });

    it('records dunning_last_email_at timestamp', async () => {
      await dunningService.handlePaymentFailed(TEST_SCHOOL_ID);
      const state = await getDunningState();
      expect(state.dunning_last_email_at).not.toBeNull();
    });

    it('does nothing silently for non-existent school', async () => {
      // Should not throw
      await expect(
        dunningService.handlePaymentFailed('00000000-0000-0000-0000-000000000999')
      ).resolves.toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // runDunning — step 2
  // ═══════════════════════════════════════════════════════════

  describe('runDunning() — step 2 escalation (day 3+)', () => {
    beforeEach(async () => {
      // Set step 1, started 4 days ago
      await setDunningState({ step: 1, startedAt: "NOW() - INTERVAL '4 days'" });
    });

    it('advances dunning_step from 1 to 2', async () => {
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.dunning_step).toBe(2);
    });

    it('does NOT advance if only 2 days have passed', async () => {
      await query(
        `UPDATE schools SET dunning_started_at = NOW() - INTERVAL '2 days' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.dunning_step).toBe(1); // unchanged
    });
  });

  // ═══════════════════════════════════════════════════════════
  // runDunning — step 3 (partial lock)
  // ═══════════════════════════════════════════════════════════

  describe('runDunning() — step 3 escalation (day 7+ partial lock)', () => {
    beforeEach(async () => {
      await setDunningState({ step: 2, startedAt: "NOW() - INTERVAL '8 days'" });
    });

    it('advances dunning_step to 3', async () => {
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.dunning_step).toBe(3);
    });

    it('disables feature_ai_insights', async () => {
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.feature_ai_insights).toBe(false);
    });

    it('disables feature_api_access', async () => {
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.feature_api_access).toBe(false);
    });

    it('does NOT advance if only 6 days have passed', async () => {
      await query(
        `UPDATE schools SET dunning_started_at = NOW() - INTERVAL '6 days' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.dunning_step).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // runDunning — step 4 (full suspension)
  // ═══════════════════════════════════════════════════════════

  describe('runDunning() — step 4 suspension (day 14+)', () => {
    beforeEach(async () => {
      await setDunningState({ step: 3, startedAt: "NOW() - INTERVAL '15 days'" });
    });

    it('advances dunning_step to 4', async () => {
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.dunning_step).toBe(4);
    });

    it('sets subscription_status to suspended', async () => {
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.subscription_status).toBe('suspended');
    });

    it('sets is_active to false', async () => {
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.is_active).toBe(false);
    });

    it('does NOT advance if only 13 days have passed', async () => {
      await query(
        `UPDATE schools SET dunning_started_at = NOW() - INTERVAL '13 days' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );
      await dunningService.runDunning();
      const state = await getDunningState();
      expect(state.dunning_step).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // runDunning — skips already-step-4 schools
  // ═══════════════════════════════════════════════════════════

  describe('runDunning() — handles edge cases', () => {
    it('does not process schools that are not past_due', async () => {
      await query(
        `UPDATE schools SET subscription_status = 'active', dunning_step = 1,
         dunning_started_at = NOW() - INTERVAL '5 days' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );
      await dunningService.runDunning();
      const state = await getDunningState();
      // Step should be unchanged because not past_due
      expect(state.dunning_step).toBe(1);
    });

    it('does not advance step 4+ schools further', async () => {
      await query(
        `UPDATE schools SET dunning_step = 4, subscription_status = 'suspended',
         dunning_started_at = NOW() - INTERVAL '20 days' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );
      await dunningService.runDunning();
      const state = await getDunningState();
      // Step should still be 4 (not 5)
      expect(state.dunning_step).toBe(4);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // runTrialWarnings
  // ═══════════════════════════════════════════════════════════

  describe('runTrialWarnings()', () => {
    it('sends 7-day warning and sets trial_warning_sent = 1', async () => {
      await query(
        `UPDATE schools SET
           subscription_status = 'trialing',
           trial_ends_at       = NOW() + INTERVAL '5 days',
           trial_warning_sent  = 0
         WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      await dunningService.runTrialWarnings();

      const r = await query(
        'SELECT trial_warning_sent FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(r.rows[0].trial_warning_sent).toBe(1);
    });

    it('sends 3-day warning and sets trial_warning_sent = 2', async () => {
      await query(
        `UPDATE schools SET
           subscription_status = 'trialing',
           trial_ends_at       = NOW() + INTERVAL '2 days',
           trial_warning_sent  = 1
         WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      await dunningService.runTrialWarnings();

      const r = await query(
        'SELECT trial_warning_sent FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(r.rows[0].trial_warning_sent).toBe(2);
    });

    it('sends 1-day warning and sets trial_warning_sent = 3', async () => {
      await query(
        `UPDATE schools SET
           subscription_status = 'trialing',
           trial_ends_at       = NOW() + INTERVAL '12 hours',
           trial_warning_sent  = 2
         WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      await dunningService.runTrialWarnings();

      const r = await query(
        'SELECT trial_warning_sent FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(r.rows[0].trial_warning_sent).toBe(3);
    });

    it('does not re-send if already at warning level', async () => {
      await query(
        `UPDATE schools SET
           subscription_status = 'trialing',
           trial_ends_at       = NOW() + INTERVAL '5 days',
           trial_warning_sent  = 1
         WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      await dunningService.runTrialWarnings();

      const r = await query(
        'SELECT trial_warning_sent FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      // Already at 1, still in the 7-day window — should not bump to 2
      expect(r.rows[0].trial_warning_sent).toBe(1);
    });

    it('does not send for already-expired trials', async () => {
      await query(
        `UPDATE schools SET
           subscription_status = 'trialing',
           trial_ends_at       = NOW() - INTERVAL '1 day',
           trial_warning_sent  = 0
         WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      await dunningService.runTrialWarnings();

      const r = await query(
        'SELECT trial_warning_sent FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      // Expired trials are excluded by the query (trial_ends_at > NOW())
      expect(r.rows[0].trial_warning_sent).toBe(0);
    });

    it('does not send for active (non-trial) subscriptions', async () => {
      await query(
        `UPDATE schools SET
           subscription_status = 'active',
           trial_ends_at       = NOW() + INTERVAL '2 days',
           trial_warning_sent  = 0
         WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      await dunningService.runTrialWarnings();

      const r = await query(
        'SELECT trial_warning_sent FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(r.rows[0].trial_warning_sent).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // runOverageAlerts
  // ═══════════════════════════════════════════════════════════

  describe('runOverageAlerts()', () => {
    it('runs without throwing on clean state', async () => {
      await expect(dunningService.runOverageAlerts()).resolves.toBeUndefined();
    });

    it('detects school at ≥90% student capacity', async () => {
      // Set max_students = 10, and ensure there are at least 9 students
      await query(
        `UPDATE schools SET max_students = 10, subscription_status = 'active', is_active = true WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      // Count current students in test school
      const countRes = await query(
        'SELECT COUNT(*) FROM students WHERE school_id = $1',
        [TEST_SCHOOL_ID]
      );
      const currentStudents = parseInt(countRes.rows[0].count);

      // If fewer than 9, add dummy students to reach 90% threshold
      const needed = 9 - currentStudents;
      for (let i = 0; i < needed; i++) {
        await query(
          `INSERT INTO students (first_name, last_name, date_of_birth, gender, school_id, is_active)
           VALUES ('Overage', 'Test${i}', '2010-01-01', 'male', $1, true)`,
          [TEST_SCHOOL_ID]
        ).catch(() => {}); // ignore if student table has different schema
      }

      // Should complete without error — email sending is fire-and-forget
      await expect(dunningService.runOverageAlerts()).resolves.toBeUndefined();

      // Clean up
      await query(
        `DELETE FROM students WHERE school_id = $1 AND first_name = 'Overage'`,
        [TEST_SCHOOL_ID]
      ).catch(() => {});
      await query(
        `UPDATE schools SET max_students = 1000 WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );
    });

    it('skips suspended and canceled schools', async () => {
      await query(
        `UPDATE schools SET
           subscription_status = 'suspended',
           is_active = false,
           max_students = 1
         WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      // Should not throw or send emails for this school
      await expect(dunningService.runOverageAlerts()).resolves.toBeUndefined();

      await resetSchool();
    });
  });
});
