import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let currentUser$: BehaviorSubject<User | null>;

  const mockAdmin: User = {
    id: '1', firstName: 'Admin', lastName: 'User', email: 'admin@test.com',
    role: 'admin', isActive: true, createdAt: '', updatedAt: ''
  };

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<User | null>(null);

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole'], {
      currentUser$: currentUser$.asObservable()
    });
    authServiceSpy.hasRole.and.returnValue(true);

    routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/dashboard',
      events: of()
    });

    await TestBed.configureTestingModule({
      imports: [SidebarComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} }, params: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have menu items defined', () => {
    expect(component.menuItems.length).toBeGreaterThan(0);
  });

  it('should check access for roles', () => {
    expect(component.hasAccess(['admin'])).toBe(true);
    expect(authServiceSpy.hasRole).toHaveBeenCalledWith(['admin']);
  });

  it('should toggle menu expansion', () => {
    const item = component.menuItems.find(m => m.children);
    expect(item).toBeTruthy();
    expect(item!.expanded).toBeFalsy();
    component.toggleExpansion(item!);
    expect(item!.expanded).toBe(true);
    component.toggleExpansion(item!);
    expect(item!.expanded).toBe(false);
  });

  it('should navigate and close sidenav', () => {
    spyOn(component.closeSidenav, 'emit');
    component.navigateTo('/students');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/students']);
    expect(component.closeSidenav.emit).toHaveBeenCalled();
  });

  it('should check active route', () => {
    expect(component.isActive('/dashboard')).toBe(true);
    expect(component.isActive('/students')).toBe(false);
  });

  it('should display user name when logged in', () => {
    currentUser$.next(mockAdmin);
    expect(component.getUserDisplayName()).toBe('Admin User');
  });

  it('should return "User" when no user', () => {
    expect(component.getUserDisplayName()).toBe('User');
  });

  it('should get capitalized role', () => {
    currentUser$.next(mockAdmin);
    expect(component.getUserRole()).toBe('Admin');
  });

  it('should return empty string for role when no user', () => {
    expect(component.getUserRole()).toBe('');
  });

  it('should include Dashboard menu item accessible to all roles', () => {
    const dashboard = component.menuItems.find(m => m.title === 'Dashboard');
    expect(dashboard).toBeTruthy();
    expect(dashboard!.roles).toContain('admin');
    expect(dashboard!.roles).toContain('student');
    expect(dashboard!.roles).toContain('teacher');
  });
});
