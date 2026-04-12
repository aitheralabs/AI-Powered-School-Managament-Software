import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ClassService } from '../../../../services/class.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';
import { ClassFormComponent } from '../class-form/class-form.component';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatListModule, MatTooltipModule,
  ],
  templateUrl: './class-detail.component.html',
  styleUrl: './class-detail.component.scss',
})
export class ClassDetailComponent implements OnInit {
  classId = '';
  classData: any = null;
  students: any[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classService: ClassService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.classId = this.route.snapshot.paramMap.get('id') || '';
    if (this.classId) this.loadClassDetails();
    else this.error = 'Invalid class ID';
  }

  loadClassDetails() {
    this.isLoading = true;
    this.error = null;
    this.classService.getClass(this.classId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.classData = (response.data as any).class || response.data;
          this.loadStudents();
        }
      },
      error: (err) => {
        this.isLoading = false;
        const e = this.errorService.processError(err);
        this.error = e.message;
        this.notificationService.error('Failed to load class details', 'Error');
        this.errorService.logError(err, 'ClassDetail.loadClassDetails');
      },
    });
  }

  loadStudents() {
    if (!this.classId) return;
    this.classService.getClassStudents(this.classId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.students = (response.data as any).items || response.data;
        }
      },
      error: (err) => this.errorService.logError(err, 'ClassDetail.loadStudents'),
    });
  }

  goBack() { this.router.navigate(['/classes']); }

  editClass() {
    if (!this.classData) return;
    const ref = this.dialog.open(ClassFormComponent, {
      width: '600px', maxHeight: '90vh',
      data: { class: this.classData },
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadClassDetails(); });
  }

  deleteClass() {
    if (!confirm('Delete this class? This cannot be undone.')) return;
    this.classService.deleteClass(this.classId).subscribe({
      next: () => {
        this.notificationService.success('Class deleted successfully');
        this.router.navigate(['/classes']);
      },
      error: (err) => {
        const e = this.errorService.processError(err);
        this.notificationService.error(e.message, 'Delete Failed');
        this.errorService.logError(err, 'ClassDetail.deleteClass');
      },
    });
  }

  retry() { this.loadClassDetails(); }

  getTeacherName(classItem: any): string {
    const t = classItem?.classTeacher || classItem?.teacher;
    if (!t) return 'Not Assigned';
    if (t.user) return `${t.user.firstName} ${t.user.lastName}`;
    return `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Not Assigned';
  }
}
