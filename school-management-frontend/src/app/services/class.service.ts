import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface Class {
  id: string;
  name: string;
  grade?: string;
  section: string;
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  teacherId?: string;
  teacher?: {
    id: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  capacity: number;
  currentStrength?: number;
  studentCount?: number;
  subjects?: string[];
  room?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassFormData {
  name: string;
  grade: string;
  section: string;
  academicYearId: string;
  teacherId?: string;
  capacity: number;
  room?: string;
  subjects?: string[];
  description?: string;
  isActive: boolean;
}

export interface ClassFilters {
  search?: string;
  academicYearId?: string;
  teacherId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClassService {
  private readonly endpoint = 'classes';

  constructor(private apiService: ApiService) {}

  getClasses(filters?: ClassFilters): Observable<any> {
    return this.apiService.getPaginated<any>(this.endpoint, filters);
  }

  getClass(id: string): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/${id}`);
  }

  createClass(classData: ClassFormData): Observable<any> {
    return this.apiService.post<any>(this.endpoint, classData);
  }

  updateClass(id: string, classData: Partial<ClassFormData>): Observable<any> {
    return this.apiService.put<any>(`${this.endpoint}/${id}`, classData);
  }

  deleteClass(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  getClassStats(): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/stats`);
  }

  getClassStudents(
    classId: string,
    filters?: { page?: number; limit?: number },
  ): Observable<any> {
    const params = this.buildQueryParams(filters);
    return this.apiService.get<any>(
      `${this.endpoint}/${classId}/students?${params}`,
    );
  }

  assignStudentToClass(classId: string, studentId: string): Observable<any> {
    return this.apiService.post<any>(`${this.endpoint}/${classId}/enroll`, {
      studentId,
    });
  }

  removeStudentFromClass(classId: string, studentId: string): Observable<any> {
    return this.apiService.delete<any>(
      `${this.endpoint}/${classId}/students/${studentId}`,
    );
  }

  private buildQueryParams(filters?: any): string {
    if (!filters) return '';

    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ''
      ) {
        params.append(key, filters[key].toString());
      }
    });

    return params.toString();
  }
}
