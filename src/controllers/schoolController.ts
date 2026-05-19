/**
 * School (Tenant) Controller
 *
 * Public: POST /api/v1/schools/register  — onboard a new school
 * Admin:  GET  /api/v1/schools/me        — get current school info
 *         GET  /api/v1/schools/me/usage  — usage vs plan limits
 * Super:  GET  /api/v1/superadmin/schools — list all schools
 */

import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { SchoolService } from "../services/schoolService";
import { z } from "zod";

const schoolService = new SchoolService();

const RegisterSchoolSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    ),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  timezone: z.string().optional(),
  gstin: z.string().max(15).optional(),
  taxId: z.string().max(50).optional(),
  pan: z.string().max(10).optional(),
  billingContactName: z.string().optional(),
  billingPhone: z.string().optional(),
  adminFirstName: z.string().min(1).max(100),
  adminLastName: z.string().min(1).max(100),
  adminPassword: z.string().min(8),
});

/** POST /api/v1/schools/register — public, no auth */
export const registerSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const data = RegisterSchoolSchema.parse(req.body);
    const result = await schoolService.createSchool(data);

    res.status(201).json({
      success: true,
      message: `Welcome! Your school "${data.name}" is set up on a 30-day free trial. Log in with your admin credentials.`,
      data: {
        school: {
          id: result.school.id,
          name: result.school.name,
          slug: result.school.slug,
          plan: result.school.plan,
          trialEndsAt: result.school.trial_ends_at,
        },
        admin: {
          id: result.admin.id,
          email: result.admin.email,
          role: result.admin.role,
        },
      },
    });
  },
);

/** GET /api/v1/schools/me — current school's own profile */
export const getMySchool = asyncHandler(async (req: Request, res: Response) => {
  if (!req.schoolId) throw new AppError("Tenant context missing", 500);
  const school = await schoolService.getSchool(req.schoolId);

  res.json({ success: true, data: school });
});

/** GET /api/v1/schools/me/usage — show limits vs current usage */
export const getSchoolUsage = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.school) throw new AppError("Tenant context missing", 500);

    const { query } = await import("../database/connection");
    const schoolId = req.schoolId!;

    const [studentCount, teacherCount, staffCount] = await Promise.all([
      query("SELECT COUNT(*) FROM students WHERE school_id = $1", [schoolId]),
      query("SELECT COUNT(*) FROM teachers WHERE school_id = $1", [schoolId]),
      query("SELECT COUNT(*) FROM staff WHERE school_id = $1", [schoolId]),
    ]);

    res.json({
      success: true,
      data: {
        plan: req.school.plan,
        subscriptionStatus: req.school.subscriptionStatus,
        trialEndsAt: req.school.trialEndsAt,
        subscriptionEndsAt: req.school.subscriptionEndsAt,
        usage: {
          students: {
            used: parseInt(studentCount.rows[0].count),
            limit: req.school.limits.maxStudents,
          },
          teachers: {
            used: parseInt(teacherCount.rows[0].count),
            limit: req.school.limits.maxTeachers,
          },
          staff: {
            used: parseInt(staffCount.rows[0].count),
            limit: req.school.limits.maxStaff,
          },
        },
        features: req.school.features,
      },
    });
  },
);

/** GET /api/v1/superadmin/schools — super-admin only */
export const listAllSchools = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status as string | undefined,
      plan: req.query.plan as string | undefined,
    };

    const result = await schoolService.listSchools(page, limit, filters);
    res.json({ success: true, ...result });
  },
);

/** PATCH /api/v1/schools/me — update school profile */
export const updateMySchool = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.schoolId) throw new AppError("Tenant context missing", 500);

    const allowed = [
      "name",
      "phone",
      "address",
      "city",
      "state",
      "country",
      "postalCode",
      "website",
      "timezone",
      "logoUrl",
      "gstin",
      "taxId",
      "pan",
      "billingContactName",
      "billingPhone",
    ];
    const input: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) input[key] = req.body[key];
    }

    const updated = await schoolService.updateSchool(req.schoolId, input);
    res.json({
      success: true,
      message: "School profile updated.",
      data: updated,
    });
  },
);

/** POST /api/v1/schools/me/export — GDPR data export */
export const exportSchoolData = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.schoolId) throw new AppError("Tenant context missing", 500);

    const data = await schoolService.exportSchoolData(req.schoolId);
    const filename = `school-export-${data.school.slug}-${Date.now()}.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json(data);
  },
);

/** POST /api/v1/superadmin/schools/:id/suspend */
export const suspendSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    await schoolService.suspendSchool(id, reason || "Suspended by admin");
    res.json({ success: true, message: "School suspended successfully" });
  },
);

/** POST /api/v1/superadmin/schools/:id/reactivate */
export const reactivateSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await schoolService.reactivateSchool(id);
    res.json({ success: true, message: "School reactivated successfully" });
  },
);
