import { Router } from 'express';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentSummary,
  getStudentClassHistory,
  getStudentsByClass,
  bulkUpdateStudents,
  getStudentStats,
} from '../controllers/studentController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateStudentSchema, 
  UpdateStudentSchema,
  StudentQuerySchema
} from '../types/student';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication + active subscription
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Create student (admin and staff)
router.post(
  '/',
  authorize('admin', 'staff'),
  validateBody(CreateStudentSchema),
  invalidateCache(['students:*', 'classes:*', 'stats:*']),
  createStudent
);

// Get student statistics (admin only) — must be before /:id
router.get(
  '/stats',
  authorize('admin', 'staff'),
  getStudentStats
);

// Get all students
router.get(
  '/',
  authorize('admin', 'teacher'),
  validateQuery(StudentQuerySchema),
  cacheResponse(300), // Cache for 5 minutes
  getStudents
);

// Get student by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  cacheResponse(600), // Cache for 10 minutes
  getStudentById
);

// Get student summary/dashboard
router.get(
  '/:id/summary',
  validateParams(z.object({ id: IdSchema })),
  getStudentSummary
);

// Get student class history
router.get(
  '/:id/class-history',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getStudentClassHistory
);

// Get students by class
router.get(
  '/class/:classId',
  authorize('admin', 'teacher'),
  validateParams(z.object({ classId: IdSchema })),
  validateQuery(z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('50'),
  })),
  cacheResponse(300), // Cache for 5 minutes
  getStudentsByClass
);

// Bulk update students (admin only)
router.patch(
  '/bulk-update',
  authorize('admin'),
  validateBody(z.object({
    studentIds: z.array(IdSchema).min(1, 'At least one student ID is required'),
    updateData: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      classId: IdSchema.optional(),
      guardianName: z.string().optional(),
      guardianPhone: z.string().optional(),
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field to update is required',
    }),
  })),
  bulkUpdateStudents
);

// Update student (admin and staff)
router.put(
  '/:id',
  authorize('admin', 'staff'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateStudentSchema),
  invalidateCache(['students:*', 'classes:*']),
  updateStudent
);

// Delete student (admin and staff)
router.delete(
  '/:id',
  authorize('admin', 'staff'),
  validateParams(z.object({ id: IdSchema })),
  invalidateCache(['students:*', 'classes:*', 'stats:*']),
  deleteStudent
);

export default router;