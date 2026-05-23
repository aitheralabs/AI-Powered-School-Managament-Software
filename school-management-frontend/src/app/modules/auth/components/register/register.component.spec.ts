import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    errorServiceSpy = jasmine.createSpyObj('ErrorService', ['processError', 'logError']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: ErrorService, useValue: errorServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.registerForm).toBeTruthy();
    expect(component.registerForm.get('role')?.value).toBe('student');
  });

  it('should require firstName and lastName with min length', () => {
    component.registerForm.patchValue({ firstName: 'A' });
    expect(component.firstName?.errors?.['minlength']).toBeTruthy();
  });

  it('should validate email format', () => {
    component.registerForm.patchValue({ email: 'invalid' });
    expect(component.email?.errors?.['email']).toBeTruthy();
  });

  it('should validate password strength', () => {
    component.registerForm.patchValue({ password: 'weakpass' });
    expect(component.password?.hasError('passwordStrength')).toBe(true);
  });

  it('should accept strong password', () => {
    component.registerForm.patchValue({ password: 'Strong1pass' });
    expect(component.password?.hasError('passwordStrength')).toBe(false);
  });

  it('should detect password mismatch', () => {
    component.registerForm.patchValue({ password: 'Strong1pass', confirmPassword: 'Different1pass' });
    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
  });

  it('should pass when passwords match', () => {
    component.registerForm.patchValue({ password: 'Strong1pass', confirmPassword: 'Strong1pass' });
    expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
  });

  it('should validate phone format', () => {
    component.registerForm.patchValue({ phone: '123' });
    expect(component.phone?.errors?.['pattern']).toBeTruthy();

    component.registerForm.patchValue({ phone: '1234567890' });
    expect(component.phone?.errors).toBeNull();
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should call register on valid submit', () => {
    authServiceSpy.register.and.returnValue(of({ success: true, data: { user: {}, token: 'tk' } } as any));
    fillValidForm();
    component.onSubmit();
    expect(authServiceSpy.register).toHaveBeenCalled();
    const callArg = authServiceSpy.register.calls.mostRecent().args[0];
    expect(callArg.firstName).toBe('John');
    expect((callArg as any).confirmPassword).toBeUndefined();
  });

  it('should show success notification on successful registration', () => {
    authServiceSpy.register.and.returnValue(of({ success: true, data: {} } as any));
    fillValidForm();
    component.onSubmit();
    expect(notificationSpy.success).toHaveBeenCalled();
  });

  it('should handle duplicate email error (409)', () => {
    errorServiceSpy.processError.and.returnValue({ title: 'Error', message: 'email already exists', type: 'error' });
    authServiceSpy.register.and.returnValue(throwError(() => ({ status: 409 })));
    fillValidForm();
    component.onSubmit();
    expect(notificationSpy.error).toHaveBeenCalledWith(
      jasmine.stringContaining('already registered'),
      jasmine.any(String)
    );
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBe(true);
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBe(false);
  });

  it('should toggle confirm password visibility', () => {
    expect(component.hideConfirmPassword).toBe(true);
    component.toggleConfirmPasswordVisibility();
    expect(component.hideConfirmPassword).toBe(false);
  });

  it('should navigate to login', () => {
    component.navigateToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  function fillValidForm() {
    component.registerForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'Strong1pass',
      confirmPassword: 'Strong1pass',
      role: 'student',
      phone: '1234567890'
    });
  }
});
