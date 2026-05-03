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
import { invoiceService } from '../services/invoiceService';
import { dunningService } from '../services/dunningService';
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
      const notes         = event.payload?.subscription?.entity?.notes || {};
      const plan          = notes.plan || 'basic';
      const billingPeriod = notes.billing_period || 'monthly';
      const chargedAt     = event.payload?.subscription?.entity?.charge_at;
      const nextDate      = chargedAt
        ? new Date(chargedAt * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const amountPaid = (event.payload?.payment?.entity?.amount || 0) / 100;

      if (schoolId) {
        await schoolService.updateSubscription({
          schoolId,
          plan: plan as any,
          stripeSubscriptionId: subscriptionId,
          subscriptionEndsAt: nextDate,
        });

        const billingResult = await query(
          `INSERT INTO billing_events
             (school_id, event_type, amount, currency, plan_name, billing_period, gateway, gateway_event_id, gateway_payload, status)
           VALUES ($1,$2,$3,'INR',$4,$5,'razorpay',$6,$7,'success')
           RETURNING id`,
          [schoolId, event.event, amountPaid, plan, billingPeriod, eventId, JSON.stringify(event)]
        );

        // Auto-generate invoice + send receipt email
        if (amountPaid > 0) {
          const periodStart = new Date();
          const periodEnd   = new Date(nextDate);
          invoiceService.generateInvoice({
            schoolId,
            billingEventId: billingResult.rows[0]?.id,
            amountPaid,
            currency: 'INR',
            planName: plan,
            billingPeriod: billingPeriod as 'monthly' | 'yearly',
            gatewayInvoiceId: eventId,
            periodStart,
            periodEnd,
          }).catch(err => console.error('[Webhook] Invoice generation failed:', err));
        }

        // Clear any active dunning when payment succeeds
        await query(
          `UPDATE schools
           SET dunning_step = 0, dunning_started_at = NULL, dunning_last_email_at = NULL
           WHERE id = $1 AND dunning_step > 0`,
          [schoolId]
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
        // Kick off dunning step 1 immediately
        dunningService.handlePaymentFailed(schoolId)
          .catch(err => console.error('[Webhook] Dunning trigger failed:', err));
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
        const stripeInvoice  = event.data.object;
        const stripeSubId    = stripeInvoice.subscription;
        const plan           = stripeInvoice.lines?.data?.[0]?.metadata?.plan || 'basic';
        const billingPeriod  = stripeInvoice.lines?.data?.[0]?.metadata?.billing_period || 'monthly';
        const periodEndTs    = stripeInvoice.lines?.data?.[0]?.period?.end;
        const periodStartTs  = stripeInvoice.lines?.data?.[0]?.period?.start;
        const amountPaid     = (stripeInvoice.amount_paid || 0) / 100;
        const currency       = (stripeInvoice.currency || 'usd').toUpperCase();

        if (schoolId) {
          const subEnd = periodEndTs ? new Date(periodEndTs * 1000) : undefined;
          await schoolService.updateSubscription({
            schoolId,
            plan: plan as any,
            stripeCustomerId: customerId,
            stripeSubscriptionId: stripeSubId,
            subscriptionEndsAt: subEnd,
          });

          const billingResult = await query(
            `INSERT INTO billing_events
               (school_id, event_type, amount, currency, plan_name, billing_period, gateway, gateway_event_id, gateway_payload, status)
             VALUES ($1,$2,$3,$4,$5,$6,'stripe',$7,$8,'success')
             RETURNING id`,
            [schoolId, event.type, amountPaid, currency, plan, billingPeriod, event.id, JSON.stringify(event)]
          );

          // Auto-generate invoice + receipt email
          if (amountPaid > 0) {
            invoiceService.generateInvoice({
              schoolId,
              billingEventId:  billingResult.rows[0]?.id,
              amountPaid,
              currency,
              planName:        plan,
              billingPeriod:   billingPeriod as 'monthly' | 'yearly',
              gatewayInvoiceId: event.id,
              periodStart: periodStartTs ? new Date(periodStartTs * 1000) : undefined,
              periodEnd:   subEnd,
            }).catch(err => console.error('[Webhook/Stripe] Invoice generation failed:', err));
          }

          // Clear dunning on success
          await query(
            `UPDATE schools
             SET dunning_step = 0, dunning_started_at = NULL, dunning_last_email_at = NULL
             WHERE id = $1 AND dunning_step > 0`,
            [schoolId]
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
          dunningService.handlePaymentFailed(schoolId)
            .catch(err => console.error('[Webhook/Stripe] Dunning trigger failed:', err));
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
