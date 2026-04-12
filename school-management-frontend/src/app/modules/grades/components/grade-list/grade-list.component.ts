import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { GradeService } from '../../../../services/grade.service';
import { AcademicService } from '../../../../services/academic.service';
import { ClassService } from '../../../../services/class.service';
import { StudentService } from '../../../../services/student.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-grade-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDividerModule, MatPaginatorModule,
  ],
  templateUrl: './grade-list.component.html',
  styleUrl: './grade-list.component.scss',
})
export class GradeListComponent implements OnInit {
  grades: any[] = [];
  stats: any = null;
  loading = false;
  submitting = false;
  showForm = false;
  isTeacherOrAdmin = false;

  // Dropdown data
  classes: any[] = [];
  students: any[] = [];
  subjects: any[] = [];
  assessmentTypes: any[] = [];
  semesters: any[] = [];
  loadingDropdowns = false;

  // Filters
  filterClassId = '';
  filterSubjectId = '';
  filterSemesterId = '';

  // Pagination
  totalGrades = 0;
  gradePage = 0;
  gradePageSize = 20;

  columns = ['student', 'subject', 'assessment', 'semester', 'marks', 'percentage', 'grade', 'actions'];

  gradeForm: FormGroup;

  constructor(
    private gradeService: GradeService,
    private academicService: AcademicService,
    private classService: ClassService,
    private studentService: StudentService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.gradeForm = this.fb.group({
      classId:          [''],
      studentId:        ['', Validators.required],
      subjectId:        ['', Validators.required],
      assessmentTypeId: ['', Validators.required],
      semesterId:       ['', Validators.required],
      marksObtained:    [0, [Validators.required, Validators.min(0)]],
      totalMarks:       [100, [Validators.required, Validators.min(1)]],
      remarks:          [''],
    });
  }

  ngOnInit() {
    this.isTeacherOrAdmin = this.authService.isAdmin() || this.authService.isTeacher() || this.authService.isStaff();
    this.loadDropdowns();
    this.loadGrades();
    this.loadStats();
  }

  loadDropdowns() {
    this.loadingDropdowns = true;
    forkJoin({
      classes:         (this.classService as any).getClasses({ limit: 100 }).pipe(catchError(() => of({ data: [] }))),
      subjects:        this.academicService.getSubjects({ limit: 200 }).pipe(catchError(() => of({ data: [] }))),
      assessmentTypes: this.gradeService.getAssessmentTypes({ limit: 50 }).pipe(catchError(() => of({ data: [] }))),
      semesters:       this.academicService.getSemesters({ limit: 50 }).pipe(catchError(() => of({ data: [] }))),
    }).subscribe({
      next: ({ classes, subjects, assessmentTypes, semesters }) => {
        this.classes         = (classes as any).data?.items || (classes as any).data || [];
        this.subjects        = (subjects as any).data?.items || (subjects as any).data || [];
        this.assessmentTypes = (assessmentTypes as any).data?.items || (assessmentTypes as any).data || [];
        this.semesters       = (semesters as any).data?.items || (semesters as any).data || [];
        this.loadingDropdowns = false;
      },
      error: () => { this.loadingDropdowns = false; },
    });
  }

  onClassChange(classId: string) {
    if (!classId) { this.students = []; return; }
    this.studentService.getStudentsByClass(classId).subscribe({
      next: (res: any) => { this.students = res.data?.items || res.data || []; },
    });
  }

  loadGrades() {
    this.loading = true;
    const params: any = { limit: this.gradePageSize, page: this.gradePage + 1 };
    if (this.filterClassId)   params.classId   = this.filterClassId;
    if (this.filterSubjectId) params.subjectId = this.filterSubjectId;
    if (this.filterSemesterId) params.semesterId = this.filterSemesterId;

    this.gradeService.getGrades(params).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.grades = res.data?.items || res.data || [];
        this.totalGrades = res.data?.pagination?.total || 0;
      },
      error: () => { this.loading = false; },
    });
  }

  loadStats() {
    const params: any = {};
    if (this.filterClassId)   params.classId   = this.filterClassId;
    if (this.filterSubjectId) params.subjectId = this.filterSubjectId;
    if (this.filterSemesterId) params.semesterId = this.filterSemesterId;
    this.gradeService.getGradeStats(params).subscribe({
      next: (res) => { if (res.success) this.stats = res.data; },
      error: () => {},
    });
  }

  applyFilters() {
    this.gradePage = 0;
    this.loadGrades();
    this.loadStats();
  }

  onPageChange(e: PageEvent) {
    this.gradePage = e.pageIndex;
    this.gradePageSize = e.pageSize;
    this.loadGrades();
  }

  submitGrade() {
    if (this.gradeForm.invalid) return;
    this.submitting = true;
    const { classId, ...payload } = this.gradeForm.value;
    this.gradeService.createGrade(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.notificationService.success('Grade recorded successfully');
        this.gradeForm.reset({ totalMarks: 100, marksObtained: 0 });
        this.showForm = false;
        this.loadGrades();
        this.loadStats();
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.error(err?.error?.message || 'Failed to save grade');
      },
    });
  }

  deleteGrade(grade: any) {
    if (!confirm('Delete this grade record?')) return;
    this.gradeService.deleteGrade(grade.id).subscribe({
      next: () => {
        this.notificationService.success('Grade deleted');
        this.loadGrades();
        this.loadStats();
      },
      error: () => this.notificationService.error('Failed to delete grade'),
    });
  }

  getGradeColor(letter: string): string {
    const map: Record<string, string> = {
      'A+': '#10b981', 'A': '#22c55e', 'B+': '#3b82f6', 'B': '#60a5fa',
      'C+': '#f59e0b', 'C': '#fbbf24', 'D': '#f97316', 'F': '#ef4444',
    };
    return map[letter] || '#64748b';
  }
}
