import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../../services/auth.service';
import { DashboardService } from '../../../../services/dashboard.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  isLoading = true;
  data: any = null;
  today = new Date();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.dashboardService.getStudentDashboard().subscribe({
      next: (res) => {
        if (res.success) this.data = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get userName(): string {
    const u = this.authService.getCurrentUserValue();
    return u ? `${u.firstName} ${u.lastName}` : 'Student';
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get attendancePct(): number {
    return this.data?.attendance?.percentage ?? 0;
  }

  get attendanceColor(): string {
    const p = this.attendancePct;
    if (p >= 75) return '#16a34a';
    if (p >= 60) return '#d97706';
    return '#dc2626';
  }

  get feeStatusColor(): string {
    const f = this.data?.fees;
    if (!f) return '#94a3b8';
    if (f.overdue > 0) return '#dc2626';
    if (f.pending > 0) return '#d97706';
    return '#16a34a';
  }

  get feeStatusLabel(): string {
    const f = this.data?.fees;
    if (!f) return '—';
    if (f.overdue > 0) return 'Overdue';
    if (f.pending > 0) return 'Pending';
    return 'Clear';
  }

  getGradeColor(grade: string): string {
    const g = (grade || '').toUpperCase();
    if (g.startsWith('A')) return '#16a34a';
    if (g.startsWith('B')) return '#2563eb';
    if (g.startsWith('C')) return '#d97706';
    if (g.startsWith('D')) return '#ea580c';
    return '#dc2626';
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
