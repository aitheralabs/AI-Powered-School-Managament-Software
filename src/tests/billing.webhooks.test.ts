/**
 * Billing Webhook Tests
 *
 * Covers:
 *  - POST /api/v1/webhooks/razorpay
 *    - signature verification bypass in test env (no secret set)
 *    - idempotency: duplicate event_id ignored
 *    - subscription.charged  → updates plan + clears dunning + creates billing_event
 *    - payment.failed        → sets past_due + triggers dunning
 *    - subscription.cancelled → sets canceled
 *  - Webhook endpoints do NOT require Authorization header
 */

import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../app';
import { query } from '../database/connection';

// ─────────────────────────────────────────────────────────────
// Test school setup
// ─────────────────────────────────────────────────────────────
const TEST_SCHOOL_ID     = '00000000-0000-0000-0000-000000000001';
const TEST_RAZORPAY_SUB  = `rzp_sub_test_${Date.now()}`;

/** Reset test school to a clean active state */
async function resetSchool() {
  await query(
    `UPDATE schools SET
       subscription_status   = 'active',
       plan                  = 'trial',
       is_active             = true,
       dunning_step          = 0,
       dunning_started_at    = NULL,
       dunning_last_email_at = NULL,
       razorpay_subscription_id = $2,
       subscription_ends_at  = NOW() + INTERVAL '30 days'
     WHERE id = $1`,
    [TEST_SCHOOL_ID, TEST_RAZORPAY_SUB]
  );
}

describe('Payment Gateway Webhooks', () => {

  beforeAll(async () => {
    await resetSchool();
    // Pre-seed subscription_plans for plan-update tests
    await query(
      `INSERT INTO subscription_plans
         (name, display_name, price_monthly, price_yearly, max_students, max_teachers, max_staff,
          max_storage_gb, feature_ai_insights, feature_library, feature_transport,
          feature_hostel, feature_messaging, feature_api_access, sort_order, is_active)
       VALUES ('basic','Basic',999,9990,500,50,30,5,false,true,false,false,true,false,2,true)
       ON CONFLICT (name) DO NOTHING`
    ).catch(() => {});
  });

  afterEach(async () => {
    // Restore school to clean state after each test that may alter it
    await resetSchool();
  });

  // ═══════════════════════════════════════════════════════════
  // Razorpay
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/v1/webhooks/razorpay', () => {
    it('accepts requests without Authorization header (no auth required)', async () => {
      // Just test the endpoint is accessible — use an unknown event to avoid side effects
      const res = await request(app)
        .post('/api/v1/webhooks/razorpay')
        .send({
          event: 'unknown.event',
          payload: {},
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('processes subscription.charged and sets plan to basic', async () => {
      const eventId = `rzp_evt_charged_${Date.now()}`;

      await request(app)
        .post('/api/v1/webhooks/razorpay')
        .send({
          event: 'subscription.charged',
          payload: {
            subscription: {
              entity: {
                id: TEST_RAZORPAY_SUB,
                charge_at: Math.floor((Date.now() + 30 * 86400 * 1000) / 1000),
                notes: { plan: 'basic', billing_period: 'monthly' },
              },
            },
            payment: {
              entity: {
                id: eventId,
                customer_id: 'rzp_cus_test',
                amount: 99900, // in paise = 999 INR
              },
            },
          },
        })
        .expect(200);

      // School plan should now be basic
      const school = await query(
        'SELECT plan, subscription_status FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(school.rows[0].plan).toBe('basic');
      expect(school.rows[0].subscription_status).toBe('active');
    });

    it('creates a billing_event record on subscription.charged', async () => {
      const eventId = `rzp_evt_billing_${Date.now()}`;

      await request(app)
        .post('/api/v1/webhooks/razorpay')
        .send({
          event: 'subscription.charged',
          payload: {
            subscription: {
              entity: {
                id: TEST_RAZORPAY_SUB,
                charge_at: Math.floor((Date.now() + 30 * 86400 * 1000) / 1000),
                notes: { plan: 'basic', billing_period: 'monthly' },
              },
            },
            payment: {
              entity: { id: eventId, customer_id: 'rzp_cus_test', amount: 99900 },
            },
          },
        })
        .expect(200);

      const evtResult = await query(
        "SELECT * FROM billing_events WHERE gateway_event_id = $1 AND gateway = 'razorpay'",
        [eventId]
      );
      expect(evtResult.rows.length).toBe(1);
      expect(evtResult.rows[0].school_id).toBe(TEST_SCHOOL_ID);
      expect(evtResult.rows[0].status).toBe('success');
    });

    it('is idempotent — ignores duplicate event_id', async () => {
      const eventId = `rzp_evt_idem_${Date.now()}`;

      const payload = {
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: TEST_RAZORPAY_SUB,
              charge_at: Math.floor((Date.now() + 30 * 86400 * 1000) / 1000),
              notes: { plan: 'basic', billing_period: 'monthly' },
            },
          },
          payment: {
            entity: { id: eventId, customer_id: 'rzp_cus_test', amount: 99900 },
          },
        },
      };

      await request(app).post('/api/v1/webhooks/razorpay').send(payload).expect(200);
      const res2 = await request(app).post('/api/v1/webhooks/razorpay').send(payload).expect(200);

      expect(res2.body.message).toContain('Already processed');

      // Only one record inserted
      const count = await query(
        "SELECT COUNT(*) FROM billing_events WHERE gateway_event_id = $1",
        [eventId]
      );
      expect(parseInt(count.rows[0].count)).toBe(1);
    });

    it('clears dunning on successful payment', async () => {
      // Pre-set dunning state
      await query(
        `UPDATE schools SET dunning_step = 2, dunning_started_at = NOW() - INTERVAL '4 days' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      const eventId = `rzp_evt_clear_dunning_${Date.now()}`;
      await request(app)
        .post('/api/v1/webhooks/razorpay')
        .send({
          event: 'subscription.charged',
          payload: {
            subscription: {
              entity: {
                id: TEST_RAZORPAY_SUB,
                charge_at: Math.floor((Date.now() + 30 * 86400 * 1000) / 1000),
                notes: { plan: 'basic', billing_period: 'monthly' },
              },
            },
            payment: {
              entity: { id: eventId, customer_id: 'rzp_cus_test', amount: 99900 },
            },
          },
        })
        .expect(200);

      const school = await query(
        'SELECT dunning_step, dunning_started_at FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(school.rows[0].dunning_step).toBe(0);
      expect(school.rows[0].dunning_started_at).toBeNull();
    });

    it('sets subscription to past_due on payment.failed', async () => {
      const eventId = `rzp_evt_failed_${Date.now()}`;

      await request(app)
        .post('/api/v1/webhooks/razorpay')
        .send({
          event: 'payment.failed',
          payload: {
            subscription: { entity: { id: TEST_RAZORPAY_SUB } },
            payment:      { entity: { id: eventId } },
          },
        })
        .expect(200);

      const school = await query(
        'SELECT subscription_status FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(school.rows[0].subscription_status).toBe('past_due');
    });

    it('sets dunning_step = 1 after payment.failed', async () => {
      const eventId = `rzp_evt_dun_${Date.now()}`;

      await request(app)
        .post('/api/v1/webhooks/razorpay')
        .send({
          event: 'payment.failed',
          payload: {
            subscription: { entity: { id: TEST_RAZORPAY_SUB } },
            payment:      { entity: { id: eventId } },
          },
        })
        .expect(200);

      // Give async dunning handler time to complete
      await new Promise(r => setTimeout(r, 200));

      const school = await query(
        'SELECT dunning_step FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(school.rows[0].dunning_step).toBe(1);
    });

    it('cancels subscription on subscription.cancelled', async () => {
      await request(app)
        .post('/api/v1/webhooks/razorpay')
        .send({
          event: 'subscription.cancelled',
          payload: {
            subscription: { entity: { id: TEST_RAZORPAY_SUB } },
            payment:      { entity: { id: `rzp_cancel_${Date.now()}` } },
          },
        })
        .expect(200);

      const school = await query(
        'SELECT subscription_status FROM schools WHERE id = $1',
        [TEST_SCHOOL_ID]
      );
      expect(school.rows[0].subscription_status).toBe('canceled');
    });
  });

});

