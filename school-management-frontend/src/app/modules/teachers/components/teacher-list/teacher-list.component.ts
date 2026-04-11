import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TeacherService } from '../../../../services/teacher.service';
import { NotificationService } from '../../../../services/notification.service';
import { Teacher } from '../../../../models/teacher.model';
import { TeacherFormComponent } from '../teacher-form/teacher-form.component';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.scss'
})
export class TeacherListComponent implements OnInit {
  teachers: Teacher[] = [];
  displayedColumns: string[] = ['name', 'employeeId', 'specialization', 'subjects', 'actions'];
  isLoading = false;
  searchQuery = '';
  searchFocused = false;
  
  // Pagination
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private teacherService: TeacherService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTeachers();
  }

  loadTeachers() {
    this.isLoading = true;
    const params = {
      page: this.pageIndex + 1,
      limit: this.pageSize,
      search: this.searchQuery || undefined
    };

    this.teacherService.getTeachers(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teachers = response.data.items;
          this.totalItems = response.data.pagination.total;
        }
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load teachers');
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    this.pageIndex = 0;
    this.loadTeachers();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTeachers();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(TeacherFormComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeachers();
      }
    });
  }

  openEditDialog(teacher: Teacher) {
    const dialogRef = this.dialog.open(TeacherFormComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: teacher
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeachers();
      }
    });
  }

  viewTeacher(teacher: Teacher) {
    this.router.navigate(['/teachers', teacher.id]);
  }

  deleteTeacher(teacher: Teacher) {
    if (confirm(`Are you sure you want to delete ${teacher.user.firstName} ${teacher.user.lastName}?`)) {
      this.teacherService.deleteTeacher(teacher.id).subscribe({
        next: () => {
          this.notificationService.success('Teacher deleted successfully');
          this.loadTeachers();
        },
        error: () => {
          this.notificationService.error('Failed to delete teacher');
        }
      });
    }
  }

  getTeacherName(teacher: Teacher): string {
    return `${teacher.user.firstName} ${teacher.user.lastName}`;
  }

  getSubjectCount(teacher: Teacher): number {
    return teacher.subjects?.length || 0;
  }

  getInitials(teacher: Teacher): string {
    const f = teacher.user.firstName?.[0] ?? '';
    const l = teacher.user.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  getAvatarGradient(teacher: Teacher): string {
    const GRADIENTS = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#ec4899,#f43f5e)',
      'linear-gradient(135deg,#3b82f6,#06b6d4)',
      'linear-gradient(135deg,#22c55e,#10b981)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
    ];
    const code = (teacher.user.firstName?.charCodeAt(0) ?? 0) + (teacher.user.lastName?.charCodeAt(0) ?? 0);
    return GRADIENTS[code % GRADIENTS.length];
  }
}
