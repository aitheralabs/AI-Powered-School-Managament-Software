import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { FeeService } from '../../../../services/fee.service';
import { NotificationService } from '../../../../services/notification.service';
import { ReportExportService } from '../../../../services/report-export.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule, MatPaginatorModule,
  ],
  templateUrl: './payment-list.component.html',
  styleUrl:    './payment-list.component.scss',
})
export class PaymentListComponent implements OnInit {
  payments: any[] = [];
  loading = false;
  total     = 0;
  page      = 0;
  pageSize  = 20;

  // Filters
  filterStartDate = '';
  filterEndDate   = '';
  filterMethod    = '';

  columns = ['date', 'student', 'category', 'amount', 'method', 'transactionId', 'actions'];
  paymentMethods = ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'online'];

  constructor(
    private feeService: FeeService,
    private notificationService: NotificationService,
    private exportService: ReportExportService,
  ) {}

  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.loading = true;
    const params: any = { limit: this.pageSize, page: this.page + 1 };
    if (this.filterStartDate) params.startDate = this.formatDate(this.filterStartDate);
    if (this.filterEndDate)   params.endDate   = this.formatDate(this.filterEndDate);
    if (this.filterMethod)    params.method    = this.filterMethod;

    this.feeService.getPayments(params).subscribe({
      next: (res: any) => {
        this.payments = res.data?.items || res.data || [];
        this.total    = res.data?.pagination?.total || 0;
        this.loading  = false;
      },
      error: () => { this.loading = false; },
    });
  }

  applyFilters() { this.page = 0; this.loadPayments(); }
  onPageChange(e: PageEvent) { this.page = e.pageIndex; this.pageSize = e.pageSize; this.loadPayments(); }

  exportCSV() {
    if (!this.payments.length) return;
    const rows = this.payments.map((p: any) => ({
      Date:          p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '',
      Student:       this.getStudentName(p),
      'Fee Category': p.studentFee?.feeCategory?.name || p.feeCategory?.name || '—',
      Amount:        p.amount,
      Method:        p.paymentMethod || p.method || '',
      'Transaction ID': p.transactionId || '',
    }));
    this.exportService.downloadCSV(rows, 'payments');
  }

  downloadReceipt(p: any) {
    this.feeService.getPaymentReceipt(p.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `receipt-${p.id}.pdf`; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Receipt not available'),
    });
  }

  getStudentName(p: any): string {
    const s = p.student || p.studentFee?.student;
    if (!s) return '—';
    return `${s.user?.firstName || s.firstName || ''} ${s.user?.lastName || s.lastName || ''}`.trim();
  }

  formatAmount(val: any): string {
    return parseFloat(val || 0).toLocaleString('en-IN');
  }

  private formatDate(val: any): string {
    if (!val) return '';
    return new Date(val).toISOString().split('T')[0];
  }
}
