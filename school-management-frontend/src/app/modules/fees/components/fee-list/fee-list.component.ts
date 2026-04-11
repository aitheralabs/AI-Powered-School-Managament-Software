import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';

import { FeeService } from '../../../../services/fee.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatDialogModule, MatTooltipModule, MatInputModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Fee Management</h1>
          <p class="subtitle">Manage fee categories and student fee assignments</p>
        </div>
        <div class="header-actions" *ngIf="isAdmin">
          <button mat-raised-button color="primary" (click)="openCategoryForm()">
            <mat-icon>add</mat-icon> New Category
          </button>
          <button mat-raised-button color="accent" (click)="openAssignForm()">
            <mat-icon>assignment</mat-icon> Assign Fees
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row" *ngIf="stats">
        <mat-card class="stat-card collected">
          <mat-card-content>
            <div class="stat-value">₹{{ formatAmount(stats.collected) }}</div>
            <div class="stat-label">Collected</div>
            <div class="stat-sub">{{ stats.collectionPercentage }}% collection rate</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card pending">
          <mat-card-content>
            <div class="stat-value">₹{{ formatAmount(stats.pending) }}</div>
            <div class="stat-label">Pending</div>
            <div class="stat-sub">{{ stats.pendingCount }} fees due</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card overdue">
          <mat-card-content>
            <div class="stat-value">₹{{ formatAmount(stats.overdueAmount) }}</div>
            <div class="stat-label">Overdue</div>
            <div class="stat-sub">{{ stats.defaulterCount }} defaulters</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card total">
          <mat-card-content>
            <div class="stat-value">₹{{ formatAmount(stats.totalFees) }}</div>
            <div class="stat-label">Total Billed</div>
            <div class="stat-sub">{{ stats.totalStudentFees }} fee records</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filter bar -->
      <mat-card class="filter-card">
        <mat-card-content class="filter-row">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="filterStatus" (ngModelChange)="loadStudentFees()">
              <mat-option value="">All</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="paid">Paid</mat-option>
              <mat-option value="overdue">Overdue</mat-option>
              <mat-option value="partial">Partial</mat-option>
              <mat-option value="waived">Waived</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button color="primary" (click)="loadAll()" matTooltip="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>
        </mat-card-content>
      </mat-card>

      <!-- Fee Categories Table -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Fee Categories</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loadingCategories" class="loading-center">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          <table mat-table [dataSource]="categories" *ngIf="!loadingCategories">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let cat">{{ cat.name }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let cat">₹{{ formatAmount(cat.amount) }}</td>
            </ng-container>
            <ng-container matColumnDef="frequency">
              <th mat-header-cell *matHeaderCellDef>Frequency</th>
              <td mat-cell *matCellDef="let cat">
                <mat-chip>{{ cat.frequency }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="mandatory">
              <th mat-header-cell *matHeaderCellDef>Mandatory</th>
              <td mat-cell *matCellDef="let cat">
                <mat-icon [color]="cat.isMandatory ? 'primary' : ''">
                  {{ cat.isMandatory ? 'check_circle' : 'radio_button_unchecked' }}
                </mat-icon>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let cat">
                <button mat-icon-button color="primary" (click)="editCategory(cat)" *ngIf="isAdmin" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteCategory(cat)" *ngIf="isAdmin" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
          </table>
          <p *ngIf="!loadingCategories && categories.length === 0" class="empty-state">
            No fee categories defined yet.
          </p>
        </mat-card-content>
      </mat-card>

      <!-- Student Fees Table -->
      <mat-card style="margin-top: 24px">
        <mat-card-header>
          <mat-card-title>Student Fees</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loadingFees" class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
          <table mat-table [dataSource]="studentFees" *ngIf="!loadingFees">
            <ng-container matColumnDef="student">
              <th mat-header-cell *matHeaderCellDef>Student</th>
              <td mat-cell *matCellDef="let fee">{{ fee.studentName || fee.student_id }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let fee">{{ fee.category_name || fee.fee_category_id }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let fee">₹{{ formatAmount(fee.amount) }}</td>
            </ng-container>
            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let fee">{{ fee.due_date | date:'mediumDate' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let fee">
                <mat-chip [class]="'status-' + fee.status">{{ fee.status }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let fee">
                <button mat-icon-button color="warn" (click)="deleteFee(fee)" *ngIf="isAdmin" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="feeColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: feeColumns;"></tr>
          </table>
          <p *ngIf="!loadingFees && studentFees.length === 0" class="empty-state">
            No fee records found.
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.8rem; font-weight: 600; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .header-actions { display: flex; gap: 12px; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card mat-card-content { padding: 16px; }
    .stat-value { font-size: 1.6rem; font-weight: 700; }
    .stat-label { font-size: 0.85rem; color: #666; margin-top: 4px; }
    .stat-sub { font-size: 0.75rem; color: #999; margin-top: 2px; }
    .collected .stat-value { color: #4caf50; }
    .pending .stat-value { color: #ff9800; }
    .overdue .stat-value { color: #f44336; }
    .total .stat-value { color: #2196f3; }
    .filter-card { margin-bottom: 16px; }
    .filter-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; color: #999; padding: 32px; }
    .status-paid { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-pending { background: #fff3e0 !important; color: #e65100 !important; }
    .status-overdue { background: #ffebee !important; color: #c62828 !important; }
    .status-partial { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-waived { background: #f3e5f5 !important; color: #6a1b9a !important; }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class FeeListComponent implements OnInit {
  categories: any[] = [];
  studentFees: any[] = [];
  stats: any = null;
  filterStatus = '';
  loadingCategories = false;
  loadingFees = false;
  isAdmin = false;

  categoryColumns = ['name', 'amount', 'frequency', 'mandatory', 'actions'];
  feeColumns = ['student', 'category', 'amount', 'dueDate', 'status', 'actions'];

  constructor(
    private feeService: FeeService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin() || this.authService.isStaff();
    this.loadAll();
  }

  loadAll() {
    this.loadStats();
    this.loadCategories();
    this.loadStudentFees();
  }

  loadStats() {
    this.feeService.getFeeStats().subscribe({
      next: (res) => { if (res.success) this.stats = res.data; },
      error: () => {}
    });
  }

  loadCategories() {
    this.loadingCategories = true;
    this.feeService.getFeeCategories({ limit: 50 }).subscribe({
      next: (res) => {
        this.loadingCategories = false;
        this.categories = (res as any).data?.items || [];
      },
      error: () => { this.loadingCategories = false; }
    });
  }

  loadStudentFees() {
    this.loadingFees = true;
    const params: any = { limit: 100 };
    if (this.filterStatus) params.status = this.filterStatus;
    this.feeService.getAllStudentFees(params).subscribe({
      next: (res) => {
        this.loadingFees = false;
        this.studentFees = (res as any).data?.items || [];
      },
      error: () => { this.loadingFees = false; }
    });
  }

  openCategoryForm() {
    this.notificationService.info('Fee category form — coming soon');
  }

  openAssignForm() {
    this.notificationService.info('Fee assignment form — coming soon');
  }

  editCategory(cat: any) {
    this.notificationService.info('Edit fee category — coming soon');
  }

  deleteCategory(cat: any) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.feeService.deleteFeeCategory(cat.id).subscribe({
      next: () => {
        this.notificationService.success('Category deleted');
        this.loadCategories();
      },
      error: () => this.notificationService.error('Failed to delete category', 'Error')
    });
  }

  deleteFee(fee: any) {
    if (!confirm('Delete this fee record?')) return;
    this.feeService.deleteStudentFee(fee.id).subscribe({
      next: () => {
        this.notificationService.success('Fee record deleted');
        this.loadStudentFees();
      },
      error: () => this.notificationService.error('Failed to delete fee record', 'Error')
    });
  }

  formatAmount(val: any): string {
    return parseFloat(val || 0).toLocaleString('en-IN');
  }
}
