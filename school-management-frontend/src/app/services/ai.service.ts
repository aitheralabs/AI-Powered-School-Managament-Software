import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/user.model';

export interface AiResponse {
  answer: string;
  insights?: {
    type: 'attendance' | 'grade' | 'fee' | 'general';
    data: any;
  };
}

export interface AttendanceRisk {
  studentId: string;
  studentName: string;
  className: string;
  attendancePercentage: number;
  riskLevel: 'high' | 'medium' | 'low';
  daysAbsent: number;
  lastAbsentDate: string;
}

export interface GradeTrend {
  studentId: string;
  studentName: string;
  className: string;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  currentGrade: string;
  previousGrade: string;
}

export interface FeeRisk {
  studentId: string;
  studentName: string;
  className: string;
  riskScore: number;
  overdueAmount: number;
  daysOverdue: number;
  lastPaymentDate: string;
}

export interface SchoolHealthSummary {
  overallScore: number;
  attendanceHealth: {
    percentage: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    totalStudents: number;
    atRiskStudents: number;
  };
  academicHealth: {
    averageGrade: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    failingStudents: number;
    improvingStudents: number;
  };
  feeHealth: {
    collectionRate: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    totalOutstanding: number;
    defaulters: number;
  };
  recommendations: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  constructor(private apiService: ApiService) {}

  askQuestion(question: string): Observable<ApiResponse<AiResponse>> {
    return this.apiService.post<AiResponse>('ai/ask', { question });
  }

  getAttendanceRisks(params?: {
    classId?: string;
    threshold?: number;
    limit?: number;
  }): Observable<ApiResponse<AttendanceRisk[]>> {
    return this.apiService.get<AttendanceRisk[]>('ai/attendance-risks', params);
  }

  getGradeTrends(params?: {
    classId?: string;
    semesterId?: string;
    limit?: number;
  }): Observable<ApiResponse<GradeTrend[]>> {
    return this.apiService.get<GradeTrend[]>('ai/grade-trends', params);
  }

  getFeeRisks(params?: {
    classId?: string;
    daysOverdue?: number;
    limit?: number;
  }): Observable<ApiResponse<FeeRisk[]>> {
    return this.apiService.get<FeeRisk[]>('ai/fee-risks', params);
  }

  getSchoolHealthSummary(): Observable<ApiResponse<SchoolHealthSummary>> {
    return this.apiService.get<SchoolHealthSummary>('ai/school-health');
  }
}
