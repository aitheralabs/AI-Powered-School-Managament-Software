import { Router } from 'express';
import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deactivateStaff,
  reactivateStaff,
  getStaffSummary,
} from '../controllers/staffController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateStaffSchema,
  UpdateStaffSchema,
  StaffQuerySchema
} from '../types/staff';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Create staff member (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateStaffSchema),
  createStaff
);

// Get staff members with filtering and pagination (admin and staff only)
router.get(
  '/',
  authorize('admin', 'staff'),
  validateQuery(StaffQuerySchema),
  getStaff
);

// Get staff summary and statistics (admin only)
router.get(
  '/summary',
  authorize('admin'),
  getStaffSummary
);

// Get staff member by ID (admin and staff only)
router.get(
  '/:id',
  authorize('admin', 'staff'),
  getStaffById
);

// Update staff member (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateBody(UpdateStaffSchema),
  updateStaff
);

// Deactivate staff member (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  deactivateStaff
);

// Reactivate staff member (admin only)
router.patch(
  '/:id/reactivate',
  authorize('admin'),
  reactivateStaff
);

export default router;