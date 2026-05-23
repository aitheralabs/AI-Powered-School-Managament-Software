import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';
import { RealtimeNotificationService } from '../../services/realtime-notification.service';
import { User } from '../../models/user.model';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let currentUser$: BehaviorSubject<User | null>;
  let routerEvents$: Subject<any>;
  let unreadCount$: BehaviorSubject<number>;

  const mockUser: User = {
    id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
    role: 'admin', isActive: true, createdAt: '', updatedAt: ''
  };

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<User | null>(null);
    routerEvents$ = new Subject();
    unreadCount$ = new BehaviorSubject<number>(0);

    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: currentUser$.asObservable()
    });

    routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEvents$.asObservable(),
      url: '/dashboard'
    });

    const notifServiceSpy = jasmine.createSpyObj('RealtimeNotificationService', ['connect'], {
      unreadCount: unreadCount$.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: RealtimeNotificationService, useValue: notifServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user name when logged in', () => {
    currentUser$.next(mockUser);
    expect(component.getUserDisplayName()).toBe('John Doe');
  });

  it('should display "User" when not logged in', () => {
    expect(component.getUserDisplayName()).toBe('User');
  });

  it('should get user initials', () => {
    currentUser$.next(mockUser);
    expect(component.getUserInitials()).toBe('JD');
  });

  it('should return "U" for initials when no user', () => {
    expect(component.getUserInitials()).toBe('U');
  });

  it('should capitalize user role', () => {
    currentUser$.next(mockUser);
    expect(component.getUserRole()).toBe('Admin');
  });

  it('should return empty string for role when no user', () => {
    expect(component.getUserRole()).toBe('');
  });

  it('should emit toggleSidenav event', () => {
    spyOn(component.toggleSidenav, 'emit');
    component.onToggleSidenav();
    expect(component.toggleSidenav.emit).toHaveBeenCalled();
  });

  it('should navigate to profile', () => {
    component.onProfile();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should navigate to settings', () => {
    component.onSettings();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('should call logout', () => {
    component.onLogout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should toggle notification panel', () => {
    expect(component.notifPanelOpen).toBe(false);
    component.toggleNotifPanel(new Event('click'));
    expect(component.notifPanelOpen).toBe(true);
    component.toggleNotifPanel(new Event('click'));
    expect(component.notifPanelOpen).toBe(false);
  });

  it('should close notification panel', () => {
    component.notifPanelOpen = true;
    component.closeNotifPanel();
    expect(component.notifPanelOpen).toBe(false);
  });

  it('should get page title for known routes', () => {
    component.currentUrl = '/students';
    expect(component.getPageTitle()).toBe('Students');
  });

  it('should return Dashboard for unknown routes', () => {
    component.currentUrl = '/unknown';
    expect(component.getPageTitle()).toBe('Dashboard');
  });

  it('should track notification count', () => {
    unreadCount$.next(5);
    expect(component.notificationCount).toBe(5);
  });

  it('should cleanup on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
