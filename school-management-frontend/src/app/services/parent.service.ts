import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { ApiResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ParentService {
  constructor(private apiService: ApiService) {}

  getParents(params?: PaginationParams & { search?: string }): Observable<PaginatedResponse<any>> {
    return this.apiService.getPaginated<any>('parents', params);
  }

  getParent(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get<any>(`parents/${id}`);
  }

  createParent(data: any): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('parents', data);
  }

  updateParent(id: string, data: any): Observable<ApiResponse<any>> {
    return this.apiService.put<any>(`parents/${id}`, data);
  }

  linkToStudent(data: { parentId: string; studentId: string; relationship: string }): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('parents/link-student', data);
  }

  getParentDashboard(): Observable<ApiResponse<any>> {
    return this.apiService.get<any>('parents/dashboard');
  }
}
