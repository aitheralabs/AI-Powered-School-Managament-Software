import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

import { FeeService } from '../../../../services/fee.service';
import { ClassService } from '../../../../services/class.service';
import { StudentService } from '../../../../services/student.service';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-fee-assign-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatRadioModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
<h2 mat-dialog-title>Assign Fee</h2>
<mat-dialog-content>
  <form [formGroup]="form" class="form-grid">

    <!-- Assign to: Student or Class -->
    <div class="full radio-group">
      <label class="radio-label">Assign to:</label>
      <mat-radio-group [(ngModel)]="assignTo" [ngModelOptions]="{standalone:true}" (change)="onAssignChange()">
        <mat-radio-button value="student">Specific Student</mat-radio-button>
        <mat-radio-button value="class">Entire Class</mat-radio-button>
      </mat-radio-group>
    </div>

    <!-- Class selector -->
    <mat-form-field appearance="outline" class="full">
      <mat-label>Class</mat-label>
      <mat-select formControlName="classId" (selectionChange)="onClassChange($event.value)">
        <mat-option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</mat-option>
      </mat-select>
      <mat-error *ngIf="form.get('classId')?.hasError('required')">Required</mat-error>
    </mat-form-field>

    <!-- Student selector (only when assigning to student) -->
    <mat-form-field appearance="outline" class="full" *ngIf="assignTo === 'student'">
      <mat-label>Student</mat-label>
      <mat-select formControlName="studentId">
        <mat-option *ngFor="let s of students" [value]="s.id">
          {{ s.user?.firstName }} {{ s.user?.lastName }}
        </mat-option>
      </mat-select>
      <mat-error *ngIf="form.get('studentId')?.hasError('required')">Required</mat-error>
    </mat-form-field>

    <!-- Fee Category -->
    <mat-form-field appearance="outline" class="full">
      <mat-label>Fee Category</mat-label>
      <mat-select formControlName="feeCategoryId">
        <mat-option *ngFor="let c of categories" [value]="c.id">
          {{ c.name }} — ₹{{ c.amount }}
        </mat-option>
      </mat-select>
      <mat-error *ngIf="form.get('feeCategoryId')?.hasError('required')">Required</mat-error>
    </mat-form-field>

    <!-- Custom Amount (optional) -->
    <mat-form-field appearance="outline">
      <mat-label>Custom Amount (optional)</mat-label>
      <input matInput type="number" formControlName="amount" placeholder="Leave blank to use default" min="0" />
    </mat-form-field>

    <!-- Due Date -->
    <mat-form-field appearance="outline">
      <mat-label>Due Date</mat-label>
      <input matInput type="date" formControlName="dueDate" />
      <mat-error *ngIf="form.get('dueDate')?.hasError('required')">Required</mat-error>
    </mat-form-field>

  </form>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Cancel</button>
  <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
    <mat-spinner diameter="18" *ngIf="saving"></mat-spinner>
    {{ saving ? 'Assigning…' : 'Assign Fee' }}
  </button>
</mat-dialog-actions>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-width: 460px; padding-top: 8px; }
           .full { grid-column: 1 / -1; }
           .radio-group { display: flex; align-items: center; gap: 16px; }
           .radio-label { font-size: 14px; color: #475569; margin-right: 8px; }
           mat-radio-button { margin-right: 16px; }`],
})
export class FeeAssignFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  assignTo: 'student' | 'class' = 'class';
  classes: any[] = [];
  students: any[] = [];
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private feeService: FeeService,
    private classService: ClassService,
    private studentService: StudentService,
    private toast: NotificationService,
    private dialogRef: MatDialogRef<FeeAssignFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const dueDate = tomorrow.toISOString().split('T')[0];

    this.form = this.fb.group({
      classId:       [''],
      studentId:     [''],
      feeCategoryId: ['', Validators.required],
      amount:        [null],
      dueDate:       [dueDate, Validators.required],
    });
  }

  ngOnInit() {
    this.loadClasses();
    this.loadCategories();
  }

  onAssignChange() {
    if (this.assignTo === 'class') {
      this.form.get('studentId')?.clearValidators();
      this.form.get('classId')?.setValidators(Validators.required);
    } else {
      this.form.get('classId')?.clearValidators();
      this.form.get('studentId')?.setValidators(Validators.required);
    }
    this.form.get('classId')?.updateValueAndValidity();
    this.form.get('studentId')?.updateValueAndValidity();
  }

  loadClasses() {
    this.classService.getClasses({ limit: 100 } as any).subscribe({
      next: (res: any) => { this.classes = res.data?.items || res.data || []; },
    });
  }

  loadCategories() {
    this.feeService.getFeeCategories({ limit: 100 } as any).subscribe({
      next: (res: any) => { this.categories = res.data?.items || res.data || []; },
    });
  }

  onClassChange(classId: string) {
    if (this.assignTo === 'student') {
      this.studentService.getStudentsByClass(classId).subscribe({
        next: (res: any) => { this.students = res.data?.items || res.data || []; },
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;

    const obs = this.assignTo === 'class'
      ? this.feeService.assignFeeToClass({ classId: v.classId, feeCategoryId: v.feeCategoryId, dueDate: v.dueDate })
      : this.feeService.assignFeeToStudent({ studentId: v.studentId, feeCategoryId: v.feeCategoryId, amount: v.amount || undefined, dueDate: v.dueDate });

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Fee assigned successfully');
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.saving = false;
        this.toast.error(err?.error?.message || 'Failed to assign fee');
      },
    });
  }
}
