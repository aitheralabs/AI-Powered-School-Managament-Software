import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  resetSuccess = false;
  hidePassword = true;
  hideConfirm = true;
  token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.notificationService.error('Invalid reset link. Please request a new one.', 'Error');
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.form.value;
    if (newPassword !== confirmPassword) {
      this.notificationService.error('Passwords do not match', 'Error');
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.token, newPassword, confirmPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetSuccess = true;
        this.notificationService.success('Password reset successfully!', 'Success');
      },
      error: (error) => {
        this.isLoading = false;
        const err = this.errorService.processError(error);
        this.notificationService.error(err.message, err.title);
      }
    });
  }

  get newPassword() { return this.form.get('newPassword'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
}
