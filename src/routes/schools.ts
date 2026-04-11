/**
 * School (Tenant) Routes
 *
 * Public:
 *   POST /api/v1/schools/register    — self-service onboarding
 *   GET  /api/v1/schools/plans       — list subscription plans
 *
 * Authenticated (school admin):
 *   GET  /api/v1/schools/me          — current school profile
 *   GET  /api/v1/schools/me/usage    — plan usage
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import {
  registerSchool,
  getMySchool,
  getSchoolUsage,
} from '../controllers/schoolController';
import { query } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// ── Public routes ──────────────────────────────────────────

/** Self-service school registration (starts 30-day trial) */
router.post('/register', registerSchool);

/** List available subscription plans */
router.get('/plans', asyncHandler(async (_req: import('express').Request, res: import('express').Response) => {
  const result = await query(
    `SELECT
       name, display_name, description,
       price_monthly, price_yearly, currency,
       max_students, max_teachers, max_staff, max_storage_gb,
       feature_ai_insights, feature_library, feature_transport,
       feature_hostel, feature_messaging, feature_api_access,
       sort_order
     FROM subscription_plans
     WHERE is_active = true
     ORDER BY sort_order ASC`
  );
  res.json({ success: true, data: result.rows });
}));

// ── Authenticated school routes ────────────────────────────

router.use(authenticate, resolveTenant);

router.get('/me',        authorize('admin'),             getMySchool);
router.get('/me/usage',  authorize('admin', 'staff'),    getSchoolUsage);

export default router;
