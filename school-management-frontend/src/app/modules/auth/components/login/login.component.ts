import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  returnUrl = '/dashboard';
  emailFocused = false;
  passFocused = false;

  features = [
    { icon: 'school',       title: 'Student Management',   desc: 'Complete student lifecycle tracking and records' },
    { icon: 'how_to_reg',   title: 'Smart Attendance',      desc: 'Automated attendance with real-time analytics' },
    { icon: 'payments',     title: 'Fee Management',        desc: 'Seamless fee collection and payment tracking' },
    { icon: 'psychology',   title: 'AI-Powered Insights',   desc: 'Intelligent reports and predictive analytics' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Initialize the login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Show verification success toast when redirected after email verification
    if (this.route.snapshot.queryParams['verified'] === '1') {
      this.notificationService.success('Email verified successfully! You can now log in.', 'Email Verified');
    }

    // If already logged in, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.notificationService.success('Login successful!', 'Welcome');
          
          // Handle remember me functionality
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }

          // Navigate to return URL or dashboard
          this.router.navigate([this.returnUrl]);
        } else {
          this.notificationService.error(response.message || 'Login failed', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = this.errorService.processError(error);
        this.notificationService.error(errorMessage.message, errorMessage.title);
        this.errorService.logError(error, 'Login');
      }
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

  // Helper method to mark all fields as touched for validation display
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Getter methods for form controls
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe');
  }
}
