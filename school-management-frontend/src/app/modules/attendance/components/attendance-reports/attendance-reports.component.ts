import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AttendanceService } from '../../../../services/attendance.service';
import { ClassService } from '../../../../services/class.service';
import { NotificationService } from '../../../../services/notification.service';
import { ReportExportService } from '../../../../services/report-export.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './attendance-reports.component.html',
  styleUrl: './attendance-reports.component.scss',
})
export class AttendanceReportsComponent implements OnInit {
  filterForm: FormGroup;
  classes: any[] = [];
  reportData: any[] = [];
  stats: any = null;
  isLoading = false;
  loadingClasses = false;
  hasSearched = false;
  columns = ['studentName', 'present', 'absent', 'late', 'total', 'percentage'];

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private classService: ClassService,
    private notificationService: NotificationService,
    private exportService: ReportExportService,
  ) {
    this.filterForm = this.fb.group({
      classId:   [''],
      startDate: [this.defaultStart(), Validators.required],
      endDate:   [this.today(),        Validators.required],
    });
  }

  ngOnInit() {
    this.loadClasses();
    this.generateReport();
  }

  loadClasses() {
    this.loadingClasses = true;
    (this.classService as any).getClasses({ limit: 100 })
      .pipe(catchError(() => of({ data: [] })))
      .subscribe((res: any) => {
        this.classes = res.data?.items || res.data || [];
        this.loadingClasses = false;
      });
  }

  generateReport() {
    if (this.filterForm.invalid) return;
    this.isLoading = true;
    this.hasSearched = true;
    const { classId, startDate, endDate } = this.filterForm.value;
    const params: any = {
      startDate: this.formatDate(startDate),
      endDate:   this.formatDate(endDate),
    };
    if (classId) params.classId = classId;

    this.attendanceService.getAttendanceReport(params)
      .pipe(catchError(() => of({ success: false, data: [] })))
      .subscribe((res: any) => {
        this.reportData = res.data?.items || res.data || [];
        this.isLoading = false;
        this.computeStats();
      });
  }

  computeStats() {
    if (!this.reportData.length) { this.stats = null; return; }
    const total   = this.reportData.length;
    const avgPct  = this.reportData.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / total;
    const below75 = this.reportData.filter((r: any) => (r.percentage || 0) < 75).length;
    this.stats = { total, avgPct: Math.round(avgPct), below75 };
  }

  exportCSV() {
    if (!this.reportData.length) return;
    const rows = this.reportData.map((r: any) => ({
      'Student Name': r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim(),
      Present:    r.present   || 0,
      Absent:     r.absent    || 0,
      Late:       r.late      || 0,
      Total:      r.total     || 0,
      'Percentage %': r.percentage || 0,
    }));
    this.exportService.downloadCSV(rows, 'attendance-report');
  }

  private formatDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    return d.toISOString().split('T')[0];
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private defaultStart(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }

  getAttendanceClass(pct: number): string {
    if (pct >= 90) return 'pct-high';
    if (pct >= 75) return 'pct-medium';
    return 'pct-low';
  }

  getStudentName(r: any): string {
    return r.studentName || `${r.student?.firstName || r.student?.first_name || ''} ${r.student?.lastName || r.student?.last_name || ''}`.trim() || '—';
  }
}
