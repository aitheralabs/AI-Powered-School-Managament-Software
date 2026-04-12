import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { Student, CreateStudent, StudentStats } from '../models/student.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(private apiService: ApiService) {}

  getStudents(params?: PaginationParams): Observable<PaginatedResponse<Student>> {
    return this.apiService.getPaginated<Student>('students', params);
  }

  getStudent(id: string): Observable<ApiResponse<Student>> {
    return this.apiService.get<Student>(`students/${id}`);
  }

  createStudent(student: CreateStudent): Observable<ApiResponse<Student>> {
    return this.apiService.post<Student>('students', student);
  }

  updateStudent(id: string, student: Partial<Student>): Observable<ApiResponse<Student>> {
    return this.apiService.put<Student>(`students/${id}`, student);
  }

  deleteStudent(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`students/${id}`);
  }

  // Backend route: GET /classes/:classId/students
  getStudentsByClass(classId: string): Observable<ApiResponse<Student[]>> {
    return this.apiService.get<Student[]>(`classes/${classId}/students`);
  }

  getStudentAttendance(studentId: string, params?: any): Observable<ApiResponse<any>> {
    return this.apiService.get(`attendance/student/${studentId}`, params);
  }

  getStudentGrades(studentId: string, params?: any): Observable<ApiResponse<any>> {
    return this.apiService.get(`grades/student/${studentId}`, params);
  }

  getStudentFees(studentId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`fees/student/${studentId}`);
  }

  getStudentStats(): Observable<ApiResponse<StudentStats>> {
    return this.apiService.get<StudentStats>('students/stats');
  }

  // Backend route: POST /classes/:classId/enroll  body: { studentId }
  enrollStudent(studentId: string, classId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`classes/${classId}/enroll`, { studentId });
  }

  // Backend route: POST /classes/transfer  body: { studentId, fromClassId, toClassId }
  transferStudent(studentId: string, fromClassId: string, toClassId: string): Observable<ApiResponse<any>> {
    return this.apiService.post('classes/transfer', { studentId, fromClassId, toClassId });
  }

  // Backend route: POST /students/import-csv  (multipart/form-data)
  bulkImportStudents(file: File): Observable<ApiResponse<any>> {
    return this.apiService.uploadFile('students/import-csv', file);
  }

  // Backend route: GET /students/csv-template
  downloadStudentTemplate(): Observable<Blob> {
    return this.apiService.downloadFile('students/csv-template');
  }

  exportStudents(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.downloadFile(`students/export?format=${format}`);
  }

  getStudentClassHistory(studentId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`students/${studentId}/class-history`);
  }

  getStudentSummary(studentId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`students/${studentId}/summary`);
  }
}
