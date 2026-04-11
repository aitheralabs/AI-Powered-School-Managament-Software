import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AttendanceReportService } from '../services/attendanceReportService';

const attendanceReportService = new AttendanceReportService();

export const generateAttendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await attendanceReportService.forSchool(req.schoolId!).generateAttendanceReport(
    req.query as any, req.user!.id, req.user!.role
  );
  res.json({ success: true, data: report });
});

export const getAttendanceTrends = asyncHandler(async (req: Request, res: Response) => {
  const report = await attendanceReportService.forSchool(req.schoolId!).getAttendanceTrends(
    req.query, req.user!.id, req.user!.role
  );
  res.json({ success: true, data: report });
});

export const getAttendanceStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'month' } = req.query;
  const report = await attendanceReportService.forSchool(req.schoolId!).getAttendanceStatistics(
    period as string, req.user!.id, req.user!.role
  );
  res.json({ success: true, data: report });
});

export const exportAttendanceData = asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
