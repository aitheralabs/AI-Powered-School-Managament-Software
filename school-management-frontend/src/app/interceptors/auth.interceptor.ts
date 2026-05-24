import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, filter, take, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Track if a token refresh is in progress
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for auth endpoints (login, register, refresh) and super-admin endpoints
  // (super-admin components manage their own token via explicit headers)
  const isAuthEndpoint = req.url.includes('/auth/login') ||
                         req.url.includes('/auth/register') ||
                         req.url.includes('/auth/refresh');

  const isSuperAdminEndpoint = req.url.includes('/superadmin');

  // Get the auth token from the service
  const authToken = authService.getToken();

  // Clone the request and add the authorization header if token exists and not an auth endpoint
  let authReq = req;
  if (authToken && !isAuthEndpoint) {
    authReq = addToken(req, authToken);
  }

  // Handle the request and catch any errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint && !isSuperAdminEndpoint) {
        // Token expired or invalid, attempt to refresh (school users only)
        return handle401Error(authReq, next, authService, router);
      }
      if (error.status === 403) {
        // User lacks required role — redirect to unauthorized page
        router.navigate(['/unauthorized']);
        return throwError(() => error);
      }
      return throwError(() => error);
    })
  );
};

function addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
  // Don't overwrite a header that was explicitly set by the caller (e.g. super-admin token)
  if (request.headers.has('Authorization')) {
    return request;
  }
  return request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`)
  });
}

function handle401Error(
  request: HttpRequest<any>,
  next: any,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;

    // Attempt to refresh the token
    return authService.refreshToken().pipe(
      switchMap((response): Observable<HttpEvent<any>> => {
        isRefreshing = false;
        
        if (response.success && response.data?.token) {
          // Retry the failed request with the new token
          return next(addToken(request, response.data.token)) as Observable<HttpEvent<any>>;
        }
        
        // Refresh failed, logout user
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => new Error('Token refresh failed'));
      }),
      catchError((error): Observable<HttpEvent<any>> => {
        isRefreshing = false;
        
        // Refresh failed, logout user
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  } else {
    // If refresh is already in progress, wait for it to complete
    // then retry the request with the new token
    return authService.token$.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token): Observable<HttpEvent<any>> => {
        return next(addToken(request, token!)) as Observable<HttpEvent<any>>;
      })
    );
  }
}