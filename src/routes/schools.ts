/**
 * School (Tenant) Routes
 *
 * Public:
 *   POST /api/v1/schools/register             — self-service onboarding
 *   GET  /api/v1/schools/plans                — list subscription plans
 *   GET  /api/v1/schools/verify-email?token=  — verify school email
 *
 * Authenticated (school admin):
 *   GET  /api/v1/schools/me                   — current school profile
 *   GET  /api/v1/schools/me/usage             — plan usage vs limits
 *   POST /api/v1/schools/me/create-order      — create Razorpay order for upgrade
 *   POST /api/v1/schools/me/verify-payment    — verify payment & activate plan
 *   GET  /api/v1/schools/me/invoices          — billing history
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import {
  registerSchool,
  getMySchool,
  getSchoolUsage,
} from '../controllers/schoolController';
import { query } from '../database/connection';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { SchoolService } from '../services/schoolService';
import crypto from 'crypto';
import https from 'https';

const router = Router();
const schoolService = new SchoolService();

// ── Public routes ──────────────────────────────────────────────────────────

/** Self-service school registration (starts 30-day trial) */
router.post('/register', registerSchool);

/** List available subscription plans */
router.get('/plans', asyncHandler(async (_req: Request, res: Response) => {
  const result = await query(
    `SELECT
       name, display_name, description,
       price_monthly, price_yearly, currency,
       max_students, max_teachers, max_staff,
       feature_ai_insights, feature_library, feature_transport,
       feature_hostel, feature_messaging, feature_api_access,
       sort_order
     FROM subscription_plans
     WHERE is_active = true
     ORDER BY sort_order ASC`
  );
  res.json({ success: true, data: result.rows });
}));

/** Verify school email via token */
router.get('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') throw new AppError('Invalid verification token', 400);

  const result = await query(
    `UPDATE schools
     SET email_verified_at = NOW(), email_verification_token = NULL, updated_at = NOW()
     WHERE email_verification_token = $1 AND email_verified_at IS NULL
     RETURNING id, name`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Verification link is invalid or already used.', 400);
  }

  res.json({ success: true, message: 'Email verified successfully.' });
}));

// ── Authenticated school routes ─────────────────────────────────────────────

router.use(authenticate, resolveTenant);

router.get('/me',       authorize('admin'),          getMySchool);
router.get('/me/usage', authorize('admin', 'staff'), getSchoolUsage);

/** POST /api/v1/schools/me/create-order — create a Razorpay order for plan upgrade */
router.post('/me/create-order', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { plan, billingPeriod = 'monthly' } = req.body;
  if (!plan) throw new AppError('Plan is required', 400);

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new AppError('Payment gateway not configured. Contact support.', 503);

  // Get plan price
  const planResult = await query(
    'SELECT price_monthly, price_yearly, currency, display_name FROM subscription_plans WHERE name = $1 AND is_active = true',
    [plan]
  );
  if (planResult.rows.length === 0) throw new AppError(`Unknown plan: ${plan}`, 400);

  const planRow  = planResult.rows[0];
  const amount   = billingPeriod === 'yearly' ? planRow.price_yearly : planRow.price_monthly;
  const currency = (planRow.currency || 'INR').toUpperCase();

  if (!amount || amount <= 0) throw new AppError('This plan is free — no payment required.', 400);

  // Create order via Razorpay REST API (no npm package needed)
  const orderPayload = JSON.stringify({
    amount:   Math.round(amount * 100), // paise
    currency,
    receipt:  `school_${req.schoolId}_${Date.now()}`,
    notes:    { schoolId: req.schoolId!, plan, billingPeriod },
  });

  const razorpayOrder = await new Promise<any>((resolve, reject) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const options = {
      hostname: 'api.razorpay.com',
      path:     '/v1/orders',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(orderPayload),
      },
    };
    const request = https.request(options, (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (response.statusCode && response.statusCode >= 400) {
            reject(new AppError(parsed?.error?.description || 'Razorpay order creation failed', 502));
          } else {
            resolve(parsed);
          }
        } catch { reject(new AppError('Invalid response from payment gateway', 502)); }
      });
    });
    request.on('error', () => reject(new AppError('Could not reach payment gateway', 502)));
    request.write(orderPayload);
    request.end();
  });

  // Fetch school contact info for pre-fill
  const schoolRow = await query('SELECT name, email, phone FROM schools WHERE id = $1', [req.schoolId!]);
  const school    = schoolRow.rows[0];

  res.json({
    success: true,
    data: {
      orderId:     razorpayOrder.id,
      amount:      razorpayOrder.amount,
      currency:    razorpayOrder.currency,
      keyId,
      plan,
      billingPeriod,
      planName:    planRow.display_name,
      schoolName:  school?.name,
      schoolEmail: school?.email,
      schoolPhone: school?.phone,
    },
  });
}));

/** POST /api/v1/schools/me/verify-payment — verify Razorpay signature and activate plan */
router.post('/me/verify-payment', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { orderId, paymentId, signature, plan, billingPeriod = 'monthly' } = req.body;
  if (!orderId || !paymentId || !signature || !plan) {
    throw new AppError('orderId, paymentId, signature, and plan are required', 400);
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new AppError('Payment gateway not configured', 503);

  // Verify Razorpay signature
  const expectedSig = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSig !== signature) throw new AppError('Payment verification failed — invalid signature', 400);

  // Get plan details for subscription end date
  const planResult = await query(
    'SELECT price_monthly, price_yearly FROM subscription_plans WHERE name = $1',
    [plan]
  );
  if (planResult.rows.length === 0) throw new AppError(`Unknown plan: ${plan}`, 400);

  const subscriptionEndsAt = new Date();
  subscriptionEndsAt.setDate(
    subscriptionEndsAt.getDate() + (billingPeriod === 'yearly' ? 365 : 30)
  );

  // Activate subscription
  await schoolService.updateSubscription({
    schoolId: req.schoolId!,
    plan:     plan as any,
    subscriptionEndsAt,
    stripeSubscriptionId: paymentId, // store Razorpay payment_id in this field
  });

  // Record billing event
  const amountPaid = billingPeriod === 'yearly'
    ? planResult.rows[0].price_yearly
    : planResult.rows[0].price_monthly;

  await query(
    `INSERT INTO billing_events
       (school_id, event_type, amount, currency, plan_name, billing_period, gateway, gateway_event_id, gateway_payload, status)
     VALUES ($1,'payment.captured',$2,'INR',$3,$4,'razorpay',$5,$6,'success')
     ON CONFLICT (gateway_event_id) DO NOTHING`,
    [req.schoolId!, amountPaid, plan, billingPeriod, paymentId, JSON.stringify({ orderId, paymentId })]
  );

  res.json({
    success: true,
    message: `Subscription upgraded to ${plan}. Your account is now active.`,
  });
}));

/** GET /api/v1/schools/me/invoices — billing history */
router.get('/me/invoices', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT
       id, event_type, amount, currency, plan_name, billing_period,
       gateway, gateway_event_id, status, created_at
     FROM billing_events
     WHERE school_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.schoolId!, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) FROM billing_events WHERE school_id = $1',
    [req.schoolId!]
  );

  res.json({
    success: true,
    data: {
      invoices: result.rows,
      total:    parseInt(countResult.rows[0].count),
      page, limit,
    },
  });
}));

export default router;
