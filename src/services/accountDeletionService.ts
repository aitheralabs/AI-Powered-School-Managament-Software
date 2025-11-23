import { BaseService } from './baseService';
import { DeletionResult } from '../types/settings';
import { AppError } from '../middleware/errorHandler';
import { comparePassword } from '../utils/auth';
import cacheService, { CacheKeys } from './cacheService';

export class AccountDeletionService extends BaseService {
  /**
   * Delete user account and all associated data
   */
  async deleteUserAccount(userId: string, password: string): Promise<DeletionResult> {
    try {
      // Verify password
      const isValidPassword = await this.verifyPassword(userId, password);
      if (!isValidPassword) {
        throw new AppError('Invalid password', 401);
      }

      // Get user info before deletion
      const userResult = await this.executeQuery(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const userRole = userResult.rows[0].role;

      // Start transaction
      await this.executeQuery('BEGIN');

      try {
        // Handle data dependencies based on role
        const roleRecordsAffected = await this.handleDataDependencies(userId, userRole);

        // Invalidate all user sessions
        const sessionsAffected = await this.invalidateUserSessions(userId);

        // Soft delete the user account
        await this.executeQuery(
          'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [userId]
        );

        // Commit transaction
        await this.executeQuery('COMMIT');

        return {
          success: true,
          deletedAt: new Date(),
          recordsAffected: {
            user: 1,
            roleSpecific: roleRecordsAffected,
            sessions: sessionsAffected
          }
        };
      } catch (error) {
        // Rollback on error
        await this.executeQuery('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error deleting user account:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete user account', 500);
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const result = await this.executeQuery(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const passwordHash = result.rows[0].password_hash;
      return await comparePassword(password, passwordHash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Handle data dependencies based on user role
   */
  async handleDataDependencies(userId: string, role: string): Promise<number> {
    let recordsAffected = 0;

    switch (role.toLowerCase()) {
      case 'teacher':
        recordsAffected = await this.deleteTeacherData(userId);
        break;
      case 'student':
        recordsAffected = await this.deleteStudentData(userId);
        break;
      case 'parent':
        recordsAffected = await this.deleteParentData(userId);
        break;
      case 'staff':
        recordsAffected = await this.deleteStaffData(userId);
        break;
    }

    // Delete user settings
    const settingsResult = await this.executeQuery(
      'DELETE FROM user_settings WHERE user_id = $1',
      [userId]
    );
    recordsAffected += settingsResult.rowCount || 0;

    return recordsAffected;
  }

  /**
   * Delete teacher-specific data
   */
  private async deleteTeacherData(userId: string): Promise<number> {
    let recordsAffected = 0;

    // Get teacher ID
    const teacherResult = await this.executeQuery(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );

    if (teacherResult.rows.length === 0) {
      return 0;
    }

    const teacherId = teacherResult.rows[0].id;

    // Reassign or archive classes (set teacher_id to null)
    const classesResult = await this.executeQuery(
      'UPDATE classes SET teacher_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE teacher_id = $1',
      [teacherId]
    );
    recordsAffected += classesResult.rowCount || 0;

    // Delete teacher record
    const deleteTeacherResult = await this.executeQuery(
      'DELETE FROM teachers WHERE id = $1',
      [teacherId]
    );
    recordsAffected += deleteTeacherResult.rowCount || 0;

    return recordsAffected;
  }

  /**
   * Delete student-specific data
   */
  private async deleteStudentData(userId: string): Promise<number> {
    let recordsAffected = 0;

    // Get student ID
    const studentResult = await this.executeQuery(
      'SELECT id FROM students WHERE user_id = $1',
      [userId]
    );

    if (studentResult.rows.length === 0) {
      return 0;
    }

    const studentId = studentResult.rows[0].id;

    // Anonymize student record but preserve academic data
    const anonymizeResult = await this.executeQuery(
      `UPDATE students 
       SET user_id = NULL, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [studentId]
    );
    recordsAffected += anonymizeResult.rowCount || 0;

    // Note: We preserve grades, attendance, and enrollments for academic records
    // but they're now anonymized since user_id is set to NULL

    return recordsAffected;
  }

  /**
   * Delete parent-specific data
   */
  private async deleteParentData(userId: string): Promise<number> {
    let recordsAffected = 0;

    // Get parent ID
    const parentResult = await this.executeQuery(
      'SELECT id FROM parents WHERE user_id = $1',
      [userId]
    );

    if (parentResult.rows.length === 0) {
      return 0;
    }

    const parentId = parentResult.rows[0].id;

    // Remove parent-student relationships (set parent_id to null in students table)
    const studentsResult = await this.executeQuery(
      'UPDATE students SET parent_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE parent_id = $1',
      [parentId]
    );
    recordsAffected += studentsResult.rowCount || 0;

    // Delete communications
    const commsResult = await this.executeQuery(
      'DELETE FROM communications WHERE parent_id = $1',
      [parentId]
    ).catch(() => ({ rowCount: 0 })); // Handle if table doesn't exist
    recordsAffected += commsResult.rowCount || 0;

    // Delete parent record
    const deleteParentResult = await this.executeQuery(
      'DELETE FROM parents WHERE id = $1',
      [parentId]
    );
    recordsAffected += deleteParentResult.rowCount || 0;

    return recordsAffected;
  }

  /**
   * Delete staff-specific data
   */
  private async deleteStaffData(userId: string): Promise<number> {
    let recordsAffected = 0;

    // Delete staff record
    const deleteStaffResult = await this.executeQuery(
      'DELETE FROM staff WHERE user_id = $1',
      [userId]
    );
    recordsAffected += deleteStaffResult.rowCount || 0;

    return recordsAffected;
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateUserSessions(userId: string): Promise<number> {
    try {
      // Clear all cache entries for this user
      const pattern = `${CacheKeys.USER_SESSION}*${userId}*`;
      await cacheService.delPattern(pattern);

      // If using a sessions table, delete from there too
      const sessionsResult = await this.executeQuery(
        'DELETE FROM sessions WHERE user_id = $1',
        [userId]
      ).catch(() => ({ rowCount: 0 })); // Handle if table doesn't exist

      return sessionsResult.rowCount || 0;
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
      return 0;
    }
  }

  /**
   * Anonymize records (helper method)
   */
  private async anonymizeRecords(userId: string): Promise<void> {
    // This method can be used to anonymize specific records
    // while preserving data for analytics or compliance
    
    // Example: Anonymize audit logs
    await this.executeQuery(
      `UPDATE audit_logs 
       SET details = jsonb_set(details, '{user_email}', '"[DELETED]"')
       WHERE user_id = $1`,
      [userId]
    ).catch(() => {}); // Handle if table doesn't exist
  }
}

export const accountDeletionService = new AccountDeletionService();
