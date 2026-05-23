import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard, RoleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'hasRole']);
    const rtrSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: rtrSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  function makeRoute(roles?: string[]): ActivatedRouteSnapshot {
    return { data: roles ? { roles } : {} } as any;
  }

  function makeState(url: string = '/dashboard'): RouterStateSnapshot {
    return { url } as any;
  }

  it('should allow access when authenticated and no role requirement', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    expect(guard.canActivate(makeRoute(), makeState())).toBe(true);
  });

  it('should allow access when authenticated with correct role', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.hasRole.and.returnValue(true);
    expect(guard.canActivate(makeRoute(['admin']), makeState())).toBe(true);
  });

  it('should redirect to unauthorized when role does not match', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.hasRole.and.returnValue(false);
    expect(guard.canActivate(makeRoute(['admin']), makeState())).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('should redirect to login with returnUrl when not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    expect(guard.canActivate(makeRoute(), makeState('/students'))).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/students' }
    });
  });
});

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'hasRole']);
    const rtrSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: rtrSpy }
      ]
    });

    guard = TestBed.inject(RoleGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  function makeRoute(roles?: string[]): ActivatedRouteSnapshot {
    return { data: roles ? { roles } : {} } as any;
  }

  function makeState(): RouterStateSnapshot {
    return { url: '/test' } as any;
  }

  it('should allow when authenticated and has role', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.hasRole.and.returnValue(true);
    expect(guard.canActivate(makeRoute(['admin']), makeState())).toBe(true);
  });

  it('should redirect to login when not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    expect(guard.canActivate(makeRoute(['admin']), makeState())).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should redirect to unauthorized when role mismatch', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.hasRole.and.returnValue(false);
    expect(guard.canActivate(makeRoute(['admin']), makeState())).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('should allow when no roles specified', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    expect(guard.canActivate(makeRoute(), makeState())).toBe(true);
  });
});
