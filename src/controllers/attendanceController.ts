import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AttendanceService } from '../services/attendanceService';
import { query } from '../database/connection';

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

export const getStudentAttendanceList = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const schoolId = req.schoolId!;
  const { startDate, endDate } = req.query as Record<string, string | undefined>;

  let whereClause = 'WHERE a.student_id = $1 AND a.school_id = $2';
  const sqlParams: any[] = [studentId, schoolId];

  if (startDate) { whereClause += ` AND a.date >= $${sqlParams.length + 1}`; sqlParams.push(startDate); }
  if (endDate)   { whereClause += ` AND a.date <= $${sqlParams.length + 1}`; sqlParams.push(endDate); }

  const result = await query(
    `SELECT a.*, c.name AS class_name, s.name AS subject_name
     FROM attendance a
     LEFT JOIN classes c  ON c.id = a.class_id
     LEFT JOIN subjects s ON s.id = a.subject_id
     ${whereClause}
     ORDER BY a.date DESC`,
    sqlParams
  );

  res.json({ success: true, data: result.rows });
});

export const getAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const today = new Date().toISOString().split('T')[0];

  const [overallRes, todayRes, weekRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'present') AS present,
         COUNT(*) FILTER (WHERE status = 'absent')  AS absent,
         COUNT(*) FILTER (WHERE status = 'late')    AS late,
         COUNT(*) FILTER (WHERE status = 'excused') AS excused
       FROM attendance WHERE school_id = $1`,
      [schoolId]
    ),
    query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'present') AS present,
         COUNT(*) FILTER (WHERE status = 'absent')  AS absent
       FROM attendance WHERE school_id = $1 AND date = $2`,
      [schoolId, today]
    ),
    query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'present') AS present
       FROM attendance
       WHERE school_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [schoolId]
    ),
  ]);

  const o = overallRes.rows[0];
  const t = todayRes.rows[0];
  const w = weekRes.rows[0];

  const totalOverall    = parseInt(o.total, 10);
  const presentOverall  = parseInt(o.present, 10);
  const totalToday      = parseInt(t.total, 10);
  const presentToday    = parseInt(t.present, 10);
  const totalWeek       = parseInt(w.total, 10);
  const presentWeek     = parseInt(w.present, 10);

  res.json({
    success: true,
    data: {
      overall: {
        total: totalOverall,
        present: presentOverall,
        absent: parseInt(o.absent, 10),
        late: parseInt(o.late, 10),
        excused: parseInt(o.excused, 10),
        attendanceRate: totalOverall > 0 ? Math.round((presentOverall / totalOverall) * 100) : 0,
      },
      today: {
        total: totalToday,
        present: presentToday,
        absent: parseInt(t.absent, 10),
        attendanceRate: totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0,
      },
      thisWeek: {
        total: totalWeek,
        present: presentWeek,
        attendanceRate: totalWeek > 0 ? Math.round((presentWeek / totalWeek) * 100) : 0,
      },
    },
  });
});
