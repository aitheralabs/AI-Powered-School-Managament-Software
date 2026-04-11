import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { AttendanceReportQuery, ReportFormat, ReportResponse } from '../types/report';
import cacheService, { CacheKeys, CacheTTL } from './cacheService';

export class AttendanceReportService extends BaseService {
  async generateAttendanceReport(reportQuery: AttendanceReportQuery, userId: string, userRole: string): Promise<ReportResponse> {
    // Validate date range
    const startDate = new Date(reportQuery.startDate);
    const endDate = new Date(reportQuery.endDate);
    
    if (startDate > endDate) {
      throw new AppError('Start date cannot be after end date', 400);
    }

    // Build base query with authorization
    let whereClause = 'WHERE a.date BETWEEN $1 AND $2';
    const queryParams: any[] = [reportQuery.startDate, reportQuery.endDate];

    // Add authorization filters
    whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);

    // Add optional filters
    whereClause = this.addOptionalFilters(whereClause, queryParams, reportQuery);

    // Generate report based on groupBy parameter
    let reportData: any[] = [];
    let summary: any = {};

    switch (reportQuery.groupBy) {
      case 'student':
        reportData = await this.generateStudentAttendanceReport(whereClause, queryParams, reportQuery);
        break;
      case 'class':
        reportData = await this.generateClassAttendanceReport(whereClause, queryParams, reportQuery);
        break;
      case 'date':
        reportData = await this.generateDateAttendanceReport(whereClause, queryParams, reportQuery);
        break;
      case 'subject':
        reportData = await this.generateSubjectAttendanceReport(whereClause, queryParams, reportQuery);
        break;
      default:
        reportData = await this.generateStudentAttendanceReport(whereClause, queryParams, reportQuery);
    }

    // Calculate summary statistics
    summary = await this.calculateAttendanceSummary(whereClause, queryParams);

    // Filter by minimum attendance percentage if specified
    if (reportQuery.minAttendancePercentage && reportQuery.groupBy === 'student') {
      reportData = reportData.filter((item: any) => 
        item.attendancePercentage >= reportQuery.minAttendancePercentage!
      );
    }

    // Generate report metadata
    const reportMetadata = {
      reportId: `ATT_${Date.now()}`,
      reportType: 'attendance' as const,
      title: `Attendance Report - ${reportQuery.groupBy} wise`,
      description: `Attendance report from ${reportQuery.startDate} to ${reportQuery.endDate}`,
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      parameters: reportQuery,
      format: reportQuery.format || 'json' as ReportFormat,
    };

    const reportSummary = {
      totalRecords: reportData.length,
      dateRange: {
        startDate: reportQuery.startDate,
        endDate: reportQuery.endDate,
      },
      filters: {
        classId: reportQuery.classId,
        studentId: reportQuery.studentId,
        subjectId: reportQuery.subjectId,
        status: reportQuery.status,
        groupBy: reportQuery.groupBy,
      },
      aggregations: summary,
    };

    return {
      metadata: reportMetadata,
      summary: reportSummary,
      data: reportData,
    };
  }

  async getAttendanceTrends(filters: any, userId: string, userRole: string) {
    const { startDate, endDate, classId, studentId, period } = filters;

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    // Build authorization filters
    let whereClause = 'WHERE a.date BETWEEN $1 AND $2';
    const queryParams: any[] = [startDate, endDate];

    whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);

    if (classId) {
      whereClause += ` AND a.class_id = $${queryParams.length + 1}`;
      queryParams.push(classId);
    }

    if (studentId) {
      whereClause += ` AND a.student_id = $${queryParams.length + 1}`;
      queryParams.push(studentId);
    }

    // Get attendance trends based on period
    const periodGrouping = period === 'weekly' ? 
      "DATE_TRUNC('week', a.date)" : 
      period === 'monthly' ? 
      "DATE_TRUNC('month', a.date)" : 
      "a.date";

    const trendsResult = await this.executeQuery(
      `SELECT 
         ${periodGrouping} as period,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY ${periodGrouping}
       ORDER BY period`,
      queryParams
    );

    // Get low attendance alerts and day patterns
    const [lowAttendanceResult, dayPatternsResult] = await Promise.all([
      this.getLowAttendanceAlerts(whereClause, queryParams),
      this.getDayPatterns(whereClause, queryParams)
    ]);

    return {
      trends: trendsResult.rows.map((row: any) => ({
        period: row.period,
        totalRecords: parseInt(row.total_records),
        presentCount: parseInt(row.present_count),
        absentCount: parseInt(row.absent_count),
        lateCount: parseInt(row.late_count),
        excusedCount: parseInt(row.excused_count),
        attendancePercentage: parseFloat(row.attendance_percentage),
      })),
      lowAttendanceAlerts: lowAttendanceResult,
      dayPatterns: dayPatternsResult,
    };
  }

  async getAttendanceStatistics(period: string, userId: string, userRole: string) {
    // Calculate date range based on period
    const { startDate, endDate } = this.calculateDateRange(period);

    // Build authorization filters
    let whereClause = 'WHERE a.date BETWEEN $1 AND $2';
    const queryParams: any[] = [startDate, endDate];

    whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);

    // Get overall statistics, class statistics, and recent activities
    const [statsResult, classStatsResult, recentActivitiesResult] = await Promise.all([
      this.getOverallStats(whereClause, queryParams),
      this.getClassStats(whereClause, queryParams),
      this.getRecentActivities(whereClause, queryParams)
    ]);

    const stats = statsResult.rows[0];

    return {
      period: period,
      dateRange: { startDate, endDate },
      overview: {
        totalStudents: parseInt(stats.total_students),
        totalClasses: parseInt(stats.total_classes),
        totalRecords: parseInt(stats.total_records),
        presentCount: parseInt(stats.present_count),
        absentCount: parseInt(stats.absent_count),
        lateCount: parseInt(stats.late_count),
        excusedCount: parseInt(stats.excused_count),
        overallAttendancePercentage: parseFloat(stats.overall_attendance_percentage),
      },
      topPerformingClasses: classStatsResult.rows.map((row: any) => ({
        classId: row.class_id,
        className: row.class_name,
        grade: row.grade,
        section: row.section,
        attendancePercentage: parseFloat(row.attendance_percentage),
      })),
      recentActivities: recentActivitiesResult.rows.map((row: any) => ({
        date: row.date,
        status: row.status,
        studentNumber: row.student_number,
        studentName: `${row.first_name} ${row.last_name}`,
        className: row.class_name,
        markedAt: row.marked_at,
      })),
    };
  }

  async exportAttendanceData(format: string, reportQuery: any, userId: string, userRole: string) {
    if (!['csv', 'json', 'excel'].includes(format)) {
      throw new AppError('Invalid export format. Supported formats: csv, json, excel', 400);
    }

    const exportData = await this.generateSimpleAttendanceExport(reportQuery, userId, userRole);

    if (format === 'json') {
      return {
        data: exportData,
        exportInfo: {
          format: 'json',
          recordCount: exportData.length,
          generatedAt: new Date().toISOString(),
        },
      };
    } else {
      // Convert to CSV format
      const csvData = this.convertToCSV(exportData);
      return {
        csvData,
        filename: `attendance_report_${Date.now()}.${format === 'excel' ? 'xls' : 'csv'}`,
        mimeType: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
      };
    }
  }

  // Private helper methods
  private addAuthorizationFilters(whereClause: string, queryParams: any[], userId: string, userRole: string): string {
    // Always scope to current school
    if (this.schoolId) {
      whereClause += ` AND a.school_id = $${queryParams.length + 1}`;
      queryParams.push(this.schoolId);
    }
    if (userRole === 'teacher') {
      whereClause += ` AND (c.teacher_id = $${queryParams.length + 1} OR EXISTS (
        SELECT 1 FROM class_subjects cs 
        WHERE cs.class_id = c.id AND cs.teacher_id = $${queryParams.length + 1}
      ))`;
      queryParams.push(userId);
    } else if (userRole === 'student') {
      whereClause += ` AND s.user_id = $${queryParams.length + 1}`;
      queryParams.push(userId);
    } else if (userRole === 'parent') {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM student_parents sp 
        WHERE sp.student_id = s.id AND sp.parent_user_id = $${queryParams.length + 1}
      )`;
      queryParams.push(userId);
    }
    return whereClause;
  }

  private addOptionalFilters(whereClause: string, queryParams: any[], reportQuery: AttendanceReportQuery): string {
    if (reportQuery.classId) {
      whereClause += ` AND a.class_id = $${queryParams.length + 1}`;
      queryParams.push(reportQuery.classId);
    }

    if (reportQuery.studentId) {
      whereClause += ` AND a.student_id = $${queryParams.length + 1}`;
      queryParams.push(reportQuery.studentId);
    }

    if (reportQuery.subjectId) {
      whereClause += ` AND a.subject_id = $${queryParams.length + 1}`;
      queryParams.push(reportQuery.subjectId);
    }

    if (reportQuery.status) {
      whereClause += ` AND a.status = $${queryParams.length + 1}`;
      queryParams.push(reportQuery.status);
    }

    if (!reportQuery.includeInactive) {
      whereClause += ' AND s.is_active = true AND c.is_active = true';
    }

    return whereClause;
  }

  private async generateStudentAttendanceReport(whereClause: string, queryParams: any[], reportQuery: AttendanceReportQuery): Promise<any[]> {
    const result = await this.executeQuery(
      `SELECT 
         s.id as student_id,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         c.grade,
         c.section,
         COUNT(*) as total_days,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_days,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY s.id, s.student_id, u.first_name, u.last_name, c.name, c.grade, c.section
       ORDER BY u.first_name, u.last_name`,
      queryParams
    );

    return result.rows.map((row: any) => ({
      studentId: row.student_id,
      studentNumber: row.student_number,
      studentName: `${row.first_name} ${row.last_name}`,
      className: row.class_name,
      grade: row.grade,
      section: row.section,
      totalDays: parseInt(row.total_days),
      presentDays: parseInt(row.present_days),
      absentDays: parseInt(row.absent_days),
      lateDays: parseInt(row.late_days),
      excusedDays: parseInt(row.excused_days),
      attendancePercentage: parseFloat(row.attendance_percentage),
    }));
  }

  private async generateClassAttendanceReport(whereClause: string, queryParams: any[], reportQuery: AttendanceReportQuery): Promise<any[]> {
    const result = await this.executeQuery(
      `SELECT 
         c.id as class_id,
         c.name as class_name,
         c.grade,
         c.section,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY c.id, c.name, c.grade, c.section
       ORDER BY c.grade, c.section`,
      queryParams
    );

    return result.rows.map((row: any) => ({
      classId: row.class_id,
      className: row.class_name,
      grade: row.grade,
      section: row.section,
      totalStudents: parseInt(row.total_students),
      totalRecords: parseInt(row.total_records),
      presentCount: parseInt(row.present_count),
      absentCount: parseInt(row.absent_count),
      lateCount: parseInt(row.late_count),
      excusedCount: parseInt(row.excused_count),
      attendancePercentage: parseFloat(row.attendance_percentage),
    }));
  }

  private async generateDateAttendanceReport(whereClause: string, queryParams: any[], reportQuery: AttendanceReportQuery): Promise<any[]> {
    const result = await this.executeQuery(
      `SELECT 
         a.date,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY a.date
       ORDER BY a.date`,
      queryParams
    );

    return result.rows.map((row: any) => ({
      date: row.date,
      totalStudents: parseInt(row.total_students),
      totalRecords: parseInt(row.total_records),
      presentCount: parseInt(row.present_count),
      absentCount: parseInt(row.absent_count),
      lateCount: parseInt(row.late_count),
      excusedCount: parseInt(row.excused_count),
      attendancePercentage: parseFloat(row.attendance_percentage),
    }));
  }

  private async generateSubjectAttendanceReport(whereClause: string, queryParams: any[], reportQuery: AttendanceReportQuery): Promise<any[]> {
    const result = await this.executeQuery(
      `SELECT 
         COALESCE(subj.id, 'general') as subject_id,
         COALESCE(subj.name, 'General Class') as subject_name,
         COALESCE(subj.code, 'GEN') as subject_code,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects subj ON a.subject_id = subj.id
       ${whereClause}
       GROUP BY subj.id, subj.name, subj.code
       ORDER BY subj.name NULLS FIRST`,
      queryParams
    );

    return result.rows.map((row: any) => ({
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      subjectCode: row.subject_code,
      totalStudents: parseInt(row.total_students),
      totalRecords: parseInt(row.total_records),
      presentCount: parseInt(row.present_count),
      absentCount: parseInt(row.absent_count),
      lateCount: parseInt(row.late_count),
      excusedCount: parseInt(row.excused_count),
      attendancePercentage: parseFloat(row.attendance_percentage),
    }));
  }

  private async calculateAttendanceSummary(whereClause: string, queryParams: any[]): Promise<any> {
    const result = await this.executeQuery(
      `SELECT 
         COUNT(DISTINCT s.id) as total_students,
         COUNT(DISTINCT c.id) as total_classes,
         COUNT(DISTINCT a.date) as total_days,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as total_late,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as total_excused,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as overall_attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}`,
      queryParams
    );

    const summary = result.rows[0];
    return {
      totalStudents: parseInt(summary.total_students),
      totalClasses: parseInt(summary.total_classes),
      totalDays: parseInt(summary.total_days),
      totalRecords: parseInt(summary.total_records),
      totalPresent: parseInt(summary.total_present),
      totalAbsent: parseInt(summary.total_absent),
      totalLate: parseInt(summary.total_late),
      totalExcused: parseInt(summary.total_excused),
      overallAttendancePercentage: parseFloat(summary.overall_attendance_percentage),
    };
  }

  private calculateDateRange(period: string): { startDate: string; endDate: string } {
    const today = new Date();
    let startDate: string;
    let endDate: string;

    switch (period) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'semester':
        startDate = new Date(today.getFullYear(), today.getMonth() < 6 ? 0 : 6, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        startDate = endDate = today.toISOString().split('T')[0];
    }

    return { startDate, endDate };
  }

  private async getLowAttendanceAlerts(whereClause: string, queryParams: any[]) {
    const result = await this.executeQuery(
      `SELECT 
         s.id as student_id,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY s.id, s.student_id, u.first_name, u.last_name, c.name
       HAVING ROUND(
         (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
         2
       ) < 75
       ORDER BY attendance_percentage ASC`,
      queryParams
    );

    return result.rows.map((row: any) => ({
      studentId: row.student_id,
      studentNumber: row.student_number,
      studentName: `${row.first_name} ${row.last_name}`,
      className: row.class_name,
      attendancePercentage: parseFloat(row.attendance_percentage),
    }));
  }

  private async getDayPatterns(whereClause: string, queryParams: any[]) {
    const result = await this.executeQuery(
      `SELECT 
         EXTRACT(DOW FROM a.date) as day_of_week,
         CASE EXTRACT(DOW FROM a.date)
           WHEN 0 THEN 'Sunday'
           WHEN 1 THEN 'Monday'
           WHEN 2 THEN 'Tuesday'
           WHEN 3 THEN 'Wednesday'
           WHEN 4 THEN 'Thursday'
           WHEN 5 THEN 'Friday'
           WHEN 6 THEN 'Saturday'
         END as day_name,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY EXTRACT(DOW FROM a.date)
       ORDER BY day_of_week`,
      queryParams
    );

    return result.rows.map((row: any) => ({
      dayOfWeek: parseInt(row.day_of_week),
      dayName: row.day_name,
      totalRecords: parseInt(row.total_records),
      presentCount: parseInt(row.present_count),
      attendancePercentage: parseFloat(row.attendance_percentage),
    }));
  }

  private async getOverallStats(whereClause: string, queryParams: any[]) {
    return await this.executeQuery(
      `SELECT 
         COUNT(DISTINCT s.id) as total_students,
         COUNT(DISTINCT c.id) as total_classes,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as overall_attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}`,
      queryParams
    );
  }

  private async getClassStats(whereClause: string, queryParams: any[]) {
    return await this.executeQuery(
      `SELECT 
         c.id as class_id,
         c.name as class_name,
         c.grade,
         c.section,
         COUNT(*) as total_records,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY c.id, c.name, c.grade, c.section
       ORDER BY attendance_percentage DESC
       LIMIT 5`,
      queryParams
    );
  }

  private async getRecentActivities(whereClause: string, queryParams: any[]) {
    return await this.executeQuery(
      `SELECT 
         a.date,
         a.status,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         a.created_at as marked_at
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT 10`,
      queryParams
    );
  }

  private async generateSimpleAttendanceExport(reportQuery: any, userId: string, userRole: string): Promise<any[]> {
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (reportQuery.startDate && reportQuery.endDate) {
      whereClause += ` AND a.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
      queryParams.push(reportQuery.startDate, reportQuery.endDate);
    }

    whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);

    const result = await this.executeQuery(
      `SELECT 
         a.date,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         c.grade,
         c.section,
         COALESCE(subj.name, 'General') as subject_name,
         a.status,
         a.remarks,
         a.created_at as marked_at
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects subj ON a.subject_id = subj.id
       ${whereClause}
       ORDER BY a.date DESC, u.first_name, u.last_name`,
      queryParams
    );

    return result.rows.map((row: any) => ({
      date: row.date,
      studentNumber: row.student_number,
      studentName: `${row.first_name} ${row.last_name}`,
      className: row.class_name,
      grade: row.grade,
      section: row.section,
      subjectName: row.subject_name,
      status: row.status,
      remarks: row.remarks,
      markedAt: row.marked_at,
    }));
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }
}