/**
 * Payment Gateway Webhooks
 *
 * Handles inbound webhook events from:
 *   - Razorpay (primary for India)
 *   - Stripe (international)
 *
 * CRITICAL: These endpoints must NOT require authentication.
 * Instead, they verify the webhook signature to confirm the event
 * comes from the real payment gateway.
 *
 * POST /api/v1/webhooks/razorpay
 * POST /api/v1/webhooks/stripe
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { SchoolService } from '../services/schoolService';
import { query } from '../database/connection';

const router = Router();
const schoolService = new SchoolService();

// ─────────────────────────────────────────────────────────────
// Razorpay webhook
// ─────────────────────────────────────────────────────────────

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

router.post('/razorpay', asyncHandler(async (req: Request, res: Response) => {
  // Verify signature
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = JSON.stringify(req.body);

  if (RAZORPAY_WEBHOOK_SECRET) {
    const expectedSig = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSig) {
      throw new AppError('Invalid webhook signature', 401);
    }
  }

  const event = req.body;
  const eventId = event.payload?.payment?.entity?.id || event.event;

  // Idempotency: skip if we've already processed this event
  const existing = await query(
    "SELECT id FROM billing_events WHERE gateway_event_id = $1 AND gateway = 'razorpay'",
    [eventId]
  );
  if (existing.rows.length > 0) {
    res.json({ success: true, message: 'Already processed' });
    return;
  }

  // Find school by Razorpay customer/subscription id
  const subscriptionId = event.payload?.subscription?.entity?.id;
  const customerId = event.payload?.payment?.entity?.customer_id;

  let schoolId: string | null = null;
  if (subscriptionId) {
    const school = await query(
      'SELECT id FROM schools WHERE stripe_subscription_id = $1', [subscriptionId]
    );
    if (school.rows.length > 0) schoolId = school.rows[0].id;
  }

  switch (event.event) {
    case 'subscription.activated':
    case 'subscription.charged': {
      // Determine plan from subscription notes
      const notes = event.payload?.subscription?.entity?.notes || {};
      const plan = notes.plan || 'basic';
      const billingPeriod = notes.billing_period || 'monthly';

      // Calculate next billing date
      const chargedAt = event.payload?.subscription?.entity?.charge_at;
      const nextDate = chargedAt
        ? new Date(chargedAt * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (schoolId) {
        await schoolService.updateSubscription({
          schoolId,
          plan: plan as any,
          stripeSubscriptionId: subscriptionId,
          subscriptionEndsAt: nextDate,
        });

        // Log billing event
        await query(
          `INSERT INTO billing_events
             (school_id, event_type, amount, currency, plan_name, billing_period, gateway, gateway_event_id, gateway_payload, status)
           VALUES ($1,$2,$3,'INR',$4,$5,'razorpay',$6,$7,'success')`,
          [
            schoolId,
            event.event,
            (event.payload?.payment?.entity?.amount || 0) / 100,
            plan, billingPeriod, eventId,
            JSON.stringify(event),
          ]
        );
      }
      break;
    }

    case 'subscription.cancelled':
    case 'subscription.completed': {
      if (schoolId) {
        await query(
          "UPDATE schools SET subscription_status = 'canceled', updated_at = NOW() WHERE id = $1",
          [schoolId]
        );
      }
      break;
    }

    case 'payment.failed': {
      if (schoolId) {
        await query(
          "UPDATE schools SET subscription_status = 'past_due', updated_at = NOW() WHERE id = $1",
          [schoolId]
        );
      }
      break;
    }
  }

  res.json({ success: true });
}));

// ─────────────────────────────────────────────────────────────
// Stripe webhook (for international customers)
// ─────────────────────────────────────────────────────────────

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

router.post(
  '/stripe',
  // Stripe requires raw body for signature verification
  // In app.ts, add: app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }))
  asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (STRIPE_WEBHOOK_SECRET && sig) {
      // Manual Stripe signature verification (avoids stripe npm dependency)
      const payload = req.body.toString();
      const parts = sig.split(',');
      const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
      const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

      const expected = crypto
        .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      if (expected !== v1) {
        throw new AppError('Invalid Stripe webhook signature', 401);
      }
    }

    const event = JSON.parse(req.body.toString());

    // Idempotency check
    const existing = await query(
      "SELECT id FROM billing_events WHERE gateway_event_id = $1 AND gateway = 'stripe'",
      [event.id]
    );
    if (existing.rows.length > 0) {
      res.json({ received: true });
      return;
    }

    const customerId = event.data?.object?.customer;
    let schoolId: string | null = null;

    if (customerId) {
      const school = await query('SELECT id FROM schools WHERE stripe_customer_id = $1', [customerId]);
      if (school.rows.length > 0) schoolId = school.rows[0].id;
    }

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const plan = invoice.lines?.data?.[0]?.metadata?.plan || 'basic';
        const periodEnd = invoice.lines?.data?.[0]?.period?.end;

        if (schoolId) {
          await schoolService.updateSubscription({
            schoolId,
            plan: plan as any,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionEndsAt: periodEnd ? new Date(periodEnd * 1000) : undefined,
          });

          await query(
            `INSERT INTO billing_events
               (school_id, event_type, amount, currency, plan_name, gateway, gateway_event_id, gateway_payload, status)
             VALUES ($1,$2,$3,$4,$5,'stripe',$6,$7,'success')`,
            [
              schoolId, event.type,
              (invoice.amount_paid || 0) / 100,
              (invoice.currency || 'usd').toUpperCase(),
              plan, event.id, JSON.stringify(event),
            ]
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        if (schoolId) {
          await query(
            "UPDATE schools SET subscription_status = 'past_due', updated_at = NOW() WHERE id = $1",
            [schoolId]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        if (schoolId) {
          await query(
            "UPDATE schools SET subscription_status = 'canceled', updated_at = NOW() WHERE id = $1",
            [schoolId]
          );
        }
        break;
      }
    }

    res.json({ received: true });
  })
);

export default router;
