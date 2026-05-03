import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="verify-page">
      <div class="verify-card">
        <div *ngIf="state === 'loading'" class="state-wrap">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Verifying your email address…</p>
        </div>
        <div *ngIf="state === 'success'" class="state-wrap success">
          <div class="icon-circle success"><mat-icon>check_circle</mat-icon></div>
          <h2>Email verified!</h2>
          <p>Your school's email address has been verified. You can now log in.</p>
          <a routerLink="/auth/login" class="btn">Go to Login</a>
        </div>
        <div *ngIf="state === 'error'" class="state-wrap error">
          <div class="icon-circle error"><mat-icon>error_outline</mat-icon></div>
          <h2>Verification failed</h2>
          <p>{{ message }}</p>
          <a routerLink="/auth/login" class="btn outline">Back to Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .verify-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      padding: 48px 40px;
      width: 100%;
      max-width: 440px;
      text-align: center;
    }
    .state-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .state-wrap p { color: #64748b; font-size: 15px; margin: 0; }
    .icon-circle {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
    }
    .icon-circle.success { background: #f0fdf4; mat-icon { color: #22c55e; } }
    .icon-circle.error   { background: #fef2f2; mat-icon { color: #ef4444; } }
    h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
    .btn {
      display: inline-block;
      margin-top: 12px;
      padding: 12px 28px;
      background: #4f46e5;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      transition: background 0.2s;
      &:hover { background: #4338ca; }
      &.outline { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; &:hover { background: #e2e8f0; } }
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  state: 'loading' | 'success' | 'error' = 'loading';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state = 'error';
      this.message = 'No verification token provided.';
      return;
    }
    this.http.get<any>(`${environment.apiUrl}/schools/verify-email`, {
      params: { token },
    }).subscribe({
      next: () => {
        this.state = 'success';
        setTimeout(() => this.router.navigate(['/auth/login'], { queryParams: { verified: '1' } }), 3000);
      },
      error: (err) => {
        this.state = 'error';
        this.message = err.error?.message || 'This verification link is invalid or has already been used.';
      },
    });
  }
}
