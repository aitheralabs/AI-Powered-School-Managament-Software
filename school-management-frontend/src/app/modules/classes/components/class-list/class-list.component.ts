import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ClassService, Class } from '../../../../services/class.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';
import { ClassFormComponent } from '../class-form/class-form.component';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './class-list.component.html',
  styleUrl: './class-list.component.scss',
})
export class ClassListComponent implements OnInit {
  classes: Class[] = [];
  displayedColumns: string[] = [
    'name',
    'grade',
    'section',
    'capacity',
    'studentCount',
    'teacher',
    'actions',
  ];
  isLoading = false;
  error: string | null = null;

  constructor(
    private classService: ClassService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadClasses();
  }

  loadClasses() {
    this.isLoading = true;
    this.error = null;

    this.classService.getClasses().subscribe({
      next: (response: any) => {
        this.isLoading = false;

        let items: any[] = [];

        if (response.success) {
          if (response.data && response.data.items) {
            items = response.data.items;
          } else if (response.data && Array.isArray(response.data)) {
            items = response.data;
          } else if (response.data && response.data.classes) {
            items = response.data.classes;
          }
        }

        this.classes = items;
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = this.errorService.processError(error);
        this.error = errorMessage.message;
        this.notificationService.error(
          'Failed to load classes. Please try again.',
          'Error',
        );
        this.errorService.logError(error, 'ClassList.loadClasses');
      },
    });
  }

  createClass() {
    const dialogRef = this.dialog.open(ClassFormComponent, {
      width: '600px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadClasses();
      }
    });
  }

  viewClass(classItem: Class) {
    this.router.navigate(['/classes', classItem.id]);
  }

  editClass(classItem: Class) {
    const dialogRef = this.dialog.open(ClassFormComponent, {
      width: '600px',
      disableClose: true,
      data: { class: classItem },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadClasses();
      }
    });
  }

  deleteClass(classItem: Class) {
    if (confirm(`Are you sure you want to delete ${classItem.name}?`)) {
      this.classService.deleteClass(classItem.id).subscribe({
        next: () => {
          this.notificationService.success('Class deleted successfully');
          this.loadClasses();
        },
        error: (err: any) => {
          const errorMessage = this.errorService.processError(err);
          this.notificationService.error(errorMessage.message, 'Delete Failed');
          this.errorService.logError(err, 'ClassList.deleteClass');
        },
      });
    }
  }

  getTeacherName(classItem: Class): string {
    if (classItem.teacher) {
      if (classItem.teacher.user) {
        return `${classItem.teacher.user.firstName} ${classItem.teacher.user.lastName}`;
      }
      if (classItem.teacher.firstName && classItem.teacher.lastName) {
        return `${classItem.teacher.firstName} ${classItem.teacher.lastName}`;
      }
    }
    return 'Not Assigned';
  }

  retry() {
    this.loadClasses();
  }
}
