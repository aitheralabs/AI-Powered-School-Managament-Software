import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { query, getClient } from '../database/connection';

export class TimetableService extends BaseService {

  // ── Timetable Slots ────────────────────────────────────────────────────────

  async getSlots(filters: {
    classId?: string;
    teacherId?: string;
    academicYearId?: string;
    semesterId?: string;
    dayOfWeek?: number;
  }) {
    const schoolId = this.requireSchool();
    const conditions: string[] = ['ts.school_id = $1', 'ts.is_active = true'];
    const params: any[] = [schoolId];

    if (filters.classId)        { conditions.push(`ts.class_id = $${params.length + 1}`);         params.push(filters.classId); }
    if (filters.teacherId)      { conditions.push(`ts.teacher_id = $${params.length + 1}`);       params.push(filters.teacherId); }
    if (filters.academicYearId) { conditions.push(`ts.academic_year_id = $${params.length + 1}`); params.push(filters.academicYearId); }
    if (filters.semesterId)     { conditions.push(`ts.semester_id = $${params.length + 1}`);      params.push(filters.semesterId); }
    if (filters.dayOfWeek)      { conditions.push(`ts.day_of_week = $${params.length + 1}`);      params.push(filters.dayOfWeek); }

    const result = await this.executeQuery(
      `SELECT
         ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room,
         ts.academic_year_id, ts.semester_id, ts.is_active,
         ts.created_at, ts.updated_at,
         c.id AS class_id, c.name AS class_name, c.grade, c.section,
         s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
         t.id AS teacher_id,
         u.first_name || ' ' || u.last_name AS teacher_name,
         t.employee_id AS teacher_employee_id
       FROM timetable_slots ts
       JOIN classes c   ON c.id = ts.class_id
       JOIN subjects s  ON s.id = ts.subject_id
       LEFT JOIN teachers t ON t.id = ts.teacher_id
       LEFT JOIN users u    ON u.id = t.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ts.day_of_week, ts.start_time`,
      params
    );

    return result.rows.map((r: any) => this.transformSlot(r));
  }

  async getSlotById(id: string) {
    const schoolId = this.requireSchool();
    const result = await this.executeQuery(
      `SELECT
         ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room,
         ts.academic_year_id, ts.semester_id, ts.is_active,
         ts.created_at, ts.updated_at,
         c.id AS class_id, c.name AS class_name, c.grade, c.section,
         s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
         t.id AS teacher_id,
         u.first_name || ' ' || u.last_name AS teacher_name
       FROM timetable_slots ts
       JOIN classes c   ON c.id = ts.class_id
       JOIN subjects s  ON s.id = ts.subject_id
       LEFT JOIN teachers t ON t.id = ts.teacher_id
       LEFT JOIN users u    ON u.id = t.user_id
       WHERE ts.id = $1 AND ts.school_id = $2`,
      [id, schoolId]
    );

    if (result.rows.length === 0) throw new AppError('Timetable slot not found', 404);
    return this.transformSlot(result.rows[0]);
  }

  async createSlot(data: {
    classId: string;
    subjectId: string;
    teacherId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    academicYearId?: string;
    semesterId?: string;
  }) {
    const schoolId = this.requireSchool();

    // Validate class belongs to school
    await this.checkEntityExists('classes', data.classId);
    await this.checkEntityExists('subjects', data.subjectId);
    if (data.teacherId) await this.checkEntityExists('teachers', data.teacherId);

    // Check for time conflicts
    await this.checkTeacherConflict(data.teacherId, data.dayOfWeek, data.startTime, data.academicYearId, null);
    await this.checkClassConflict(data.classId, data.dayOfWeek, data.startTime, data.academicYearId, null);

    const result = await this.executeQuery(
      `INSERT INTO timetable_slots
         (school_id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, academic_year_id, semester_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        schoolId, data.classId, data.subjectId, data.teacherId || null,
        data.dayOfWeek, data.startTime, data.endTime, data.room || null,
        data.academicYearId || null, data.semesterId || null,
      ]
    );

    return this.getSlotById(result.rows[0].id);
  }

  async updateSlot(id: string, data: {
    classId?: string;
    subjectId?: string;
    teacherId?: string | null;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    room?: string;
    academicYearId?: string;
    semesterId?: string;
    isActive?: boolean;
  }) {
    const schoolId = this.requireSchool();

    // Ensure slot belongs to this school
    const existing = await this.executeQuery(
      'SELECT * FROM timetable_slots WHERE id = $1 AND school_id = $2',
      [id, schoolId]
    );
    if (existing.rows.length === 0) throw new AppError('Timetable slot not found', 404);

    const slot = existing.rows[0];
    const newTeacherId      = data.teacherId  !== undefined ? data.teacherId  : slot.teacher_id;
    const newDayOfWeek      = data.dayOfWeek  !== undefined ? data.dayOfWeek  : slot.day_of_week;
    const newStartTime      = data.startTime  !== undefined ? data.startTime  : slot.start_time;
    const newAcademicYearId = data.academicYearId !== undefined ? data.academicYearId : slot.academic_year_id;

    // Conflict checks (excluding current slot)
    await this.checkTeacherConflict(newTeacherId, newDayOfWeek, newStartTime, newAcademicYearId, id);
    await this.checkClassConflict(
      data.classId || slot.class_id, newDayOfWeek, newStartTime, newAcademicYearId, id
    );

    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    const map: Record<string, any> = {
      class_id: data.classId, subject_id: data.subjectId, teacher_id: data.teacherId,
      day_of_week: data.dayOfWeek, start_time: data.startTime, end_time: data.endTime,
      room: data.room, academic_year_id: data.academicYearId, semester_id: data.semesterId,
      is_active: data.isActive,
    };

    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { fields.push(`${col} = $${i++}`); values.push(val); }
    }
    if (fields.length === 0) throw new AppError('No fields to update', 400);

    values.push(id, schoolId);
    await this.executeQuery(
      `UPDATE timetable_slots SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i++} AND school_id = $${i}`,
      values
    );

    return this.getSlotById(id);
  }

  async deleteSlot(id: string) {
    const schoolId = this.requireSchool();
    const result = await this.executeQuery(
      'DELETE FROM timetable_slots WHERE id = $1 AND school_id = $2 RETURNING id',
      [id, schoolId]
    );
    if (result.rows.length === 0) throw new AppError('Timetable slot not found', 404);
  }

  /** Return full week timetable for a class, structured as { Mon: [...], Tue: [...], ... } */
  async getClassWeeklyTimetable(classId: string, filters: { academicYearId?: string; semesterId?: string }) {
    const schoolId = this.requireSchool();
    const classCheck = await this.executeQuery(
      'SELECT id, name, grade, section FROM classes WHERE id = $1 AND school_id = $2',
      [classId, schoolId]
    );
    if (classCheck.rows.length === 0) throw new AppError('Class not found', 404);

    const slots = await this.getSlots({ classId, ...filters });

    const days: Record<number, string> = { 1:'Monday', 2:'Tuesday', 3:'Wednesday', 4:'Thursday', 5:'Friday', 6:'Saturday', 7:'Sunday' };
    const weekly: Record<string, any[]> = {};
    for (const [, name] of Object.entries(days)) weekly[name] = [];
    for (const slot of slots) {
      const dayName = days[slot.dayOfWeek] || 'Unknown';
      weekly[dayName].push(slot);
    }

    return { class: classCheck.rows[0], timetable: weekly };
  }

  /** Return teacher's full schedule for the week */
  async getTeacherSchedule(teacherId: string, filters: { academicYearId?: string }) {
    const schoolId = this.requireSchool();
    const teacherCheck = await this.executeQuery(
      'SELECT t.id, t.employee_id, u.first_name, u.last_name FROM teachers t JOIN users u ON u.id = t.user_id WHERE t.id = $1 AND t.school_id = $2',
      [teacherId, schoolId]
    );
    if (teacherCheck.rows.length === 0) throw new AppError('Teacher not found', 404);

    const slots = await this.getSlots({ teacherId, ...filters });
    return { teacher: teacherCheck.rows[0], slots };
  }

  // ── Exams ─────────────────────────────────────────────────────────────────

  async getExams(filters: { academicYearId?: string; semesterId?: string; examType?: string }) {
    const schoolId = this.requireSchool();
    const conditions: string[] = ['school_id = $1'];
    const params: any[] = [schoolId];

    if (filters.academicYearId) { conditions.push(`academic_year_id = $${params.length + 1}`); params.push(filters.academicYearId); }
    if (filters.semesterId)     { conditions.push(`semester_id = $${params.length + 1}`);      params.push(filters.semesterId); }
    if (filters.examType)       { conditions.push(`exam_type = $${params.length + 1}`);        params.push(filters.examType); }

    const result = await this.executeQuery(
      `SELECT * FROM exams WHERE ${conditions.join(' AND ')} ORDER BY start_date DESC`,
      params
    );
    return result.rows.map(this.transformExam);
  }

  async getExamById(id: string) {
    const schoolId = this.requireSchool();
    const result = await this.executeQuery(
      'SELECT * FROM exams WHERE id = $1 AND school_id = $2',
      [id, schoolId]
    );
    if (result.rows.length === 0) throw new AppError('Exam not found', 404);
    return this.transformExam(result.rows[0]);
  }

  async createExam(data: {
    name: string; examType: string; startDate: string; endDate: string;
    academicYearId?: string; semesterId?: string; instructions?: string;
  }) {
    const schoolId = this.requireSchool();
    const result = await this.executeQuery(
      `INSERT INTO exams (school_id, name, exam_type, start_date, end_date, academic_year_id, semester_id, instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [schoolId, data.name, data.examType, data.startDate, data.endDate,
       data.academicYearId || null, data.semesterId || null, data.instructions || null]
    );
    return this.transformExam(result.rows[0]);
  }

  async updateExam(id: string, data: Partial<{
    name: string; examType: string; startDate: string; endDate: string;
    academicYearId: string; semesterId: string; instructions: string; isPublished: boolean;
  }>) {
    const schoolId = this.requireSchool();
    const existing = await this.executeQuery('SELECT id FROM exams WHERE id = $1 AND school_id = $2', [id, schoolId]);
    if (existing.rows.length === 0) throw new AppError('Exam not found', 404);

    const map: Record<string, any> = {
      name: data.name, exam_type: data.examType, start_date: data.startDate,
      end_date: data.endDate, academic_year_id: data.academicYearId,
      semester_id: data.semesterId, instructions: data.instructions, is_published: data.isPublished,
    };

    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { fields.push(`${col} = $${i++}`); values.push(val); }
    }
    if (fields.length === 0) throw new AppError('No fields to update', 400);

    values.push(id, schoolId);
    const result = await this.executeQuery(
      `UPDATE exams SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i++} AND school_id = $${i} RETURNING *`,
      values
    );
    return this.transformExam(result.rows[0]);
  }

  async deleteExam(id: string) {
    const schoolId = this.requireSchool();
    const result = await this.executeQuery('DELETE FROM exams WHERE id = $1 AND school_id = $2 RETURNING id', [id, schoolId]);
    if (result.rows.length === 0) throw new AppError('Exam not found', 404);
  }

  // ── Exam Schedules ────────────────────────────────────────────────────────

  async getExamSchedules(examId: string) {
    const schoolId = this.requireSchool();
    const result = await this.executeQuery(
      `SELECT es.*,
         c.name AS class_name, c.grade, c.section,
         s.name AS subject_name, s.code AS subject_code
       FROM exam_schedules es
       JOIN classes c  ON c.id = es.class_id
       JOIN subjects s ON s.id = es.subject_id
       WHERE es.exam_id = $1 AND es.school_id = $2
       ORDER BY es.exam_date, es.start_time`,
      [examId, schoolId]
    );
    return result.rows.map((r: any) => ({
      id: r.id, examId: r.exam_id,
      examDate: r.exam_date, startTime: r.start_time, endTime: r.end_time,
      room: r.room, maxMarks: r.max_marks, passMarks: r.pass_marks,
      class: { id: r.class_id, name: r.class_name, grade: r.grade, section: r.section },
      subject: { id: r.subject_id, name: r.subject_name, code: r.subject_code },
    }));
  }

  async createExamSchedule(examId: string, data: {
    classId: string; subjectId: string; examDate: string;
    startTime?: string; endTime?: string; room?: string;
    maxMarks?: number; passMarks?: number;
  }) {
    const schoolId = this.requireSchool();
    const examCheck = await this.executeQuery('SELECT id FROM exams WHERE id = $1 AND school_id = $2', [examId, schoolId]);
    if (examCheck.rows.length === 0) throw new AppError('Exam not found', 404);

    const result = await this.executeQuery(
      `INSERT INTO exam_schedules (school_id, exam_id, class_id, subject_id, exam_date, start_time, end_time, room, max_marks, pass_marks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [schoolId, examId, data.classId, data.subjectId, data.examDate,
       data.startTime || null, data.endTime || null, data.room || null,
       data.maxMarks || null, data.passMarks || null]
    );
    return result.rows[0];
  }

  async deleteExamSchedule(scheduleId: string) {
    const schoolId = this.requireSchool();
    const result = await this.executeQuery(
      'DELETE FROM exam_schedules WHERE id = $1 AND school_id = $2 RETURNING id',
      [scheduleId, schoolId]
    );
    if (result.rows.length === 0) throw new AppError('Exam schedule not found', 404);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async checkTeacherConflict(
    teacherId: string | null | undefined,
    dayOfWeek: number,
    startTime: string,
    academicYearId: string | null | undefined,
    excludeId: string | null
  ) {
    if (!teacherId) return;
    const schoolId = this.requireSchool();

    let sql = `SELECT id FROM timetable_slots
               WHERE school_id = $1 AND teacher_id = $2 AND day_of_week = $3 AND start_time = $4 AND is_active = true`;
    const params: any[] = [schoolId, teacherId, dayOfWeek, startTime];

    if (academicYearId) { sql += ` AND academic_year_id = $${params.length + 1}`; params.push(academicYearId); }
    if (excludeId)      { sql += ` AND id != $${params.length + 1}`;              params.push(excludeId); }

    const result = await this.executeQuery(sql, params);
    if (result.rows.length > 0) throw new AppError('Teacher is already scheduled at this time', 409);
  }

  private async checkClassConflict(
    classId: string,
    dayOfWeek: number,
    startTime: string,
    academicYearId: string | null | undefined,
    excludeId: string | null
  ) {
    const schoolId = this.requireSchool();

    let sql = `SELECT id FROM timetable_slots
               WHERE school_id = $1 AND class_id = $2 AND day_of_week = $3 AND start_time = $4 AND is_active = true`;
    const params: any[] = [schoolId, classId, dayOfWeek, startTime];

    if (academicYearId) { sql += ` AND academic_year_id = $${params.length + 1}`; params.push(academicYearId); }
    if (excludeId)      { sql += ` AND id != $${params.length + 1}`;              params.push(excludeId); }

    const result = await this.executeQuery(sql, params);
    if (result.rows.length > 0) throw new AppError('This class already has a subject scheduled at this time', 409);
  }

  private transformSlot(r: any) {
    return {
      id: r.id,
      dayOfWeek: r.day_of_week,
      startTime: r.start_time,
      endTime:   r.end_time,
      room:      r.room,
      isActive:  r.is_active,
      academicYearId: r.academic_year_id,
      semesterId:     r.semester_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      class:   { id: r.class_id,   name: r.class_name,   grade: r.grade, section: r.section },
      subject: { id: r.subject_id, name: r.subject_name, code: r.subject_code },
      teacher: r.teacher_id ? { id: r.teacher_id, name: r.teacher_name, employeeId: r.teacher_employee_id } : null,
    };
  }

  private transformExam(r: any) {
    return {
      id: r.id, name: r.name, examType: r.exam_type,
      startDate: r.start_date, endDate: r.end_date,
      instructions: r.instructions, isPublished: r.is_published,
      academicYearId: r.academic_year_id, semesterId: r.semester_id,
      createdAt: r.created_at, updatedAt: r.updated_at,
    };
  }
}
