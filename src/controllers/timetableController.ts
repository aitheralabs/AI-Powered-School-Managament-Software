import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { TimetableService } from '../services/timetableService';

const svc = new TimetableService();

// ── Slots ──────────────────────────────────────────────────────────────────

export const getSlots = asyncHandler(async (req: Request, res: Response) => {
  const { classId, teacherId, academicYearId, semesterId, dayOfWeek } = req.query as Record<string, string>;
  const data = await svc.forSchool(req.schoolId!).getSlots({
    classId, teacherId, academicYearId, semesterId,
    dayOfWeek: dayOfWeek ? parseInt(dayOfWeek, 10) : undefined,
  });
  res.json({ success: true, data });
});

export const getSlotById = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.forSchool(req.schoolId!).getSlotById(req.params.id);
  res.json({ success: true, data });
});

export const createSlot = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.forSchool(req.schoolId!).createSlot(req.body);
  res.status(201).json({ success: true, message: 'Timetable slot created', data });
});

export const updateSlot = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.forSchool(req.schoolId!).updateSlot(req.params.id, req.body);
  res.json({ success: true, message: 'Timetable slot updated', data });
});

export const deleteSlot = asyncHandler(async (req: Request, res: Response) => {
  await svc.forSchool(req.schoolId!).deleteSlot(req.params.id);
  res.json({ success: true, message: 'Timetable slot deleted' });
});

export const getClassWeeklyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { academicYearId, semesterId } = req.query as Record<string, string>;
  const data = await svc.forSchool(req.schoolId!).getClassWeeklyTimetable(req.params.classId, { academicYearId, semesterId });
  res.json({ success: true, data });
});

export const getTeacherSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { academicYearId } = req.query as Record<string, string>;
  const data = await svc.forSchool(req.schoolId!).getTeacherSchedule(req.params.teacherId, { academicYearId });
  res.json({ success: true, data });
});

// ── Exams ─────────────────────────────────────────────────────────────────

export const getExams = asyncHandler(async (req: Request, res: Response) => {
  const { academicYearId, semesterId, examType } = req.query as Record<string, string>;
  const data = await svc.forSchool(req.schoolId!).getExams({ academicYearId, semesterId, examType });
  res.json({ success: true, data });
});

export const getExamById = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.forSchool(req.schoolId!).getExamById(req.params.id);
  res.json({ success: true, data });
});

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.forSchool(req.schoolId!).createExam(req.body);
  res.status(201).json({ success: true, message: 'Exam created', data });
});

export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.forSchool(req.schoolId!).updateExam(req.params.id, req.body);
  res.json({ success: true, message: 'Exam updated', data });
});

export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  await svc.forSchool(req.schoolId!).deleteExam(req.params.id);
  res.json({ success: true, message: 'Exam deleted' });
});

// ── Exam Schedules ────────────────────────────────────────────────────────

export const getExamSchedules = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.forSchool(req.schoolId!).getExamSchedules(req.params.examId);
  res.json({ success: true, data });
});

export const createExamSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.forSchool(req.schoolId!).createExamSchedule(req.params.examId, req.body);
  res.status(201).json({ success: true, message: 'Exam schedule created', data });
});

export const deleteExamSchedule = asyncHandler(async (req: Request, res: Response) => {
  await svc.forSchool(req.schoolId!).deleteExamSchedule(req.params.scheduleId);
  res.json({ success: true, message: 'Exam schedule deleted' });
});
