import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-schools-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './schools-list.component.html',
  styleUrl: './schools-list.component.scss',
})
export class SchoolsListComponent implements OnInit, OnDestroy {
  schools: any[] = [];
  total = 0;
  page = 1;
  limit = 20;
  isLoading = false;
  error = '';

  searchQuery = '';
  statusFilter = '';
  planFilter = '';

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private readonly API = `${environment.apiUrl}/superadmin`;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('superAdminToken');
    if (!token) { this.router.navigate(['/super-admin/login']); return; }

    this.search$.pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.load(); });

    this.load();
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('superAdminToken')}` });
  }

  load() {
    this.isLoading = true;
    this.error = '';
    const params: any = { page: this.page, limit: this.limit };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.planFilter)   params.plan   = this.planFilter;

    const qs = new URLSearchParams(params).toString();
    this.http.get<any>(`${this.API}/schools?${qs}`, { headers: this.headers() }).subscribe({
      next: (res) => {
        const payload = res.data || {};
        this.schools = Array.isArray(payload) ? payload : (payload.data || []);
        this.total   = payload.total ?? this.schools.length;
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 401) { localStorage.removeItem('superAdminToken'); this.router.navigate(['/super-admin/login']); return; }
        this.error = err.error?.message || 'Failed to load schools.';
        this.isLoading = false;
      },
    });
  }

  onSearch(v: string) { this.searchQuery = v; this.search$.next(v); }
  onFilterChange()    { this.page = 1; this.load(); }

  prevPage() { if (this.page > 1) { this.page--; this.load(); } }
  nextPage() { if (this.page * this.limit < this.total) { this.page++; this.load(); } }

  openSchool(id: string) { this.router.navigate(['/super-admin/schools', id]); }

  planColor(plan: string): string {
    const p = (plan || '').toLowerCase();
    if (p === 'enterprise') return '#7c3aed';
    if (p === 'premium')    return '#2563eb';
    if (p === 'standard')   return '#0891b2';
    if (p === 'basic')      return '#059669';
    return '#64748b';
  }

  statusColor(s: string): string {
    if (s === 'active')    return '#16a34a';
    if (s === 'trialing')  return '#d97706';
    if (s === 'past_due')  return '#dc2626';
    if (s === 'suspended') return '#dc2626';
    if (s === 'canceled')  return '#94a3b8';
    return '#64748b';
  }

  get pages(): number { return Math.ceil(this.total / this.limit); }
}
