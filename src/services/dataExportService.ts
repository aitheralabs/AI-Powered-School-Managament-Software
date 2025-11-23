import { BaseService } from './baseService';
import { 
  UserDataExport, 
  ExportResult, 
  UserProfile, 
  RoleSpecificData,
  ExportMetadata,
  AuditLog
} from '../types/settings';
import { AppError } from '../middleware/errorHandler';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class DataExportService extends BaseService {
  private readonly exportDir = 'uploads/exports';

  /**
   * Export all user data
   */
  async exportUserData(userId: string): Promise<ExportResult> {
    try {
      // Collect all user data
      const userData = await this.collectUserData(userId);

      // Ensure export directory exists
      await this.ensureExportDirectory(userId);

      // Generate unique identifier for this export
      const exportId = uuidv4();
      const timestamp = Date.now();
      const userExportDir = path.join(this.exportDir, userId, timestamp.toString());

      // Create user-specific export directory
      await fs.mkdir(userExportDir, { recursive: true });

      // Generate JSON export
      const jsonPath = await this.generateJSONExport(userData, userExportDir, exportId);
      const jsonStats = await fs.stat(jsonPath);

      // Generate PDF export
      const pdfPath = await this.generatePDFExport(userData, userExportDir, exportId);
      const pdfStats = await fs.stat(pdfPath);

      // Schedule cleanup after 24 hours
      await this.scheduleFileCleanup(userExportDir, 24);

      // Return export result with URLs
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      return {
        jsonUrl: `/uploads/exports/${userId}/${timestamp}/${path.basename(jsonPath)}`,
        pdfUrl: `/uploads/exports/${userId}/${timestamp}/${path.basename(pdfPath)}`,
        expiresAt,
        fileSize: {
          json: jsonStats.size,
          pdf: pdfStats.size
        }
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new AppError('Failed to export user data', 500);
    }
  }

  /**
   * Collect all user data from database
   */
  async collectUserData(userId: string): Promise<UserDataExport> {
    try {
      // Collect profile data
      const profile = await this.collectProfileData(userId);

      // Collect settings data
      const settings = await this.collectSettingsData(userId);

      // Collect role-specific data
      const roleSpecificData = await this.collectRoleSpecificData(userId, profile.role);

      // Collect audit logs
      const auditLogs = await this.collectAuditLogs(userId);

      // Create metadata
      const exportMetadata: ExportMetadata = {
        exportDate: new Date(),
        exportedBy: userId,
        dataVersion: '1.0',
        recordCount: this.calculateRecordCount(profile, settings, roleSpecificData, auditLogs)
      };

      return {
        profile,
        settings,
        roleSpecificData,
        auditLogs,
        exportMetadata
      };
    } catch (error) {
      console.error('Error collecting user data:', error);
      throw new AppError('Failed to collect user data', 500);
    }
  }

  /**
   * Collect user profile data
   */
  private async collectProfileData(userId: string): Promise<UserProfile> {
    const result = await this.executeQuery(
      `SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      address: user.address,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  /**
   * Collect user settings data
   */
  private async collectSettingsData(userId: string): Promise<any> {
    const result = await this.executeQuery(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const settings = result.rows[0];
    return {
      userId: settings.user_id,
      emailNotifications: settings.email_notifications,
      pushNotifications: settings.push_notifications,
      smsNotifications: settings.sms_notifications,
      darkMode: settings.dark_mode,
      compactView: settings.compact_view,
      profileVisibility: settings.profile_visibility,
      activityStatus: settings.activity_status,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    };
  }

  /**
   * Collect role-specific data
   */
  private async collectRoleSpecificData(userId: string, role: string): Promise<RoleSpecificData> {
    const roleSpecificData: RoleSpecificData = {};

    switch (role.toLowerCase()) {
      case 'teacher':
        roleSpecificData.teacher = await this.collectTeacherData(userId);
        break;
      case 'student':
        roleSpecificData.student = await this.collectStudentData(userId);
        break;
      case 'parent':
        roleSpecificData.parent = await this.collectParentData(userId);
        break;
      case 'staff':
        roleSpecificData.staff = await this.collectStaffData(userId);
        break;
    }

    return roleSpecificData;
  }

  /**
   * Collect teacher-specific data
   */
  private async collectTeacherData(userId: string): Promise<any> {
    // Get teacher record
    const teacherResult = await this.executeQuery(
      'SELECT * FROM teachers WHERE user_id = $1',
      [userId]
    );

    if (teacherResult.rows.length === 0) {
      return { classes: [], subjects: [], assignments: [] };
    }

    const teacherId = teacherResult.rows[0].id;

    // Get classes
    const classesResult = await this.executeQuery(
      `SELECT c.id, c.name, ay.year as academic_year, s.name as semester
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN semesters s ON c.semester_id = s.id
       WHERE c.teacher_id = $1`,
      [teacherId]
    );

    // Get subjects
    const subjectsResult = await this.executeQuery(
      `SELECT DISTINCT s.id, s.name, s.code
       FROM subjects s
       INNER JOIN classes c ON s.id = c.subject_id
       WHERE c.teacher_id = $1`,
      [teacherId]
    );

    // Get assignments
    const assignmentsResult = await this.executeQuery(
      `SELECT a.id, a.title, a.due_date, a.class_id
       FROM assignments a
       INNER JOIN classes c ON a.class_id = c.id
       WHERE c.teacher_id = $1
       ORDER BY a.due_date DESC
       LIMIT 100`,
      [teacherId]
    );

    return {
      classes: classesResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        academicYear: row.academic_year,
        semester: row.semester
      })),
      subjects: subjectsResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code
      })),
      assignments: assignmentsResult.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        dueDate: row.due_date,
        classId: row.class_id
      }))
    };
  }

  /**
   * Collect student-specific data
   */
  private async collectStudentData(userId: string): Promise<any> {
    // Get student record
    const studentResult = await this.executeQuery(
      'SELECT * FROM students WHERE user_id = $1',
      [userId]
    );

    if (studentResult.rows.length === 0) {
      return { enrollments: [], grades: [], attendance: [], fees: [] };
    }

    const studentId = studentResult.rows[0].id;

    // Get enrollments
    const enrollmentsResult = await this.executeQuery(
      `SELECT e.id, c.name as class_name, ay.year as academic_year, e.enrollment_date
       FROM enrollments e
       INNER JOIN classes c ON e.class_id = c.id
       INNER JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE e.student_id = $1`,
      [studentId]
    );

    // Get grades
    const gradesResult = await this.executeQuery(
      `SELECT g.id, s.name as subject, g.grade, sem.name as semester, ay.year as academic_year
       FROM grades g
       INNER JOIN subjects s ON g.subject_id = s.id
       LEFT JOIN semesters sem ON g.semester_id = sem.id
       LEFT JOIN academic_years ay ON g.academic_year_id = ay.id
       WHERE g.student_id = $1
       ORDER BY g.created_at DESC`,
      [studentId]
    );

    // Get attendance
    const attendanceResult = await this.executeQuery(
      `SELECT a.date, a.status, c.name as class_name
       FROM attendance a
       INNER JOIN classes c ON a.class_id = c.id
       WHERE a.student_id = $1
       ORDER BY a.date DESC
       LIMIT 100`,
      [studentId]
    );

    // Get fees
    const feesResult = await this.executeQuery(
      `SELECT f.id, f.amount, f.due_date, f.status, f.description
       FROM fees f
       WHERE f.student_id = $1
       ORDER BY f.due_date DESC`,
      [studentId]
    );

    return {
      enrollments: enrollmentsResult.rows.map((row: any) => ({
        id: row.id,
        className: row.class_name,
        academicYear: row.academic_year,
        enrollmentDate: row.enrollment_date
      })),
      grades: gradesResult.rows.map((row: any) => ({
        id: row.id,
        subject: row.subject,
        grade: row.grade,
        semester: row.semester,
        academicYear: row.academic_year
      })),
      attendance: attendanceResult.rows.map((row: any) => ({
        date: row.date,
        status: row.status,
        className: row.class_name
      })),
      fees: feesResult.rows.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        dueDate: row.due_date,
        status: row.status,
        description: row.description
      }))
    };
  }

  /**
   * Collect parent-specific data
   */
  private async collectParentData(userId: string): Promise<any> {
    // Get parent record
    const parentResult = await this.executeQuery(
      'SELECT * FROM parents WHERE user_id = $1',
      [userId]
    );

    if (parentResult.rows.length === 0) {
      return { children: [], communications: [] };
    }

    const parentId = parentResult.rows[0].id;

    // Get children
    const childrenResult = await this.executeQuery(
      `SELECT u.id, u.first_name, u.last_name, c.name as class_name
       FROM students s
       INNER JOIN users u ON s.user_id = u.id
       LEFT JOIN enrollments e ON s.id = e.student_id
       LEFT JOIN classes c ON e.class_id = c.id
       WHERE s.parent_id = $1`,
      [parentId]
    );

    // Get communications (if there's a communications table)
    const communicationsResult = await this.executeQuery(
      `SELECT id, created_at as date, subject, type
       FROM communications
       WHERE parent_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [parentId]
    ).catch(() => ({ rows: [] })); // Handle if table doesn't exist

    return {
      children: childrenResult.rows.map((row: any) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        className: row.class_name
      })),
      communications: communicationsResult.rows.map((row: any) => ({
        id: row.id,
        date: row.date,
        subject: row.subject,
        type: row.type
      }))
    };
  }

  /**
   * Collect staff-specific data
   */
  private async collectStaffData(userId: string): Promise<any> {
    const staffResult = await this.executeQuery(
      'SELECT * FROM staff WHERE user_id = $1',
      [userId]
    );

    if (staffResult.rows.length === 0) {
      return {};
    }

    const staff = staffResult.rows[0];
    return {
      department: staff.department,
      position: staff.position,
      responsibilities: staff.responsibilities ? JSON.parse(staff.responsibilities) : []
    };
  }

  /**
   * Collect audit logs for user
   */
  private async collectAuditLogs(userId: string): Promise<AuditLog[]> {
    const result = await this.executeQuery(
      `SELECT id, action, timestamp, details
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`,
      [userId]
    ).catch(() => ({ rows: [] })); // Handle if table doesn't exist

    return result.rows.map((row: any) => ({
      id: row.id,
      action: row.action,
      timestamp: row.timestamp,
      details: row.details
    }));
  }

  /**
   * Generate JSON export file
   */
  async generateJSONExport(userData: UserDataExport, exportDir: string, exportId: string): Promise<string> {
    const filename = `user-data-${exportId}.json`;
    const filePath = path.join(exportDir, filename);

    const jsonContent = JSON.stringify(userData, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');

    return filePath;
  }

  /**
   * Generate PDF export file
   */
  async generatePDFExport(userData: UserDataExport, exportDir: string, exportId: string): Promise<string> {
    const filename = `user-data-${exportId}.pdf`;
    const filePath = path.join(exportDir, filename);

    // For now, create a simple text-based PDF
    // In production, use a proper PDF library like pdfkit or puppeteer
    const pdfContent = this.generatePDFContent(userData);
    await fs.writeFile(filePath, pdfContent, 'utf-8');

    return filePath;
  }

  /**
   * Generate PDF content (simplified version)
   */
  private generatePDFContent(userData: UserDataExport): string {
    let content = '=== USER DATA EXPORT ===\n\n';
    
    content += '--- PROFILE ---\n';
    content += `Name: ${userData.profile.firstName} ${userData.profile.lastName}\n`;
    content += `Email: ${userData.profile.email}\n`;
    content += `Role: ${userData.profile.role}\n`;
    content += `Phone: ${userData.profile.phone || 'N/A'}\n\n`;

    content += '--- SETTINGS ---\n';
    if (userData.settings) {
      content += `Email Notifications: ${userData.settings.emailNotifications}\n`;
      content += `Dark Mode: ${userData.settings.darkMode}\n`;
      content += `Profile Visibility: ${userData.settings.profileVisibility}\n\n`;
    }

    content += '--- EXPORT METADATA ---\n';
    content += `Export Date: ${userData.exportMetadata.exportDate}\n`;
    content += `Data Version: ${userData.exportMetadata.dataVersion}\n`;
    content += `Total Records: ${userData.exportMetadata.recordCount}\n`;

    return content;
  }

  /**
   * Ensure export directory exists
   */
  private async ensureExportDirectory(userId: string): Promise<void> {
    const userDir = path.join(this.exportDir, userId);
    await fs.mkdir(userDir, { recursive: true });
  }

  /**
   * Schedule file cleanup after specified hours
   */
  async scheduleFileCleanup(filePath: string, delayHours: number): Promise<void> {
    // In production, use a proper job queue like Bull or BullMQ
    // For now, use setTimeout (note: this won't persist across server restarts)
    const delayMs = delayHours * 60 * 60 * 1000;
    
    setTimeout(async () => {
      try {
        await fs.rm(filePath, { recursive: true, force: true });
        console.log(`Cleaned up export files at: ${filePath}`);
      } catch (error) {
        console.error(`Failed to cleanup export files at ${filePath}:`, error);
      }
    }, delayMs);
  }

  /**
   * Calculate total record count
   */
  private calculateRecordCount(profile: any, settings: any, roleData: RoleSpecificData, auditLogs: AuditLog[]): number {
    let count = 1; // Profile
    if (settings) count += 1;
    count += auditLogs.length;

    if (roleData.teacher) {
      count += roleData.teacher.classes.length;
      count += roleData.teacher.subjects.length;
      count += roleData.teacher.assignments.length;
    }

    if (roleData.student) {
      count += roleData.student.enrollments.length;
      count += roleData.student.grades.length;
      count += roleData.student.attendance.length;
      count += roleData.student.fees.length;
    }

    if (roleData.parent) {
      count += roleData.parent.children.length;
      count += roleData.parent.communications.length;
    }

    return count;
  }
}

export const dataExportService = new DataExportService();
