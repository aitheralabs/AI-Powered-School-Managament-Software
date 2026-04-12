import { Router } from 'express';
import {
  markAttendance,
  markBulkAttendance,
  getAttendanceRecords,
  updateAttendance,
  getAttendanceById,
  getClassAttendance,
  getClassAttendanceSummary,
  getStudentAttendanceSummary,
  deleteAttendance,
  getAttendanceStats,
  getStudentAttendanceList,
} from '../controllers/attendanceController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateAttendanceSchema, 
  UpdateAttendanceSchema,
  CreateBulkAttendanceSchema,
  AttendanceQuerySchema
} from '../types/attendance';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Attendance statistics — must be before /:id routes
router.get(
  '/stats',
  authorize('admin', 'staff', 'teacher'),
  getAttendanceStats
);

// Mark single attendance record
router.post(
  '/',
  authorize('admin', 'teacher'),
  validateBody(CreateAttendanceSchema),
  invalidateCache(['report:attendance*', 'stats:attendance*']),
  markAttendance
);

// Mark bulk attendance for a class
router.post(
  '/bulk',
  authorize('admin', 'teacher'),
  validateBody(CreateBulkAttendanceSchema),
  invalidateCache(['report:attendance*', 'stats:attendance*']),
  markBulkAttendance
);

// Get attendance records with filtering
router.get(
  '/',
  validateQuery(AttendanceQuerySchema),
  cacheResponse(300), // Cache for 5 minutes
  getAttendanceRecords
);

// Get attendance by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getAttendanceById
);

// Update attendance record
router.put(
  '/:id',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateAttendanceSchema),
  updateAttendance
);

// Delete attendance record
router.delete(
  '/:id',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  deleteAttendance
);

// Get class attendance for a specific date
router.get(
  '/class/:classId',
  validateParams(z.object({ classId: IdSchema })),
  validateQuery(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    subjectId: IdSchema.optional(),
  })),
  getClassAttendance
);

// Get class attendance summary (aggregated stats per student)
router.get(
  '/class/:classId/summary',
  validateParams(z.object({ classId: IdSchema })),
  validateQuery(z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })),
  getClassAttendanceSummary
);

// Get student attendance records list
router.get(
  '/student/:studentId',
  validateParams(z.object({ studentId: IdSchema })),
  validateQuery(z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })),
  getStudentAttendanceList
);

// Get student attendance summary
router.get(
  '/student/:studentId/summary',
  validateParams(z.object({ studentId: IdSchema })),
  validateQuery(z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  })),
  getStudentAttendanceSummary
);

export default router;