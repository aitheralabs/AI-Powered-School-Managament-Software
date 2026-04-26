import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getAdminDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/admin`);
  }

  getTeacherDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/teacher`);
  }

  getStudentDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/student`);
  }

  getParentDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/parent`);
  }

  getSuperAdminDashboard(token: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/superadmin`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}
