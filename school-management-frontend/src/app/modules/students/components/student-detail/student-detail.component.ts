import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StudentService } from '../../../../services/student.service';
import { FeeService } from '../../../../services/fee.service';
import { NotificationService } from '../../../../services/notification.service';
import { Student } from '../../../../models/student.model';
import { StudentFormComponent } from '../student-form/student-form.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTabsModule, MatProgressSpinnerModule, MatTableModule,
    MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss',
})
export class StudentDetailComponent implements OnInit {
  student: Student | null = null;
  isLoading = true;
  studentId = '';

  // Attendance tab
  attendanceRecords: any[] = [];
  attendanceSummary: any = null;
  loadingAttendance = false;

  // Grades tab
  gradeRecords: any[] = [];
  loadingGrades = false;

  // Fees tab
  feeRecords: any[] = [];
  loadingFees = false;

  attendanceColumns = ['date', 'status', 'subject'];
  gradeColumns = ['subject', 'assessment', 'marks', 'percentage', 'grade'];
  feeColumns = ['category', 'amount', 'dueDate', 'status'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private feeService: FeeService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.studentId = this.route.snapshot.params['id'];
    this.loadStudent();
  }

  loadStudent() {
    this.isLoading = true;
    this.studentService.getStudent(this.studentId).subscribe({
      next: (res) => {
        if (res.success && res.data) this.student = res.data;
        this.isLoading = false;
        this.loadTabData();
      },
      error: () => {
        this.notificationService.error('Failed to load student details');
        this.isLoading = false;
        this.router.navigate(['/students']);
      },
    });
  }

  loadTabData() {
    this.loadAttendance();
    this.loadGrades();
    this.loadFees();
  }

  loadAttendance() {
    this.loadingAttendance = true;
    this.studentService.getStudentAttendance(this.studentId, { limit: 30 }).subscribe({
      next: (res: any) => {
        this.attendanceRecords = res.data?.records || res.data || [];
        this.attendanceSummary = res.data?.summary || null;
        this.loadingAttendance = false;
      },
      error: () => { this.loadingAttendance = false; },
    });
  }

  loadGrades() {
    this.loadingGrades = true;
    this.studentService.getStudentGrades(this.studentId).subscribe({
      next: (res: any) => {
        this.gradeRecords = res.data || [];
        this.loadingGrades = false;
      },
      error: () => { this.loadingGrades = false; },
    });
  }

  loadFees() {
    this.loadingFees = true;
    this.studentService.getStudentFees(this.studentId).subscribe({
      next: (res: any) => {
        this.feeRecords = res.data || [];
        this.loadingFees = false;
      },
      error: () => { this.loadingFees = false; },
    });
  }

  openEditDialog() {
    if (!this.student) return;
    const ref = this.dialog.open(StudentFormComponent, {
      width: '700px', maxHeight: '90vh', data: this.student,
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadStudent(); });
  }

  deleteStudent() {
    if (!this.student) return;
    if (!confirm(`Delete ${this.getStudentName()}? This cannot be undone.`)) return;
    this.studentService.deleteStudent(this.studentId).subscribe({
      next: () => {
        this.notificationService.success('Student deleted');
        this.router.navigate(['/students']);
      },
      error: () => this.notificationService.error('Failed to delete student'),
    });
  }

  goBack() { this.router.navigate(['/students']); }

  getStudentName(): string {
    if (!this.student) return '';
    return `${this.student.user.firstName} ${this.student.user.lastName}`;
  }

  getClassName(): string {
    return (this.student as any)?.class?.name || 'Not Assigned';
  }

  getAge(): number {
    if (!this.student?.dateOfBirth) return 0;
    const birth = new Date(this.student.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  getAttendancePct(): number {
    if (!this.attendanceSummary) return 0;
    const { present = 0, total = 0 } = this.attendanceSummary;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  getGradeColor(letter: string): string {
    const map: Record<string, string> = {
      'A+': '#10b981', 'A': '#22c55e', 'B+': '#3b82f6', 'B': '#60a5fa',
      'C+': '#f59e0b', 'C': '#fbbf24', 'D': '#f97316', 'F': '#ef4444',
    };
    return map[letter] || '#64748b';
  }

  getFeeStatusClass(status: string): string {
    return { paid: 'chip-success', pending: 'chip-warn', overdue: 'chip-danger', partial: 'chip-info' }[status] || '';
  }

  formatAmount(val: any): string {
    return parseFloat(val || 0).toLocaleString('en-IN');
  }
}
