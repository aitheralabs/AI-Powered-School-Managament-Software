import { Router } from 'express';
import {
  createGrade,
  getGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getStudentGrades,
  getClassGrades,
  getGradeStats,
  bulkCreateGrades,
} from '../controllers/gradeController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateGradeSchema,
  UpdateGradeSchema,
  GradeQuerySchema
} from '../types/grade';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Grade statistics — must be before /:id
router.get(
  '/stats',
  authorize('admin', 'teacher'),
  validateQuery(z.object({
    classId:    IdSchema.optional(),
    subjectId:  IdSchema.optional(),
    semesterId: IdSchema.optional(),
  })),
  getGradeStats
);

// Get grades for a specific student (admin, teacher, staff, parent, student)
router.get(
  '/student/:studentId',
  authorize('admin', 'teacher', 'staff', 'parent', 'student'),
  validateParams(z.object({ studentId: IdSchema })),
  validateQuery(z.object({
    semesterId: IdSchema.optional(),
    subjectId:  IdSchema.optional(),
  })),
  getStudentGrades
);

// Get grades for a specific class
router.get(
  '/class/:classId',
  authorize('admin', 'teacher'),
  validateParams(z.object({ classId: IdSchema })),
  validateQuery(z.object({
    semesterId:       IdSchema.optional(),
    subjectId:        IdSchema.optional(),
    assessmentTypeId: IdSchema.optional(),
  })),
  getClassGrades
);

// Bulk create/upsert grades
router.post(
  '/bulk',
  authorize('admin', 'teacher'),
  validateBody(z.object({
    grades: z.array(z.object({
      studentId:        IdSchema,
      subjectId:        IdSchema,
      assessmentTypeId: IdSchema,
      marksObtained:    z.number().min(0),
      totalMarks:       z.number().min(1),
      semesterId:       IdSchema,
      remarks:          z.string().optional(),
    })).min(1),
  })),
  invalidateCache(['report:grades*', 'stats:*']),
  bulkCreateGrades
);

// Create grade (teachers and admins only)
router.post(
  '/',
  authorize('admin', 'teacher'),
  validateBody(CreateGradeSchema),
  invalidateCache(['report:grades*', 'stats:*']),
  createGrade
);

// Get grades with filtering and pagination (admin, teacher, staff)
router.get(
  '/',
  authorize('admin', 'teacher', 'staff'),
  validateQuery(GradeQuerySchema),
  cacheResponse(300), // Cache for 5 minutes
  getGrades
);

// Get grade by ID (admin, teacher, staff, parent, student)
router.get(
  '/:id',
  authorize('admin', 'teacher', 'staff', 'parent', 'student'),
  getGradeById
);

// Update grade (teachers and admins only)
router.put(
  '/:id',
  authorize('admin', 'teacher'),
  validateBody(UpdateGradeSchema),
  updateGrade
);

// Delete grade (teachers and admins only)
router.delete(
  '/:id',
  authorize('admin', 'teacher'),
  deleteGrade
);

export default router;