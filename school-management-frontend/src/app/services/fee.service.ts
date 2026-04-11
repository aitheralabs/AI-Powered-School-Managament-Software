import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { FeeCategory, StudentFee, Payment, CreatePayment, FeeStats } from '../models/fee.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class FeeService {
  constructor(private apiService: ApiService) {}

  // Fee Categories
  getFeeCategories(params?: PaginationParams): Observable<PaginatedResponse<FeeCategory>> {
    return this.apiService.getPaginated<FeeCategory>('fees/categories', params);
  }

  getFeeCategory(id: string): Observable<ApiResponse<FeeCategory>> {
    return this.apiService.get<FeeCategory>(`fees/categories/${id}`);
  }

  createFeeCategory(category: Partial<FeeCategory>): Observable<ApiResponse<FeeCategory>> {
    return this.apiService.post<FeeCategory>('fees/categories', category);
  }

  updateFeeCategory(id: string, category: Partial<FeeCategory>): Observable<ApiResponse<FeeCategory>> {
    return this.apiService.put<FeeCategory>(`fees/categories/${id}`, category);
  }

  deleteFeeCategory(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`fees/categories/${id}`);
  }

  // Student Fees
  getStudentFees(studentId: string): Observable<ApiResponse<StudentFee[]>> {
    return this.apiService.get<StudentFee[]>(`fees/student/${studentId}`);
  }

  getAllStudentFees(params?: PaginationParams & { status?: string; classId?: string }): Observable<PaginatedResponse<StudentFee>> {
    return this.apiService.getPaginated<StudentFee>('fees/student-fees', params);
  }

  assignFeeToStudent(data: {
    studentId: string;
    feeCategoryId: string;
    amount?: number;
    dueDate: string;
  }): Observable<ApiResponse<StudentFee>> {
    return this.apiService.post<StudentFee>('fees/assign-students', data);
  }

  assignFeeToClass(data: {
    classId: string;
    feeCategoryId: string;
    dueDate: string;
  }): Observable<ApiResponse<any>> {
    return this.apiService.post('fees/assign-class', data);
  }

  updateStudentFee(id: string, fee: Partial<StudentFee>): Observable<ApiResponse<StudentFee>> {
    return this.apiService.put<StudentFee>(`fees/student-fees/${id}`, fee);
  }

  deleteStudentFee(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`fees/student-fees/${id}`);
  }

  // Payments
  getPayments(params?: PaginationParams & { studentId?: string; startDate?: string; endDate?: string }): Observable<PaginatedResponse<Payment>> {
    return this.apiService.getPaginated<Payment>('payments', params);
  }

  getPayment(id: string): Observable<ApiResponse<Payment>> {
    return this.apiService.get<Payment>(`payments/${id}`);
  }

  createPayment(payment: CreatePayment): Observable<ApiResponse<Payment>> {
    return this.apiService.post<Payment>('payments', payment);
  }

  getStudentPayments(studentId: string): Observable<ApiResponse<Payment[]>> {
    return this.apiService.get<Payment[]>(`payments/student/${studentId}/history`);
  }

  getPaymentReceipt(paymentId: string): Observable<Blob> {
    return this.apiService.downloadFile(`payments/${paymentId}/receipt`);
  }

  // Reports and Stats
  getFeeStats(): Observable<ApiResponse<FeeStats>> {
    return this.apiService.get<FeeStats>('fees/stats');
  }

  getFeeCollectionReport(params: {
    startDate: string;
    endDate: string;
    classId?: string;
    feeCategoryId?: string;
  }): Observable<ApiResponse<any>> {
    return this.apiService.get('fee-reports/collection', params);
  }

  getOutstandingFeesReport(params?: { classId?: string }): Observable<ApiResponse<any>> {
    return this.apiService.get('fee-reports/outstanding', params);
  }

  getDefaultersReport(params?: { classId?: string; days?: number }): Observable<ApiResponse<any>> {
    return this.apiService.get('fee-reports/defaulters', params);
  }

  exportFeeReport(type: 'collection' | 'outstanding' | 'defaulters', params: any, format: 'csv' | 'excel' | 'pdf' = 'pdf'): Observable<Blob> {
    const queryParams = new URLSearchParams({ ...params, format }).toString();
    return this.apiService.downloadFile(`fee-reports/${type}/export?${queryParams}`);
  }

  sendFeeReminder(studentIds: string[], message?: string): Observable<ApiResponse<any>> {
    return this.apiService.post('fees/send-reminder', { studentIds, message });
  }

  bulkPaymentImport(file: File): Observable<ApiResponse<any>> {
    return this.apiService.uploadFile('payments/bulk-import', file);
  }
}