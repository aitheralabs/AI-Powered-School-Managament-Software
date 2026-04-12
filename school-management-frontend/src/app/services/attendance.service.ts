import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { Attendance, CreateAttendance, BulkAttendance, AttendanceReport, AttendanceStats } from '../models/attendance.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private apiService: ApiService) {}

  getAttendance(params?: PaginationParams & { classId?: string; studentId?: string; date?: string }): Observable<PaginatedResponse<Attendance>> {
    return this.apiService.getPaginated<Attendance>('attendance', params);
  }

  getAttendanceById(id: string): Observable<ApiResponse<Attendance>> {
    return this.apiService.get<Attendance>(`attendance/${id}`);
  }

  markAttendance(attendance: CreateAttendance): Observable<ApiResponse<Attendance>> {
    return this.apiService.post<Attendance>('attendance', attendance);
  }

  markBulkAttendance(bulkAttendance: BulkAttendance): Observable<ApiResponse<any>> {
    return this.apiService.post('attendance/bulk', bulkAttendance);
  }

  updateAttendance(id: string, attendance: Partial<Attendance>): Observable<ApiResponse<Attendance>> {
    return this.apiService.put<Attendance>(`attendance/${id}`, attendance);
  }

  deleteAttendance(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`attendance/${id}`);
  }

  getStudentAttendance(studentId: string, params?: { startDate?: string; endDate?: string }): Observable<ApiResponse<Attendance[]>> {
    return this.apiService.get<Attendance[]>(`attendance/student/${studentId}`, params);
  }

  getClassAttendance(classId: string, params?: { date?: string; startDate?: string; endDate?: string }): Observable<ApiResponse<Attendance[]>> {
    return this.apiService.get<Attendance[]>(`attendance/class/${classId}`, params);
  }

  // Backend route: GET /attendance-reports/report
  getAttendanceReport(params: {
    studentId?: string;
    classId?: string;
    startDate: string;
    endDate: string;
  }): Observable<ApiResponse<AttendanceReport[]>> {
    return this.apiService.get<AttendanceReport[]>('attendance-reports/report', params);
  }

  getAttendanceStats(params?: { classId?: string; date?: string }): Observable<ApiResponse<AttendanceStats>> {
    return this.apiService.get<AttendanceStats>('attendance/stats', params);
  }

  getAttendanceSummary(studentId: string, params?: { startDate?: string; endDate?: string }): Observable<ApiResponse<any>> {
    return this.apiService.get(`attendance/student/${studentId}/summary`, params);
  }

  // Backend route: GET /attendance/class/:classId/summary
  getClassAttendanceSummary(classId: string, params?: { startDate?: string; endDate?: string }): Observable<ApiResponse<any>> {
    return this.apiService.get(`attendance/class/${classId}/summary`, params);
  }

  // Backend route: GET /attendance-reports/export
  exportAttendanceReport(params: {
    classId?: string;
    studentId?: string;
    startDate: string;
    endDate: string;
    format?: 'csv' | 'excel' | 'json';
  }): Observable<Blob> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.apiService.downloadFile(`attendance-reports/export?${queryParams}`);
  }

  // Backend route: GET /attendance-reports/trends
  getAttendanceAnalytics(params?: {
    classId?: string;
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Observable<ApiResponse<any>> {
    return this.apiService.get('attendance-reports/trends', params);
  }

  // Backend route: GET /attendance-reports/statistics
  getAttendanceStatistics(params?: { period?: 'today' | 'week' | 'month' | 'semester' }): Observable<ApiResponse<any>> {
    return this.apiService.get('attendance-reports/statistics', params);
  }
}
