import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentService } from '../../../../services/student.service';
import { NotificationService } from '../../../../services/notification.service';
import { Student } from '../../../../models/student.model';
import { Class } from '../../../../models/teacher.model';
import { ApiService } from '../../../../services/api.service';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
  ],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss'
})
export class StudentFormComponent implements OnInit {
  studentForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  classes: Class[] = [];
  maxDate = new Date();

  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private apiService: ApiService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<StudentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Student | null
  ) {}

  ngOnInit() {
    this.isEditMode = !!this.data;
    this.loadClasses();
    this.initForm();
  }

  loadClasses() {
    this.apiService.getPaginated<Class>('classes').subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.classes = response.data.items || (response.data as any).classes || [];
        }
      },
      error: () => {
        this.classes = [];
        this.notificationService.error('Failed to load classes');
      }
    });
  }

  initForm() {
    const student = this.data;
    this.studentForm = this.fb.group({
      // User fields
      firstName: [student?.user.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [student?.user.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [student?.user.email || '', [Validators.required, Validators.email]],
      phone: [student?.user.phone || '', [Validators.pattern(/^[0-9]{10,15}$/)]],
      address: [student?.user.address || ''],
      password: [this.isEditMode ? '' : '', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      
      // Student fields
      studentId: [student?.studentId || '', Validators.required],
      dateOfBirth: [student?.dateOfBirth ? new Date(student.dateOfBirth) : '', Validators.required],
      gender: [student?.gender || '', Validators.required],
      enrollmentDate: [student?.enrollmentDate ? new Date(student.enrollmentDate) : new Date(), Validators.required],
      classId: [student?.classId || ''],
      guardianName: [student?.guardianName || '', [Validators.required, Validators.minLength(2)]],
      guardianPhone: [student?.guardianPhone || '', [Validators.required, Validators.minLength(10)]],
      emergencyContact: [student?.emergencyContact || '', [Validators.required, Validators.minLength(10)]],
      medicalInfo: [student?.medicalInfo || '']
    });

    // Disable email in edit mode
    if (this.isEditMode) {
      this.studentForm.get('email')?.disable();
      this.studentForm.get('password')?.disable();
    }
  }

  onSubmit() {
    if (this.studentForm.invalid) {
      this.markFormGroupTouched(this.studentForm);
      return;
    }

    this.isLoading = true;
    const formValue = this.studentForm.getRawValue();
    
    // Format dates
    const studentData: any = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      address: formValue.address,
      studentId: formValue.studentId,
      gender: formValue.gender,
      dateOfBirth: new Date(formValue.dateOfBirth).toISOString().split('T')[0],
      enrollmentDate: new Date(formValue.enrollmentDate).toISOString().split('T')[0],
      classId: formValue.classId,
      guardianName: formValue.guardianName,
      guardianPhone: formValue.guardianPhone,
      emergencyContact: formValue.emergencyContact,
      medicalInfo: formValue.medicalInfo
    };

    // Add password only for new students
    if (!this.isEditMode && formValue.password) {
      studentData.password = formValue.password;
    }

    const request = this.isEditMode
      ? this.studentService.updateStudent(this.data!.id, studentData)
      : this.studentService.createStudent(studentData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.notificationService.success(
            `Student ${this.isEditMode ? 'updated' : 'created'} successfully`
          );
          this.dialogRef.close(true);
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || `Failed to ${this.isEditMode ? 'update' : 'create'} student`;
        this.notificationService.error(errorMessage);
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
