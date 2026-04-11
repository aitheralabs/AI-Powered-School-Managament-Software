import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DashboardService } from '../../../../services/dashboard.service';

interface CreateTenantForm {
  name: string;
  slug: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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

  // ── Create Tenant modal ──────────────────────────────────────────────────
  showCreateModal = false;
  createLoading   = false;
  createError     = '';
  createSuccess   = '';
  showAdminPwd    = false;

  tenantForm: CreateTenantForm = this.blankForm();

  private readonly API = 'http://localhost:3000/api/v1/superadmin';

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('superAdminToken');
    if (!token) { this.router.navigate(['/super-admin/login']); return; }
    this.loadDashboard(token);
  }

  private loadDashboard(token: string) {
    this.isLoading = true;
    this.dashboardService.getSuperAdminDashboard(token).subscribe({
      next:  (res) => { if (res.success) this.data = res.data; this.isLoading = false; },
      error: (err) => {
        if (err.status === 401) { localStorage.removeItem('superAdminToken'); this.router.navigate(['/super-admin/login']); }
        this.isLoading = false;
      }
    });
  }

  logout() {
    localStorage.removeItem('superAdminToken');
    this.router.navigate(['/super-admin/login']);
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  openCreateModal() {
    this.tenantForm   = this.blankForm();
    this.createError  = '';
    this.createSuccess = '';
    this.showAdminPwd = false;
    this.showCreateModal = true;
  }

  closeCreateModal() {
    if (this.createLoading) return;
    this.showCreateModal = false;
  }

  onNameChange() {
    // Auto-fill slug only while it is still empty
    if (!this.tenantForm.slug) {
      this.tenantForm.slug = this.tenantForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  submitCreateTenant() {
    const f = this.tenantForm;
    if (!f.name || !f.slug || !f.email || !f.adminFirstName || !f.adminLastName || !f.adminEmail || !f.adminPassword) {
      this.createError = 'Please fill in all required fields.';
      return;
    }
    if (f.adminPassword.length < 8) {
      this.createError = 'Admin password must be at least 8 characters.';
      return;
    }

    const token = localStorage.getItem('superAdminToken');
    if (!token) { this.router.navigate(['/super-admin/login']); return; }

    this.createLoading = true;
    this.createError   = '';
    this.createSuccess = '';

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.post<any>(`${this.API}/schools`, f, { headers }).subscribe({
      next: (res) => {
        this.createLoading = false;
        this.createSuccess = `"${res.data?.school?.name}" created! Admin: ${res.data?.admin?.email}`;
        setTimeout(() => { this.showCreateModal = false; this.loadDashboard(token); }, 2000);
      },
      error: (err) => {
        this.createLoading = false;
        this.createError   = err.error?.message || err.error?.error || 'Failed to create school.';
      }
    });
  }

  // ── Misc helpers ─────────────────────────────────────────────────────────

  getPlanColor(plan: string): string {
    const p = plan?.toLowerCase();
    if (p === 'enterprise')   return '#7c3aed';
    if (p === 'professional') return '#2563eb';
    if (p === 'basic')        return '#0891b2';
    return '#64748b';
  }

  getStatusColor(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'active')   return '#16a34a';
    if (s === 'trialing') return '#d97706';
    if (s === 'expired')  return '#dc2626';
    return '#94a3b8';
  }

  formatRevenue(n: number): string {
    if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
    return `₹${n.toFixed(0)}`;
  }

  private blankForm(): CreateTenantForm {
    return { name: '', slug: '', email: '', phone: '', city: '', state: '',
             adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '' };
  }
}
