import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FeeService } from '../../../../services/fee.service';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatProgressSpinnerModule,
  ],
  template: `
<h2 mat-dialog-title>Record Payment</h2>
<mat-dialog-content>
  <!-- Student fee summary -->
  <div class="fee-summary" *ngIf="data">
    <p><strong>Student:</strong> {{ data.studentName }}</p>
    <p><strong>Fee:</strong> {{ data.categoryName }}</p>
    <p><strong>Amount Due:</strong> ₹{{ formatAmount(data.amountDue) }}</p>
    <p *ngIf="data.amountPaid > 0"><strong>Already Paid:</strong> ₹{{ formatAmount(data.amountPaid) }}</p>
    <p><strong>Balance:</strong> ₹{{ formatAmount(data.amountDue - (data.amountPaid || 0)) }}</p>
  </div>

  <form [formGroup]="form" class="form-grid">
    <mat-form-field appearance="outline">
      <mat-label>Amount Paid (₹)</mat-label>
      <input matInput type="number" formControlName="amount" min="1" />
      <mat-error *ngIf="form.get('amount')?.hasError('required')">Required</mat-error>
      <mat-error *ngIf="form.get('amount')?.hasError('min')">Must be > 0</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Payment Date</mat-label>
      <input matInput type="date" formControlName="paymentDate" />
    </mat-form-field>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Payment Method</mat-label>
      <mat-select formControlName="paymentMethod">
        <mat-option value="cash">Cash</mat-option>
        <mat-option value="upi">UPI</mat-option>
        <mat-option value="bank_transfer">Bank Transfer</mat-option>
        <mat-option value="cheque">Cheque</mat-option>
        <mat-option value="card">Card</mat-option>
        <mat-option value="online">Online Portal</mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Transaction / Reference ID (optional)</mat-label>
      <input matInput formControlName="transactionId" placeholder="e.g. UPI ref, cheque number" />
    </mat-form-field>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Notes (optional)</mat-label>
      <textarea matInput formControlName="notes" rows="2"></textarea>
    </mat-form-field>
  </form>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Cancel</button>
  <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
    <mat-spinner diameter="18" *ngIf="saving"></mat-spinner>
    {{ saving ? 'Processing…' : 'Record Payment' }}
  </button>
</mat-dialog-actions>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-width: 440px; padding-top: 8px; }
           .full { grid-column: 1 / -1; }
           .fee-summary { background: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; }
           .fee-summary p { margin: 4px 0; }`],
})
export class PaymentFormComponent implements OnInit {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private feeService: FeeService,
    private toast: NotificationService,
    private dialogRef: MatDialogRef<PaymentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      amount:        [data?.amountDue - (data?.amountPaid || 0) || '', [Validators.required, Validators.min(1)]],
      paymentDate:   [today, Validators.required],
      paymentMethod: ['cash', Validators.required],
      transactionId: [''],
      notes:         [''],
    });
  }

  ngOnInit() {}

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;

    this.feeService.createPayment({
      studentFeeId:  this.data.studentFeeId,
      amount:        parseFloat(v.amount),
      paymentDate:   v.paymentDate,
      paymentMethod: v.paymentMethod,
      transactionId: v.transactionId || undefined,
      notes:         v.notes || undefined,
    } as any).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success(`Payment of ₹${parseFloat(v.amount).toLocaleString('en-IN')} recorded`);
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.saving = false;
        this.toast.error(err?.error?.message || 'Failed to record payment');
      },
    });
  }

  formatAmount(val: any): string {
    return parseFloat(val || 0).toLocaleString('en-IN');
  }
}
