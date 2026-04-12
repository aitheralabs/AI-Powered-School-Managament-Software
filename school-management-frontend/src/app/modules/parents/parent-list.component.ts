import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

import { ParentService } from '../../services/parent.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

// ── Create Parent Dialog ────────────────────────────────────────────────────
@Component({
  selector: 'app-parent-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Parent</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="parent-form">
        <mat-form-field appearance="outline"><mat-label>First Name</mat-label>
          <input matInput formControlName="firstName" /><mat-error>Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Last Name</mat-label>
          <input matInput formControlName="lastName" /><mat-error>Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" /><mat-error>Valid email required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Phone</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Occupation</mat-label>
          <input matInput formControlName="occupation" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Address</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
        <mat-form-field appearance="outline" *ngIf="!data"><mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" /><mat-error>Required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
        <mat-spinner diameter="16" *ngIf="saving"></mat-spinner>
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.parent-form { display:grid; grid-template-columns:1fr 1fr; gap:12px; min-width:420px; padding-top:8px; } .full { grid-column:1/-1; }`],
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
      firstName:  [data?.user?.firstName || '', Validators.required],
      lastName:   [data?.user?.lastName  || '', Validators.required],
      email:      [data?.user?.email     || '', [Validators.required, Validators.email]],
      phone:      [data?.user?.phone     || ''],
      occupation: [data?.occupation      || ''],
      address:    [data?.user?.address   || ''],
      ...(!data ? { password: ['', [Validators.required, Validators.minLength(8)]] } : {}),
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.data
      ? this.parentService.updateParent(this.data.id, this.form.value)
      : this.parentService.createParent(this.form.value);
    obs.subscribe({
      next:  () => this.dialogRef.close(true),
      error: (err) => {
        this.saving = false;
        // bubble error message back
        this.dialogRef.close({ error: err?.error?.message || 'Failed' });
      },
    });
  }
}

// ── Main list component ────────────────────────────────────────────────────
@Component({
  selector: 'app-parent-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDialogModule,
    MatPaginatorModule,
  ],
  templateUrl: './parent-list.component.html',
  styleUrl:    './parent-list.component.scss',
})
export class ParentListComponent implements OnInit {
  parents: any[] = [];
  loading = false;
  isAdmin = false;
  search  = '';

  total    = 0;
  page     = 0;
  pageSize = 20;

  columns = ['name', 'email', 'phone', 'occupation', 'children', 'actions'];

  constructor(
    private parentService: ParentService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin() || this.authService.isStaff();
    this.loadParents();
  }

  loadParents() {
    this.loading = true;
    const params: any = { limit: this.pageSize, page: this.page + 1 };
    if (this.search) params.search = this.search;
    this.parentService.getParents(params).subscribe({
      next: (res: any) => {
        this.parents = res.data?.items || res.data || [];
        this.total   = res.data?.pagination?.total || this.parents.length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch() { this.page = 0; this.loadParents(); }
  onPageChange(e: PageEvent) { this.page = e.pageIndex; this.pageSize = e.pageSize; this.loadParents(); }

  openForm(parent?: any) {
    const ref = this.dialog.open(ParentFormDialogComponent, {
      width: '560px', data: parent || null,
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.error) { this.notificationService.error(result.error); return; }
      this.notificationService.success(parent ? 'Parent updated' : 'Parent created');
      this.loadParents();
    });
  }

  getParentName(p: any): string {
    return `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || '—';
  }

  getChildrenCount(p: any): number {
    return p.students?.length || p.studentParents?.length || 0;
  }
}
