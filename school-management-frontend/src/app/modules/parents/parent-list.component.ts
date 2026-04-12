import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

import { ParentService } from '../../services/parent.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ParentFormDialogComponent } from './parent-form-dialog.component';

@Component({
  selector: 'app-parent-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatPaginatorModule,
  ],
  templateUrl: './parent-list.component.html',
  styleUrl: './parent-list.component.scss',
})
export class ParentListComponent implements OnInit {
  parents: any[] = [];
  loading = false;
  isAdmin = false;
  search = '';

  total = 0;
  page = 0;
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
        this.total = res.data?.pagination?.total || this.parents.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearch() {
    this.page = 0;
    this.loadParents();
  }
  onPageChange(e: PageEvent) {
    this.page = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadParents();
  }

  openForm(parent?: any) {
    const ref = this.dialog.open(ParentFormDialogComponent, {
      width: '560px',
      data: parent || null,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.error) {
        this.notificationService.error(result.error);
        return;
      }
      this.notificationService.success(
        parent ? 'Parent updated' : 'Parent created',
      );
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
