/**
 * Tenant Resolution Middleware
 *
 * Resolves the current school (tenant) from:
 *   1. JWT payload field `schoolId` (primary, used after login)
 *   2. X-School-ID request header (for API clients)
 *   3. Subdomain: acme.yourapp.com → slug = 'acme'
 *
 * Attaches `req.schoolId` and `req.school` to every authenticated request.
 * All downstream service calls MUST include school_id in every DB query.
 */

import { Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from './errorHandler';

// Extend Request to carry tenant context
declare global {
  namespace Express {
    interface Request {
      schoolId?: string;
      school?: {
        id: string;
        name: string;
        slug: string;
        plan: string;
        subscriptionStatus: string;
        trialEndsAt: Date | null;
        subscriptionEndsAt: Date | null;
        features: {
          aiInsights: boolean;
          library: boolean;
          transport: boolean;
          hostel: boolean;
          messaging: boolean;
          apiAccess: boolean;
        };
        limits: {
          maxStudents: number;
          maxTeachers: number;
          maxStaff: number;
        };
        isActive: boolean;
      };
    }
  }
}

/** Cache resolved schools briefly (60 s) to avoid per-request DB hits */
const tenantCache = new Map<string, { school: Request['school']; cachedAt: number }>();
const TENANT_CACHE_TTL = 60_000; // 60 seconds

async function resolveSchool(schoolId: string): Promise<Request['school'] | null> {
  const now = Date.now();
  const cached = tenantCache.get(schoolId);
  if (cached && now - cached.cachedAt < TENANT_CACHE_TTL) {
    return cached.school;
  }

  const result = await query(
    `SELECT
       id, name, slug, plan, subscription_status,
       trial_ends_at, subscription_ends_at,
       max_students, max_teachers, max_staff,
       feature_ai_insights, feature_library, feature_transport,
       feature_hostel, feature_messaging, feature_api_access,
       is_active
     FROM schools
     WHERE id = $1`,
    [schoolId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const school: Request['school'] = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    subscriptionStatus: row.subscription_status,
    trialEndsAt: row.trial_ends_at,
    subscriptionEndsAt: row.subscription_ends_at,
    features: {
      aiInsights: row.feature_ai_insights,
      library: row.feature_library,
      transport: row.feature_transport,
      hostel: row.feature_hostel,
      messaging: row.feature_messaging,
      apiAccess: row.feature_api_access,
    },
    limits: {
      maxStudents: row.max_students,
      maxTeachers: row.max_teachers,
      maxStaff: row.max_staff,
    },
    isActive: row.is_active,
  };

  tenantCache.set(schoolId, { school, cachedAt: now });
  return school;
}

/** Resolve school_id from JWT user object (user.schoolId set during login) */
export const resolveTenant = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  // Skip for super-admin routes and public routes
  if (!req.user) return next();

  // Try JWT payload first
  const schoolId: string | undefined = (req.user as any).schoolId;

  // Try header fallback (for API clients)
  const headerSchoolId = req.headers['x-school-id'] as string | undefined;

  const resolvedId = schoolId || headerSchoolId;

  if (!resolvedId) {
    throw new AppError('School context could not be determined. Please log in again.', 400);
  }

  const school = await resolveSchool(resolvedId);

  if (!school) {
    throw new AppError('School not found. Contact support.', 404);
  }

  if (!school.isActive) {
    throw new AppError('This school account has been suspended. Contact support.', 403);
  }

  req.schoolId = resolvedId;
  req.school = school;
  next();
});

/** Invalidate the in-process cache entry for a school (call after plan changes) */
export const invalidateTenantCache = (schoolId: string) => {
  tenantCache.delete(schoolId);
};

/**
 * Middleware: require that the school's subscription is active (or in trial).
 * Attach this AFTER resolveTenant on any revenue-gated route.
 */
export const requireActiveSubscription = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.school) {
    throw new AppError('Tenant context missing', 500);
  }

  const { subscriptionStatus, trialEndsAt, subscriptionEndsAt } = req.school;
  const now = new Date();

  if (subscriptionStatus === 'trialing') {
    if (trialEndsAt && now > trialEndsAt) {
      throw new AppError(
        'Your free trial has expired. Please subscribe to continue using the platform.',
        402
      );
    }
    return next();
  }

  if (subscriptionStatus === 'active') {
    if (subscriptionEndsAt && now > subscriptionEndsAt) {
      throw new AppError('Your subscription has expired. Please renew to continue.', 402);
    }
    return next();
  }

  if (subscriptionStatus === 'past_due') {
    throw new AppError('Your payment is past due. Please update your payment method.', 402);
  }

  throw new AppError(`Account status is "${subscriptionStatus}". Please contact support.`, 403);
});

/**
 * Feature gate factory.
 * Usage: router.get('/ai-insights', requireFeature('aiInsights'), controller)
 */
type SchoolFeatures = NonNullable<Request['school']>['features'];

export const requireFeature = (feature: keyof SchoolFeatures) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.school) throw new AppError('Tenant context missing', 500);
    if (!req.school.features[feature as keyof SchoolFeatures]) {
      throw new AppError(
        `This feature is not available on your current plan. Please upgrade to access it.`,
        403
      );
    }
    next();
  });
};
