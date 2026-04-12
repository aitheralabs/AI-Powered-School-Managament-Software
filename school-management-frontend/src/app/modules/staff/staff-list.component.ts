import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
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
import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

import { StaffService, Staff, CreateStaff } from '../../services/staff.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

const DEPARTMENTS = [
  'Administration',
  'Academics',
  'Finance',
  'Library',
  'IT',
  'Maintenance',
  'Security',
  'Transport',
  'Cafeteria',
  'Medical',
  'Sports',
  'Other',
];

const POSITIONS = [
  'Principal',
  'Vice Principal',
  'Academic Coordinator',
  'Librarian',
  'Accountant',
  'Clerk',
  'IT Administrator',
  'Security Guard',
  'Maintenance Staff',
  'Driver',
  'Cook',
  'Nurse',
  'Sports Instructor',
  'Counselor',
  'Other',
];

@Component({
  selector: 'app-staff-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Staff Member</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="staff-form">
        <div class="form-section">
          <h3>Personal Information</h3>
          <div class="form-row">
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
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              <mat-error>Valid email is required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Address</mat-label>
            <input matInput formControlName="address" />
          </mat-form-field>
        </div>

        <div class="form-section" *ngIf="!data">
          <h3>Login Credentials</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
            <mat-error>Password must be at least 8 characters</mat-error>
          </mat-form-field>
        </div>

        <div class="form-section">
          <h3>Employment Details</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Employee ID</mat-label>
              <input matInput formControlName="employeeId" />
              <mat-error>Employee ID is required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Joining Date</mat-label>
              <input matInput type="date" formControlName="joiningDate" />
              <mat-error>Joining date is required</mat-error>
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select formControlName="department">
                <mat-option *ngFor="let dept of departments" [value]="dept">{{
                  dept
                }}</mat-option>
              </mat-select>
              <mat-error>Department is required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Position</mat-label>
              <mat-select formControlName="position">
                <mat-option *ngFor="let pos of positions" [value]="pos">{{
                  pos
                }}</mat-option>
              </mat-select>
              <mat-error>Position is required</mat-error>
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Salary (₹)</mat-label>
              <input matInput type="number" formControlName="salary" min="0" />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Responsibilities</mat-label>
            <textarea
              matInput
              formControlName="responsibilities"
              rows="3"
            ></textarea>
          </mat-form-field>
        </div>
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
      .staff-form {
        min-width: 520px;
      }
      .form-section {
        margin-bottom: 16px;
      }
      .form-section h3 {
        margin: 0 0 12px;
        color: #666;
        font-size: 14px;
        font-weight: 500;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class StaffFormDialogComponent {
  form: FormGroup;
  saving = false;
  departments = DEPARTMENTS;
  positions = POSITIONS;

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private dialogRef: MatDialogRef<StaffFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Staff | null,
  ) {
    this.form = this.fb.group({
      firstName: [data?.user?.firstName || '', Validators.required],
      lastName: [data?.user?.lastName || '', Validators.required],
      email: [data?.user?.email || '', [Validators.required, Validators.email]],
      phone: [data?.user?.phone || ''],
      address: [data?.user?.address || ''],
      employeeId: [data?.employeeId || '', Validators.required],
      department: [data?.department || '', Validators.required],
      position: [data?.position || '', Validators.required],
      joiningDate: [
        data?.joiningDate?.split('T')[0] || '',
        Validators.required,
      ],
      salary: [data?.salary || ''],
      responsibilities: [data?.responsibilities || ''],
      ...(!data
        ? { password: ['', [Validators.required, Validators.minLength(8)]] }
        : {}),
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const formValue = this.form.value;

    if (this.data) {
      this.staffService.updateStaff(this.data.id, formValue).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.saving = false;
          this.dialogRef.close({
            error: err?.error?.message || 'Failed to update staff',
          });
        },
      });
    } else {
      this.staffService.createStaff(formValue).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.saving = false;
          this.dialogRef.close({
            error: err?.error?.message || 'Failed to create staff',
          });
        },
      });
    }
  }
}

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule,
  ],
  template: `
    <div class="staff-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Staff Management</h1>
          <p class="page-subtitle">Manage school staff members</p>
        </div>
        <div class="header-actions">
          <button
            mat-raised-button
            color="primary"
            (click)="openForm()"
            *ngIf="isAdmin"
          >
            <mat-icon>add</mat-icon> Add Staff
          </button>
        </div>
      </div>

      <mat-card class="filters-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <input
              matInput
              [(ngModel)]="search"
              (keyup.enter)="onSearch()"
              placeholder="Name, email, or employee ID"
            />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Department</mat-label>
            <mat-select
              [(ngModel)]="departmentFilter"
              (selectionChange)="onSearch()"
            >
              <mat-option value="">All Departments</mat-option>
              <mat-option *ngFor="let dept of departments" [value]="dept">{{
                dept
              }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select
              [(ngModel)]="statusFilter"
              (selectionChange)="onSearch()"
            >
              <mat-option value="">All</mat-option>
              <mat-option value="true">Active</mat-option>
              <mat-option value="false">Inactive</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-button (click)="clearFilters()">Clear</button>
        </div>
      </mat-card>

      <mat-card class="data-card">
        <div class="loading-overlay" *ngIf="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <table
          mat-table
          [dataSource]="staff"
          class="staff-table"
          *ngIf="!loading && staff.length"
        >
          <ng-container matColumnDef="employee">
            <th mat-header-cell *matHeaderCellDef>Employee</th>
            <td mat-cell *matCellDef="let s">
              <div class="employee-cell">
                <div class="avatar">{{ getInitials(s) }}</div>
                <div>
                  <div class="name">
                    {{ s.user?.firstName }} {{ s.user?.lastName }}
                  </div>
                  <div class="email">{{ s.user?.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="employeeId">
            <th mat-header-cell *matHeaderCellDef>Employee ID</th>
            <td mat-cell *matCellDef="let s">{{ s.employeeId }}</td>
          </ng-container>

          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef>Department</th>
            <td mat-cell *matCellDef="let s">
              <span class="chip chip-department">{{ s.department }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="position">
            <th mat-header-cell *matHeaderCellDef>Position</th>
            <td mat-cell *matCellDef="let s">{{ s.position }}</td>
          </ng-container>

          <ng-container matColumnDef="joiningDate">
            <th mat-header-cell *matHeaderCellDef>Joining Date</th>
            <td mat-cell *matCellDef="let s">
              {{ s.joiningDate | date: 'mediumDate' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let s">
              <span
                class="chip"
                [class.chip-active]="s.isActive"
                [class.chip-inactive]="!s.isActive"
              >
                {{ s.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let s">
              <button
                mat-icon-button
                matTooltip="Edit"
                (click)="openForm(s)"
                *ngIf="isAdmin"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                [matMenuTriggerFor]="menu"
                *ngIf="isAdmin"
              >
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button
                  mat-menu-item
                  (click)="toggleStatus(s)"
                  *ngIf="s.isActive"
                >
                  <mat-icon>block</mat-icon> Deactivate
                </button>
                <button
                  mat-menu-item
                  (click)="toggleStatus(s)"
                  *ngIf="!s.isActive"
                >
                  <mat-icon>check_circle</mat-icon> Reactivate
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>

        <div class="empty-state" *ngIf="!loading && staff.length === 0">
          <mat-icon>people_outline</mat-icon>
          <h3>No staff members found</h3>
          <p>Try adjusting your filters or add a new staff member</p>
        </div>

        <mat-paginator
          [length]="total"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        >
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .staff-page {
        padding: 24px;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .page-title {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }
      .page-subtitle {
        margin: 4px 0 0;
        color: #666;
      }

      .filters-card {
        margin-bottom: 16px;
      }
      .filters-row {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
      }
      .search-field {
        flex: 1;
        min-width: 250px;
      }

      .data-card {
        position: relative;
      }
      .loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.8);
        z-index: 10;
      }

      .staff-table {
        width: 100%;
      }
      .employee-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #3f51b5;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        font-size: 14px;
      }
      .employee-cell .name {
        font-weight: 500;
      }
      .employee-cell .email {
        font-size: 12px;
        color: #666;
      }

      .chip {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      .chip-department {
        background: #e3f2fd;
        color: #1565c0;
      }
      .chip-active {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .chip-inactive {
        background: #ffebee;
        color: #c62828;
      }

      .empty-state {
        text-align: center;
        padding: 48px;
        color: #666;
      }
      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.3;
      }
      .empty-state h3 {
        margin: 16px 0 8px;
      }
      .empty-state p {
        margin: 0;
        opacity: 0.7;
      }
    `,
  ],
})
export class StaffListComponent implements OnInit {
  staff: Staff[] = [];
  loading = false;
  isAdmin = false;

  search = '';
  departmentFilter = '';
  statusFilter = '';
  departments = DEPARTMENTS;

  total = 0;
  page = 0;
  pageSize = 10;

  columns = [
    'employee',
    'employeeId',
    'department',
    'position',
    'joiningDate',
    'status',
    'actions',
  ];

  constructor(
    private staffService: StaffService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadStaff();
  }

  loadStaff() {
    this.loading = true;
    const params: any = { limit: this.pageSize, page: this.page + 1 };
    if (this.search) params.search = this.search;
    if (this.departmentFilter) params.department = this.departmentFilter;
    if (this.statusFilter) params.isActive = this.statusFilter === 'true';

    this.staffService.getStaff(params).subscribe({
      next: (res: any) => {
        this.staff = res.data?.items || res.data || [];
        this.total = res.data?.pagination?.total || this.staff.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearch() {
    this.page = 0;
    this.loadStaff();
  }

  clearFilters() {
    this.search = '';
    this.departmentFilter = '';
    this.statusFilter = '';
    this.page = 0;
    this.loadStaff();
  }

  onPageChange(e: PageEvent) {
    this.page = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadStaff();
  }

  openForm(staff?: Staff) {
    const ref = this.dialog.open(StaffFormDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: staff || null,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.error) {
        this.notificationService.error(result.error);
        return;
      }
      this.notificationService.success(
        staff ? 'Staff updated' : 'Staff created',
      );
      this.loadStaff();
    });
  }

  toggleStatus(staff: Staff) {
    const action = staff.isActive ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this staff member?`))
      return;

    const obs = staff.isActive
      ? this.staffService.deactivateStaff(staff.id)
      : this.staffService.reactivateStaff(staff.id);

    obs.subscribe({
      next: () => {
        this.notificationService.success(
          `Staff ${staff.isActive ? 'deactivated' : 'reactivated'} successfully`,
        );
        this.loadStaff();
      },
      error: (err) =>
        this.notificationService.error(
          err?.error?.message || 'Failed to update staff',
        ),
    });
  }

  getInitials(s: Staff): string {
    return `${s.user?.firstName?.[0] || ''}${s.user?.lastName?.[0] || ''}`.toUpperCase();
  }
}
