import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/user.model';
import { TimetableSlot, CreateTimetableSlot, WeeklyTimetable, Exam, ExamSchedule } from '../models/timetable.model';

@Injectable({ providedIn: 'root' })
export class TimetableService {
  constructor(private api: ApiService) {}

  // ── Slots ────────────────────────────────────────────────────────────────

  getSlots(params?: {
    classId?: string; teacherId?: string;
    academicYearId?: string; semesterId?: string; dayOfWeek?: number;
  }): Observable<ApiResponse<TimetableSlot[]>> {
    return this.api.get<TimetableSlot[]>('timetable', params);
  }

  getSlot(id: string): Observable<ApiResponse<TimetableSlot>> {
    return this.api.get<TimetableSlot>(`timetable/${id}`);
  }

  createSlot(slot: CreateTimetableSlot): Observable<ApiResponse<TimetableSlot>> {
    return this.api.post<TimetableSlot>('timetable', slot);
  }

  updateSlot(id: string, slot: Partial<CreateTimetableSlot>): Observable<ApiResponse<TimetableSlot>> {
    return this.api.put<TimetableSlot>(`timetable/${id}`, slot);
  }

  deleteSlot(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(`timetable/${id}`);
  }

  getClassTimetable(classId: string, params?: { academicYearId?: string; semesterId?: string }): Observable<ApiResponse<WeeklyTimetable>> {
    return this.api.get<WeeklyTimetable>(`timetable/class/${classId}`, params);
  }

  getTeacherSchedule(teacherId: string, params?: { academicYearId?: string }): Observable<ApiResponse<any>> {
    return this.api.get<any>(`timetable/teacher/${teacherId}`, params);
  }

  // ── Exams ────────────────────────────────────────────────────────────────

  getExams(params?: { academicYearId?: string; semesterId?: string; examType?: string }): Observable<ApiResponse<Exam[]>> {
    return this.api.get<Exam[]>('timetable/exams', params);
  }

  getExam(id: string): Observable<ApiResponse<Exam>> {
    return this.api.get<Exam>(`timetable/exams/${id}`);
  }

  createExam(exam: Partial<Exam>): Observable<ApiResponse<Exam>> {
    return this.api.post<Exam>('timetable/exams', exam);
  }

  updateExam(id: string, exam: Partial<Exam>): Observable<ApiResponse<Exam>> {
    return this.api.put<Exam>(`timetable/exams/${id}`, exam);
  }

  deleteExam(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(`timetable/exams/${id}`);
  }

  // ── Exam Schedules ────────────────────────────────────────────────────────

  getExamSchedules(examId: string): Observable<ApiResponse<ExamSchedule[]>> {
    return this.api.get<ExamSchedule[]>(`timetable/exams/${examId}/schedules`);
  }

  createExamSchedule(examId: string, schedule: Partial<ExamSchedule>): Observable<ApiResponse<ExamSchedule>> {
    return this.api.post<ExamSchedule>(`timetable/exams/${examId}/schedules`, schedule);
  }

  deleteExamSchedule(examId: string, scheduleId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`timetable/exams/${examId}/schedules/${scheduleId}`);
  }
}
