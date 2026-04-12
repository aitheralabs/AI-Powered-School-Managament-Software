import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { Teacher, CreateTeacher, TeacherStats, Subject, Class } from '../models/teacher.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  constructor(private apiService: ApiService) {}

  getTeachers(params?: PaginationParams): Observable<PaginatedResponse<Teacher>> {
    return this.apiService.getPaginated<Teacher>('teachers', params);
  }

  getTeacher(id: string): Observable<ApiResponse<Teacher>> {
    return this.apiService.get<Teacher>(`teachers/${id}`);
  }

  createTeacher(teacher: CreateTeacher): Observable<ApiResponse<Teacher>> {
    return this.apiService.post<Teacher>('teachers', teacher);
  }

  updateTeacher(id: string, teacher: Partial<Teacher>): Observable<ApiResponse<Teacher>> {
    return this.apiService.put<Teacher>(`teachers/${id}`, teacher);
  }

  deleteTeacher(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`teachers/${id}`);
  }

  getTeacherClasses(teacherId: string): Observable<ApiResponse<Class[]>> {
    return this.apiService.get<Class[]>(`teachers/${teacherId}/classes`);
  }

  getTeacherSubjects(teacherId: string): Observable<ApiResponse<Subject[]>> {
    return this.apiService.get<Subject[]>(`teachers/${teacherId}/subjects`);
  }

  // Backend route: POST /teachers/assign-class  body: { teacherId, classId }
  assignTeacherToClass(teacherId: string, classId: string): Observable<ApiResponse<any>> {
    return this.apiService.post('teachers/assign-class', { teacherId, classId });
  }

  // Backend route: POST /teachers/assign-subject  body: { teacherId, subjectId }
  assignTeacherToSubject(teacherId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.post('teachers/assign-subject', { teacherId, subjectId });
  }

  // Backend route: DELETE /teachers/classes/:classId/teacher
  removeTeacherFromClass(teacherId: string, classId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`teachers/classes/${classId}/teacher`);
  }

  // Backend route: DELETE /teachers/:teacherId/subjects/:subjectId
  removeTeacherFromSubject(teacherId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`teachers/${teacherId}/subjects/${subjectId}`);
  }

  getTeacherStats(): Observable<ApiResponse<TeacherStats>> {
    return this.apiService.get<TeacherStats>('teachers/stats');
  }

  getTeacherWorkload(teacherId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`teachers/${teacherId}/workload`);
  }

  // Schedule info is available via the workload endpoint
  getTeacherSchedule(teacherId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`teachers/${teacherId}/workload`);
  }

  // Backend route: POST /teachers/import-csv  (multipart/form-data)
  bulkImportTeachers(file: File): Observable<ApiResponse<any>> {
    return this.apiService.uploadFile('teachers/import-csv', file);
  }

  // Backend route: GET /teachers/csv-template
  downloadTeacherTemplate(): Observable<Blob> {
    return this.apiService.downloadFile('teachers/csv-template');
  }

  exportTeachers(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.downloadFile(`teachers/export?format=${format}`);
  }

  // Assign a teacher to teach a specific subject in a specific class
  assignTeacherToClassSubject(teacherId: string, classId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.post('teachers/assign-class-subject', { teacherId, classId, subjectId });
  }

  removeTeacherFromClassSubject(classId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`teachers/classes/${classId}/subjects/${subjectId}/teacher`);
  }

  checkConflicts(teacherId: string, classId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.post('teachers/check-conflicts', { teacherId, classId, subjectId });
  }

  getOptimalSuggestions(classId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`teachers/suggestions/${classId}/${subjectId}`);
  }

  getAllAssignments(params?: any): Observable<ApiResponse<any>> {
    return this.apiService.get('teachers/assignments', params);
  }
}
