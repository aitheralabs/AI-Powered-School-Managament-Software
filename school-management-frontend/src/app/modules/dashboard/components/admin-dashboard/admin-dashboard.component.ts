import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

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

import { StudentService } from '../../../../services/student.service';
import { TeacherService } from '../../../../services/teacher.service';
import { AttendanceService } from '../../../../services/attendance.service';
import { FeeService } from '../../../../services/fee.service';
import { AuthService } from '../../../../services/auth.service';

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
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    BaseChartDirective
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = true;
  currentDate = new Date();

  kpiCards: KpiCard[] = [];

  recentActivity: ActivityItem[] = [
    { icon: 'person_add', iconClass: 'success', title: 'New Student Enrolled', description: 'Rahul Kumar enrolled in Class 10-A', time: '2 min ago' },
    { icon: 'payment', iconClass: 'primary', title: 'Fee Payment Received', description: '₹12,500 received from Priya Sharma', time: '18 min ago' },
    { icon: 'how_to_reg', iconClass: 'info', title: 'Attendance Marked', description: 'Class 9-B attendance marked — 28/30 present', time: '1 hr ago' },
    { icon: 'grade', iconClass: 'warning', title: 'Grades Submitted', description: 'Mid-term results entered for Class 8-A', time: '3 hr ago' },
    { icon: 'announcement', iconClass: 'accent', title: 'Notice Published', description: 'Annual Sports Day announcement posted', time: '5 hr ago' },
    { icon: 'event', iconClass: 'secondary', title: 'Exam Scheduled', description: 'Final exams scheduled for Jan 15–25', time: 'Yesterday' }
  ];

  quickActions = [
    { icon: 'person_add', label: 'Add Student', route: '/students/add', color: 'primary' },
    { icon: 'how_to_reg', label: 'Mark Attendance', route: '/attendance', color: 'accent' },
    { icon: 'payment', label: 'Record Payment', route: '/fees/payments', color: 'primary' },
    { icon: 'grade', label: 'Enter Grades', route: '/grades', color: 'accent' },
    { icon: 'description', label: 'Report Cards', route: '/reports/report-cards', color: 'primary' },
    { icon: 'psychology', label: 'AI Insights', route: '/ai-insights', color: 'warn' }
  ];

  // Revenue Line Chart
  revenueChartData: ChartData<'line'> = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Fee Collection (₹)',
        data: [420000, 380000, 510000, 490000, 620000, 580000, 710000, 650000, 780000, 720000, 850000, 920000],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.12)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }
    ]
  };

  revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${(ctx.raw as number).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          font: { size: 11 },
          callback: (v) => `₹${(Number(v) / 1000).toFixed(0)}K`
        }
      }
    }
  };

  // Attendance Bar Chart
  attendanceChartData: ChartData<'bar'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Present',
        data: [285, 292, 278, 301, 295, 210],
        backgroundColor: 'rgba(67, 233, 123, 0.85)',
        borderRadius: 6,
        borderSkipped: false
      },
      {
        label: 'Absent',
        data: [35, 28, 42, 19, 25, 40],
        backgroundColor: 'rgba(245, 87, 108, 0.75)',
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  attendanceChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } }
    },
    scales: {
      x: { grid: { display: false }, stacked: false },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, stacked: false }
    }
  };

  // Grade Distribution Doughnut
  gradeChartData: ChartData<'doughnut'> = {
    labels: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    datasets: [{
      data: [18, 25, 22, 18, 8, 5, 3, 1],
      backgroundColor: ['#667eea', '#764ba2', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#f093fb', '#f5576c'],
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  gradeChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 11 }, padding: 12, boxWidth: 14 } }
    },
    cutout: '65%'
  };

  // Fee Status Doughnut
  feeStatusChartData: ChartData<'doughnut'> = {
    labels: ['Paid', 'Pending', 'Overdue'],
    datasets: [{
      data: [68, 22, 10],
      backgroundColor: ['#43e97b', '#f093fb', '#f5576c'],
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  feeStatusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } }
    },
    cutout: '65%'
  };

  constructor(
    private studentService: StudentService,
    private teacherService: TeacherService,
    private attendanceService: AttendanceService,
    private feeService: FeeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.buildKpiCards(0, 0, 0, 0, 0, 0);
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading = true;
    const today = new Date().toISOString().split('T')[0];

    forkJoin({
      students: this.studentService.getStudentStats().pipe(catchError(() => of({ success: false, data: null }))),
      teachers: this.teacherService.getTeacherStats().pipe(catchError(() => of({ success: false, data: null }))),
      attendance: this.attendanceService.getAttendanceStats({ date: today }).pipe(catchError(() => of({ success: false, data: null }))),
      fees: this.feeService.getFeeStats().pipe(catchError(() => of({ success: false, data: null })))
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ students, teachers, attendance, fees }) => {
        const totalStudents = students?.data?.total ?? 0;
        const totalTeachers = teachers?.data?.total ?? 0;
        const attendancePct = attendance?.data?.percentage ?? 0;
        const present = attendance?.data?.present ?? 0;
        const feeCollected = fees?.data?.collected ?? 0;
        const feePending = fees?.data?.pending ?? 0;
        const feePct = fees?.data?.collectionPercentage ?? 0;

        this.buildKpiCards(totalStudents, totalTeachers, attendancePct, present, feeCollected, feePct);

        // Update fee status chart with real data
        if (fees?.data) {
          const overdueAmt = fees.data.overdueAmount || 0;
          const total = (fees.data.collected || 0) + (fees.data.pending || 0) + overdueAmt;
          if (total > 0) {
            this.feeStatusChartData = {
              ...this.feeStatusChartData,
              datasets: [{
                ...this.feeStatusChartData.datasets[0],
                data: [
                  Math.round((fees.data.collected / total) * 100),
                  Math.round((fees.data.pending / total) * 100),
                  Math.round((overdueAmt / total) * 100)
                ]
              }]
            };
          }
        }

        this.isLoading = false;
      },
      error: () => {
        this.buildKpiCards(0, 0, 0, 0, 0, 0);
        this.isLoading = false;
      }
    });
  }

  private buildKpiCards(
    students: number, teachers: number, attendancePct: number,
    present: number, feeCollected: number, feePct: number
  ) {
    this.kpiCards = [
      {
        title: 'Total Students',
        value: students.toLocaleString(),
        subtitle: 'Currently enrolled',
        icon: 'school',
        colorClass: 'purple',
        trend: { value: 5.2, direction: 'up', label: 'vs last month' }
      },
      {
        title: 'Total Teachers',
        value: teachers.toLocaleString(),
        subtitle: 'Active faculty',
        icon: 'person',
        colorClass: 'pink',
        trend: { value: 2.1, direction: 'up', label: 'vs last month' }
      },
      {
        title: "Today's Attendance",
        value: `${attendancePct.toFixed(1)}%`,
        subtitle: `${present} students present`,
        icon: 'how_to_reg',
        colorClass: 'blue',
        progress: attendancePct,
        trend: { value: 1.3, direction: attendancePct > 80 ? 'up' : 'down', label: 'vs yesterday' }
      },
      {
        title: 'Fee Collection',
        value: `${feePct.toFixed(1)}%`,
        subtitle: `₹${feeCollected.toLocaleString('en-IN')} collected`,
        icon: 'payments',
        colorClass: 'green',
        progress: feePct,
        trend: { value: 8.4, direction: 'up', label: 'vs last month' }
      },
      {
        title: 'Active Classes',
        value: '24',
        subtitle: '6 academic sections',
        icon: 'class',
        colorClass: 'orange',
        trend: { value: 0, direction: 'neutral', label: 'no change' }
      },
      {
        title: 'Pending Dues',
        value: '₹3.2L',
        subtitle: '42 students overdue',
        icon: 'warning',
        colorClass: 'red',
        trend: { value: 3.1, direction: 'down', label: 'vs last month' }
      }
    ];
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

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
