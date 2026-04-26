/**
 * Report Export Service
 *
 * Provides CSV export for: students, teachers, attendance, grades.
 * Uses direct data export (no server round-trip needed for simple CSV).
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportExportService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Generic CSV downloader ─────────────────────────────────────────────────

  /** Convert array of objects to CSV and trigger browser download */
  downloadCSV(data: Record<string, any>[], filename: string): void {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Student export ─────────────────────────────────────────────────────────

  getStudentsForExport(params?: { search?: string; classId?: string }): Observable<any> {
    let httpParams = new HttpParams().set('limit', '1000');
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.classId) httpParams = httpParams.set('classId', params.classId);
    return this.http.get<any>(`${this.API}/students`, { params: httpParams });
  }

  exportStudentsCSV(params?: { search?: string; classId?: string }): void {
    this.getStudentsForExport(params).subscribe({
      next: (res) => {
        const students = res.data?.items || res.data || [];
        const rows = students.map((s: any) => ({
          'Student ID': s.studentId || s.student_id || '',
          'First Name': s.firstName || s.first_name || '',
          'Last Name':  s.lastName  || s.last_name  || '',
          'Email':      s.email     || '',
          'Phone':      s.phone     || '',
          'Class':      s.className || s.class_name || '',
          'Gender':     s.gender    || '',
          'Guardian Name':  s.guardianName  || s.guardian_name  || '',
          'Guardian Phone': s.guardianPhone || s.guardian_phone || '',
          'Enrollment Date': s.enrollmentDate || s.enrollment_date || '',
          'Status':     s.isActive ?? true ? 'Active' : 'Inactive',
        }));
        this.downloadCSV(rows, 'students');
      },
    });
  }

  // ─── Teacher export ─────────────────────────────────────────────────────────

  exportTeachersCSV(): void {
    this.http.get<any>(`${this.API}/teachers?limit=1000`).subscribe({
      next: (res) => {
        const teachers = res.data?.items || res.data || [];
        const rows = teachers.map((t: any) => ({
          'Employee ID':   t.employeeId   || t.employee_id   || '',
          'First Name':    t.firstName    || t.first_name    || '',
          'Last Name':     t.lastName     || t.last_name     || '',
          'Email':         t.email        || '',
          'Phone':         t.phone        || '',
          'Specialization': t.specialization || '',
          'Qualification': t.qualification  || '',
          'Date of Joining': t.dateOfJoining || t.date_of_joining || '',
          'Status':        t.isActive ?? true ? 'Active' : 'Inactive',
        }));
        this.downloadCSV(rows, 'teachers');
      },
    });
  }

  // ─── Attendance export ──────────────────────────────────────────────────────

  exportAttendanceCSV(params: { startDate?: string; endDate?: string; classId?: string }): void {
    let httpParams = new HttpParams().set('limit', '5000');
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate)   httpParams = httpParams.set('endDate',   params.endDate);
    if (params.classId)   httpParams = httpParams.set('classId',   params.classId);

    this.http.get<any>(`${this.API}/attendance`, { params: httpParams }).subscribe({
      next: (res) => {
        const records = res.data?.items || res.data || [];
        const rows = records.map((r: any) => ({
          'Date':         r.date || '',
          'Student Name': `${r.firstName || r.first_name || ''} ${r.lastName || r.last_name || ''}`.trim(),
          'Student ID':   r.studentId || r.student_id || '',
          'Class':        r.className || r.class_name || '',
          'Status':       r.status || '',
          'Marked By':    r.markedBy || r.marked_by || '',
        }));
        this.downloadCSV(rows, 'attendance');
      },
    });
  }

  // ─── Grades export ──────────────────────────────────────────────────────────

  exportGradesCSV(params: { classId?: string; subjectId?: string }): void {
    let httpParams = new HttpParams().set('limit', '5000');
    if (params.classId)   httpParams = httpParams.set('classId',   params.classId);
    if (params.subjectId) httpParams = httpParams.set('subjectId', params.subjectId);

    this.http.get<any>(`${this.API}/grades`, { params: httpParams }).subscribe({
      next: (res) => {
        const grades = res.data?.items || res.data || [];
        const rows = grades.map((g: any) => ({
          'Student Name': `${g.firstName || g.first_name || ''} ${g.lastName || g.last_name || ''}`.trim(),
          'Student ID':   g.studentId || g.student_id || '',
          'Subject':      g.subjectName || g.subject_name || '',
          'Class':        g.className  || g.class_name   || '',
          'Assessment':   g.assessmentType || g.assessment_type || '',
          'Marks':        g.marksObtained ?? g.marks_obtained ?? '',
          'Max Marks':    g.maxMarks ?? g.max_marks ?? '',
          'Grade':        g.grade || '',
          'Date':         g.createdAt || g.created_at || '',
        }));
        this.downloadCSV(rows, 'grades');
      },
    });
  }
}
