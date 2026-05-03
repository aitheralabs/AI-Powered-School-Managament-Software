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
import { z } from 'zod';
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

/** POST /api/v1/superadmin/schools — create a new tenant/school */
const CreateSchoolSchema = z.object({
  name:           z.string().min(2).max(255),
  slug:           z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  email:          z.string().email(),
  phone:          z.string().optional(),
  address:        z.string().optional(),
  city:           z.string().optional(),
  state:          z.string().optional(),
  country:        z.string().optional(),
  postalCode:     z.string().optional(),
  website:        z.string().url().optional().or(z.literal('')),
  timezone:       z.string().optional(),
  adminFirstName: z.string().min(1).max(100),
  adminLastName:  z.string().min(1).max(100),
  adminEmail:     z.string().email(),
  adminPassword:  z.string().min(8),
});

router.post('/schools', asyncHandler(async (req: Request, res: Response) => {
  const data = CreateSchoolSchema.parse(req.body);
  const result = await schoolService.createSchool({
    ...data,
    email:      data.email,      // school contact email
    adminEmail: data.adminEmail, // admin user login email
  });

  res.status(201).json({
    success: true,
    message: `School "${data.name}" created successfully.`,
    data: {
      school: {
        id:          result.school.id,
        name:        result.school.name,
        slug:        result.school.slug,
        plan:        result.school.plan,
        trialEndsAt: result.school.trial_ends_at,
      },
      admin: {
        id:    result.admin.id,
        email: result.admin.email,
        role:  result.admin.role,
      },
    },
  });
}));

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

/**
 * POST /api/v1/superadmin/schools/:id/impersonate
 *
 * Generates a short-lived (15 min) JWT scoped to the school's first admin user.
 * Lets a super-admin log in as a school admin for support purposes.
 * The token carries an `impersonated: true` flag for audit logging.
 */
router.post('/schools/:id/impersonate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Find the school
  const schoolResult = await query(
    'SELECT id, name, slug FROM schools WHERE id = $1 AND is_active = true',
    [id]
  );
  if (schoolResult.rows.length === 0) throw new AppError('School not found or suspended', 404);
  const school = schoolResult.rows[0];

  // Find the first active admin user of this school
  const userResult = await query(
    `SELECT id, first_name, last_name, email, role
     FROM users
     WHERE school_id = $1 AND role = 'admin' AND is_active = true
     ORDER BY created_at ASC
     LIMIT 1`,
    [id]
  );
  if (userResult.rows.length === 0) throw new AppError('No active admin found for this school', 404);
  const admin = userResult.rows[0];

  // Build a short-lived JWT (15 min) — uses the same JWT_SECRET so existing authenticate middleware accepts it
  const JWT_SECRET = process.env.JWT_SECRET!;
  const token = jwt.sign(
    {
      id:           admin.id,
      email:        admin.email,
      role:         admin.role,
      schoolId:     school.id,
      impersonated: true,
      impersonatedBy: (req as any).superAdminId,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Audit this action
  console.log(`[SuperAdmin] Impersonation: admin ${(req as any).superAdminId} → school ${school.name} (${id}) as user ${admin.email}`);

  res.json({
    success: true,
    message: `Impersonation token issued for ${admin.email} at ${school.name}. Expires in 15 minutes.`,
    data: {
      token,
      user: {
        id:        admin.id,
        email:     admin.email,
        firstName: admin.first_name,
        lastName:  admin.last_name,
        role:      admin.role,
        schoolId:  school.id,
      },
      school: {
        id:   school.id,
        name: school.name,
        slug: school.slug,
      },
    },
  });
}));

export default router;
