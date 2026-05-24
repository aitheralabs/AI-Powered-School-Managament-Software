import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { CreateUserSchema, UpdateUserSchema } from '../types/user';
import { PaginationSchema } from '../types/common';
import { IdSchema } from '../types/common';
import { z } from 'zod';
import { sanitizeUser } from '../middleware/sanitization';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';

const router = Router();

// All routes require authentication + tenant isolation
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Create user (admin only)
router.post(
  '/',
  authorize('admin'),
  sanitizeUser,
  validateBody(CreateUserSchema),
  invalidateCache(['users:*', 'user_session:*']),
  createUser
);

// Get all users (admin only)
router.get(
  '/',
  authorize('admin'),
  validateQuery(PaginationSchema),
  cacheResponse(300), // 5 minutes cache
  getUsers
);

// Get user by ID (admin only)
router.get(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  cacheResponse(600), // 10 minutes cache
  getUserById
);

// Update user
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateUserSchema),
  invalidateCache(['users:*', 'user_session:*']),
  updateUser
);

// Delete user (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  invalidateCache(['users:*', 'user_session:*']),
  deleteUser
);

export default router;
