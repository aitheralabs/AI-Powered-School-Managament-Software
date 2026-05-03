import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';

import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../../../services/dashboard.service';
import { GradeService } from '../../../../services/grade.service';
import { AuthService } from '../../../../services/auth.service';
import { environment } from '../../../../../environments/environment';

Chart.register(...registerables);

interface KpiCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  colorClass: string;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral'; label: string };
  progress?: number;
}

interface ActivityItem {
  icon: string;
  iconClass: string;
  title: string;
  description: string;
  time: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatProgressBarModule,
    MatChipsModule, MatDividerModule, MatTooltipModule,
    MatBadgeModule, BaseChartDirective,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = true;
  currentDate = new Date();
  trialDaysLeft: number | null = null;

  kpiCards: KpiCard[] = [];
  recentActivity: ActivityItem[] = [];
  quickActions = [
    { icon: 'person_add',  label: 'Add Student',    route: '/students/add',   color: 'primary' },
    { icon: 'how_to_reg',  label: 'Mark Attendance', route: '/attendance',     color: 'accent' },
    { icon: 'payment',     label: 'Record Payment',  route: '/fees',           color: 'primary' },
    { icon: 'grade',       label: 'Enter Grades',    route: '/grades',         color: 'accent' },
    { icon: 'description', label: 'Report Cards',    route: '/grades',         color: 'primary' },
    { icon: 'smart_toy',   label: 'AI Assistant',    route: '/ai-chat',        color: 'warn' },
  ];

  // ─── Revenue Chart ───────────────────────────────────────────────────────────
  revenueChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Fee Collection (₹)',
      data: [],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102,126,234,0.12)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#667eea',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  };

  revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ₹${(ctx.raw as number).toLocaleString('en-IN')}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11 }, callback: (v) => `₹${(Number(v) / 1000).toFixed(0)}K` },
      },
    },
  };

  // ─── Attendance Chart ────────────────────────────────────────────────────────
  attendanceChartData: ChartData<'bar'> = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      label: 'Today\'s Attendance',
      data: [0, 0, 0],
      backgroundColor: ['rgba(67,233,123,0.85)', 'rgba(245,87,108,0.75)', 'rgba(255,193,7,0.8)'],
      borderRadius: 6,
    }],
  };

  attendanceChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
    },
  };

  // ─── Grade Distribution ──────────────────────────────────────────────────────
  gradeChartData: ChartData<'doughnut'> = {
    labels: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: ['#667eea','#764ba2','#4facfe','#00f2fe','#43e97b','#38f9d7','#f093fb','#f5576c'],
      borderWidth: 0, hoverOffset: 6,
    }],
  };

  gradeChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { font: { size: 11 }, padding: 12, boxWidth: 14 } } },
    cutout: '65%',
  };

  // ─── Fee Status Chart ────────────────────────────────────────────────────────
  feeStatusChartData: ChartData<'doughnut'> = {
    labels: ['Collected', 'Pending', 'Overdue'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#43e97b', '#f093fb', '#f5576c'],
      borderWidth: 0, hoverOffset: 6,
    }],
  };

  feeStatusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } } },
    cutout: '65%',
  };

  constructor(
    private dashboardService: DashboardService,
    private gradeService: GradeService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.loadUsageBanner();
  }

  private loadUsageBanner() {
    this.http.get<any>(`${environment.apiUrl}/schools/me/usage`)
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        const data = res?.data;
        if (!data) return;
        if (data.subscriptionStatus === 'trialing' && data.trialEndsAt) {
          const daysLeft = Math.max(0, Math.ceil(
            (new Date(data.trialEndsAt).getTime() - Date.now()) / 86400000
          ));
          this.trialDaysLeft = daysLeft;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading = true;

    this.dashboardService.getAdminDashboard()
      .pipe(takeUntil(this.destroy$), catchError(() => of({ success: false, data: null })))
      .subscribe(res => {
        const d = (res as any)?.data;
        if (!d) { this.isLoading = false; return; }

        // ── KPI Cards ────────────────────────────────────────────────────────
        const { stats, attendance, fees } = d;
        const total = (fees?.totalCollected || 0) + (fees?.totalPending || 0) + (fees?.totalOverdue || 0);
        const feePct = total > 0 ? Math.round((fees.totalCollected / total) * 100) : 0;

        this.kpiCards = [
          {
            title: 'Total Students', value: (stats?.totalStudents || 0).toLocaleString(),
            subtitle: 'Currently enrolled', icon: 'school', colorClass: 'purple',
            trend: { value: 0, direction: 'neutral', label: 'enrolled' },
          },
          {
            title: 'Total Teachers', value: (stats?.totalTeachers || 0).toLocaleString(),
            subtitle: 'Active faculty', icon: 'person', colorClass: 'pink',
            trend: { value: 0, direction: 'neutral', label: 'active' },
          },
          {
            title: "Today's Attendance",
            value: `${attendance?.todayPercentage ?? 0}%`,
            subtitle: `${attendance?.todayPresent ?? 0} present · ${attendance?.todayAbsent ?? 0} absent`,
            icon: 'how_to_reg', colorClass: 'blue',
            progress: attendance?.todayPercentage ?? 0,
            trend: { value: 0, direction: (attendance?.todayPercentage ?? 0) >= 80 ? 'up' : 'down', label: 'today' },
          },
          {
            title: 'Fee Collection', value: `${feePct}%`,
            subtitle: `₹${(fees?.totalCollected || 0).toLocaleString('en-IN')} collected`,
            icon: 'payments', colorClass: 'green',
            progress: feePct,
            trend: { value: 0, direction: 'up', label: 'collected' },
          },
          {
            title: 'Active Classes', value: (stats?.totalClasses || 0).toLocaleString(),
            subtitle: 'This academic year', icon: 'class', colorClass: 'orange',
            trend: { value: 0, direction: 'neutral', label: 'active' },
          },
          {
            title: 'Pending Dues',
            value: `₹${((fees?.totalPending || 0) + (fees?.totalOverdue || 0)).toLocaleString('en-IN')}`,
            subtitle: `₹${(fees?.totalOverdue || 0).toLocaleString('en-IN')} overdue`,
            icon: 'warning', colorClass: 'red',
            trend: { value: 0, direction: (fees?.totalOverdue || 0) > 0 ? 'down' : 'neutral', label: 'total outstanding' },
          },
        ];

        // ── Revenue Chart ─────────────────────────────────────────────────────
        const monthly: { month: string; amount: number }[] = d.monthlyRevenue || [];
        if (monthly.length > 0) {
          this.revenueChartData = {
            labels: monthly.map(m => m.month),
            datasets: [{
              ...this.revenueChartData.datasets[0],
              data: monthly.map(m => m.amount),
            }],
          };
        }

        // ── Attendance Chart ──────────────────────────────────────────────────
        this.attendanceChartData = {
          labels: ['Present', 'Absent'],
          datasets: [{
            label: "Today's Attendance",
            data: [attendance?.todayPresent || 0, attendance?.todayAbsent || 0],
            backgroundColor: ['rgba(67,233,123,0.85)', 'rgba(245,87,108,0.75)'],
            borderRadius: 6,
          }],
        };

        // ── Fee Status Chart ──────────────────────────────────────────────────
        if (total > 0) {
          this.feeStatusChartData = {
            ...this.feeStatusChartData,
            datasets: [{ ...this.feeStatusChartData.datasets[0],
              data: [
                Math.round((fees.totalCollected / total) * 100),
                Math.round((fees.totalPending   / total) * 100),
                Math.round((fees.totalOverdue   / total) * 100),
              ],
            }],
          };
        }

        // ── Activity Feed ─────────────────────────────────────────────────────
        this.recentActivity = [];
        // Recent enrollments
        for (const e of (d.recentEnrollments || []).slice(0, 3)) {
          this.recentActivity.push({
            icon: 'person_add', iconClass: 'success',
            title: 'Student Enrolled',
            description: `${e.name} enrolled in ${e.class}`,
            time: this.formatTime(e.enrollment_date),
          });
        }
        // Recent payments
        for (const p of (d.recentPayments || []).slice(0, 3)) {
          this.recentActivity.push({
            icon: 'payment', iconClass: 'primary',
            title: 'Fee Payment',
            description: `₹${parseFloat(p.amount).toLocaleString('en-IN')} received from ${p.student_name}`,
            time: this.formatTime(p.date),
          });
        }
        // Sort by time (most recent first, best effort)
        this.recentActivity = this.recentActivity.slice(0, 6);

        this.isLoading = false;
      });

    // ── Grade Distribution (separate call) ─────────────────────────────────────
    this.gradeService.getGradeStats()
      .pipe(catchError(() => of({ success: false, data: null })))
      .subscribe((res: any) => {
        const byGrade: { grade: string; count: number }[] = res?.data?.byGradeLetter || [];
        if (byGrade.length > 0) {
          const gradeMap: Record<string, number> = {};
          byGrade.forEach(g => gradeMap[g.grade] = g.count);
          const labels = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
          this.gradeChartData = {
            ...this.gradeChartData,
            datasets: [{ ...this.gradeChartData.datasets[0],
              data: labels.map(l => gradeMap[l] || 0),
            }],
          };
        }
      });
  }

  private formatTime(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1)  return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24)  return `${diffHrs} hr ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch { return ''; }
  }

  getUserDisplayName(): string {
    const user = this.authService.getCurrentUserValue();
    if (user) return `${user.firstName} ${user.lastName}`;
    return 'Admin';
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  navigateTo(route: string) { this.router.navigate([route]); }
}
