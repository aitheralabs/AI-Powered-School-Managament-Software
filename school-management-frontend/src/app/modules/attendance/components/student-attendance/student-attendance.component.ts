import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttendanceService } from '../../../../services/attendance.service';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="student-attendance" style="padding:24px">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon style="vertical-align:middle;margin-right:8px">person_search</mat-icon>
            Student Attendance
          </mat-card-title>
          <mat-card-subtitle *ngIf="studentId">Student ID: {{ studentId }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content style="padding:24px 0 8px">
          <div *ngIf="isLoading" style="display:flex;justify-content:center;padding:40px">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          <p *ngIf="!isLoading" style="color:#64748b">
            Detailed student attendance records will be displayed here.
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class StudentAttendanceComponent implements OnInit {
  studentId: string | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('studentId');
  }
}
