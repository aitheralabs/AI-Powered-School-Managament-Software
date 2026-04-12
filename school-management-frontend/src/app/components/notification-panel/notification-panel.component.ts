import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import {
  RealtimeNotificationService, AppNotification
} from '../../services/realtime-notification.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, DatePipe,
    MatIconModule, MatButtonModule,
    MatDividerModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
<div class="notif-panel">
  <!-- Header -->
  <div class="notif-header">
    <h3>Notifications</h3>
    <div class="notif-header-actions">
      <button mat-icon-button matTooltip="Mark all as read" (click)="markAllAsRead()" [disabled]="unreadCount === 0">
        <mat-icon>done_all</mat-icon>
      </button>
      <button mat-icon-button matTooltip="Delete all" (click)="deleteAll()" [disabled]="notifications.length === 0">
        <mat-icon>delete_sweep</mat-icon>
      </button>
    </div>
  </div>

  <mat-divider></mat-divider>

  <!-- Loading -->
  <div *ngIf="isLoading" class="notif-loading">
    <mat-spinner diameter="32"></mat-spinner>
  </div>

  <!-- Empty -->
  <div *ngIf="!isLoading && notifications.length === 0" class="notif-empty">
    <mat-icon>notifications_none</mat-icon>
    <p>No notifications</p>
  </div>

  <!-- List -->
  <div class="notif-list" *ngIf="!isLoading && notifications.length > 0">
    <div
      *ngFor="let n of notifications; trackBy: trackById"
      class="notif-item"
      [class.unread]="n.status !== 'read'"
      (click)="markAsRead(n)"
    >
      <div class="notif-icon" [ngClass]="getIconClass(n.type)">
        <mat-icon>{{ getIcon(n.type) }}</mat-icon>
      </div>
      <div class="notif-content">
        <p class="notif-title">{{ n.title }}</p>
        <p class="notif-body">{{ n.body }}</p>
        <p class="notif-time">{{ n.createdAt | date:'shortTime' }} · {{ n.createdAt | date:'mediumDate' }}</p>
      </div>
      <button mat-icon-button class="notif-delete" (click)="deleteOne($event, n.id)">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  </div>

  <!-- Load more -->
  <div class="notif-footer" *ngIf="hasMore">
    <button mat-button (click)="loadMore()">Load more</button>
  </div>
</div>
  `,
  styles: [`
.notif-panel {
  width: 380px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  background: var(--surface, #fff);
}
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  h3 { margin: 0; font-size: 15px; font-weight: 600; }
}
.notif-header-actions { display: flex; gap: 4px; }
.notif-loading {
  display: flex; justify-content: center; padding: 32px;
}
.notif-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 16px; color: var(--text-muted, #94a3b8);
  mat-icon { font-size: 40px; width: 40px; height: 40px; }
  p { margin: 8px 0 0; font-size: 14px; }
}
.notif-list { overflow-y: auto; flex: 1; }
.notif-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; cursor: pointer; position: relative;
  transition: background 0.15s;
  &:hover { background: var(--hover-bg, #f8fafc); }
  &.unread { background: rgba(99,102,241,0.05); }
  &.unread::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: #6366f1; border-radius: 0 2px 2px 0;
  }
}
.notif-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  mat-icon { font-size: 18px; width: 18px; height: 18px; }
}
.notif-icon.fee   { background: rgba(16,185,129,0.1); color: #10b981; }
.notif-icon.att   { background: rgba(245,158,11,0.1);  color: #f59e0b; }
.notif-icon.grade { background: rgba(99,102,241,0.1);  color: #6366f1; }
.notif-icon.info  { background: rgba(59,130,246,0.1);  color: #3b82f6; }
.notif-content { flex: 1; min-width: 0; }
.notif-title  { margin: 0; font-size: 13px; font-weight: 600; color: var(--text, #1e293b); }
.notif-body   { margin: 2px 0; font-size: 12px; color: var(--text-muted, #64748b); line-height: 1.4;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-time   { margin: 4px 0 0; font-size: 11px; color: #94a3b8; }
.notif-delete {
  opacity: 0; transition: opacity 0.15s; width: 24px; height: 24px;
  mat-icon { font-size: 16px; width: 16px; height: 16px; }
}
.notif-item:hover .notif-delete { opacity: 1; }
.notif-footer { padding: 8px 16px; text-align: center; }
  `],
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  unreadCount = 0;
  isLoading = false;
  page = 1;
  hasMore = false;

  private destroy$ = new Subject<void>();

  constructor(
    private rtService: RealtimeNotificationService,
    private toast: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();

    // Subscribe to live notifications
    this.rtService.newNotification.pipe(takeUntil(this.destroy$)).subscribe(n => {
      this.notifications.unshift(n);
      this.unreadCount++;
      this.cdr.markForCheck();
    });

    this.rtService.unreadCount.pipe(takeUntil(this.destroy$)).subscribe(c => {
      this.unreadCount = c;
      this.cdr.markForCheck();
    });
  }

  load(append = false): void {
    this.isLoading = !append;
    this.rtService.getNotifications(this.page, 20).subscribe({
      next: res => {
        if (append) {
          this.notifications = [...this.notifications, ...res.data.items];
        } else {
          this.notifications = res.data.items;
        }
        this.unreadCount = res.data.unreadCount;
        this.hasMore = res.data.pagination.hasNext;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); },
    });
  }

  loadMore(): void {
    this.page++;
    this.load(true);
  }

  markAsRead(n: AppNotification): void {
    if (n.status === 'read') return;
    this.rtService.markAsRead(n.id).subscribe({
      next: () => {
        n.status = 'read';
        this.cdr.markForCheck();
      },
    });
  }

  markAllAsRead(): void {
    this.rtService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => (n.status = 'read'));
        this.unreadCount = 0;
        this.cdr.markForCheck();
        this.toast.success('All notifications marked as read');
      },
    });
  }

  deleteOne(event: Event, id: string): void {
    event.stopPropagation();
    this.rtService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.cdr.markForCheck();
      },
    });
  }

  deleteAll(): void {
    this.rtService.deleteAll().subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
        this.cdr.markForCheck();
        this.toast.success('All notifications cleared');
      },
    });
  }

  trackById(_: number, n: AppNotification): string { return n.id; }

  getIcon(type: string): string {
    if (type.includes('fee') || type.includes('payment')) return 'payments';
    if (type.includes('attend')) return 'how_to_reg';
    if (type.includes('grade') || type.includes('assignment')) return 'grade';
    return 'notifications';
  }

  getIconClass(type: string): string {
    if (type.includes('fee') || type.includes('payment')) return 'fee';
    if (type.includes('attend')) return 'att';
    if (type.includes('grade') || type.includes('assignment')) return 'grade';
    return 'info';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
