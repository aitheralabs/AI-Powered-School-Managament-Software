/**
 * SaaS Tenant Routes — Comprehensive Tests
 *
 * Covers:
 *  - GET  /api/v1/schools/plans           (public)
 *  - POST /api/v1/schools/register        (public — onboarding)
 *  - GET  /api/v1/schools/verify-email    (public — email verification)
 *  - GET  /api/v1/schools/me              (admin only)
 *  - PATCH /api/v1/schools/me             (admin only)
 *  - GET  /api/v1/schools/me/usage        (admin + staff)
 *  - POST /api/v1/schools/me/export       (admin only — GDPR)
 *  - GET  /api/v1/schools/me/invoices     (admin only)
 *  - Subscription enforcement middleware
 *  - Feature gate middleware
 *  - Plan limit enforcement
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { query } from '../database/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_environment_32_chars_minimum';

const makeToken = (role: string, extra: Record<string, any> = {}) =>
  jwt.sign({ id: `test-${role}-saas`, email: `${role}@saas.test`, role, ...extra }, JWT_SECRET, { expiresIn: '1h' });

const adminToken   = makeToken('admin');
const teacherToken = makeToken('teacher');
const staffToken   = makeToken('staff');
const studentToken = makeToken('student');

// Unique slug/email for each test run to avoid conflicts
const RUN_ID   = Date.now();
const TEST_SLUG  = `test-school-${RUN_ID}`;
const TEST_EMAIL = `school-${RUN_ID}@register.test`;

describe('SaaS Tenant Routes', () => {

  afterAll(async () => {
    // Clean up any schools created by registration tests
    await query(
      `DELETE FROM users WHERE email LIKE '%@register.test' OR email LIKE 'admin-%@register.test'`
    ).catch(() => {});
    await query(
      `DELETE FROM schools WHERE slug LIKE 'test-school-%' OR email LIKE '%@register.test'`
    ).catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────────
  // Plans (public)
  // ─────────────────────────────────────────────────────────────────

  describe('GET /api/v1/schools/plans', () => {
    it('returns all active plans without auth', async () => {
      const res = await request(app)
        .get('/api/v1/schools/plans')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('each plan has required pricing and limit fields', async () => {
      const res = await request(app).get('/api/v1/schools/plans').expect(200);
      for (const plan of res.body.data) {
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('display_name');
        expect(plan).toHaveProperty('price_monthly');
        expect(plan).toHaveProperty('price_yearly');
        expect(plan).toHaveProperty('max_students');
        expect(plan).toHaveProperty('max_teachers');
        expect(plan).toHaveProperty('max_staff');
      }
    });

    it('plans are ordered by sort_order', async () => {
      const res = await request(app).get('/api/v1/schools/plans').expect(200);
      const orders: number[] = res.body.data.map((p: any) => p.sort_order);
      const sorted = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sorted);
    });

    it('includes trial plan with zero price', async () => {
      const res = await request(app).get('/api/v1/schools/plans').expect(200);
      const trial = res.body.data.find((p: any) => p.name === 'trial');
      expect(trial).toBeDefined();
      expect(Number(trial.price_monthly)).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // School Registration (public)
  // ─────────────────────────────────────────────────────────────────

  describe('POST /api/v1/schools/register', () => {
    it('registers a new school and creates admin user', async () => {
      const res = await request(app)
        .post('/api/v1/schools/register')
        .send({
          name:           'Test Registration School',
          slug:           TEST_SLUG,
          email:          TEST_EMAIL,
          adminFirstName: 'Admin',
          adminLastName:  'User',
          adminPassword:  'AdminPass123!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.school.slug).toBe(TEST_SLUG);
      expect(res.body.data.school.plan).toBe('trial');
      expect(res.body.data.school.trialEndsAt).toBeTruthy();
      expect(res.body.data.admin.email).toBeTruthy();
      expect(res.body.data.admin.role).toBe('admin');
    });

    it('rejects duplicate slug', async () => {
      const res = await request(app)
        .post('/api/v1/schools/register')
        .send({
          name:           'Duplicate',
          slug:           TEST_SLUG,
          email:          `dup-${TEST_EMAIL}`,
          adminFirstName: 'A',
          adminLastName:  'B',
          adminPassword:  'Pass123!XX',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/schools/register')
        .send({
          name:           'Dup Email',
          slug:           `${TEST_SLUG}-new`,
          email:          TEST_EMAIL,
          adminFirstName: 'A',
          adminLastName:  'B',
          adminPassword:  'Pass123!XX',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('rejects invalid slug format (spaces/uppercase)', async () => {
      const res = await request(app)
        .post('/api/v1/schools/register')
        .send({
          name:           'Bad Slug',
          slug:           'Bad Slug With Spaces',
          email:          `bad-slug-${RUN_ID}@test.com`,
          adminFirstName: 'A',
          adminLastName:  'B',
          adminPassword:  'Pass123!XX',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects weak admin password (< 8 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/schools/register')
        .send({
          name:           'Weak Pass School',
          slug:           `weak-pass-${RUN_ID}`,
          email:          `weakpass-${RUN_ID}@test.com`,
          adminFirstName: 'A',
          adminLastName:  'B',
          adminPassword:  'abc',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/schools/register')
        .send({ name: 'Only Name' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Email Verification
  // ─────────────────────────────────────────────────────────────────

  describe('GET /api/v1/schools/verify-email', () => {
    it('returns 400 for missing token', async () => {
      const res = await request(app)
        .get('/api/v1/schools/verify-email')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid/used token', async () => {
      const res = await request(app)
        .get('/api/v1/schools/verify-email?token=invalid-token-that-does-not-exist')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('verifies a real token from a registered school', async () => {
      // Fetch the token that was set during registration
      const row = await query(
        'SELECT email_verification_token FROM schools WHERE slug = $1',
        [TEST_SLUG]
      );
      if (!row.rows[0]?.email_verification_token) return; // already verified or not set

      const token = row.rows[0].email_verification_token;
      const res = await request(app)
        .get(`/api/v1/schools/verify-email?token=${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // GET /api/v1/schools/me
  // ─────────────────────────────────────────────────────────────────

  describe('GET /api/v1/schools/me', () => {
    it('admin can get school profile', async () => {
      const res = await request(app)
        .get('/api/v1/schools/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('plan');
      expect(res.body.data).toHaveProperty('subscription_status');
    });

    it('rejects unauthenticated request', async () => {
      await request(app).get('/api/v1/schools/me').expect(401);
    });

    it('rejects teacher role (admin only)', async () => {
      await request(app)
        .get('/api/v1/schools/me')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('rejects student role', async () => {
      await request(app)
        .get('/api/v1/schools/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // PATCH /api/v1/schools/me
  // ─────────────────────────────────────────────────────────────────

  describe('PATCH /api/v1/schools/me', () => {
    it('admin can update school profile fields', async () => {
      const res = await request(app)
        .patch('/api/v1/schools/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone:   '+91-9876543210',
          city:    'Mumbai',
          state:   'Maharashtra',
          country: 'India',
          website: 'https://testschool.example.com',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('updated');
    });

    it('returns 400 when no valid fields provided', async () => {
      const res = await request(app)
        .patch('/api/v1/schools/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ unknownField: 'value' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects non-admin roles', async () => {
      await request(app)
        .patch('/api/v1/schools/me')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ city: 'Delhi' })
        .expect(403);
    });

    it('rejects unauthenticated request', async () => {
      await request(app)
        .patch('/api/v1/schools/me')
        .send({ city: 'Delhi' })
        .expect(401);
    });

    it('persists updated value and retrieves it in /me', async () => {
      await request(app)
        .patch('/api/v1/schools/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ city: 'Bangalore' })
        .expect(200);

      const res = await request(app)
        .get('/api/v1/schools/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.city).toBe('Bangalore');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // GET /api/v1/schools/me/usage
  // ─────────────────────────────────────────────────────────────────

  describe('GET /api/v1/schools/me/usage', () => {
    it('admin can see usage vs limits', async () => {
      const res = await request(app)
        .get('/api/v1/schools/me/usage')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const { usage } = res.body.data;
      expect(usage).toHaveProperty('students');
      expect(usage).toHaveProperty('teachers');
      expect(usage).toHaveProperty('staff');
      expect(usage.students).toHaveProperty('used');
      expect(usage.students).toHaveProperty('limit');
    });

    it('staff can see usage', async () => {
      await request(app)
        .get('/api/v1/schools/me/usage')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);
    });

    it('teacher cannot see usage', async () => {
      await request(app)
        .get('/api/v1/schools/me/usage')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('returns plan and subscription status', async () => {
      const res = await request(app)
        .get('/api/v1/schools/me/usage')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('plan');
      expect(res.body.data).toHaveProperty('subscriptionStatus');
      expect(res.body.data).toHaveProperty('features');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // POST /api/v1/schools/me/export  (GDPR)
  // ─────────────────────────────────────────────────────────────────

  describe('POST /api/v1/schools/me/export', () => {
    it('admin can export school data as JSON download', async () => {
      const res = await request(app)
        .post('/api/v1/schools/me/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/json');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('school-export-');
      expect(res.body).toHaveProperty('exportedAt');
      expect(res.body).toHaveProperty('school');
      expect(res.body).toHaveProperty('students');
      expect(res.body).toHaveProperty('teachers');
      expect(res.body).toHaveProperty('staff');
      expect(res.body).toHaveProperty('payments');
    });

    it('export contains all expected data sections', async () => {
      const res = await request(app)
        .post('/api/v1/schools/me/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expected = ['school', 'students', 'teachers', 'staff', 'classes',
                        'academicYears', 'feeCategories', 'payments', 'attendance'];
      for (const key of expected) {
        expect(res.body).toHaveProperty(key);
      }
    });

    it('rejects teacher role', async () => {
      await request(app)
        .post('/api/v1/schools/me/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('rejects unauthenticated request', async () => {
      await request(app)
        .post('/api/v1/schools/me/export')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // GET /api/v1/schools/me/invoices
  // ─────────────────────────────────────────────────────────────────

  describe('GET /api/v1/schools/me/invoices', () => {
    it('admin can list billing history', async () => {
      const res = await request(app)
        .get('/api/v1/schools/me/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('invoices');
      expect(Array.isArray(res.body.data.invoices)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
    });

    it('supports pagination params', async () => {
      const res = await request(app)
        .get('/api/v1/schools/me/invoices?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.limit).toBe(5);
      expect(res.body.data.page).toBe(1);
    });

    it('rejects teacher role', async () => {
      await request(app)
        .get('/api/v1/schools/me/invoices')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Subscription enforcement
  // ─────────────────────────────────────────────────────────────────

  describe('requireActiveSubscription middleware', () => {
    const TEST_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';

    afterEach(async () => {
      // Restore test school to active state
      await query(
        `UPDATE schools SET subscription_status = 'active', trial_ends_at = NOW() + INTERVAL '30 days'
         WHERE id = $1`,
        [TEST_SCHOOL_ID]
      ).catch(() => {});
    });

    it('blocks past_due school with 402', async () => {
      await query(
        `UPDATE schools SET subscription_status = 'past_due' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(402);

      expect(res.body.success).toBe(false);
    });

    it('blocks expired trial school with 402', async () => {
      await query(
        `UPDATE schools SET subscription_status = 'trialing',
         trial_ends_at = NOW() - INTERVAL '1 day' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(402);

      expect(res.body.success).toBe(false);
    });

    it('allows active subscription', async () => {
      await query(
        `UPDATE schools SET subscription_status = 'active',
         subscription_ends_at = NOW() + INTERVAL '30 days' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).not.toBe(402);
    });

    it('allows school in active trial', async () => {
      await query(
        `UPDATE schools SET subscription_status = 'trialing',
         trial_ends_at = NOW() + INTERVAL '10 days' WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).not.toBe(402);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Feature gates
  // ─────────────────────────────────────────────────────────────────

  describe('requireFeature middleware', () => {
    const TEST_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';

    afterEach(async () => {
      await query(
        `UPDATE schools SET feature_ai_insights = true WHERE id = $1`,
        [TEST_SCHOOL_ID]
      ).catch(() => {});
    });

    it('allows access when feature is enabled', async () => {
      await query(
        `UPDATE schools SET feature_ai_insights = true WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );
      const res = await request(app)
        .get('/api/v1/ai/insights')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).not.toBe(403);
    });

    it('returns 403 when feature is disabled on plan', async () => {
      await query(
        `UPDATE schools SET feature_ai_insights = false WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );
      const res = await request(app)
        .get('/api/v1/ai/insights')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(res.body.message).toContain('not available on your current plan');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Plan limit enforcement
  // ─────────────────────────────────────────────────────────────────

  describe('Plan limit enforcement', () => {
    const TEST_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';

    afterEach(async () => {
      await query(
        `UPDATE schools SET max_students = 1000 WHERE id = $1`,
        [TEST_SCHOOL_ID]
      ).catch(() => {});
    });

    it('returns 403 when student limit is reached', async () => {
      // Set max_students to 0 so any addition fails
      await query(
        `UPDATE schools SET max_students = 0 WHERE id = $1`,
        [TEST_SCHOOL_ID]
      );

      const res = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName:   'Limit',
          lastName:    'Test',
          email:       `limit-test-${RUN_ID}@test.com`,
          dateOfBirth: '2010-01-01',
          gender:      'male',
          studentId:   `LT${RUN_ID}`,
        })
        .expect(403);

      expect(res.body.message).toContain('plan limit');
    });
  });
});
