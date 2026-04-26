import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError, timer } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, LoginResponse, CreateUser, ApiResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private refreshTokenTimeout?: any;

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load user and token from localStorage on service initialization
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(user));
      this.startRefreshTokenTimer();
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;
            
            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }
            
            // Update subjects
            this.tokenSubject.next(token);
            this.currentUserSubject.next(user);
            
            // Start automatic token refresh
            this.startRefreshTokenTimer();
          }
        })
      );
  }

  register(userData: CreateUser): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;
            
            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }
            
            // Update subjects
            this.tokenSubject.next(token);
            this.currentUserSubject.next(user);
            
            // Start automatic token refresh
            this.startRefreshTokenTimer();
          }
        })
      );
  }

  logout(): void {
    // Stop refresh token timer
    this.stopRefreshTokenTimer();
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    
    // Clear subjects
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    
    // Navigate to login
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/profile`);
  }

  refreshToken(): Observable<ApiResponse<any>> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const { token, refreshToken: newRefreshToken } = response.data;
            
            // Update tokens in localStorage
            localStorage.setItem('token', token);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            
            // Update token subject
            this.tokenSubject.next(token);
            
            // Restart the refresh timer
            this.startRefreshTokenTimer();
          }
        })
      );
  }

  private startRefreshTokenTimer(): void {
    // Stop any existing timer
    this.stopRefreshTokenTimer();
    
    // Parse token to get expiration time
    const token = this.getToken();
    if (!token) return;
    
    try {
      const tokenPayload = this.parseJwt(token);
      const expires = new Date(tokenPayload.exp * 1000);
      const timeout = expires.getTime() - Date.now() - (5 * 60 * 1000); // Refresh 5 minutes before expiry
      
      // Only set timer if token hasn't expired yet
      if (timeout > 0) {
        this.refreshTokenTimeout = setTimeout(() => {
          this.refreshToken().subscribe({
            error: (error) => {
              console.error('Token refresh failed:', error);
              this.logout();
            }
          });
        }, timeout);
      } else {
        // Token already expired or will expire soon, refresh immediately
        this.refreshToken().subscribe({
          error: (error) => {
            console.error('Token refresh failed:', error);
            this.logout();
          }
        });
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = undefined;
    }
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUserValue();
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(['admin']);
  }

  isTeacher(): boolean {
    return this.hasRole(['teacher']);
  }

  isStudent(): boolean {
    return this.hasRole(['student']);
  }

  isParent(): boolean {
    return this.hasRole(['parent']);
  }

  isStaff(): boolean {
    return this.hasRole(['staff']);
  }
}