import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, debounceTime } from 'rxjs/operators';

import { SharedModule } from './shared/shared.module';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { AuthService } from './services/auth.service';
import { LoadingService } from './services/loading.service';
import { RealtimeNotificationService } from './services/realtime-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    SharedModule,
    HeaderComponent,
    SidebarComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'School Management System';
  isAuthenticated = false;
  isLoading = false;
  sidenavOpened = true;

  private readonly publicPrefixes = [
    '/',
    '/auth',
    '/super-admin',
    '/unauthorized',
  ];

  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    private notifService: RealtimeNotificationService,
  ) {}

  ngOnInit() {
    // Authentication with debounce to prevent rapid changes
    this.authService.currentUser$.pipe(debounceTime(100)).subscribe((user) => {
      this.isAuthenticated = !!user;
      if (user) {
        this.notifService.requestBrowserPermission();
      }
    });

    // Loading state
    this.loadingService.loading$.pipe(debounceTime(50)).subscribe((loading) => {
      this.isLoading = loading;
    });

    // Navigation events
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile()) {
          this.sidenavOpened = false;
        }
      });

    // Initial state
    this.sidenavOpened = !this.isMobile();
  }

  isPublicRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return this.publicPrefixes.some((prefix) =>
      prefix === '/' ? url === '/' : url.startsWith(prefix),
    );
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  closeSidenav() {
    if (this.isMobile()) {
      this.sidenavOpened = false;
    }
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }
}
