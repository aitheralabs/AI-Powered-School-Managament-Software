import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ParentService } from '../../services/parent.service';

@Component({
  selector: 'app-parent-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Parent</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="parent-form">
        <mat-form-field appearance="outline">
          <mat-label>First Name</mat-label>
          <input matInput formControlName="firstName" />
          <mat-error>First name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Last Name</mat-label>
          <input matInput formControlName="lastName" />
          <mat-error>Last name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
          <mat-error>Valid email is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Occupation</mat-label>
          <input matInput formControlName="occupation" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Address</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width" *ngIf="!data">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
          <mat-error>Password must be at least 8 characters</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="submit()"
        [disabled]="form.invalid || saving"
      >
        <mat-spinner diameter="16" *ngIf="saving"></mat-spinner>
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .parent-form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        min-width: 420px;
        padding-top: 8px;
      }
      .full-width {
        grid-column: 1 / -1;
      }
    `,
  ],
})
export class ParentFormDialogComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private parentService: ParentService,
    private dialogRef: MatDialogRef<ParentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      firstName: [data?.user?.firstName || '', Validators.required],
      lastName: [data?.user?.lastName || '', Validators.required],
      email: [data?.user?.email || '', [Validators.required, Validators.email]],
      phone: [data?.user?.phone || ''],
      occupation: [data?.occupation || ''],
      address: [data?.user?.address || ''],
      ...(!data
        ? { password: ['', [Validators.required, Validators.minLength(8)]] }
        : {}),
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const formValue = this.form.value;

    const obs = this.data
      ? this.parentService.updateParent(this.data.id, formValue)
      : this.parentService.createParent(formValue);

    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving = false;
        this.dialogRef.close({
          error: err?.error?.message || 'Failed to save parent',
        });
      },
    });
  }
}
