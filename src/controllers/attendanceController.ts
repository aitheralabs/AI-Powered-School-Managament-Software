import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AttendanceService } from '../services/attendanceService';

const attendanceService = new AttendanceService();

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const attendance = await attendanceService.forSchool(req.schoolId!).markAttendance(req.body, req.user!.id);
  res.status(201).json({ success: true, message: 'Attendance marked successfully', data: attendance });
});

export const markBulkAttendance = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.forSchool(req.schoolId!).markBulkAttendance(req.body, req.user!.id);
  res.status(201).json({ success: true, message: 'Bulk attendance marked successfully', data: result });
});

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.forSchool(req.schoolId!).getAttendance(req);
  res.json({ success: true, data: result.attendance, pagination: result.pagination });
});

export const getAttendanceById = asyncHandler(async (req: Request, res: Response) => {
  const attendance = await attendanceService.forSchool(req.schoolId!).getAttendanceById(req.params.id);
  res.json({ success: true, data: attendance });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const attendance = await attendanceService.forSchool(req.schoolId!).updateAttendance(req.params.id, req.body);
  res.json({ success: true, message: 'Attendance updated successfully', data: attendance });
});

export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  await attendanceService.forSchool(req.schoolId!).deleteAttendance(req.params.id);
  res.json({ success: true, message: 'Attendance record deleted successfully' });
});

export const getStudentAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;
  const summary = await attendanceService.forSchool(req.schoolId!).getStudentAttendanceSummary(
    studentId, startDate as string, endDate as string
  );
  res.json({ success: true, data: summary });
});

export const getAttendanceRecords = getAttendance;
export const getClassAttendance = getAttendance;
