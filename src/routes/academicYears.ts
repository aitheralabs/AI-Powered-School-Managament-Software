import { Router } from 'express';
import {
  createAcademicYear,
  getAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
  getActiveAcademicYear,
  activateAcademicYear,
} from '../controllers/academicYearController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { sanitizeAcademicYear } from '../middleware/sanitization';
import { adminRateLimit } from '../middleware/rateLimiting';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateAcademicYearSchema, 
  UpdateAcademicYearSchema 
} from '../types/academic';
import { PaginationSchema, IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Create academic year (admin only)
router.post(
  '/',
  authorize('admin'),
  adminRateLimit,
  sanitizeAcademicYear,
  validateBody(CreateAcademicYearSchema),
  invalidateCache(['academic_year*']),
  createAcademicYear
);

// Get all academic years
router.get(
  '/',
  validateQuery(PaginationSchema.extend({
    isActive: z.string().optional().transform(val => val === 'true'),
  })),
  cacheResponse(3600), // Cache for 1 hour (rarely changes)
  getAcademicYears
);

// Get active academic year
router.get(
  '/active',
  cacheResponse(3600), // Cache for 1 hour (rarely changes)
  getActiveAcademicYear
);

// Activate academic year (must be before /:id to avoid conflict)
router.post(
  '/:id/activate',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  invalidateCache(['academic_year*']),
  activateAcademicYear
);

// Get academic year by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  cacheResponse(3600), // Cache for 1 hour
  getAcademicYearById
);

// Update academic year (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  sanitizeAcademicYear,
  validateBody(UpdateAcademicYearSchema),
  invalidateCache(['academic_year*']),
  updateAcademicYear
);

// Delete academic year (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  invalidateCache(['academic_year*']),
  deleteAcademicYear
);

export default router;