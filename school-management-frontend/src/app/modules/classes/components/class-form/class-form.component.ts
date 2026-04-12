import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ClassService, Class, ClassFormData } from '../../../../services/class.service';
import { AcademicService } from '../../../../services/academic.service';
import { TeacherService } from '../../../../services/teacher.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './class-form.component.html',
  styleUrl: './class-form.component.scss'
})
export class ClassFormComponent implements OnInit {
  classForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoadingData = false;
  
  academicYears: any[] = [];
  teachers: any[] = [];
  noAcademicYears = false;
  
  gradeOptions = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
  ];
  
  sectionOptions = [
    'A', 'B', 'C', 'D', 'E', 'F'
  ];

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private academicService: AcademicService,
    private teacherService: TeacherService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    public dialogRef: MatDialogRef<ClassFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { class?: Class }
  ) {
    this.isEditMode = !!data?.class;
    this.classForm = this.createForm();
  }

  ngOnInit() {
    this.loadFormData();
    
    if (this.isEditMode && this.data.class) {
      this.populateForm(this.data.class);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      grade: ['', [Validators.required]],
      section: ['', [Validators.required]],
      academicYearId: ['', [Validators.required]],
      teacherId: [''],
      capacity: [30, [Validators.required, Validators.min(1), Validators.max(100)]],
      room: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  loadFormData() {
    this.isLoadingData = true;
    this.noAcademicYears = false;

    forkJoin({
      years:    this.academicService.getAcademicYears().pipe(catchError(() => of(null))),
      teachers: this.teacherService.getTeachers().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ years, teachers }) => {
        // Academic years
        if (years?.success && years.data) {
          this.academicYears = years.data.academicYears || years.data.items || [];
        }
        this.noAcademicYears = this.academicYears.length === 0;

        // Auto-select active year or first available
        if (this.academicYears.length > 0 && !this.isEditMode) {
          const active = this.academicYears.find((y: any) => y.isActive);
          this.classForm.patchValue({ academicYearId: (active || this.academicYears[0]).id });
        }

        // Teachers
        if (teachers?.success && teachers.data) {
          this.teachers = teachers.data.items || [];
        }

        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
        this.notificationService.error('Failed to load form data');
      },
    });
  }

  populateForm(classData: Class) {
    this.classForm.patchValue({
      name: classData.name,
      grade: classData.grade || '',
      section: classData.section,
      academicYearId: classData.academicYearId,
      teacherId: classData.teacherId || '',
      capacity: classData.capacity,
      room: classData.room || '',
      description: classData.description || ''
    });
  }

  onSubmit() {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData: ClassFormData = {
      ...this.classForm.value,
      isActive: true
    };
    
    // Remove empty optional fields
    if (!formData.teacherId) {
      delete formData.teacherId;
    }
    if (!formData.room) {
      delete formData.room;
    }
    if (!formData.description) {
      delete formData.description;
    }

    const request = this.isEditMode
      ? this.classService.updateClass(this.data.class!.id, formData)
      : this.classService.createClass(formData);

    request.subscribe({
      next: (response) => {
        this.isSubmitting = false;
        const message = this.isEditMode ? 'Class updated successfully' : 'Class created successfully';
        this.notificationService.success(message);
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isSubmitting = false;
        const errorMessage = this.errorService.processError(error);
        this.notificationService.error(errorMessage.message, 'Error');
        this.errorService.logError(error, 'ClassForm.onSubmit');
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.classForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control.errors['maxLength']) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    if (control.errors['min']) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `${this.getFieldLabel(fieldName)} cannot exceed ${control.errors['max'].max}`;
    }

    return 'Invalid value';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Class name',
      grade: 'Grade',
      section: 'Section',
      academicYearId: 'Academic year',
      teacherId: 'Class teacher',
      capacity: 'Capacity',
      room: 'Room',
      description: 'Description'
    };
    return labels[fieldName] || fieldName;
  }

  getTeacherName(teacher: any): string {
    if (!teacher || !teacher.user) return '';
    return `${teacher.user.firstName} ${teacher.user.lastName}`;
  }
}
