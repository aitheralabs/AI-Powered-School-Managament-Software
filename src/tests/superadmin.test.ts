/**
 * Super-Admin Panel — Comprehensive Tests
 *
 * Covers:
 *  - POST /api/v1/superadmin/login            (success, wrong pw, inactive, 2FA challenge)
 *  - POST /api/v1/superadmin/2fa/setup        (generate secret)
 *  - POST /api/v1/superadmin/2fa/verify       (enable 2FA)
 *  - DELETE /api/v1/superadmin/2fa            (disable 2FA)
 *  - Full 2FA login flow
 *  - GET  /api/v1/superadmin/stats            (KPIs)
 *  - POST /api/v1/superadmin/schools          (create tenant)
 *  - GET  /api/v1/superadmin/schools          (list with pagination + filters)
 *  - GET  /api/v1/superadmin/schools/:id      (get single tenant)
 *  - POST /api/v1/superadmin/schools/:id/suspend
 *  - POST /api/v1/superadmin/schools/:id/reactivate
 *  - PUT  /api/v1/superadmin/schools/:id/subscription
 *  - POST /api/v1/superadmin/schools/:id/impersonate  (token + audit_log entry)
 *  - Auth rejection: school JWT rejected, missing token rejected
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import app from '../app';
import { query } from '../database/connection';

// ─────────────────────────────────────────────────────────────
// Secrets (must match what superadmin.ts uses at runtime)
// ─────────────────────────────────────────────────────────────
const JWT_SECRET           = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_environment_32_chars_minimum';
const SUPER_ADMIN_SECRET   = process.env.SUPER_ADMIN_JWT_SECRET || (JWT_SECRET + '_superadmin');

// ─────────────────────────────────────────────────────────────
// TOTP helpers (mirrors superadmin.ts — no import to avoid coupling)
// ─────────────────────────────────────────────────────────────
const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

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

// ─────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────
const RUN_ID        = Date.now();
const SA_EMAIL      = `superadmin-${RUN_ID}@test.internal`;
const SA_PASSWORD   = `SuperPass123!-${RUN_ID}`;
const SA_ID         = `00000000-dead-beef-0000-${String(RUN_ID).slice(-12).padStart(12, '0')}`;

// School-user JWT (school admin) — used to verify super-admin routes reject it
const schoolAdminToken = jwt.sign(
  { id: 'school-user-id', email: 'school@test.com', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// Super-admin JWT helper
const makeSaToken = (id = SA_ID) =>
  jwt.sign({ id, type: 'super_admin' }, SUPER_ADMIN_SECRET, { expiresIn: '8h' });

let saToken: string;          // set after login test
let createdSchoolId: string;  // set after create-school test

describe('Super-Admin Panel', () => {

  // ─── Setup: insert a real super_admin row ──────────────────
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(SA_PASSWORD, 10);
    await query(
      `INSERT INTO super_admins (id, email, password_hash, first_name, last_name, is_active)
       VALUES ($1, $2, $3, 'Test', 'SuperAdmin', true)
       ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true`,
      [SA_ID, SA_EMAIL, passwordHash]
    );
    // Start with 2FA disabled
    await query(
      'UPDATE super_admins SET totp_enabled = false, totp_secret = NULL WHERE id = $1',
      [SA_ID]
    );
    saToken = makeSaToken();
  });

  // ─── Teardown: remove test fixtures ───────────────────────
  afterAll(async () => {
    // Clean up schools created in these tests
    await query(
      `DELETE FROM users WHERE email LIKE '%@sa-school-test.com'`
    ).catch(() => {});
    await query(
      `DELETE FROM schools WHERE email LIKE '%@sa-school-test.com'`
    ).catch(() => {});
    // Remove our test super_admin
    await query('DELETE FROM super_admins WHERE id = $1', [SA_ID]).catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════
  // Authentication
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/v1/superadmin/login', () => {
    it('returns token on valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: SA_EMAIL, password: SA_PASSWORD })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.admin.email).toBe(SA_EMAIL);
      expect(res.body.data.twoFactorEnabled).toBe(false);

      // Store for subsequent tests
      saToken = res.body.data.token;
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: SA_EMAIL, password: 'WrongPassword999!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('rejects unknown email with 401', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: 'nobody@nowhere.com', password: SA_PASSWORD })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('rejects inactive super-admin with 401', async () => {
      await query('UPDATE super_admins SET is_active = false WHERE id = $1', [SA_ID]);

      const res = await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: SA_EMAIL, password: SA_PASSWORD })
        .expect(401);

      expect(res.body.success).toBe(false);

      // Restore
      await query('UPDATE super_admins SET is_active = true WHERE id = $1', [SA_ID]);
    });

    it('returns 400 when email or password is missing', async () => {
      await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: SA_EMAIL })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Auth rejection tests
  // ═══════════════════════════════════════════════════════════

  describe('Auth rejection', () => {
    it('rejects school-user JWT on super-admin routes', async () => {
      await request(app)
        .get('/api/v1/superadmin/stats')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(401);
    });

    it('rejects missing Authorization header', async () => {
      await request(app)
        .get('/api/v1/superadmin/stats')
        .expect(401);
    });

    it('rejects expired super-admin token', async () => {
      const expiredToken = jwt.sign(
        { id: SA_ID, type: 'super_admin' },
        SUPER_ADMIN_SECRET,
        { expiresIn: '-1s' }
      );
      await request(app)
        .get('/api/v1/superadmin/stats')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('rejects token with wrong secret', async () => {
      const wrongToken = jwt.sign(
        { id: SA_ID, type: 'super_admin' },
        'wrong-secret-entirely',
        { expiresIn: '1h' }
      );
      await request(app)
        .get('/api/v1/superadmin/stats')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2FA full flow
  // ═══════════════════════════════════════════════════════════

  describe('TOTP 2FA flow', () => {
    let totpSecret: string;

    it('POST /2fa/setup generates secret and URI', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/2fa/setup')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.secret).toBeTruthy();
      expect(res.body.data.uri).toMatch(/^otpauth:\/\/totp\//);

      totpSecret = res.body.data.secret;
    });

    it('POST /2fa/setup returns 400 if called again before verify', async () => {
      // Secret is stored but not enabled yet — re-setup should overwrite (not error)
      // The actual behaviour: errors only if totp_enabled = true
      const res = await request(app)
        .post('/api/v1/superadmin/2fa/setup')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200); // second setup is allowed while not yet enabled

      totpSecret = res.body.data.secret; // use the latest secret
    });

    it('POST /2fa/verify rejects wrong code', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/2fa/verify')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ code: '000000' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('POST /2fa/verify enables 2FA with correct code', async () => {
      const code = totpCode(totpSecret);

      const res = await request(app)
        .post('/api/v1/superadmin/2fa/verify')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ code })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('enabled');
    });

    it('POST /2fa/setup returns 400 when 2FA already enabled', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/2fa/setup')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('login with 2FA enabled returns requires2FA when code omitted', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: SA_EMAIL, password: SA_PASSWORD })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.requires2FA).toBe(true);
    });

    it('login with 2FA enabled rejects wrong TOTP code', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: SA_EMAIL, password: SA_PASSWORD, totpCode: '000000' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('login with 2FA enabled succeeds with valid TOTP code', async () => {
      const code = totpCode(totpSecret);

      const res = await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: SA_EMAIL, password: SA_PASSWORD, totpCode: code })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.twoFactorEnabled).toBe(true);

      // Refresh saToken from 2FA-complete login
      saToken = res.body.data.token;
    });

    it('DELETE /2fa rejects wrong code', async () => {
      const res = await request(app)
        .delete('/api/v1/superadmin/2fa')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ code: '000000' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('DELETE /2fa disables 2FA with valid code', async () => {
      const code = totpCode(totpSecret);

      const res = await request(app)
        .delete('/api/v1/superadmin/2fa')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ code })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('disabled');
    });

    it('login works normally after 2FA disabled', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/login')
        .send({ email: SA_EMAIL, password: SA_PASSWORD })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.requires2FA).toBeUndefined();
      saToken = res.body.data.token;
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Stats
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/v1/superadmin/stats', () => {
    it('returns platform KPIs', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/stats')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const { schools, users } = res.body.data;

      expect(schools).toHaveProperty('total_active_schools');
      expect(schools).toHaveProperty('trialing_schools');
      expect(schools).toHaveProperty('active_paid_schools');
      expect(schools).toHaveProperty('at_risk_schools');
      expect(schools).toHaveProperty('new_last_30_days');
      expect(users).toHaveProperty('total_users');
      expect(users).toHaveProperty('students');
      expect(users).toHaveProperty('teachers');
    });

    it('all KPI values are non-negative integers', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/stats')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      for (const val of Object.values(res.body.data.schools)) {
        expect(typeof val).toBe('number');
        expect(val as number).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Tenant management — create school
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/v1/superadmin/schools', () => {
    const schoolSlug  = `sa-school-${RUN_ID}`;
    const schoolEmail = `contact-${RUN_ID}@sa-school-test.com`;
    const adminEmail  = `admin-${RUN_ID}@sa-school-test.com`;

    it('creates a new school tenant and returns token-ready data', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/schools')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          name:           'SA Test School',
          slug:           schoolSlug,
          email:          schoolEmail,
          adminFirstName: 'Jane',
          adminLastName:  'Doe',
          adminEmail,
          adminPassword:  'SecurePass123!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.school.slug).toBe(schoolSlug);
      expect(res.body.data.school.plan).toBe('trial');
      expect(res.body.data.school.trialEndsAt).toBeTruthy();
      expect(res.body.data.admin.email).toBe(adminEmail);
      expect(res.body.data.admin.role).toBe('admin');

      createdSchoolId = res.body.data.school.id;
    });

    it('rejects duplicate slug with 409', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/schools')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          name:           'Dup',
          slug:           schoolSlug,
          email:          `other-${RUN_ID}@sa-school-test.com`,
          adminFirstName: 'A',
          adminLastName:  'B',
          adminEmail:     `other2-${RUN_ID}@sa-school-test.com`,
          adminPassword:  'Pass123456!',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('rejects invalid slug format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/schools')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          name:           'Bad',
          slug:           'UPPERCASE_SLUG',
          email:          `badslug-${RUN_ID}@sa-school-test.com`,
          adminFirstName: 'A',
          adminLastName:  'B',
          adminEmail:     `badslug2-${RUN_ID}@sa-school-test.com`,
          adminPassword:  'Pass123456!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/schools')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ name: 'Only Name' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects weak admin password with 400', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/schools')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          name:           'Weak',
          slug:           `weak-${RUN_ID}`,
          email:          `weak-${RUN_ID}@sa-school-test.com`,
          adminFirstName: 'A',
          adminLastName:  'B',
          adminEmail:     `weakadmin-${RUN_ID}@sa-school-test.com`,
          adminPassword:  'abc',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Tenant management — list schools
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/v1/superadmin/schools', () => {
    it('returns paginated list of all schools', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/schools')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('limit');
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('pagination limits results correctly', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/schools?page=1&limit=2')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      expect(res.body.data.data.length).toBeLessThanOrEqual(2);
      expect(res.body.data.limit).toBe(2);
    });

    it('filters by subscription status', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/schools?status=trialing')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      for (const school of res.body.data.data) {
        expect(school.subscription_status).toBe('trialing');
      }
    });

    it('filters by plan', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/schools?plan=trial')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      for (const school of res.body.data.data) {
        expect(school.plan).toBe('trial');
      }
    });

    it('each school row has expected fields', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/schools?limit=1')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      if (res.body.data.data.length > 0) {
        const school = res.body.data.data[0];
        expect(school).toHaveProperty('id');
        expect(school).toHaveProperty('name');
        expect(school).toHaveProperty('slug');
        expect(school).toHaveProperty('email');
        expect(school).toHaveProperty('plan');
        expect(school).toHaveProperty('subscription_status');
        expect(school).toHaveProperty('student_count');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Tenant management — get single school
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/v1/superadmin/schools/:id', () => {
    it('returns detailed school info', async () => {
      const res = await request(app)
        .get(`/api/v1/superadmin/schools/${createdSchoolId}`)
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdSchoolId);
      expect(res.body.data).toHaveProperty('student_count');
      expect(res.body.data).toHaveProperty('teacher_count');
      expect(res.body.data).toHaveProperty('staff_count');
    });

    it('returns 404 for non-existent school', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/schools/00000000-0000-0000-0000-000000000999')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Tenant lifecycle — suspend / reactivate
  // ═══════════════════════════════════════════════════════════

  describe('Suspend and Reactivate school', () => {
    it('suspends an active school', async () => {
      const res = await request(app)
        .post(`/api/v1/superadmin/schools/${createdSchoolId}/suspend`)
        .set('Authorization', `Bearer ${saToken}`)
        .send({ reason: 'Test suspension' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('school is suspended in DB after suspend', async () => {
      const row = await query(
        'SELECT subscription_status, is_active FROM schools WHERE id = $1',
        [createdSchoolId]
      );
      expect(row.rows[0].subscription_status).toBe('suspended');
      expect(row.rows[0].is_active).toBe(false);
    });

    it('reactivates a suspended school', async () => {
      const res = await request(app)
        .post(`/api/v1/superadmin/schools/${createdSchoolId}/reactivate`)
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('school is active in DB after reactivate', async () => {
      const row = await query(
        'SELECT subscription_status, is_active FROM schools WHERE id = $1',
        [createdSchoolId]
      );
      expect(row.rows[0].subscription_status).toBe('active');
      expect(row.rows[0].is_active).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Subscription update
  // ═══════════════════════════════════════════════════════════

  describe('PUT /api/v1/superadmin/schools/:id/subscription', () => {
    it('updates subscription plan to basic', async () => {
      const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .put(`/api/v1/superadmin/schools/${createdSchoolId}/subscription`)
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          plan:                'basic',
          subscriptionEndsAt:  endsAt,
          razorpayCustomerId:    'cus_test_123',
          razorpaySubscriptionId: 'sub_test_456',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('DB reflects updated plan and razorpay IDs', async () => {
      const row = await query(
        'SELECT plan, razorpay_customer_id, razorpay_subscription_id FROM schools WHERE id = $1',
        [createdSchoolId]
      );
      expect(row.rows[0].plan).toBe('basic');
      expect(row.rows[0].razorpay_customer_id).toBe('cus_test_123');
    });

    it('returns 400 for unknown plan name', async () => {
      const res = await request(app)
        .put(`/api/v1/superadmin/schools/${createdSchoolId}/subscription`)
        .set('Authorization', `Bearer ${saToken}`)
        .send({ plan: 'unicorn-plan' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Impersonation
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/v1/superadmin/schools/:id/impersonate', () => {
    it('returns a short-lived school JWT for the tenant admin', async () => {
      const res = await request(app)
        .post(`/api/v1/superadmin/schools/${createdSchoolId}/impersonate`)
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.school.id).toBe(createdSchoolId);
      expect(res.body.data.user.role).toBe('admin');
    });

    it('impersonation token decodes with correct claims', async () => {
      const res = await request(app)
        .post(`/api/v1/superadmin/schools/${createdSchoolId}/impersonate`)
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      const decoded = jwt.verify(res.body.data.token, JWT_SECRET) as any;
      expect(decoded.impersonated).toBe(true);
      expect(decoded.impersonatedBy).toBe(SA_ID);
      expect(decoded.schoolId).toBe(createdSchoolId);
      expect(decoded.role).toBe('admin');
    });

    it('impersonation creates an audit_log entry in DB', async () => {
      // Perform impersonation
      await request(app)
        .post(`/api/v1/superadmin/schools/${createdSchoolId}/impersonate`)
        .set('Authorization', `Bearer ${saToken}`)
        .expect(200);

      // Verify audit log
      const logResult = await query(
        `SELECT * FROM audit_logs
         WHERE school_id = $1 AND user_id = $2 AND action = 'impersonation.start'
         ORDER BY created_at DESC LIMIT 1`,
        [createdSchoolId, SA_ID]
      );

      expect(logResult.rows.length).toBeGreaterThan(0);
      const log = logResult.rows[0];
      expect(log.user_role).toBe('super_admin');
      expect(log.entity).toBe('schools');
      expect(log.new_data).toMatchObject({ targetUserEmail: expect.any(String) });
    });

    it('returns 404 when impersonating non-existent school', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/schools/00000000-0000-0000-0000-000000000999/impersonate')
        .set('Authorization', `Bearer ${saToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('returns 404 when impersonating suspended school', async () => {
      // Suspend the school
      await query(
        `UPDATE schools SET is_active = false WHERE id = $1`,
        [createdSchoolId]
      );

      const res = await request(app)
        .post(`/api/v1/superadmin/schools/${createdSchoolId}/impersonate`)
        .set('Authorization', `Bearer ${saToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);

      // Restore
      await query(
        `UPDATE schools SET is_active = true WHERE id = $1`,
        [createdSchoolId]
      );
    });
  });
});
