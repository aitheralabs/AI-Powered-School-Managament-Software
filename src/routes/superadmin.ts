/**
 * Super-Admin Routes
 *
 * Platform operators (not school users) manage the entire SaaS here.
 * Protected by a separate super-admin JWT (different secret).
 *
 * Auth:
 *   POST /api/v1/superadmin/login
 *   POST /api/v1/superadmin/2fa/setup        — generate TOTP secret + QR URI
 *   POST /api/v1/superadmin/2fa/verify        — confirm TOTP code & enable 2FA
 *   DELETE /api/v1/superadmin/2fa             — disable 2FA (requires valid TOTP)
 *
 * Tenant management:
 *   POST /api/v1/superadmin/schools
 *   GET  /api/v1/superadmin/schools
 *   GET  /api/v1/superadmin/schools/:id
 *   POST /api/v1/superadmin/schools/:id/suspend
 *   POST /api/v1/superadmin/schools/:id/reactivate
 *   PUT  /api/v1/superadmin/schools/:id/subscription
 *   POST /api/v1/superadmin/schools/:id/impersonate
 *
 * Analytics:
 *   GET  /api/v1/superadmin/stats
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../database/connection';
import { SchoolService } from '../services/schoolService';
import { listAllSchools, suspendSchool, reactivateSchool } from '../controllers/schoolController';

const router = Router();
const schoolService = new SchoolService();

const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_superadmin';

// ─────────────────────────────────────────────────────────────
// TOTP (RFC 6238) — pure crypto, no extra dependency
// ─────────────────────────────────────────────────────────────

const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let result = '';
  let bits = 0;
  let val  = 0;
  for (let i = 0; i < buf.length; i++) {
    val   = (val << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      result += B32_CHARS[(val >>> (bits - 5)) & 31];
      bits   -= 5;
    }
  }
  if (bits > 0) result += B32_CHARS[(val << (5 - bits)) & 31];
  return result;
}

function base32Decode(str: string): Buffer {
  str = str.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  const out: number[] = [];
  let bits = 0;
  let val  = 0;
  for (const ch of str) {
    const idx = B32_CHARS.indexOf(ch);
    if (idx === -1) continue;
    val   = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((val >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpCode(secret: string, windowOffset = 0): string {
  const key     = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30) + windowOffset;
  const buf     = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac  = crypto.createHmac('sha1', key).update(buf).digest();
  const off   = hmac[hmac.length - 1] & 0xf;
  const code  = (
    ((hmac[off]     & 0x7f) << 24) |
    ((hmac[off + 1] & 0xff) << 16) |
    ((hmac[off + 2] & 0xff) <<  8) |
     (hmac[off + 3] & 0xff)
  ) % 1_000_000;
  return code.toString().padStart(6, '0');
}

function verifyTotp(secret: string, token: string): boolean {
  // Allow ±1 time window for clock drift
  return [-1, 0, 1].some(w => totpCode(secret, w) === token);
}

function totpUri(secret: string, email: string): string {
  const issuer = encodeURIComponent(process.env.APP_NAME || 'EduSaaS');
  const acct   = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${acct}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// ─────────────────────────────────────────────────────────────
// Auth middleware — verify super-admin JWT
// ─────────────────────────────────────────────────────────────

const requireSuperAdmin = asyncHandler(async (req: Request, _res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AppError('Super-admin authentication required', 401);

  const token   = authHeader.substring(7);
  const decoded = jwt.verify(token, SUPER_ADMIN_SECRET) as { id: string; type: string };

  if (decoded.type !== 'super_admin') throw new AppError('Invalid super-admin token', 401);

  const admin = await query(
    'SELECT id, totp_enabled FROM super_admins WHERE id = $1 AND is_active = true',
    [decoded.id]
  );
  if (admin.rows.length === 0) throw new AppError('Super-admin not found or inactive', 401);

  (req as any).superAdminId     = decoded.id;
  (req as any).superAdminTotp   = admin.rows[0].totp_enabled;
  next();
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/superadmin/login
// ─────────────────────────────────────────────────────────────

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, totpCode: providedTotp } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const result = await query(
    'SELECT * FROM super_admins WHERE email = $1 AND is_active = true',
    [email]
  );
  if (result.rows.length === 0) throw new AppError('Invalid credentials', 401);

  const admin = result.rows[0];
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  // 2FA check — required if enabled
  if (admin.totp_enabled) {
    if (!providedTotp) {
      res.status(200).json({
        success: true,
        requires2FA: true,
        message: 'Please provide your 2FA code to complete login.',
      });
      return;
    }
    if (!verifyTotp(admin.totp_secret, String(providedTotp))) {
      throw new AppError('Invalid 2FA code', 401);
    }
  }

  await query('UPDATE super_admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);

  const token = jwt.sign({ id: admin.id, type: 'super_admin' }, SUPER_ADMIN_SECRET, { expiresIn: '8h' });

  res.json({
    success: true,
    data: {
      token,
      admin: { id: admin.id, email: admin.email, firstName: admin.first_name, lastName: admin.last_name },
      twoFactorEnabled: admin.totp_enabled,
    },
  });
}));

// ─────────────────────────────────────────────────────────────
// 2FA endpoints (require auth)
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/superadmin/2fa/setup
 * Generates a new TOTP secret. Returns the secret + otpauth URI for a QR code.
 * 2FA is NOT yet enabled — admin must call /2fa/verify to confirm.
 */
router.post('/2fa/setup', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).superAdminId as string;

  const adminRow = await query('SELECT email, totp_enabled FROM super_admins WHERE id = $1', [adminId]);
  if (adminRow.rows.length === 0) throw new AppError('Admin not found', 404);

  if (adminRow.rows[0].totp_enabled) {
    throw new AppError('2FA is already enabled. Disable it first before re-enrolling.', 400);
  }

  // Generate new TOTP secret (20 random bytes → base32)
  const secret = base32Encode(crypto.randomBytes(20));
  const uri    = totpUri(secret, adminRow.rows[0].email);

  // Store the secret but DO NOT enable yet (requires verify step)
  await query(
    'UPDATE super_admins SET totp_secret = $1, totp_enabled = false WHERE id = $2',
    [secret, adminId]
  );

  res.json({
    success: true,
    message: 'Scan the QR code with your authenticator app, then call POST /2fa/verify with a valid code.',
    data: {
      secret,
      uri, // pass to qrcode.toDataURL(uri) on the frontend
    },
  });
}));

/**
 * POST /api/v1/superadmin/2fa/verify
 * Confirms the TOTP code and enables 2FA for this admin.
 * Body: { code: "123456" }
 */
router.post('/2fa/verify', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).superAdminId as string;
  const { code } = req.body;
  if (!code) throw new AppError('TOTP code is required', 400);

  const adminRow = await query(
    'SELECT totp_secret, totp_enabled FROM super_admins WHERE id = $1', [adminId]
  );
  if (!adminRow.rows[0]?.totp_secret) {
    throw new AppError('No TOTP secret found. Call POST /2fa/setup first.', 400);
  }
  if (adminRow.rows[0].totp_enabled) {
    throw new AppError('2FA is already enabled.', 400);
  }

  if (!verifyTotp(adminRow.rows[0].totp_secret, String(code))) {
    throw new AppError('Invalid TOTP code. Please try again.', 401);
  }

  await query(
    'UPDATE super_admins SET totp_enabled = true, totp_verified_at = NOW() WHERE id = $1',
    [adminId]
  );

  res.json({ success: true, message: '2FA has been successfully enabled on your account.' });
}));

/**
 * DELETE /api/v1/superadmin/2fa
 * Disables 2FA. Body: { code: "123456" } — must supply a valid current TOTP.
 */
router.delete('/2fa', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).superAdminId as string;
  const { code } = req.body;
  if (!code) throw new AppError('TOTP code is required to disable 2FA', 400);

  const adminRow = await query(
    'SELECT totp_secret, totp_enabled FROM super_admins WHERE id = $1', [adminId]
  );
  if (!adminRow.rows[0]?.totp_enabled) {
    throw new AppError('2FA is not enabled on this account.', 400);
  }

  if (!verifyTotp(adminRow.rows[0].totp_secret, String(code))) {
    throw new AppError('Invalid TOTP code', 401);
  }

  await query(
    'UPDATE super_admins SET totp_enabled = false, totp_secret = NULL, totp_verified_at = NULL WHERE id = $1',
    [adminId]
  );

  res.json({ success: true, message: '2FA has been disabled.' });
}));

// ─────────────────────────────────────────────────────────────
// All routes below require super-admin auth
// ─────────────────────────────────────────────────────────────
router.use(requireSuperAdmin);

// ─────────────────────────────────────────────────────────────
// POST /api/v1/superadmin/schools — create a new tenant/school
// ─────────────────────────────────────────────────────────────

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
  const data   = CreateSchoolSchema.parse(req.body);
  const result = await schoolService.createSchool({ ...data, adminEmail: data.adminEmail });

  res.status(201).json({
    success: true,
    message: `School "${data.name}" created successfully.`,
    data: {
      school: { id: result.school.id, name: result.school.name, slug: result.school.slug, plan: result.school.plan, trialEndsAt: result.school.trial_ends_at },
      admin:  { id: result.admin.id,  email: result.admin.email, role: result.admin.role },
    },
  });
}));

router.get('/schools',      listAllSchools);

router.get('/schools/:id',  asyncHandler(async (req: Request, res: Response) => {
  const school = await schoolService.getSchool(req.params.id);
  res.json({ success: true, data: school });
}));

router.post('/schools/:id/suspend',    suspendSchool);
router.post('/schools/:id/reactivate', reactivateSchool);

router.put('/schools/:id/subscription', asyncHandler(async (req: Request, res: Response) => {
  const { plan, subscriptionEndsAt, razorpayCustomerId, razorpaySubscriptionId } = req.body;
  await schoolService.updateSubscription({
    schoolId: req.params.id,
    plan,
    razorpayCustomerId,
    razorpaySubscriptionId,
    subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : undefined,
  });
  res.json({ success: true, message: 'Subscription updated successfully' });
}));

// ─────────────────────────────────────────────────────────────
// GET /api/v1/superadmin/stats
// ─────────────────────────────────────────────────────────────
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [schoolStats, userStats] = await Promise.all([
    query(`
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
    `),
    query(`
      SELECT
        COUNT(*)::INT AS total_users,
        COUNT(*) FILTER (WHERE role = 'student')::INT AS students,
        COUNT(*) FILTER (WHERE role = 'teacher')::INT AS teachers
      FROM users WHERE is_active = true
    `),
  ]);

  res.json({ success: true, data: { schools: schoolStats.rows[0], users: userStats.rows[0] } });
}));

// ─────────────────────────────────────────────────────────────
// POST /api/v1/superadmin/schools/:id/impersonate
// ─────────────────────────────────────────────────────────────
router.post('/schools/:id/impersonate', asyncHandler(async (req: Request, res: Response) => {
  const { id }       = req.params;
  const superAdminId = (req as any).superAdminId as string;

  const schoolResult = await query(
    'SELECT id, name, slug FROM schools WHERE id = $1 AND is_active = true', [id]
  );
  if (schoolResult.rows.length === 0) throw new AppError('School not found or suspended', 404);
  const school = schoolResult.rows[0];

  const userResult = await query(
    `SELECT id, first_name, last_name, email, role
     FROM users
     WHERE school_id = $1 AND role = 'admin' AND is_active = true
     ORDER BY created_at ASC LIMIT 1`,
    [id]
  );
  if (userResult.rows.length === 0) throw new AppError('No active admin found for this school', 404);
  const admin = userResult.rows[0];

  const JWT_SECRET = process.env.JWT_SECRET!;
  const token = jwt.sign(
    {
      id:             admin.id,
      email:          admin.email,
      role:           admin.role,
      schoolId:       school.id,
      impersonated:   true,
      impersonatedBy: superAdminId,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // ── Audit log to DB (not just console) ──────────────────────
  await query(
    `INSERT INTO audit_logs
       (school_id, user_id, user_role, action, entity, new_data, ip_address, user_agent)
     VALUES ($1, $2, 'super_admin', 'impersonation.start', 'schools', $3, $4, $5)`,
    [
      school.id,
      superAdminId,
      JSON.stringify({ targetUserId: admin.id, targetUserEmail: admin.email }),
      req.ip || null,
      req.headers['user-agent'] || null,
    ]
  );

  console.log(`[SuperAdmin] Impersonation: ${superAdminId} → ${school.name} as ${admin.email}`);

  res.json({
    success: true,
    message: `Impersonation token for ${admin.email} at ${school.name}. Expires in 15 minutes.`,
    data: {
      token,
      user:   { id: admin.id, email: admin.email, firstName: admin.first_name, lastName: admin.last_name, role: admin.role, schoolId: school.id },
      school: { id: school.id, name: school.name, slug: school.slug },
    },
  });
}));

export default router;
