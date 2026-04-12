import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../services/auth.service';
import { RealtimeNotificationService } from '../../services/realtime-notification.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { User } from '../../models/user.model';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':              'Dashboard',
  '/students':               'Students',
  '/students/add':           'Add Student',
  '/teachers':               'Teachers',
  '/classes':                'Classes',
  '/attendance':             'Attendance',
  '/attendance/marking':     'Mark Attendance',
  '/attendance/reports':     'Attendance Reports',
  '/fees':                   'Fees',
  '/fees/categories':        'Fee Categories',
  '/fees/student-fees':      'Student Fees',
  '/fees/payments':          'Payments',
  '/grades':                 'Grades',
  '/reports':                'Reports',
  '/staff':                  'Staff',
  '/parents':                'Parents',
  '/settings':               'Settings',
  '/ai-insights':            'AI Insights',
  '/ai-chat':                'AI Assistant',
  '/academic':               'Academic',
  '/subjects':               'Subjects',
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatToolbarModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatBadgeModule, MatDividerModule,
    MatRippleModule, MatTooltipModule,
    NotificationPanelComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidenav = new EventEmitter<void>();

  currentUser: User | null = null;
  notificationCount = 0;
  currentUrl = '/dashboard';
  notifPanelOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    public notifService: RealtimeNotificationService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentUrl = e.urlAfterRedirects;
    });

    this.currentUrl = this.router.url;

    // Subscribe to real unread count
    this.notifService.unreadCount.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.notificationCount = count;
    });
  }

  onToggleSidenav() { this.toggleSidenav.emit(); }
  onProfile()       { this.router.navigate(['/profile']); }
  onSettings()      { this.router.navigate(['/settings']); }
  onLogout()        { this.authService.logout(); }

  toggleNotifPanel(event: Event): void {
    event.stopPropagation();
    this.notifPanelOpen = !this.notifPanelOpen;
  }

  closeNotifPanel(): void {
    this.notifPanelOpen = false;
  }

  getUserDisplayName(): string {
    if (this.currentUser) return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    return 'User';
  }

  getUserInitials(): string {
    if (this.currentUser) {
      const f = this.currentUser.firstName?.[0] ?? '';
      const l = this.currentUser.lastName?.[0] ?? '';
      return (f + l).toUpperCase();
    }
    return 'U';
  }

  getUserRole(): string {
    if (!this.currentUser?.role) return '';
    return this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
  }

  getPageTitle(): string {
    for (const [path, title] of Object.entries(ROUTE_TITLES)) {
      if (this.currentUrl.startsWith(path)) return title;
    }
    return 'Dashboard';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
