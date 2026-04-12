import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FeeService } from '../../../../services/fee.service';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-fee-category-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule,
  ],
  template: `
<h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'New' }} Fee Category</h2>
<mat-dialog-content>
  <form [formGroup]="form" class="form-grid">
    <mat-form-field appearance="outline" class="full">
      <mat-label>Category Name</mat-label>
      <input matInput formControlName="name" placeholder="e.g. Tuition Fee, Transport Fee" />
      <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Amount (₹)</mat-label>
      <input matInput type="number" formControlName="amount" min="0" />
      <mat-error *ngIf="form.get('amount')?.hasError('required')">Amount is required</mat-error>
      <mat-error *ngIf="form.get('amount')?.hasError('min')">Amount must be ≥ 0</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Frequency</mat-label>
      <mat-select formControlName="frequency">
        <mat-option value="one_time">One-time</mat-option>
        <mat-option value="monthly">Monthly</mat-option>
        <mat-option value="quarterly">Quarterly</mat-option>
        <mat-option value="half_yearly">Half-yearly</mat-option>
        <mat-option value="yearly">Yearly</mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Description</mat-label>
      <textarea matInput formControlName="description" rows="2" placeholder="Optional description"></textarea>
    </mat-form-field>

    <mat-checkbox formControlName="isMandatory" class="full">Mandatory fee</mat-checkbox>
  </form>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Cancel</button>
  <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
    <mat-spinner diameter="18" *ngIf="saving"></mat-spinner>
    {{ saving ? 'Saving…' : (isEdit ? 'Update' : 'Create') }}
  </button>
</mat-dialog-actions>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-width: 420px; padding-top: 8px; }
           .full { grid-column: 1 / -1; }`],
})
export class FeeCategoryFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private feeService: FeeService,
    private toast: NotificationService,
    private dialogRef: MatDialogRef<FeeCategoryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      amount:      [0, [Validators.required, Validators.min(0)]],
      frequency:   ['monthly', Validators.required],
      description: [''],
      isMandatory: [true],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.isEdit = true;
      this.form.patchValue({
        name:        this.data.name,
        amount:      this.data.amount,
        frequency:   this.data.frequency,
        description: this.data.description || '',
        isMandatory: this.data.isMandatory ?? true,
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const payload = this.form.value;
    const action = this.isEdit
      ? this.feeService.updateFeeCategory(this.data.id, payload)
      : this.feeService.createFeeCategory(payload);

    action.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.toast.success(`Fee category ${this.isEdit ? 'updated' : 'created'}`);
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.saving = false;
        this.toast.error(err?.error?.message || 'Failed to save fee category');
      },
    });
  }
}
