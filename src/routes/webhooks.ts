/**
 * Payment Gateway Webhooks
 *
 * Handles inbound webhook events from Razorpay.
 *
 * CRITICAL: These endpoints must NOT require authentication.
 * Instead, they verify the webhook signature to confirm the event
 * comes from the real payment gateway.
 *
 * POST /api/v1/webhooks/razorpay
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

  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured — rejecting webhook');
    throw new AppError('Webhook signature verification not configured', 500);
  }

  const expectedSig = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    throw new AppError('Invalid webhook signature', 401);
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
      'SELECT id FROM schools WHERE razorpay_subscription_id = $1', [subscriptionId]
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
          razorpaySubscriptionId: subscriptionId,
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

export default router;
