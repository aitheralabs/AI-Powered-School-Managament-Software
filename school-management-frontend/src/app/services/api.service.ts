import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Generic CRUD operations
  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, { params: httpParams });
  }

  getPaginated<T>(endpoint: string, params?: PaginationParams): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof PaginationParams] !== null && params[key as keyof PaginationParams] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof PaginationParams]!.toString());
        }
      });
    }
    
    return this.http.get<PaginatedResponse<T>>(`${this.API_URL}/${endpoint}`, { params: httpParams });
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, data);
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, data);
  }

  patch<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, data);
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.API_URL}/${endpoint}`);
  }

  // File upload
  uploadFile(endpoint: string, file: File, additionalData?: any): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${endpoint}`, formData);
  }

  // Download file
  downloadFile(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${endpoint}`, { responseType: 'blob' });
  }
}