import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-super-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './super-admin-login.component.html',
  styleUrl: './super-admin-login.component.scss'
})
export class SuperAdminLoginComponent {
  credentials = { email: '', password: '' };
  isLoading = false;
  error = '';
  showPassword = false;
  emailFocused = false;
  passFocused = false;

  private readonly API = 'http://localhost:3000/api/v1/superadmin';

  constructor(private http: HttpClient, private router: Router) {
    // Redirect if already logged in
    if (localStorage.getItem('superAdminToken')) {
      this.router.navigate(['/super-admin/dashboard']);
    }
  }

  login() {
    if (!this.credentials.email || !this.credentials.password) {
      this.error = 'Please enter your email and password.';
      return;
    }
    this.isLoading = true;
    this.error = '';

    this.http.post<any>(`${this.API}/login`, this.credentials).subscribe({
      next: (res) => {
        if (res.success && res.data?.token) {
          localStorage.setItem('superAdminToken', res.data.token);
          this.router.navigate(['/super-admin/dashboard']);
        } else {
          this.error = 'Invalid credentials.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid email or password.';
        this.isLoading = false;
      }
    });
  }
}
