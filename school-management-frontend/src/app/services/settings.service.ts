import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserSettings {
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  darkMode: boolean;
  compactView: boolean;
  profileVisibility: boolean;
  activityStatus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateSettingsDTO {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  darkMode?: boolean;
  compactView?: boolean;
  profileVisibility?: boolean;
  activityStatus?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;
  private settingsSubject = new BehaviorSubject<UserSettings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get current user's settings
   */
  getSettings(): Observable<ApiResponse<UserSettings>> {
    return this.http.get<ApiResponse<UserSettings>>(this.apiUrl).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.settingsSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Update current user's settings
   */
  updateSettings(updates: UpdateSettingsDTO): Observable<ApiResponse<UserSettings>> {
    return this.http.put<ApiResponse<UserSettings>>(this.apiUrl, updates).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.settingsSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Reset settings to default
   */
  resetSettings(): Observable<ApiResponse<UserSettings>> {
    return this.http.post<ApiResponse<UserSettings>>(`${this.apiUrl}/reset`, {}).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.settingsSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Get current settings value
   */
  getCurrentSettings(): UserSettings | null {
    return this.settingsSubject.value;
  }

  /**
   * Clear settings from memory
   */
  clearSettings(): void {
    this.settingsSubject.next(null);
  }
}
