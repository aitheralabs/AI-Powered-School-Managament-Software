import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { ApiResponse } from '../models/user.model';

export interface Staff {
  id: string;
  altId: string;
  employeeId: string;
  department: string;
  position: string;
  joiningDate: string;
  salary: number | null;
  responsibilities: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    address: string | null;
  };
}

export interface CreateStaff {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  employeeId: string;
  department: string;
  position: string;
  joiningDate: string;
  salary?: number;
  responsibilities?: string;
}

export interface UpdateStaff {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  department?: string;
  position?: string;
  salary?: number;
  responsibilities?: string;
}

export interface StaffSummary {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  departmentBreakdown: {
    department: string;
    totalStaff: number;
    activeStaff: number;
    positions: { position: string; count: number }[];
  }[];
}

export interface StaffFilters {
  department?: string;
  position?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  constructor(private apiService: ApiService) {}

  getStaff(
    params?: PaginationParams & StaffFilters,
  ): Observable<PaginatedResponse<Staff>> {
    return this.apiService.getPaginated<Staff>('staff', params);
  }

  getStaffMember(id: string): Observable<ApiResponse<Staff>> {
    return this.apiService.get<Staff>(`staff/${id}`);
  }

  createStaff(staff: CreateStaff): Observable<ApiResponse<Staff>> {
    return this.apiService.post<Staff>('staff', staff);
  }

  updateStaff(id: string, staff: UpdateStaff): Observable<ApiResponse<Staff>> {
    return this.apiService.put<Staff>(`staff/${id}`, staff);
  }

  deactivateStaff(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`staff/${id}`);
  }

  reactivateStaff(id: string): Observable<ApiResponse<any>> {
    return this.apiService.patch(`staff/${id}/reactivate`, {});
  }

  getStaffSummary(): Observable<ApiResponse<StaffSummary>> {
    return this.apiService.get<StaffSummary>('staff/summary');
  }

  exportStaff(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.downloadFile(`staff/export?format=${format}`);
  }
}
