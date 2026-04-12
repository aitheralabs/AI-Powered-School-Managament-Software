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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { FeeService } from '../../../../services/fee.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/auth.service';
import { FeeCategoryFormComponent } from '../fee-category-form/fee-category-form.component';
import { FeeAssignFormComponent } from '../fee-assign-form/fee-assign-form.component';
import { PaymentFormComponent } from '../payment-form/payment-form.component';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
    MatInputModule, MatPaginatorModule,
  ],
  templateUrl: './fee-list.component.html',
  styleUrl: './fee-list.component.scss',
})
export class FeeListComponent implements OnInit {
  categories: any[] = [];
  studentFees: any[] = [];
  stats: any = null;
  filterStatus = '';
  loadingCategories = false;
  loadingFees = false;
  isAdmin = false;

  // Pagination
  totalFees = 0;
  feePage = 0;
  feePageSize = 20;

  categoryColumns = ['name', 'amount', 'frequency', 'mandatory', 'actions'];
  feeColumns = ['student', 'category', 'amount', 'paid', 'dueDate', 'status', 'actions'];

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
      error: () => {},
    });
  }

  loadCategories() {
    this.loadingCategories = true;
    this.feeService.getFeeCategories({ limit: 100 } as any).subscribe({
      next: (res: any) => {
        this.loadingCategories = false;
        this.categories = res.data?.items || res.data || [];
      },
      error: () => { this.loadingCategories = false; },
    });
  }

  loadStudentFees() {
    this.loadingFees = true;
    const params: any = { limit: this.feePageSize, page: this.feePage + 1 };
    if (this.filterStatus) params.status = this.filterStatus;
    this.feeService.getAllStudentFees(params).subscribe({
      next: (res: any) => {
        this.loadingFees = false;
        this.studentFees = res.data?.items || [];
        this.totalFees = res.data?.pagination?.total || 0;
      },
      error: () => { this.loadingFees = false; },
    });
  }

  onFeePageChange(e: PageEvent) {
    this.feePage = e.pageIndex;
    this.feePageSize = e.pageSize;
    this.loadStudentFees();
  }

  openCategoryForm(cat?: any) {
    const ref = this.dialog.open(FeeCategoryFormComponent, {
      width: '500px',
      data: cat || null,
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadAll(); });
  }

  openAssignForm() {
    const ref = this.dialog.open(FeeAssignFormComponent, {
      width: '520px',
      data: null,
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadAll(); });
  }

  openPaymentForm(fee: any) {
    const ref = this.dialog.open(PaymentFormComponent, {
      width: '520px',
      data: {
        studentFeeId: fee.id,
        studentName:  fee.studentName || fee.student_name || 'Student',
        categoryName: fee.category_name || 'Fee',
        amountDue:    parseFloat(fee.amount || 0),
        amountPaid:   parseFloat(fee.amount_paid || 0),
      },
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadAll(); });
  }

  deleteCategory(cat: any) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.feeService.deleteFeeCategory(cat.id).subscribe({
      next: () => {
        this.notificationService.success('Category deleted');
        this.loadCategories();
      },
      error: () => this.notificationService.error('Failed to delete category'),
    });
  }

  deleteFee(fee: any) {
    if (!confirm('Delete this fee record?')) return;
    this.feeService.deleteStudentFee(fee.id).subscribe({
      next: () => {
        this.notificationService.success('Fee record deleted');
        this.loadStudentFees();
      },
      error: () => this.notificationService.error('Failed to delete fee record'),
    });
  }

  formatAmount(val: any): string {
    return parseFloat(val || 0).toLocaleString('en-IN');
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      paid: 'chip-success', pending: 'chip-warn', overdue: 'chip-danger',
      partial: 'chip-info', waived: 'chip-neutral',
    };
    return map[status] || '';
  }
}
