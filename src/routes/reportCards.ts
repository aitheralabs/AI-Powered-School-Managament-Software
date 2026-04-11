import { Router } from 'express';
import {
  generateReportCard,
  getReportCards,
  getReportCardById,
  updateReportCard,
  deleteReportCard,
  regenerateReportCard,
} from '../controllers/reportCardController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateReportCardSchema,
  UpdateReportCardSchema
} from '../types/grade';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Generate report card (teachers and admins only)
router.post(
  '/',
  authorize('admin', 'teacher'),
  validateBody(CreateReportCardSchema),
  generateReportCard
);

// Get report cards with filtering and pagination
router.get(
  '/',
  validateQuery(z.object({
    studentId: IdSchema.optional(),
    semesterId: IdSchema.optional(),
    classId: IdSchema.optional(),
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number),
  })),
  getReportCards
);

// Get report card by ID with full details
router.get(
  '/:id',
  getReportCardById
);

// Update report card remarks (teachers and admins only)
router.put(
  '/:id',
  authorize('admin', 'teacher'),
  validateBody(UpdateReportCardSchema),
  updateReportCard
);

// Delete report card (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  deleteReportCard
);

// Regenerate report card (recalculate based on current grades)
router.patch(
  '/:id/regenerate',
  authorize('admin', 'teacher'),
  regenerateReportCard
);

export default router;