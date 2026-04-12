import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';

import { GradeService } from '../../../../services/grade.service';
import { AcademicService } from '../../../../services/academic.service';
import { ClassService } from '../../../../services/class.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-report-cards',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatPaginatorModule, MatDividerModule,
  ],
  templateUrl: './report-cards.component.html',
  styleUrl:    './report-cards.component.scss',
})
export class ReportCardsComponent implements OnInit {
  reportCards: any[] = [];
  loading = false;
  generating = false;
  isAdmin = false;

  classes:   any[] = [];
  semesters: any[] = [];

  filterClassId    = '';
  filterSemesterId = '';

  // Generate bulk
  genClassId    = '';
  genSemesterId = '';

  total    = 0;
  page     = 0;
  pageSize = 20;

  columns = ['student', 'semester', 'percentage', 'grade', 'rank', 'actions'];

  constructor(
    private gradeService: GradeService,
    private academicService: AcademicService,
    private classService: ClassService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin() || this.authService.isStaff() || this.authService.isTeacher();
    this.loadDropdowns();
    this.loadReportCards();
  }

  loadDropdowns() {
    forkJoin({
      classes:   (this.classService as any).getClasses({ limit: 100 }).pipe(catchError(() => of({ data: [] }))),
      semesters: this.academicService.getSemesters({ limit: 50 }).pipe(catchError(() => of({ data: [] }))),
    }).subscribe(({ classes, semesters }: any) => {
      this.classes   = classes.data?.items  || classes.data  || [];
      this.semesters = semesters.data?.items || semesters.data || [];
    });
  }

  loadReportCards() {
    this.loading = true;
    const params: any = { limit: this.pageSize, page: this.page + 1 };
    if (this.filterClassId)    params.classId    = this.filterClassId;
    if (this.filterSemesterId) params.semesterId = this.filterSemesterId;

    this.gradeService.getReportCards(params).subscribe({
      next: (res: any) => {
        this.reportCards = res.data?.items || res.data || [];
        this.total       = res.data?.pagination?.total || 0;
        this.loading     = false;
      },
      error: () => { this.loading = false; },
    });
  }

  applyFilters() { this.page = 0; this.loadReportCards(); }
  onPageChange(e: PageEvent) { this.page = e.pageIndex; this.pageSize = e.pageSize; this.loadReportCards(); }

  generateForClass() {
    if (!this.genClassId || !this.genSemesterId) {
      this.notificationService.error('Select class and semester first');
      return;
    }
    this.generating = true;
    this.gradeService.generateClassReportCards(this.genClassId, this.genSemesterId).subscribe({
      next: () => {
        this.notificationService.success('Report cards generated successfully');
        this.generating = false;
        this.loadReportCards();
      },
      error: (err) => {
        this.notificationService.error(err?.error?.message || 'Failed to generate report cards');
        this.generating = false;
      },
    });
  }

  downloadPDF(rc: any) {
    this.gradeService.downloadReportCard(rc.id, 'pdf').subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `report-card-${rc.id}.pdf`; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Download failed'),
    });
  }

  getStudentName(rc: any): string {
    const s = rc.student;
    if (!s) return '—';
    return `${s.user?.firstName || s.firstName || ''} ${s.user?.lastName || s.lastName || ''}`.trim();
  }

  getGradeColor(letter: string): string {
    const map: Record<string, string> = {
      'A+': '#10b981', 'A': '#22c55e', 'B+': '#3b82f6', 'B': '#60a5fa',
      'C+': '#f59e0b', 'C': '#fbbf24', 'D': '#f97316', 'F': '#ef4444',
    };
    return map[letter] || '#64748b';
  }
}
