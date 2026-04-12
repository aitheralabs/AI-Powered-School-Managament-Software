import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { SharedModule } from './shared/shared.module';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { AuthService } from './services/auth.service';
import { LoadingService } from './services/loading.service';
import { RealtimeNotificationService } from './services/realtime-notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, SharedModule, HeaderComponent, SidebarComponent, LoadingSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'School Management System';
  isAuthenticated = false;
  isLoading = false;
  sidenavOpened = true;
  
  // Route prefixes that bypass the authenticated shell layout
  // These render with a full-screen blank canvas (no header/sidebar)
  private readonly publicPrefixes = ['/', '/auth', '/super-admin', '/unauthorized'];

  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    private notifService: RealtimeNotificationService,
  ) {}

  ngOnInit() {
    // Subscribe to authentication state
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      // Request browser notification permission once authenticated
      if (user) {
        this.notifService.requestBrowserPermission();
      }
    });

    // Subscribe to loading state and update UI
    this.loadingService.loading$.subscribe(loading => {
      this.isLoading = loading;
      
      // Optional: Add a small delay to prevent flickering for fast requests
      if (!loading) {
        setTimeout(() => {
          this.isLoading = loading;
        }, 100);
      }
    });

    // Check if current route is public and handle mobile navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Auto-close sidenav on mobile after navigation
      if (this.isMobile()) {
        this.sidenavOpened = false;
      }
    });

    // Set initial sidenav state based on screen size
    this.sidenavOpened = !this.isMobile();
  }

  /** True for routes that render without the app shell (header + sidebar). */
  isPublicRoute(): boolean {
    const url = this.router.url.split('?')[0]; // strip query params
    return this.publicPrefixes.some(prefix =>
      prefix === '/' ? url === '/' : url.startsWith(prefix)
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