/**
 * Super-Admin Routes
 *
 * Platform operators (not school users) manage the entire SaaS here.
 * Protected by a separate super-admin JWT (different secret).
 *
 * POST /api/v1/superadmin/login
 * GET  /api/v1/superadmin/schools
 * GET  /api/v1/superadmin/schools/:id
 * POST /api/v1/superadmin/schools/:id/suspend
 * POST /api/v1/superadmin/schools/:id/reactivate
 * PUT  /api/v1/superadmin/schools/:id/subscription
 * GET  /api/v1/superadmin/stats
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../database/connection';
import { SchoolService } from '../services/schoolService';
import { listAllSchools, suspendSchool, reactivateSchool } from '../controllers/schoolController';

const router = Router();
const schoolService = new SchoolService();

const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_superadmin';

/** Middleware: verify super-admin JWT */
const requireSuperAdmin = asyncHandler(async (req: Request, _res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AppError('Super-admin authentication required', 401);

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, SUPER_ADMIN_SECRET) as { id: string; type: string };

  if (decoded.type !== 'super_admin') throw new AppError('Invalid super-admin token', 401);

  // Verify still active
  const admin = await query('SELECT id FROM super_admins WHERE id = $1 AND is_active = true', [decoded.id]);
  if (admin.rows.length === 0) throw new AppError('Super-admin not found or inactive', 401);

  (req as any).superAdminId = decoded.id;
  next();
});

/** POST /api/v1/superadmin/login */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const result = await query('SELECT * FROM super_admins WHERE email = $1 AND is_active = true', [email]);
  if (result.rows.length === 0) throw new AppError('Invalid credentials', 401);

  const admin = result.rows[0];
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  await query('UPDATE super_admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);

  const token = jwt.sign({ id: admin.id, type: 'super_admin' }, SUPER_ADMIN_SECRET, { expiresIn: '8h' });

  res.json({
    success: true,
    data: {
      token,
      admin: { id: admin.id, email: admin.email, firstName: admin.first_name, lastName: admin.last_name },
    },
  });
}));

// All routes below require super-admin auth
router.use(requireSuperAdmin);

/** GET /api/v1/superadmin/schools */
router.get('/schools', listAllSchools);

/** GET /api/v1/superadmin/schools/:id */
router.get('/schools/:id', asyncHandler(async (req: Request, res: Response) => {
  const school = await schoolService.getSchool(req.params.id);
  res.json({ success: true, data: school });
}));

/** POST /api/v1/superadmin/schools/:id/suspend */
router.post('/schools/:id/suspend', suspendSchool);

/** POST /api/v1/superadmin/schools/:id/reactivate */
router.post('/schools/:id/reactivate', reactivateSchool);

/** PUT /api/v1/superadmin/schools/:id/subscription */
router.put('/schools/:id/subscription', asyncHandler(async (req: Request, res: Response) => {
  const { plan, subscriptionEndsAt, stripeCustomerId, stripeSubscriptionId } = req.body;

  await schoolService.updateSubscription({
    schoolId: req.params.id,
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : undefined,
  });

  res.json({ success: true, message: 'Subscription updated successfully' });
}));

/** GET /api/v1/superadmin/stats — Platform-wide KPIs */
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const result = await query(`
    SELECT
      COUNT(*) FILTER (WHERE is_active = true)::INT                          AS total_active_schools,
      COUNT(*) FILTER (WHERE subscription_status = 'trialing')::INT          AS trialing_schools,
      COUNT(*) FILTER (WHERE subscription_status = 'active')::INT            AS active_paid_schools,
      COUNT(*) FILTER (WHERE subscription_status IN ('past_due','suspended'))::INT AS at_risk_schools,
      COUNT(*) FILTER (WHERE plan = 'basic')::INT                            AS basic_count,
      COUNT(*) FILTER (WHERE plan = 'standard')::INT                         AS standard_count,
      COUNT(*) FILTER (WHERE plan = 'premium')::INT                          AS premium_count,
      COUNT(*) FILTER (WHERE plan = 'enterprise')::INT                       AS enterprise_count,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::INT  AS new_last_30_days
    FROM schools
  `);

  const userCount = await query(`
    SELECT
      COUNT(*)::INT AS total_users,
      COUNT(*) FILTER (WHERE role = 'student')::INT  AS students,
      COUNT(*) FILTER (WHERE role = 'teacher')::INT  AS teachers
    FROM users
    WHERE is_active = true
  `);

  res.json({
    success: true,
    data: {
      schools: result.rows[0],
      users: userCount.rows[0],
    },
  });
}));

export default router;
