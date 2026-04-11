import { Router } from 'express';
import {
  recordPayment,
  getPayments,
  getPaymentById,
  getPaymentReceipt,
  getPaymentHistory,
  getPaymentStatistics,
  reversePayment,
} from '../controllers/paymentController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreatePaymentSchema,
  FeeQuerySchema
} from '../types/fee';
import { IdSchema, PaginationSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Record a payment (admin and staff only)
router.post(
  '/',
  authorize('admin', 'staff'),
  validateBody(CreatePaymentSchema),
  invalidateCache(['payments:*', 'fees:*', 'stats:fees:*']),
  recordPayment
);

// Get all payments with filtering
router.get(
  '/',
  validateQuery(FeeQuerySchema),
  cacheResponse(300), // Cache for 5 minutes
  getPayments
);

// Get payment by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  cacheResponse(600), // Cache for 10 minutes
  getPaymentById
);

// Get payment receipt
router.get(
  '/:id/receipt',
  validateParams(z.object({ id: IdSchema })),
  getPaymentReceipt
);

// Get payment history for a student
router.get(
  '/student/:studentId/history',
  validateParams(z.object({ studentId: IdSchema })),
  getPaymentHistory
);

// Get payment statistics
router.get(
  '/statistics/overview',
  validateQuery(z.object({
    period: z.enum(['today', 'week', 'month', 'year']).optional().default('month'),
    classId: IdSchema.optional(),
    feeCategoryId: IdSchema.optional(),
  })),
  getPaymentStatistics
);

// Reverse/void a payment (admin only)
router.delete(
  '/:id/reverse',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
  })),
  reversePayment
);

export default router;