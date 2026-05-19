/**
 * School (Tenant) Service
 *
 * Handles school onboarding, plan management, and tenant lifecycle.
 * This is the SaaS control plane — separate from the school's own data.
 */

import { query, getClient } from "../database/connection";
import { AppError } from "../middleware/errorHandler";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { invalidateTenantCache } from "../middleware/tenant";
import { emailService } from "./emailService";

export interface CreateSchoolInput {
  // School info
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  gstin?: string;
  taxId?: string;
  pan?: string;
  billingContactName?: string;
  billingPhone?: string;
  // Admin user to create for this school
  adminEmail?: string; // if omitted, falls back to school email
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;
}

export interface UpdateSubscriptionInput {
  schoolId: string;
  plan: "trial" | "basic" | "standard" | "premium" | "enterprise";
  billingPeriod?: "monthly" | "yearly";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionEndsAt?: Date;
}

export class SchoolService {
  /** Register a new school (tenant) with its first admin user */
  async createSchool(
    input: CreateSchoolInput,
  ): Promise<{ school: any; admin: any }> {
    // Validate slug uniqueness
    const slugCheck = await query("SELECT id FROM schools WHERE slug = $1", [
      input.slug,
    ]);
    if (slugCheck.rows.length > 0) {
      throw new AppError(
        "A school with this slug already exists. Choose a different subdomain.",
        409,
      );
    }

    const emailCheck = await query("SELECT id FROM schools WHERE email = $1", [
      input.email,
    ]);
    if (emailCheck.rows.length > 0) {
      throw new AppError("A school with this email already exists.", 409);
    }

    const client = await getClient();
    try {
      await client.query("BEGIN");

      // 1. Create the school (generate email verification token)
      const verificationToken = crypto.randomBytes(32).toString("hex");

      const schoolResult = await client.query(
        `INSERT INTO schools
           (name, slug, email, phone, address, city, state, country, postal_code, website, timezone,
            gstin, tax_id, pan, billing_contact_name, billing_phone,
            plan, subscription_status, trial_ends_at,
            max_students, max_teachers, max_staff,
            feature_messaging, email_verification_token)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
                 $12,$13,$14,$15,$16,
                 'trial','trialing', NOW() + INTERVAL '30 days',
                 100, 20, 10, true, $17)
         RETURNING *`,
        [
          input.name,
          input.slug,
          input.email,
          input.phone || null,
          input.address || null,
          input.city || null,
          input.state || null,
          input.country || "India",
          input.postalCode || null,
          input.website || null,
          input.timezone || "Asia/Kolkata",
          input.gstin || null,
          input.taxId || null,
          input.pan || null,
          input.billingContactName || null,
          input.billingPhone || null,
          verificationToken,
        ],
      );

      const school = schoolResult.rows[0];

      // 2. Create the school's first admin user
      const passwordHash = await bcrypt.hash(input.adminPassword, 12);

      const adminResult = await client.query(
        `INSERT INTO users
           (first_name, last_name, email, password_hash, role, school_id, is_active)
         VALUES ($1,$2,$3,$4,'admin',$5,true)
         RETURNING id, first_name, last_name, email, role, school_id, created_at`,
        [
          input.adminFirstName,
          input.adminLastName,
          input.adminEmail || input.email,
          passwordHash,
          school.id,
        ],
      );

      const admin = adminResult.rows[0];

      // 3. Mark school as onboarded
      await client.query(
        "UPDATE schools SET onboarded_at = NOW() WHERE id = $1",
        [school.id],
      );

      await client.query("COMMIT");

      // Send welcome + verification email asynchronously (never block registration)
      const appUrl = process.env.APP_URL || "http://localhost:4200";
      const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;
      emailService
        .sendSchoolWelcomeEmail(
          admin.email,
          `${input.adminFirstName} ${input.adminLastName}`,
          input.name,
        )
        .catch((err) =>
          console.error("[SchoolService] Welcome email failed:", err),
        );

      emailService
        .sendEmailVerification(input.email, input.name, verifyUrl)
        .catch((err) =>
          console.error("[SchoolService] Verification email failed:", err),
        );

      return { school, admin };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /** Get school details by ID */
  async getSchool(schoolId: string): Promise<any> {
    const result = await query(
      `SELECT
         s.*,
         (SELECT COUNT(*) FROM users    WHERE school_id = s.id AND role = 'student' AND is_active = true)::INT AS student_count,
         (SELECT COUNT(*) FROM teachers WHERE school_id = s.id)::INT AS teacher_count,
         (SELECT COUNT(*) FROM staff    WHERE school_id = s.id AND is_active = true)::INT AS staff_count
       FROM schools s
       WHERE s.id = $1`,
      [schoolId],
    );
    if (result.rows.length === 0) throw new AppError("School not found", 404);
    return result.rows[0];
  }

  /** List all schools (super-admin only) */
  async listSchools(
    page = 1,
    limit = 20,
    filters?: { status?: string; plan?: string },
  ): Promise<any> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`s.subscription_status = $${params.length}`);
    }
    if (filters?.plan) {
      params.push(filters.plan);
      conditions.push(`s.plan = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(limit, offset);

    const result = await query(
      `SELECT
         s.id, s.name, s.slug, s.email, s.plan, s.subscription_status,
         s.trial_ends_at, s.subscription_ends_at, s.is_active, s.created_at,
         (SELECT COUNT(*) FROM users WHERE school_id = s.id AND role = 'student')::INT AS student_count
       FROM schools s
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM schools s ${where}`,
      params.slice(0, -2),
    );
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  /** Update subscription after payment gateway webhook */
  async updateSubscription(input: UpdateSubscriptionInput): Promise<void> {
    // Get plan limits from the plan definition table
    const planResult = await query(
      "SELECT * FROM subscription_plans WHERE name = $1",
      [input.plan],
    );

    if (planResult.rows.length === 0) {
      throw new AppError(`Unknown plan: ${input.plan}`, 400);
    }

    const plan = planResult.rows[0];

    await query(
      `UPDATE schools SET
         plan = $1,
         subscription_status = 'active',
         subscription_starts_at = NOW(),
         subscription_ends_at = $2,
         stripe_customer_id = COALESCE($3, stripe_customer_id),
         stripe_subscription_id = COALESCE($4, stripe_subscription_id),
         max_students = $5,
         max_teachers = $6,
         max_staff = $7,
         max_storage_gb = $8,
         feature_ai_insights = $9,
         feature_library = $10,
         feature_transport = $11,
         feature_hostel = $12,
         feature_messaging = $13,
         feature_api_access = $14,
         updated_at = NOW()
       WHERE id = $15`,
      [
        input.plan,
        input.subscriptionEndsAt || null,
        input.stripeCustomerId || null,
        input.stripeSubscriptionId || null,
        plan.max_students,
        plan.max_teachers,
        plan.max_staff,
        plan.max_storage_gb,
        plan.feature_ai_insights,
        plan.feature_library,
        plan.feature_transport,
        plan.feature_hostel,
        plan.feature_messaging,
        plan.feature_api_access,
        input.schoolId,
      ],
    );

    // Invalidate cache so next request picks up new plan
    invalidateTenantCache(input.schoolId);
  }

  /** Suspend a school */
  async suspendSchool(schoolId: string, reason: string): Promise<void> {
    await query(
      `UPDATE schools SET subscription_status = 'suspended', is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [schoolId],
    );
    invalidateTenantCache(schoolId);
  }

  /** Reactivate a school */
  async reactivateSchool(schoolId: string): Promise<void> {
    await query(
      `UPDATE schools SET subscription_status = 'active', is_active = true, updated_at = NOW()
       WHERE id = $1`,
      [schoolId],
    );
    invalidateTenantCache(schoolId);
  }

  /** Update mutable school profile fields */
  async updateSchool(
    schoolId: string,
    input: Partial<{
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      website: string;
      timezone: string;
      logoUrl: string;
      gstin: string;
      taxId: string;
      pan: string;
      billingContactName: string;
      billingPhone: string;
    }>,
  ): Promise<any> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    const colMap: Record<string, string> = {
      name: "name",
      phone: "phone",
      address: "address",
      city: "city",
      state: "state",
      country: "country",
      postalCode: "postal_code",
      website: "website",
      timezone: "timezone",
      logoUrl: "logo_url",
      gstin: "gstin",
      taxId: "tax_id",
      pan: "pan",
      billingContactName: "billing_contact_name",
      billingPhone: "billing_phone",
    };

    for (const [key, col] of Object.entries(colMap)) {
      const val = (input as any)[key];
      if (val !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(val);
      }
    }

    if (fields.length === 0)
      throw new AppError("No valid fields to update", 400);

    fields.push(`updated_at = NOW()`);
    values.push(schoolId);

    const result = await query(
      `UPDATE schools SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values,
    );
    if (result.rows.length === 0) throw new AppError("School not found", 404);

    invalidateTenantCache(schoolId);
    return result.rows[0];
  }

  /**
   * GDPR data export — returns a structured JSON object with all school data.
   * The route handler streams this as a JSON file download.
   */
  async exportSchoolData(schoolId: string): Promise<any> {
    const [
      schoolRes,
      studentsRes,
      teachersRes,
      staffRes,
      classesRes,
      academicYearsRes,
      feeCategoriesRes,
      paymentsRes,
      attendanceRes,
    ] = await Promise.all([
      query(
        "SELECT id, name, slug, email, phone, address, city, state, country, plan, subscription_status, created_at FROM schools WHERE id = $1",
        [schoolId],
      ),
      query("SELECT * FROM students      WHERE school_id = $1", [schoolId]),
      query("SELECT * FROM teachers      WHERE school_id = $1", [schoolId]),
      query("SELECT * FROM staff         WHERE school_id = $1", [schoolId]),
      query("SELECT * FROM classes       WHERE school_id = $1", [schoolId]),
      query("SELECT * FROM academic_years WHERE school_id = $1", [schoolId]),
      query("SELECT * FROM fee_categories WHERE school_id = $1", [schoolId]),
      query(
        "SELECT id, student_id, amount, payment_date, payment_method, status, created_at FROM payments WHERE school_id = $1",
        [schoolId],
      ),
      query("SELECT * FROM attendance    WHERE school_id = $1", [schoolId]),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      school: schoolRes.rows[0],
      students: studentsRes.rows,
      teachers: teachersRes.rows,
      staff: staffRes.rows,
      classes: classesRes.rows,
      academicYears: academicYearsRes.rows,
      feeCategories: feeCategoriesRes.rows,
      payments: paymentsRes.rows,
      attendance: attendanceRes.rows,
    };
  }

  /**
   * Check if school is within plan limits before adding a resource.
   *
   * Uses SELECT FOR UPDATE on the schools row to prevent the classic
   * time-of-check / time-of-use race condition where two concurrent
   * requests both pass the limit check before either INSERT commits.
   *
   * IMPORTANT: the caller MUST wrap this inside an open transaction and
   * pass the transaction client; the INSERT that follows must use the same
   * client so the lock is held until the INSERT completes.
   */
  async checkLimit(
    schoolId: string,
    resource: "student" | "teacher" | "staff",
    client?: import("pg").PoolClient,
  ): Promise<void> {
    const runner = client ?? { query: (text: string, params?: any[]) => query(text, params) };

    // Lock the school row for the duration of the caller's transaction
    const schoolResult = await runner.query(
      "SELECT max_students, max_teachers, max_staff FROM schools WHERE id = $1 FOR UPDATE",
      [schoolId],
    );
    if (schoolResult.rows.length === 0)
      throw new AppError("School not found", 404);
    const school = schoolResult.rows[0];

    if (resource === "student") {
      const count = await runner.query(
        "SELECT COUNT(*) FROM students WHERE school_id = $1",
        [schoolId],
      );
      if (parseInt(count.rows[0].count) >= school.max_students) {
        throw new AppError(
          `You have reached your plan limit of ${school.max_students} students. Please upgrade your plan.`,
          403,
        );
      }
    } else if (resource === "teacher") {
      const count = await runner.query(
        "SELECT COUNT(*) FROM teachers WHERE school_id = $1",
        [schoolId],
      );
      if (parseInt(count.rows[0].count) >= school.max_teachers) {
        throw new AppError(
          `You have reached your plan limit of ${school.max_teachers} teachers. Please upgrade your plan.`,
          403,
        );
      }
    } else if (resource === "staff") {
      const count = await runner.query(
        "SELECT COUNT(*) FROM staff WHERE school_id = $1",
        [schoolId],
      );
      if (parseInt(count.rows[0].count) >= school.max_staff) {
        throw new AppError(
          `You have reached your plan limit of ${school.max_staff} staff members. Please upgrade your plan.`,
          403,
        );
      }
    }
  }
}
