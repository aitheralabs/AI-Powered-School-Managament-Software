import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  isLoading = true;
  verified = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.isLoading = false;
      this.errorMessage = 'Invalid verification link.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.isLoading = false;
        this.verified = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Verification failed. The link may be expired or invalid.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login'], { queryParams: { verified: '1' } });
  }
}
