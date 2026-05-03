import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-school-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './school-detail.component.html',
  styleUrl: './school-detail.component.scss',
})
export class SchoolDetailComponent implements OnInit {
  school: any = null;
  isLoading = true;
  error = '';
  actionLoading = false;
  actionError = '';
  actionSuccess = '';

  // Subscription edit state
  showSubEdit = false;
  subForm = { plan: '', subscriptionEndsAt: '' };

  plans = ['trial', 'basic', 'standard', 'premium', 'enterprise'];

  private readonly API = `${environment.apiUrl}/superadmin`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('superAdminToken');
    if (!token) { this.router.navigate(['/super-admin/login']); return; }
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('superAdminToken')}` });
  }

  load(id?: string) {
    this.isLoading = true;
    this.error = '';
    const schoolId = id || this.school?.id;
    this.http.get<any>(`${this.API}/schools/${schoolId}`, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.school = res.data;
        this.subForm.plan = this.school.plan;
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 401) { localStorage.removeItem('superAdminToken'); this.router.navigate(['/super-admin/login']); return; }
        this.error = err.error?.message || 'Failed to load school.';
        this.isLoading = false;
      },
    });
  }

  suspend() {
    if (!confirm(`Suspend ${this.school.name}? This will lock out all users immediately.`)) return;
    this.runAction('suspend', 'POST', `/schools/${this.school.id}/suspend`, { reason: 'Suspended by super-admin' });
  }

  reactivate() {
    this.runAction('reactivate', 'POST', `/schools/${this.school.id}/reactivate`, {});
  }

  saveSubscription() {
    const payload: any = { plan: this.subForm.plan };
    if (this.subForm.subscriptionEndsAt) payload.subscriptionEndsAt = this.subForm.subscriptionEndsAt;
    this.runAction('subscription', 'PUT', `/schools/${this.school.id}/subscription`, payload, () => { this.showSubEdit = false; });
  }

  private runAction(name: string, method: 'POST'|'PUT', path: string, body: any, onSuccess?: () => void) {
    this.actionLoading = true;
    this.actionError   = '';
    this.actionSuccess = '';

    const req = method === 'PUT'
      ? this.http.put<any>(`${this.API}${path}`, body, { headers: this.headers() })
      : this.http.post<any>(`${this.API}${path}`, body, { headers: this.headers() });

    req.subscribe({
      next: (res) => {
        this.actionLoading = false;
        this.actionSuccess = res.message || 'Action completed.';
        onSuccess?.();
        this.load();
        setTimeout(() => this.actionSuccess = '', 4000);
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Action failed.';
      },
    });
  }

  planColor(p: string): string {
    if (p === 'enterprise') return '#7c3aed';
    if (p === 'premium')    return '#2563eb';
    if (p === 'standard')   return '#0891b2';
    if (p === 'basic')      return '#059669';
    return '#64748b';
  }

  statusColor(s: string): string {
    if (s === 'active')    return '#16a34a';
    if (s === 'trialing')  return '#d97706';
    if (s === 'past_due' || s === 'suspended') return '#dc2626';
    return '#94a3b8';
  }

  isSuspended(): boolean {
    return this.school?.subscription_status === 'suspended' || !this.school?.is_active;
  }

  impersonate() {
    if (!confirm(`Log in as the admin of ${this.school.name}?\n\nYou will be redirected to the school portal. The token expires in 15 minutes.`)) return;
    this.actionLoading = true;
    this.actionError = '';
    this.http.post<any>(`${this.API}/schools/${this.school.id}/impersonate`, {}, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.actionLoading = false;
        const { token, user } = res.data;
        // Store impersonation session separately so it doesn't overwrite the super-admin session
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ ...user, impersonated: true }));
        // Open school portal in a new tab
        window.open('/dashboard', '_blank');
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Impersonation failed.';
      },
    });
  }

  usagePct(used: number, max: number): number {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }
}
