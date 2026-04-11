import { Router } from 'express';
import {
  createFeeCategory,
  getFeeCategories,
  getFeeCategoryById,
  updateFeeCategory,
  deleteFeeCategory,
  assignFeesToStudents,
  assignFeesToClass,
  getStudentFees,
  getStudentFeeById,
  updateStudentFee,
} from '../controllers/feeController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateFeeCategorySchema, 
  UpdateFeeCategorySchema,
  AssignFeesToStudentsSchema,
  AssignFeesToClassSchema,
  UpdateStudentFeeSchema,
  FeeQuerySchema
} from '../types/fee';
import { IdSchema, PaginationSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Fee Category Management Routes

// Create fee category (admin only)
router.post(
  '/categories',
  authorize('admin'),
  validateBody(CreateFeeCategorySchema),
  invalidateCache(['fees:*', 'stats:fees:*']),
  createFeeCategory
);

// Get all fee categories
router.get(
  '/categories',
  validateQuery(PaginationSchema.extend({
    academicYearId: IdSchema.optional(),
    frequency: z.enum(['monthly', 'quarterly', 'semester', 'annual', 'one-time']).optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
    isMandatory: z.string().optional().transform(val => val === 'true'),
  })),
  cacheResponse(600), // Cache for 10 minutes
  getFeeCategories
);

// Get fee category by ID
router.get(
  '/categories/:id',
  validateParams(z.object({ id: IdSchema })),
  cacheResponse(600), // Cache for 10 minutes
  getFeeCategoryById
);

// Update fee category (admin only)
router.put(
  '/categories/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateFeeCategorySchema),
  updateFeeCategory
);

// Delete fee category (admin only)
router.delete(
  '/categories/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  deleteFeeCategory
);

// Fee Assignment Routes

// Assign fees to specific students (admin only)
router.post(
  '/assign-students',
  authorize('admin'),
  validateBody(AssignFeesToStudentsSchema),
  assignFeesToStudents
);

// Assign fees to entire class (admin only)
router.post(
  '/assign-class',
  authorize('admin'),
  validateBody(AssignFeesToClassSchema),
  assignFeesToClass
);

// Student Fee Management Routes

// Get student fees with filtering
router.get(
  '/student-fees',
  validateQuery(FeeQuerySchema),
  getStudentFees
);

// Get student fee by ID
router.get(
  '/student-fees/:id',
  validateParams(z.object({ id: IdSchema })),
  getStudentFeeById
);

// Update student fee (admin only)
router.put(
  '/student-fees/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateStudentFeeSchema),
  updateStudentFee
);

export default router;