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
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss'
})
export class TeacherDashboardComponent implements OnInit {
  isLoading = true;
  data: any = null;
  today = new Date();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.dashboardService.getTeacherDashboard().subscribe({
      next: (res) => {
        if (res.success) this.data = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get userName(): string {
    const u = this.authService.getCurrentUserValue();
    return u ? `${u.firstName} ${u.lastName}` : 'Teacher';
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getGradeColor(grade: string): string {
    const g = (grade || '').toUpperCase();
    if (g.startsWith('A')) return '#16a34a';
    if (g.startsWith('B')) return '#2563eb';
    if (g.startsWith('C')) return '#d97706';
    if (g.startsWith('D')) return '#ea580c';
    return '#dc2626';
  }

  getAttendancePct(cls: any): number {
    return cls.studentCount > 0 ? 100 : 0;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
