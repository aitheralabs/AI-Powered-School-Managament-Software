import { Router } from 'express';
import { importTeachersCSV, getTeacherCSVTemplate } from '../controllers/bulkUploadController';
import { uploadCSV } from '../middleware/fileUpload';
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  assignTeacherToSubject,
  removeTeacherFromSubject,
  assignTeacherToClass,
  removeTeacherFromClass,
  assignTeacherToClassSubject,
  removeTeacherFromClassSubject,
  getTeacherWorkload,
  getAllTeacherAssignments,
  checkAssignmentConflicts,
  getOptimalTeacherSuggestions,
  getTeacherStats,
  getTeacherClasses,
  getTeacherSubjects,
  exportTeachers,
} from '../controllers/teacherController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { sanitizeTeacher } from '../middleware/sanitization';
import { 
  CreateTeacherSchema, 
  UpdateTeacherSchema 
} from '../types/teacher';
import { PaginationSchema, IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication + active subscription
router.use(authenticate, resolveTenant, requireActiveSubscription);

// CSV bulk import & export
router.post('/import-csv', authorize('admin'), uploadCSV, importTeachersCSV);
router.get('/csv-template', authorize('admin'), getTeacherCSVTemplate);
router.get('/export', authorize('admin', 'staff'), exportTeachers);

// Create teacher (admin only)
router.post(
  '/',
  authorize('admin'),
  sanitizeTeacher,
  validateBody(CreateTeacherSchema),
  invalidateCache(['teachers:*', 'teacher:*']),
  createTeacher
);

// Get all teachers
router.get(
  '/',
  validateQuery(PaginationSchema.extend({
    isActive: z.string().optional().transform(val => val === 'true'),
    search: z.string().optional(),
    specialization: z.string().optional(),
  })),
  cacheResponse(300), // Cache for 5 minutes
  getTeachers
);

// Get teacher statistics (admin only) — must be before /:id routes
router.get(
  '/stats',
  authorize('admin', 'staff'),
  getTeacherStats
);

// Teacher assignment routes (must come before /:id routes)

// Get all teacher assignments overview (admin only)
router.get(
  '/assignments',
  authorize('admin'),
  validateQuery(PaginationSchema.extend({
    academicYearId: IdSchema.optional(),
    subjectId: IdSchema.optional(),
    classId: IdSchema.optional(),
  })),
  getAllTeacherAssignments
);

// Get teacher by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  cacheResponse(600), // Cache for 10 minutes
  getTeacherById
);

// Get classes taught by a teacher
router.get(
  '/:id/classes',
  validateParams(z.object({ id: IdSchema })),
  getTeacherClasses
);

// Get subjects taught by a teacher
router.get(
  '/:id/subjects',
  validateParams(z.object({ id: IdSchema })),
  getTeacherSubjects
);

// Update teacher (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  sanitizeTeacher,
  validateBody(UpdateTeacherSchema),
  invalidateCache(['teachers:*', 'teacher:*']),
  updateTeacher
);

// Deactivate teacher (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  invalidateCache(['teachers:*', 'teacher:*', 'classes:*']),
  deleteTeacher
);

// Get teacher workload and schedule
router.get(
  '/:id/workload',
  validateParams(z.object({ id: IdSchema })),
  cacheResponse(600), // Cache workload for 10 minutes (expensive calculation)
  getTeacherWorkload
);

// Check assignment conflicts before assigning
router.post(
  '/check-conflicts',
  authorize('admin'),
  validateBody(z.object({
    teacherId: IdSchema,
    classId: IdSchema,
    subjectId: IdSchema,
  })),
  checkAssignmentConflicts
);

// Get optimal teacher suggestions for class-subject assignment
router.get(
  '/suggestions/:classId/:subjectId',
  authorize('admin'),
  validateParams(z.object({ 
    classId: IdSchema,
    subjectId: IdSchema,
  })),
  getOptimalTeacherSuggestions
);

// Subject assignment routes
router.post(
  '/assign-subject',
  authorize('admin'),
  validateBody(z.object({
    teacherId: IdSchema,
    subjectId: IdSchema,
  })),
  invalidateCache(['teacher:*', 'teachers:*']),
  assignTeacherToSubject
);

router.delete(
  '/:teacherId/subjects/:subjectId',
  authorize('admin'),
  validateParams(z.object({ 
    teacherId: IdSchema,
    subjectId: IdSchema,
  })),
  invalidateCache(['teacher:*', 'teachers:*']),
  removeTeacherFromSubject
);

// Class assignment routes (main class teacher)
router.post(
  '/assign-class',
  authorize('admin'),
  validateBody(z.object({
    teacherId: IdSchema,
    classId: IdSchema,
  })),
  invalidateCache(['teacher:*', 'teachers:*', 'classes:*']),
  assignTeacherToClass
);

router.delete(
  '/classes/:classId/teacher',
  authorize('admin'),
  validateParams(z.object({ classId: IdSchema })),
  removeTeacherFromClass
);

// Class-subject assignment routes (subject-specific teaching)
router.post(
  '/assign-class-subject',
  authorize('admin'),
  validateBody(z.object({
    teacherId: IdSchema,
    classId: IdSchema,
    subjectId: IdSchema,
  })),
  assignTeacherToClassSubject
);

router.delete(
  '/classes/:classId/subjects/:subjectId/teacher',
  authorize('admin'),
  validateParams(z.object({ 
    classId: IdSchema,
    subjectId: IdSchema,
  })),
  removeTeacherFromClassSubject
);

export default router;