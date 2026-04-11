import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../../services/auth.service';
import { DashboardService } from '../../../../services/dashboard.service';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './parent-dashboard.component.html',
  styleUrl: './parent-dashboard.component.scss'
})
export class ParentDashboardComponent implements OnInit {
  isLoading = true;
  data: any = null;
  selectedChildIndex = 0;
  today = new Date();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.dashboardService.getParentDashboard().subscribe({
      next: (res) => {
        if (res.success) this.data = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get userName(): string {
    const u = this.authService.getCurrentUserValue();
    return u ? `${u.firstName} ${u.lastName}` : 'Parent';
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get children(): any[] {
    return this.data?.children ?? [];
  }

  get selectedChild(): any {
    return this.children[this.selectedChildIndex] ?? null;
  }

  selectChild(index: number) {
    this.selectedChildIndex = index;
  }

  getAttendanceColor(pct: number): string {
    if (pct >= 75) return '#16a34a';
    if (pct >= 60) return '#d97706';
    return '#dc2626';
  }

  getFeeStatusColor(child: any): string {
    if (child.fees?.overdue > 0) return '#dc2626';
    if (child.fees?.pending > 0) return '#d97706';
    return '#16a34a';
  }

  getFeeStatusLabel(child: any): string {
    if (child.fees?.overdue > 0) return 'Overdue';
    if (child.fees?.pending > 0) return 'Pending';
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

  getInitials(name: string): string {
    return name?.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  getAvatarGradient(name: string): string {
    const GRADIENTS = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#ec4899,#f43f5e)',
      'linear-gradient(135deg,#3b82f6,#06b6d4)',
      'linear-gradient(135deg,#22c55e,#10b981)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
    ];
    const code = (name?.charCodeAt(0) ?? 0) + (name?.charCodeAt(1) ?? 0);
    return GRADIENTS[code % GRADIENTS.length];
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
