import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { AcademicService } from '../../services/academic.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

// ── Inline dialog for create/edit ──────────────────────────────────────────
@Component({
  selector: 'app-subject-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Create' }} Subject</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="subject-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Subject Name</mat-label>
          <input matInput formControlName="name" />
          <mat-error>Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Subject Code</mat-label>
          <input matInput formControlName="code" />
          <mat-error>Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Credit Hours</mat-label>
          <input matInput type="number" formControlName="creditHours" min="1" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <mat-checkbox formControlName="isActive">Active</mat-checkbox>
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
  styles: [`.subject-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-width: 400px; padding-top: 8px; } .full { grid-column: 1 / -1; }`],
})
export class SubjectFormDialogComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private dialogRef: MatDialogRef<SubjectFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      name:        [data?.name        || '', Validators.required],
      code:        [data?.code        || '', Validators.required],
      creditHours: [data?.creditHours || 3],
      description: [data?.description || ''],
      isActive:    [data?.isActive !== false],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.data
      ? this.academicService.updateSubject(this.data.id, this.form.value)
      : this.academicService.createSubject(this.form.value);
    obs.subscribe({
      next:  () => this.dialogRef.close(true),
      error: () => { this.saving = false; },
    });
  }
}

// ── Main list component ────────────────────────────────────────────────────
@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDialogModule,
    MatChipsModule, MatPaginatorModule,
  ],
  templateUrl: './subject-list.component.html',
  styleUrl:    './subject-list.component.scss',
})
export class SubjectListComponent implements OnInit {
  subjects: any[] = [];
  loading = false;
  isAdmin = false;
  search = '';

  total     = 0;
  page      = 0;
  pageSize  = 20;

  columns = ['name', 'code', 'creditHours', 'status', 'actions'];

  constructor(
    private academicService: AcademicService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin() || this.authService.isStaff();
    this.loadSubjects();
  }

  loadSubjects() {
    this.loading = true;
    const params: any = { limit: this.pageSize, page: this.page + 1 };
    if (this.search) params.search = this.search;
    this.academicService.getSubjects(params).subscribe({
      next: (res: any) => {
        this.subjects = res.data?.items || res.data || [];
        this.total    = res.data?.pagination?.total || this.subjects.length;
        this.loading  = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch() { this.page = 0; this.loadSubjects(); }
  onPageChange(e: PageEvent) { this.page = e.pageIndex; this.pageSize = e.pageSize; this.loadSubjects(); }

  openForm(subject?: any) {
    const ref = this.dialog.open(SubjectFormDialogComponent, {
      width: '520px', data: subject || null,
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.notificationService.success(subject ? 'Subject updated' : 'Subject created');
        this.loadSubjects();
      }
    });
  }

  deleteSubject(s: any) {
    if (!confirm(`Delete subject "${s.name}"?`)) return;
    this.academicService.deleteSubject(s.id).subscribe({
      next: () => { this.notificationService.success('Subject deleted'); this.loadSubjects(); },
      error: () => this.notificationService.error('Failed to delete subject'),
    });
  }
}
