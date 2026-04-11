import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { AttendanceService } from '../../../../services/attendance.service';
import { ClassService } from '../../../../services/class.service';
import { StudentService } from '../../../../services/student.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';
import { AuthService } from '../../../../services/auth.service';

import { AttendanceStatus, BulkAttendance } from '../../../../models/attendance.model';

interface StudentAttendanceRow {
  studentId: string;
  studentName: string;
  studentNumber: string;
  status: AttendanceStatus;
  remarks: string;
  isPresent?: boolean;
}

@Component({
  selector: 'app-attendance-marking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatRadioModule,
    MatInputModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './attendance-marking.component.html',
  styleUrl: './attendance-marking.component.scss'
})
export class AttendanceMarkingComponent implements OnInit {
  attendanceForm: FormGroup;
  classes: any[] = [];
  students: StudentAttendanceRow[] = [];
  
  isLoading = false;
  isLoadingStudents = false;
  isSubmitting = false;
  
  displayedColumns: string[] = ['select', 'studentNumber', 'studentName', 'status', 'remarks'];
  attendanceStatuses: { value: AttendanceStatus; label: string; color: 'primary' | 'accent' | 'warn' | undefined }[] = [
    { value: 'present', label: 'Present', color: 'primary' },
    { value: 'absent', label: 'Absent', color: 'warn' },
    { value: 'late', label: 'Late', color: 'accent' },
    { value: 'excused', label: 'Excused', color: undefined }
  ];

  maxDate = new Date(); // Cannot mark attendance for future dates
  selectedDate = new Date();

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private classService: ClassService,
    private studentService: StudentService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private authService: AuthService
  ) {
    this.attendanceForm = this.createForm();
  }

  ngOnInit() {
    this.loadClasses();
  }

  createForm(): FormGroup {
    return this.fb.group({
      classId: ['', [Validators.required]],
      date: [new Date(), [Validators.required]]
    });
  }

  loadClasses() {
    this.isLoading = true;
    
    this.classService.getClasses().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.classes = response.data.items || [];
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = this.errorService.processError(error);
        this.notificationService.error(errorMessage.message, 'Error');
        this.errorService.logError(error, 'AttendanceMarking.loadClasses');
      }
    });
  }

  onClassChange() {
    const classId = this.attendanceForm.get('classId')?.value;
    if (classId) {
      this.loadStudents(classId);
    } else {
      this.students = [];
    }
  }

  onDateChange() {
    const classId = this.attendanceForm.get('classId')?.value;
    if (classId) {
      this.loadStudents(classId);
    }
  }

  loadStudents(classId: string) {
    this.isLoadingStudents = true;
    this.students = [];
    
    const selectedDate = this.attendanceForm.get('date')?.value;
    const dateStr = this.formatDate(selectedDate);
    
    // Load class students
    this.classService.getClassStudents(classId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const classStudents = response.data.items || [];
          
          // Load existing attendance for this date
          this.attendanceService.getClassAttendance(classId, { date: dateStr }).subscribe({
            next: (attendanceResponse) => {
              this.isLoadingStudents = false;
              
              const existingAttendance = attendanceResponse.success && attendanceResponse.data 
                ? attendanceResponse.data 
                : [];
              
              // Create attendance rows
              this.students = classStudents.map((student: any) => {
                const existing = existingAttendance.find((att: any) => att.studentId === student.id);
                
                return {
                  studentId: student.id,
                  studentName: `${student.user.firstName} ${student.user.lastName}`,
                  studentNumber: student.studentId || student.id.slice(-6),
                  status: existing?.status || 'present',
                  remarks: existing?.remarks || '',
                  isPresent: existing?.status === 'present' || !existing
                } as StudentAttendanceRow;
              });
              
              if (existingAttendance.length > 0) {
                this.notificationService.info(`Attendance already marked for ${dateStr}. You can modify it.`);
              }
            },
            error: (error) => {
              this.isLoadingStudents = false;
              // If no attendance found, that's okay - create new rows
              this.students = classStudents.map((student: any) => ({
                studentId: student.id,
                studentName: `${student.user.firstName} ${student.user.lastName}`,
                studentNumber: student.studentId || student.id.slice(-6),
                status: 'present' as AttendanceStatus,
                remarks: '',
                isPresent: true
              }));
            }
          });
        }
      },
      error: (error) => {
        this.isLoadingStudents = false;
        const errorMessage = this.errorService.processError(error);
        this.notificationService.error(errorMessage.message, 'Error');
        this.errorService.logError(error, 'AttendanceMarking.loadStudents');
      }
    });
  }

  markAllPresent() {
    this.students.forEach(student => {
      student.status = 'present';
      student.isPresent = true;
    });
    this.notificationService.success('All students marked as present');
  }

  markAllAbsent() {
    this.students.forEach(student => {
      student.status = 'absent';
      student.isPresent = false;
    });
    this.notificationService.success('All students marked as absent');
  }

  onStatusChange(student: StudentAttendanceRow, status: AttendanceStatus) {
    student.status = status;
    student.isPresent = status === 'present';
  }

  onCheckboxChange(student: StudentAttendanceRow, isChecked: boolean) {
    student.isPresent = isChecked;
    student.status = isChecked ? 'present' : 'absent';
  }

  onSubmit() {
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    if (this.students.length === 0) {
      this.notificationService.warning('No students to mark attendance for');
      return;
    }

    this.isSubmitting = true;
    
    const classId = this.attendanceForm.get('classId')?.value;
    const selectedDate = this.attendanceForm.get('date')?.value;
    const dateStr = this.formatDate(selectedDate);
    
    const bulkAttendance: BulkAttendance = {
      classId,
      date: dateStr,
      attendance: this.students.map(student => ({
        studentId: student.studentId,
        status: student.status,
        remarks: student.remarks || undefined
      }))
    };

    this.attendanceService.markBulkAttendance(bulkAttendance).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.notificationService.success('Attendance marked successfully');
          
          // Show summary
          const summary = this.getAttendanceSummary();
          this.notificationService.info(
            `Summary: ${summary.present} Present, ${summary.absent} Absent, ${summary.late} Late, ${summary.excused} Excused`
          );
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        const errorMessage = this.errorService.processError(error);
        this.notificationService.error(errorMessage.message, 'Error');
        this.errorService.logError(error, 'AttendanceMarking.onSubmit');
      }
    });
  }

  getAttendanceSummary() {
    return this.students.reduce((summary, student) => {
      summary[student.status]++;
      return summary;
    }, { present: 0, absent: 0, late: 0, excused: 0 });
  }

  getClassName(classId: string): string {
    const classItem = this.classes.find(c => c.id === classId);
    return classItem ? classItem.name : '';
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getStatusColor(status: AttendanceStatus): string {
    const statusConfig = this.attendanceStatuses.find(s => s.value === status);
    return statusConfig?.color || 'basic';
  }

  countByStatus(status: string): number {
    return this.students.filter(s => s.status === status).length;
  }

  canMarkAttendance(): boolean {
    const selectedDate = this.attendanceForm.get('date')?.value;
    if (!selectedDate) return false;
    
    // Can only mark attendance for today or past dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  }
}