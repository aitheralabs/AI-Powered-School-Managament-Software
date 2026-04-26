/**
 * Authentication Service Tests
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login with valid credentials', (done) => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          user: { id: '1', email: 'test@test.com', role: 'admin' },
        },
      };

      service
        .login({ email: 'test@test.com', password: 'password123' })
        .subscribe({
          next: (response) => {
            expect(response.success).toBe(true);
            expect(response.data?.accessToken).toBe('mock-token');
            done();
          },
          error: () => done(),
        });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle login error', (done) => {
      service
        .login({ email: 'test@test.com', password: 'wrongpassword' })
        .subscribe({
          error: (error) => {
            expect(error.status).toBe(401);
            done();
          },
        });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(
        { success: false, message: 'Invalid credentials' },
        {
          status: 401,
          statusText: 'Unauthorized',
        },
      );
    });
  });

  describe('logout', () => {
    it('should clear localStorage', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      service.logout();

      expect(localStorage.getItem('token')).toBeFalsy();
      expect(localStorage.getItem('user')).toBeFalsy();
    });
  });

  describe('currentUser$', () => {
    it('should emit null when not logged in', (done) => {
      service.currentUser$.subscribe((user) => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('isAdmin', () => {
    it('should return false when not logged in', () => {
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
