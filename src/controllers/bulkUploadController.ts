/**
 * Bulk Upload Controller
 *
 * CSV import for students and teachers.
 * Parses uploaded CSV file, validates rows, inserts into DB.
 */

import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ─── Simple CSV parser (no extra dependency) ────────────────────────────────

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle quoted fields containing commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').replace(/^"|"$/g, '');
    });
    rows.push(row);
  }

  return rows;
}

// ─── Student CSV Import ──────────────────────────────────────────────────────

/**
 * POST /students/import-csv
 * CSV columns: firstName, lastName, email, phone, dateOfBirth, gender, address, guardianName, guardianPhone, classId
 */
export const importStudentsCSV = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) throw new AppError('School context required', 400);

  if (!req.file) throw new AppError('CSV file is required', 400);

  const text = req.file.buffer.toString('utf-8');
  const rows = parseCSV(text);

  if (rows.length === 0) throw new AppError('CSV file is empty or has no data rows', 400);

  const results = { created: 0, failed: 0, errors: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based, accounting for header

    const firstName = row['firstName'] || row['first_name'] || row['First Name'];
    const lastName  = row['lastName']  || row['last_name']  || row['Last Name'];
    const email     = row['email']     || row['Email'];

    if (!firstName || !lastName) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: firstName and lastName are required`);
      continue;
    }

    try {
      // Create user account for student
      const tempPassword = crypto.randomBytes(12).toString('base64url').slice(0, 16);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const userEmail = email || `student_${Date.now()}_${i}@placeholder.local`;

      const userResult = await query(
        `INSERT INTO users (school_id, email, password_hash, role, first_name, last_name, is_active)
         VALUES ($1, $2, $3, 'student', $4, $5, true)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [schoolId, userEmail, passwordHash, firstName, lastName]
      );

      if (userResult.rows.length === 0) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Email ${userEmail} already exists`);
        continue;
      }

      const userId = userResult.rows[0].id;

      // Generate student ID
      const countResult = await query(
        `SELECT COUNT(*) as cnt FROM students WHERE school_id = $1`,
        [schoolId]
      );
      const studentNum = parseInt(countResult.rows[0].cnt) + 1 + i;
      const studentId = `STU${String(studentNum).padStart(4, '0')}`;

      const classId = row['classId'] || row['class_id'] || row['Class ID'] || null;

      await query(
        `INSERT INTO students (school_id, user_id, student_id, first_name, last_name,
          date_of_birth, gender, phone, address, guardian_name, guardian_phone, class_id, enrollment_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_DATE)`,
        [
          schoolId,
          userId,
          studentId,
          firstName,
          lastName,
          row['dateOfBirth'] || row['date_of_birth'] || row['Date of Birth'] || null,
          row['gender']    || row['Gender']    || null,
          row['phone']     || row['Phone']     || null,
          row['address']   || row['Address']   || null,
          row['guardianName']  || row['guardian_name']  || row['Guardian Name']  || null,
          row['guardianPhone'] || row['guardian_phone'] || row['Guardian Phone'] || null,
          classId,
        ]
      );

      results.created++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: ${err.message}`);
    }
  }

  res.status(200).json({
    success: true,
    message: `Import complete: ${results.created} created, ${results.failed} failed`,
    data: results,
  });
});

/** GET /students/csv-template — download sample CSV */
export const getStudentCSVTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const csv = [
    'firstName,lastName,email,phone,dateOfBirth,gender,address,guardianName,guardianPhone,classId',
    'John,Doe,john.doe@email.com,9876543210,2010-05-15,male,"123 Main St",Jane Doe,9876543211,',
    'Jane,Smith,jane.smith@email.com,9876543212,2011-03-20,female,"456 Oak Ave",Bob Smith,9876543213,',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students_template.csv"');
  res.send(csv);
});

// ─── Teacher CSV Import ──────────────────────────────────────────────────────

/**
 * POST /teachers/import-csv
 * CSV columns: firstName, lastName, email, phone, specialization, qualification, dateOfJoining
 */
export const importTeachersCSV = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) throw new AppError('School context required', 400);

  if (!req.file) throw new AppError('CSV file is required', 400);

  const text = req.file.buffer.toString('utf-8');
  const rows = parseCSV(text);

  if (rows.length === 0) throw new AppError('CSV file is empty or has no data rows', 400);

  const results = { created: 0, failed: 0, errors: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const firstName = row['firstName'] || row['first_name'] || row['First Name'];
    const lastName  = row['lastName']  || row['last_name']  || row['Last Name'];
    const email     = row['email']     || row['Email'];

    if (!firstName || !lastName || !email) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: firstName, lastName, and email are required`);
      continue;
    }

    try {
      const tempPassword = crypto.randomBytes(12).toString('base64url').slice(0, 16);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const userResult = await query(
        `INSERT INTO users (school_id, email, password_hash, role, first_name, last_name, is_active)
         VALUES ($1, $2, $3, 'teacher', $4, $5, true)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [schoolId, email, passwordHash, firstName, lastName]
      );

      if (userResult.rows.length === 0) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Email ${email} already exists`);
        continue;
      }

      const userId = userResult.rows[0].id;

      const countResult = await query(
        `SELECT COUNT(*) as cnt FROM teachers WHERE school_id = $1`,
        [schoolId]
      );
      const teacherNum = parseInt(countResult.rows[0].cnt) + 1 + i;
      const employeeId = `TCH${String(teacherNum).padStart(4, '0')}`;

      await query(
        `INSERT INTO teachers (school_id, user_id, employee_id, first_name, last_name,
          email, phone, specialization, qualification, date_of_joining)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          schoolId,
          userId,
          employeeId,
          firstName,
          lastName,
          email,
          row['phone']          || row['Phone']          || null,
          row['specialization'] || row['Specialization'] || null,
          row['qualification']  || row['Qualification']  || null,
          row['dateOfJoining']  || row['date_of_joining'] || row['Date of Joining'] || null,
        ]
      );

      results.created++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: ${err.message}`);
    }
  }

  res.status(200).json({
    success: true,
    message: `Import complete: ${results.created} created, ${results.failed} failed`,
    data: results,
  });
});

/** GET /teachers/csv-template */
export const getTeacherCSVTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const csv = [
    'firstName,lastName,email,phone,specialization,qualification,dateOfJoining',
    'Alice,Johnson,alice.johnson@school.com,9876543210,Mathematics,B.Ed,2024-06-01',
    'Bob,Williams,bob.williams@school.com,9876543211,Science,M.Sc,2023-08-15',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="teachers_template.csv"');
  res.send(csv);
});
