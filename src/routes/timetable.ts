/**
 * Timetable Routes
 *
 * GET  /api/v1/timetable                          — list slots
 * GET  /api/v1/timetable/:id                      — get slot
 * POST /api/v1/timetable                          — create slot
 * PUT  /api/v1/timetable/:id                      — update slot
 * DELETE /api/v1/timetable/:id                    — delete slot
 * GET  /api/v1/timetable/class/:classId            — weekly timetable for a class
 * GET  /api/v1/timetable/teacher/:teacherId        — teacher schedule
 *
 * GET  /api/v1/timetable/exams                    — list exams
 * GET  /api/v1/timetable/exams/:id                — get exam
 * POST /api/v1/timetable/exams                    — create exam
 * PUT  /api/v1/timetable/exams/:id                — update exam
 * DELETE /api/v1/timetable/exams/:id              — delete exam
 * GET  /api/v1/timetable/exams/:examId/schedules  — list exam schedules
 * POST /api/v1/timetable/exams/:examId/schedules  — create exam schedule
 * DELETE /api/v1/timetable/exams/:examId/schedules/:scheduleId — delete exam schedule
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { invalidateCache, cacheResponse } from '../middleware/caching';
import {
  getSlots, getSlotById, createSlot, updateSlot, deleteSlot,
  getClassWeeklyTimetable, getTeacherSchedule,
  getExams, getExamById, createExam, updateExam, deleteExam,
  getExamSchedules, createExamSchedule, deleteExamSchedule,
} from '../controllers/timetableController';
import { IdSchema } from '../types/common';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

const SlotSchema = z.object({
  classId:        IdSchema,
  subjectId:      IdSchema,
  teacherId:      IdSchema.optional(),
  dayOfWeek:      z.number().int().min(1).max(7),
  startTime:      z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  endTime:        z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  room:           z.string().max(50).optional(),
  academicYearId: IdSchema.optional(),
  semesterId:     IdSchema.optional(),
});

const ExamSchema = z.object({
  name:           z.string().min(2).max(255),
  examType:       z.enum(['unit_test', 'midterm', 'final', 'practical', 'other']),
  startDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  academicYearId: IdSchema.optional(),
  semesterId:     IdSchema.optional(),
  instructions:   z.string().optional(),
});

const ExamScheduleSchema = z.object({
  classId:    IdSchema,
  subjectId:  IdSchema,
  examDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:  z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  endTime:    z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  room:       z.string().max(50).optional(),
  maxMarks:   z.number().positive().optional(),
  passMarks:  z.number().positive().optional(),
});

// ── Named special routes (MUST come before /:id) ───────────────────────────

router.get('/class/:classId',
  validateParams(z.object({ classId: IdSchema })),
  cacheResponse(300),
  getClassWeeklyTimetable
);

router.get('/teacher/:teacherId',
  authorize('admin', 'teacher', 'staff'),
  validateParams(z.object({ teacherId: IdSchema })),
  cacheResponse(300),
  getTeacherSchedule
);

// ── Exam routes ────────────────────────────────────────────────────────────

router.get('/exams',
  cacheResponse(300),
  getExams
);

router.get('/exams/:id',
  validateParams(z.object({ id: IdSchema })),
  getExamById
);

router.post('/exams',
  authorize('admin', 'staff'),
  validateBody(ExamSchema),
  invalidateCache(['timetable:exams*']),
  createExam
);

router.put('/exams/:id',
  authorize('admin', 'staff'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(ExamSchema.partial()),
  invalidateCache(['timetable:exams*']),
  updateExam
);

router.delete('/exams/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  invalidateCache(['timetable:exams*']),
  deleteExam
);

router.get('/exams/:examId/schedules',
  validateParams(z.object({ examId: IdSchema })),
  getExamSchedules
);

router.post('/exams/:examId/schedules',
  authorize('admin', 'staff'),
  validateParams(z.object({ examId: IdSchema })),
  validateBody(ExamScheduleSchema),
  createExamSchedule
);

router.delete('/exams/:examId/schedules/:scheduleId',
  authorize('admin'),
  validateParams(z.object({ examId: IdSchema, scheduleId: IdSchema })),
  deleteExamSchedule
);

// ── Slot CRUD ──────────────────────────────────────────────────────────────

router.get('/',
  cacheResponse(300),
  getSlots
);

router.get('/:id',
  validateParams(z.object({ id: IdSchema })),
  getSlotById
);

router.post('/',
  authorize('admin', 'staff'),
  validateBody(SlotSchema),
  invalidateCache(['timetable*']),
  createSlot
);

router.put('/:id',
  authorize('admin', 'staff'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(SlotSchema.partial()),
  invalidateCache(['timetable*']),
  updateSlot
);

router.delete('/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  invalidateCache(['timetable*']),
  deleteSlot
);

export default router;
