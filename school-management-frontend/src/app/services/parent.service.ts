import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { ApiResponse } from '../models/user.model';

export interface Parent {
  id: string;
  userId: string;
  occupation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
  };
  students?: any[];
  studentParents?: any[];
}

export interface CreateParent {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  occupation?: string;
}

export interface UpdateParent {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  occupation?: string;
}

export interface LinkStudentData {
  studentId: string;
  parentUserId: string;
  relationshipType: 'father' | 'mother' | 'guardian' | 'other';
  isPrimary?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ParentService {
  constructor(private apiService: ApiService) {}

  getParents(
    params?: PaginationParams & { search?: string; hasChildren?: boolean },
  ): Observable<PaginatedResponse<Parent>> {
    return this.apiService.getPaginated<Parent>('parents', params);
  }

  getParent(id: string): Observable<ApiResponse<Parent>> {
    return this.apiService.get<Parent>(`parents/${id}`);
  }

  createParent(data: CreateParent): Observable<ApiResponse<Parent>> {
    return this.apiService.post<Parent>('parents', data);
  }

  updateParent(
    id: string,
    data: UpdateParent,
  ): Observable<ApiResponse<Parent>> {
    return this.apiService.put<Parent>(`parents/${id}`, data);
  }

  deleteParent(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`parents/${id}`);
  }

  linkToStudent(data: LinkStudentData): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('parents/link-student', data);
  }

  updateRelationship(
    relationshipId: string,
    data: { relationshipType?: string; isPrimary?: boolean },
  ): Observable<ApiResponse<any>> {
    return this.apiService.put<any>(
      `parents/relationships/${relationshipId}`,
      data,
    );
  }

  removeRelationship(relationshipId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`parents/relationships/${relationshipId}`);
  }

  getParentChildren(parentId: string): Observable<ApiResponse<any>> {
    return this.apiService.get<any>(`parents/${parentId}/children`);
  }

  getParentDashboard(): Observable<ApiResponse<any>> {
    return this.apiService.get<any>('parents/dashboard');
  }
}
