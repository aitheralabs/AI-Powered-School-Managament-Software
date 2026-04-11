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
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentService } from '../../../../services/student.service';
import { NotificationService } from '../../../../services/notification.service';
import { Student } from '../../../../models/student.model';
import { StudentFormComponent } from '../student-form/student-form.component';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#22c55e,#10b981)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#a855f7)',
];

@Component({
  selector: 'app-student-list',
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
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss'
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  displayedColumns: string[] = ['name', 'studentId', 'class', 'enrollmentDate', 'status', 'actions'];
  isLoading = false;
  searchQuery = '';
  searchFocused = false;

  // Pagination
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private studentService: StudentService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.isLoading = true;
    const params = {
      page: this.pageIndex + 1,
      limit: this.pageSize,
      search: this.searchQuery || undefined
    };

    this.studentService.getStudents(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.students = response.data.items;
          this.totalItems = response.data.pagination.total;
        }
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load students');
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    this.pageIndex = 0;
    this.loadStudents();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadStudents();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(StudentFormComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: null
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadStudents(); });
  }

  openEditDialog(student: Student) {
    const dialogRef = this.dialog.open(StudentFormComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: student
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadStudents(); });
  }

  viewStudent(student: Student) {
    this.router.navigate(['/students', student.id]);
  }

  deleteStudent(student: Student) {
    if (confirm(`Are you sure you want to delete ${student.user.firstName} ${student.user.lastName}?`)) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: () => { this.notificationService.success('Student deleted successfully'); this.loadStudents(); },
        error: () => { this.notificationService.error('Failed to delete student'); }
      });
    }
  }

  getStudentName(student: Student): string {
    return `${student.user.firstName} ${student.user.lastName}`;
  }

  getClassName(student: Student): string {
    return student.class?.name || 'Not Assigned';
  }

  getInitials(student: Student): string {
    const f = student.user.firstName?.[0] ?? '';
    const l = student.user.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  getAvatarGradient(student: Student): string {
    const code = (student.user.firstName?.charCodeAt(0) ?? 0) + (student.user.lastName?.charCodeAt(0) ?? 0);
    return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
  }
}
