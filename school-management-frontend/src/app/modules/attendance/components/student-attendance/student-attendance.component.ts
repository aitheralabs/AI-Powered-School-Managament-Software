import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AttendanceService } from '../../../../services/attendance.service';
import { Attendance, AttendanceStatus } from '../../../../models/attendance.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatTableModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatTooltipModule, MatDividerModule,
  ],
  template: `
    <div class="student-attendance" style="padding:24px; max-width:1000px; margin:0 auto">

      <!-- Summary cards -->
      <div *ngIf="summary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:24px">
        <mat-card style="text-align:center;padding:16px">
          <div style="font-size:2rem;font-weight:700;color:#3b82f6">{{ summary.totalDays ?? 0 }}</div>
          <div style="color:#64748b;font-size:.85rem">Total Days</div>
        </mat-card>
        <mat-card style="text-align:center;padding:16px">
          <div style="font-size:2rem;font-weight:700;color:#22c55e">{{ summary.presentDays ?? 0 }}</div>
          <div style="color:#64748b;font-size:.85rem">Present</div>
        </mat-card>
        <mat-card style="text-align:center;padding:16px">
          <div style="font-size:2rem;font-weight:700;color:#ef4444">{{ summary.absentDays ?? 0 }}</div>
          <div style="color:#64748b;font-size:.85rem">Absent</div>
        </mat-card>
        <mat-card style="text-align:center;padding:16px">
          <div style="font-size:2rem;font-weight:700;color:#f59e0b">{{ summary.lateDays ?? 0 }}</div>
          <div style="color:#64748b;font-size:.85rem">Late</div>
        </mat-card>
        <mat-card style="text-align:center;padding:16px">
          <div style="font-size:2rem;font-weight:700"
               [style.color]="(summary.attendancePercentage ?? 0) >= 75 ? '#22c55e' : '#ef4444'">
            {{ summary.attendancePercentage ?? 0 | number:'1.1-1' }}%
          </div>
          <div style="color:#64748b;font-size:.85rem">Attendance %</div>
        </mat-card>
      </div>

      <!-- Date filter + records table -->
      <mat-card>
        <mat-card-header style="padding:16px 16px 0">
          <mat-card-title>
            <mat-icon style="vertical-align:middle;margin-right:8px">history</mat-icon>
            Attendance Records
          </mat-card-title>
          <span style="flex:1"></span>
          <!-- Date range filters -->
          <mat-form-field appearance="outline" style="width:155px;margin-right:8px">
            <mat-label>From</mat-label>
            <input matInput [matDatepicker]="fromPicker" [(ngModel)]="startDate" (dateChange)="loadData()">
            <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:155px">
            <mat-label>To</mat-label>
            <input matInput [matDatepicker]="toPicker" [(ngModel)]="endDate" (dateChange)="loadData()">
            <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </mat-form-field>
        </mat-card-header>

        <mat-card-content style="padding:16px">
          <div *ngIf="isLoading" style="display:flex;justify-content:center;padding:40px">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div *ngIf="!isLoading && records.length === 0" style="text-align:center;padding:40px;color:#94a3b8">
            <mat-icon style="font-size:48px;height:48px;width:48px">event_busy</mat-icon>
            <p>No attendance records found for the selected period.</p>
          </div>

          <table *ngIf="!isLoading && records.length > 0" mat-table [dataSource]="records" style="width:100%">

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.date | date:'mediumDate' }}</td>
            </ng-container>

            <ng-container matColumnDef="day">
              <th mat-header-cell *matHeaderCellDef>Day</th>
              <td mat-cell *matCellDef="let r">{{ r.date | date:'EEEE' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span [ngStyle]="statusStyle(r.status)"
                      style="padding:4px 12px;border-radius:12px;font-size:.8rem;font-weight:600;text-transform:capitalize">
                  {{ r.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="remarks">
              <th mat-header-cell *matHeaderCellDef>Remarks</th>
              <td mat-cell *matCellDef="let r" style="color:#64748b">{{ r.remarks || '—' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <p *ngIf="errorMsg" style="color:#ef4444;margin-top:12px">{{ errorMsg }}</p>
    </div>
  `
})
export class StudentAttendanceComponent implements OnInit {
  studentId: string | null = null;
  isLoading = false;
  errorMsg = '';

  records: Attendance[] = [];
  summary: any = null;
  columns = ['date', 'day', 'status', 'remarks'];

  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private attendanceService: AttendanceService,
  ) {}

  ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('studentId');
    // Default to current month
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.loadData();
  }

  loadData() {
    if (!this.studentId) return;
    this.isLoading = true;
    this.errorMsg = '';

    const params: any = {};
    if (this.startDate) params.startDate = this.fmt(this.startDate);
    if (this.endDate)   params.endDate   = this.fmt(this.endDate);

    // Load records and summary in parallel
    this.attendanceService.getStudentAttendance(this.studentId, params)
      .pipe(catchError(() => of({ data: [] })))
      .subscribe((res: any) => {
        this.records = (res.data || []).sort((a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.isLoading = false;
      });

    this.attendanceService.getAttendanceSummary(this.studentId, params)
      .pipe(catchError(() => of({ data: null })))
      .subscribe((res: any) => {
        this.summary = res.data;
      });
  }

  statusStyle(status: AttendanceStatus): Record<string, string> {
    const map: Record<string, Record<string, string>> = {
      present:  { background: '#dcfce7', color: '#16a34a' },
      absent:   { background: '#fee2e2', color: '#dc2626' },
      late:     { background: '#fef9c3', color: '#ca8a04' },
      excused:  { background: '#e0f2fe', color: '#0369a1' },
    };
    return map[status] ?? { background: '#f1f5f9', color: '#475569' };
  }

  private fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
