import { query, getClient } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import {
  CreateStaff,
  UpdateStaff,
  StaffQuery,
  StaffResponse,
  StaffSummary,
} from '../types/staff';
import { BaseService } from './baseService';
import bcrypt from 'bcrypt';
import { SchoolService } from './schoolService';

const schoolService = new SchoolService();

export class StaffService extends BaseService {

  async createStaff(staffData: CreateStaff, adminUserId: string): Promise<StaffResponse> {
    const schoolId = this.requireSchool();

    await schoolService.checkLimit(schoolId, 'staff');

    const client = await getClient();

    try {
      await client.query('BEGIN');

      const emailCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 AND school_id = $2',
        [staffData.email, schoolId]
      );
      if (emailCheck.rows.length > 0) throw new AppError('Email already exists', 409);

      const employeeIdCheck = await client.query(
        'SELECT id FROM staff WHERE employee_id = $1 AND school_id = $2',
        [staffData.employeeId, schoolId]
      );
      if (employeeIdCheck.rows.length > 0) throw new AppError('Employee ID already exists', 409);

      const staffPassword = staffData.password || `Staff@${staffData.employeeId || Date.now()}`;
      const hashedPassword = await bcrypt.hash(staffPassword, 10);

      const userResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, is_active, school_id)
         VALUES ($1, $2, $3, $4, 'staff', $5, $6, $7, true, $8)
         RETURNING *`,
        [staffData.firstName, staffData.lastName, staffData.email, hashedPassword, staffData.phone || null, staffData.dateOfBirth || null, staffData.address || null, schoolId]
      );

      const user = userResult.rows[0];

      const staffResult = await client.query(
        `INSERT INTO staff (user_id, employee_id, department, position, joining_date, salary, responsibilities, is_active, school_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
         RETURNING *`,
        [user.id, staffData.employeeId, staffData.department, staffData.position, staffData.joiningDate, staffData.salary || null, staffData.responsibilities || null, schoolId]
      );

      await client.query('COMMIT');

      const completeStaff = await this.getStaffWithUser(staffResult.rows[0].id, schoolId);
      if (!completeStaff) throw new AppError('Failed to retrieve created staff member', 500);
      return completeStaff;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStaff(queryParams: StaffQuery, userRole: string, userId?: string): Promise<{ staff: StaffResponse[]; total: number }> {
    const schoolId = this.requireSchool();

    let whereClause = 'WHERE s.school_id = $1 AND s.is_active = true';
    const sqlParams: any[] = [schoolId];

    if (userRole === 'staff' && userId) {
      whereClause += ` AND u.id = $${sqlParams.length + 1}`;
      sqlParams.push(userId);
    }

    if (queryParams.department) { whereClause += ` AND s.department = $${sqlParams.length + 1}`; sqlParams.push(queryParams.department); }
    if (queryParams.position) { whereClause += ` AND s.position = $${sqlParams.length + 1}`; sqlParams.push(queryParams.position); }

    if (queryParams.isActive !== undefined) {
      whereClause = whereClause.replace('s.is_active = true', `s.is_active = $${sqlParams.length + 1}`);
      sqlParams.push(queryParams.isActive);
    }

    if (queryParams.joiningDateFrom) { whereClause += ` AND s.joining_date >= $${sqlParams.length + 1}`; sqlParams.push(queryParams.joiningDateFrom); }
    if (queryParams.joiningDateTo) { whereClause += ` AND s.joining_date <= $${sqlParams.length + 1}`; sqlParams.push(queryParams.joiningDateTo); }

    if (queryParams.search) {
      whereClause += ` AND (u.first_name ILIKE $${sqlParams.length + 1} OR u.last_name ILIKE $${sqlParams.length + 1} OR u.email ILIKE $${sqlParams.length + 1} OR s.employee_id ILIKE $${sqlParams.length + 1})`;
      sqlParams.push(`%${queryParams.search}%`);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM staff s JOIN users u ON s.user_id = u.id ${whereClause}`,
      sqlParams
    );
    const total = parseInt(countResult.rows[0].total);

    const offset = (queryParams.page - 1) * queryParams.limit;
    const sortColumn = this.getSortColumn(queryParams.sortBy);

    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
       FROM staff s JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY ${sortColumn} ${queryParams.sortOrder}
       LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`,
      [...sqlParams, queryParams.limit, offset]
    );

    return { staff: result.rows.map(this.formatStaffResponse), total };
  }

  async getStaffById(staffId: string, userRole: string, userId?: string): Promise<StaffResponse> {
    const schoolId = this.requireSchool();
    const staff = await this.getStaffWithUser(staffId, schoolId);
    if (!staff) throw new AppError('Staff member not found', 404);

    if (userRole === 'staff' && staff.userId !== userId) {
      throw new AppError('You can only view your own profile', 403);
    }
    return staff;
  }

  async updateStaff(staffId: string, updateData: UpdateStaff, userRole: string, userId?: string): Promise<StaffResponse> {
    const schoolId = this.requireSchool();

    const existingStaff = await query(
      'SELECT s.*, u.id as user_db_id FROM staff s JOIN users u ON s.user_id = u.id WHERE s.id = $1 AND s.school_id = $2',
      [staffId, schoolId]
    );
    if (existingStaff.rows.length === 0) throw new AppError('Staff member not found', 404);

    const staff = existingStaff.rows[0];
    if (userRole === 'staff' && staff.user_id !== userId) {
      throw new AppError('You can only update your own profile', 403);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const userUpdateFields: string[] = [];
      const userUpdateValues: any[] = [];
      let userParamIndex = 1;

      if (updateData.firstName !== undefined) { userUpdateFields.push(`first_name = $${userParamIndex++}`); userUpdateValues.push(updateData.firstName); }
      if (updateData.lastName !== undefined) { userUpdateFields.push(`last_name = $${userParamIndex++}`); userUpdateValues.push(updateData.lastName); }
      if (updateData.phone !== undefined) { userUpdateFields.push(`phone = $${userParamIndex++}`); userUpdateValues.push(updateData.phone); }
      if (updateData.dateOfBirth !== undefined) { userUpdateFields.push(`date_of_birth = $${userParamIndex++}`); userUpdateValues.push(updateData.dateOfBirth); }
      if (updateData.address !== undefined) { userUpdateFields.push(`address = $${userParamIndex++}`); userUpdateValues.push(updateData.address); }

      if (userUpdateFields.length > 0) {
        userUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        userUpdateValues.push(staff.user_db_id);
        await client.query(`UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = $${userParamIndex}`, userUpdateValues);
      }

      const staffUpdateFields: string[] = [];
      const staffUpdateValues: any[] = [];
      let staffParamIndex = 1;

      if (updateData.department !== undefined) { staffUpdateFields.push(`department = $${staffParamIndex++}`); staffUpdateValues.push(updateData.department); }
      if (updateData.position !== undefined) { staffUpdateFields.push(`position = $${staffParamIndex++}`); staffUpdateValues.push(updateData.position); }
      if (updateData.salary !== undefined) { staffUpdateFields.push(`salary = $${staffParamIndex++}`); staffUpdateValues.push(updateData.salary); }
      if (updateData.responsibilities !== undefined) { staffUpdateFields.push(`responsibilities = $${staffParamIndex++}`); staffUpdateValues.push(updateData.responsibilities); }

      if (staffUpdateFields.length > 0) {
        staffUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        staffUpdateValues.push(staffId);
        staffUpdateValues.push(schoolId);
        await client.query(`UPDATE staff SET ${staffUpdateFields.join(', ')} WHERE id = $${staffParamIndex} AND school_id = $${staffParamIndex + 1}`, staffUpdateValues);
      }

      await client.query('COMMIT');

      const updatedStaff = await this.getStaffWithUser(staffId, schoolId);
      if (!updatedStaff) throw new AppError('Failed to retrieve updated staff member', 500);
      return updatedStaff;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deactivateStaff(staffId: string): Promise<void> {
    const schoolId = this.requireSchool();
    const existingStaff = await query('SELECT * FROM staff WHERE id = $1 AND school_id = $2', [staffId, schoolId]);
    if (existingStaff.rows.length === 0) throw new AppError('Staff member not found', 404);

    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE staff SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [staffId]);
      await client.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [existingStaff.rows[0].user_id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reactivateStaff(staffId: string): Promise<StaffResponse> {
    const schoolId = this.requireSchool();
    const existingStaff = await query('SELECT * FROM staff WHERE id = $1 AND school_id = $2 AND is_active = false', [staffId, schoolId]);
    if (existingStaff.rows.length === 0) throw new AppError('Staff member not found or already active', 404);

    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE staff SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [staffId]);
      await client.query('UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [existingStaff.rows[0].user_id]);
      await client.query('COMMIT');

      const updatedStaff = await this.getStaffWithUser(staffId, schoolId);
      if (!updatedStaff) throw new AppError('Failed to retrieve reactivated staff member', 500);
      return updatedStaff;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStaffSummary(): Promise<StaffSummary> {
    const schoolId = this.requireSchool();

    const overallStats = await query(
      `SELECT COUNT(*) as total_staff,
              COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
              COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_staff
       FROM staff WHERE school_id = $1`,
      [schoolId]
    );

    const departmentStats = await query(
      `SELECT department,
              COUNT(*) as total_staff,
              COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff
       FROM staff WHERE school_id = $1
       GROUP BY department ORDER BY department`,
      [schoolId]
    );

    const recentJoinings = await query(
      `SELECT s.id, u.first_name || ' ' || u.last_name as name, s.department, s.position, s.joining_date
       FROM staff s JOIN users u ON s.user_id = u.id
       WHERE s.school_id = $1 AND s.joining_date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY s.joining_date DESC LIMIT 10`,
      [schoolId]
    );

    const stats = overallStats.rows[0];
    return {
      totalStaff: parseInt(stats.total_staff),
      activeStaff: parseInt(stats.active_staff),
      inactiveStaff: parseInt(stats.inactive_staff),
      departmentBreakdown: departmentStats.rows.map((row: any) => ({
        department: row.department,
        totalStaff: parseInt(row.total_staff),
        activeStaff: parseInt(row.active_staff),
        positions: [],
      })),
      recentJoinings: recentJoinings.rows.map((row: any) => ({
        staffId: row.id.toString(), name: row.name, department: row.department,
        position: row.position, joiningDate: row.joining_date,
      })),
    };
  }

  private async getStaffWithUser(staffId: string, schoolId: string): Promise<StaffResponse | null> {
    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
       FROM staff s JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 AND s.school_id = $2`,
      [staffId, schoolId]
    );
    if (result.rows.length === 0) return null;
    return this.formatStaffResponse(result.rows[0]);
  }

  private formatStaffResponse(row: any): StaffResponse {
    return {
      id: row.id.toString(), altId: null, userId: row.user_id.toString(),
      employeeId: row.employee_id, department: row.department, position: row.position,
      joiningDate: row.joining_date, salary: row.salary ? parseFloat(row.salary) : null,
      responsibilities: row.responsibilities, isActive: row.is_active,
      createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
      user: {
        firstName: row.first_name, lastName: row.last_name, email: row.email,
        phone: row.phone, dateOfBirth: row.date_of_birth, address: row.address,
      },
    };
  }

  private getSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      firstName: 'u.first_name', lastName: 'u.last_name', employeeId: 's.employee_id',
      department: 's.department', position: 's.position', joiningDate: 's.joining_date',
    };
    return columnMap[sortBy] || 'u.first_name';
  }
}
