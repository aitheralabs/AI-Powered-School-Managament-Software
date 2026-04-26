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

export const exportAttendanceData = asyncHandler(async (req: Request, res: Response) => {
  const { format = 'csv', ...reportQuery } = req.query as Record<string, string>;

  const result = await attendanceReportService
    .forSchool(req.schoolId!)
    .exportAttendanceData(format, reportQuery, req.user!.id, req.user!.role);

  if (format === 'json') {
    res.json({ success: true, data: result });
    return;
  }

  // CSV / Excel: stream the file as a download
  const { csvData, filename, mimeType } = result as {
    csvData: string;
    filename: string;
    mimeType: string;
  };

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvData);
});
