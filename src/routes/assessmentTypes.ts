import { Router } from 'express';
import {
  createAssessmentType,
  getAssessmentTypes,
  getAssessmentTypeById,
  updateAssessmentType,
  deleteAssessmentType,
  reactivateAssessmentType,
} from '../controllers/assessmentTypeController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateAssessmentTypeSchema,
  UpdateAssessmentTypeSchema
} from '../types/grade';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Create assessment type (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateAssessmentTypeSchema),
  createAssessmentType
);

// Get all assessment types
router.get(
  '/',
  validateQuery(z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number),
    active: z.string().optional().default('true'),
  })),
  getAssessmentTypes
);

// Get assessment type by ID
router.get(
  '/:id',
  getAssessmentTypeById
);

// Update assessment type (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateBody(UpdateAssessmentTypeSchema),
  updateAssessmentType
);

// Delete assessment type (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  deleteAssessmentType
);

// Reactivate assessment type (admin only)
router.patch(
  '/:id/reactivate',
  authorize('admin'),
  reactivateAssessmentType
);

export default router;