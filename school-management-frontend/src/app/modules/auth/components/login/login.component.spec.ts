import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isAuthenticated']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    errorServiceSpy = jasmine.createSpyObj('ErrorService', ['processError', 'logError']);

    authServiceSpy.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: ErrorService, useValue: errorServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize login form with empty fields', () => {
    expect(component.loginForm).toBeTruthy();
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('rememberMe')?.value).toBe(false);
  });

  it('should mark form invalid with empty fields', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should mark form invalid with invalid email', () => {
    component.loginForm.patchValue({ email: 'notanemail', password: 'password123' });
    expect(component.loginForm.valid).toBe(false);
    expect(component.email?.errors?.['email']).toBeTruthy();
  });

  it('should mark form invalid with short password', () => {
    component.loginForm.patchValue({ email: 'test@test.com', password: '12345' });
    expect(component.password?.errors?.['minlength']).toBeTruthy();
  });

  it('should mark form valid with correct inputs', () => {
    component.loginForm.patchValue({ email: 'test@test.com', password: 'password123' });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should call authService.login on valid submit', () => {
    authServiceSpy.login.and.returnValue(of({ success: true, data: { user: {}, token: 'tk', accessToken: 'at', refreshToken: 'rt' } } as any));
    component.loginForm.patchValue({ email: 'test@test.com', password: 'password123' });
    component.onSubmit();
    expect(authServiceSpy.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
  });

  it('should navigate to dashboard on successful login', () => {
    authServiceSpy.login.and.returnValue(of({ success: true, data: { user: {}, token: 'tk', accessToken: 'at', refreshToken: 'rt' } } as any));
    component.loginForm.patchValue({ email: 'test@test.com', password: 'password123' });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(notificationSpy.success).toHaveBeenCalled();
  });

  it('should show error on failed login', () => {
    authServiceSpy.login.and.returnValue(of({ success: false, message: 'Invalid credentials' } as any));
    component.loginForm.patchValue({ email: 'test@test.com', password: 'wrongpass' });
    component.onSubmit();
    expect(notificationSpy.error).toHaveBeenCalled();
  });

  it('should handle login error from server', () => {
    errorServiceSpy.processError.and.returnValue({ title: 'Error', message: 'Server error', type: 'error' });
    authServiceSpy.login.and.returnValue(throwError(() => ({ status: 500 })));
    component.loginForm.patchValue({ email: 'test@test.com', password: 'password123' });
    component.onSubmit();
    expect(notificationSpy.error).toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBe(true);
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBe(false);
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBe(true);
  });

  it('should save rememberMe to localStorage', () => {
    authServiceSpy.login.and.returnValue(of({ success: true, data: { user: {}, token: 'tk', accessToken: 'at', refreshToken: 'rt' } } as any));
    component.loginForm.patchValue({ email: 'test@test.com', password: 'password123', rememberMe: true });
    component.onSubmit();
    expect(localStorage.getItem('rememberMe')).toBe('true');
  });

  it('should redirect if already authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
