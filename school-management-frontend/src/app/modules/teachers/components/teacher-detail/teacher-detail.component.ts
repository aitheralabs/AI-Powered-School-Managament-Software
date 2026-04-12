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

import { TeacherService } from '../../../../services/teacher.service';
import { NotificationService } from '../../../../services/notification.service';
import { Teacher } from '../../../../models/teacher.model';
import { TeacherFormComponent } from '../teacher-form/teacher-form.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTabsModule, MatProgressSpinnerModule,
    MatTableModule, MatChipsModule,
  ],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.scss',
})
export class TeacherDetailComponent implements OnInit {
  teacher: Teacher | null = null;
  isLoading = true;
  teacherId = '';

  // Classes & Subjects tab
  teacherClasses: any[] = [];
  teacherSubjects: any[] = [];
  loadingClassesSubjects = false;
  classColumns = ['name', 'section', 'grade'];
  subjectColumns = ['name', 'code'];

  // Schedule tab
  scheduleRecords: any[] = [];
  loadingSchedule = false;
  scheduleColumns = ['day', 'period', 'subject', 'class', 'time'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.teacherId = this.route.snapshot.params['id'];
    this.loadTeacher();
  }

  loadTeacher() {
    this.isLoading = true;
    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teacher = response.data;
        }
        this.isLoading = false;
        this.loadTabData();
      },
      error: () => {
        this.notificationService.error('Failed to load teacher details');
        this.isLoading = false;
        this.router.navigate(['/teachers']);
      },
    });
  }

  loadTabData() {
    this.loadClassesAndSubjects();
    this.loadSchedule();
  }

  loadClassesAndSubjects() {
    this.loadingClassesSubjects = true;
    forkJoin({
      classes:  this.teacherService.getTeacherClasses(this.teacherId).pipe(catchError(() => of({ data: [] }))),
      subjects: this.teacherService.getTeacherSubjects(this.teacherId).pipe(catchError(() => of({ data: [] }))),
    }).subscribe({
      next: ({ classes, subjects }) => {
        this.teacherClasses  = (classes as any).data?.items  || (classes as any).data  || [];
        this.teacherSubjects = (subjects as any).data?.items || (subjects as any).data || [];
        this.loadingClassesSubjects = false;
      },
      error: () => { this.loadingClassesSubjects = false; },
    });
  }

  loadSchedule() {
    this.loadingSchedule = true;
    this.teacherService.getTeacherSchedule(this.teacherId).subscribe({
      next: (res: any) => {
        this.scheduleRecords = res.data?.items || res.data || [];
        this.loadingSchedule = false;
      },
      error: () => { this.loadingSchedule = false; },
    });
  }

  openEditDialog() {
    if (!this.teacher) return;
    const ref = this.dialog.open(TeacherFormComponent, {
      width: '700px', maxHeight: '90vh', data: this.teacher,
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadTeacher(); });
  }

  deleteTeacher() {
    if (!this.teacher) return;
    if (!confirm(`Delete ${this.getTeacherName()}? This cannot be undone.`)) return;
    this.teacherService.deleteTeacher(this.teacher.id).subscribe({
      next: () => {
        this.notificationService.success('Teacher deleted successfully');
        this.router.navigate(['/teachers']);
      },
      error: () => this.notificationService.error('Failed to delete teacher'),
    });
  }

  goBack() { this.router.navigate(['/teachers']); }

  getTeacherName(): string {
    if (!this.teacher) return '';
    return `${this.teacher.user.firstName} ${this.teacher.user.lastName}`;
  }

  getSubjectCount(): number { return this.teacher?.subjects?.length || this.teacherSubjects.length; }
  getClassCount():   number { return this.teacher?.classes?.length  || this.teacherClasses.length;  }
}
