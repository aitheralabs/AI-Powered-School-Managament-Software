import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DashboardService } from '../../../../services/dashboard.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss'
})
export class SuperAdminDashboardComponent implements OnInit {
  isLoading = true;
  data: any = null;
  today = new Date();

  constructor(private dashboardService: DashboardService, private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      this.router.navigate(['/super-admin/login']);
      return;
    }
    this.dashboardService.getSuperAdminDashboard(token).subscribe({
      next: (res) => {
        if (res.success) this.data = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 401) {
          localStorage.removeItem('superAdminToken');
          this.router.navigate(['/super-admin/login']);
        }
        this.isLoading = false;
      }
    });
  }

  logout() {
    localStorage.removeItem('superAdminToken');
    this.router.navigate(['/super-admin/login']);
  }

  getPlanColor(plan: string): string {
    const p = plan?.toLowerCase();
    if (p === 'enterprise') return '#7c3aed';
    if (p === 'professional') return '#2563eb';
    if (p === 'basic')        return '#0891b2';
    return '#64748b';
  }

  getStatusColor(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'active')    return '#16a34a';
    if (s === 'trialing')  return '#d97706';
    if (s === 'expired')   return '#dc2626';
    return '#94a3b8';
  }

  formatRevenue(n: number): string {
    if (n >= 1_000_000) return `₹${(n/1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `₹${(n/1_000).toFixed(1)}K`;
    return `₹${n.toFixed(0)}`;
  }
}
