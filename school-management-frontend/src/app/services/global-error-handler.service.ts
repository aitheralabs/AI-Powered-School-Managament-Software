import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { ErrorService } from './error.service';
import { environment } from '../../environments/environment';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error | HttpErrorResponse): void {
    const notificationService = this.injector.get(NotificationService);
    const errorService = this.injector.get(ErrorService);
    const router = this.injector.get(Router);

    // Log error for debugging
    errorService.logError(error, 'GlobalErrorHandler');

    if (error instanceof HttpErrorResponse) {
      // Server or connection error
      this.handleHttpError(error, notificationService, router);
    } else {
      // Client-side error
      this.handleClientError(error, notificationService);
    }
  }

  private handleHttpError(
    error: HttpErrorResponse,
    notificationService: NotificationService,
    router: Router
  ): void {
    const errorMessage = this.injector.get(ErrorService).processError(error);

    // Handle specific HTTP status codes
    switch (error.status) {
      case 0:
        // Network error
        notificationService.error(
          'Unable to connect to the server. Please check your internet connection.',
          'Connection Error'
        );
        break;

      case 401:
        // Unauthorized - handled by auth interceptor
        // Don't show notification as user will be redirected to login
        break;

      case 403:
        // Forbidden
        notificationService.error(
          'You do not have permission to perform this action.',
          'Access Denied'
        );
        router.navigate(['/unauthorized']);
        break;

      case 404:
        // Not found
        notificationService.warning(
          'The requested resource was not found.',
          'Not Found'
        );
        break;

      case 500:
      case 502:
      case 503:
        // Server errors
        notificationService.error(
          'A server error occurred. Please try again later.',
          'Server Error'
        );
        break;

      default:
        // Other HTTP errors
        notificationService.error(errorMessage.message, errorMessage.title);
    }
  }

  private handleClientError(
    error: Error,
    notificationService: NotificationService
  ): void {
    // Client-side errors (JavaScript errors)
    console.error('Client-side error:', error);

    // Only show notification in development mode to avoid confusing users
    if (!this.isProduction()) {
      notificationService.error(
        error.message || 'An unexpected error occurred',
        'Application Error'
      );
    } else {
      // In production, show a generic message
      notificationService.error(
        'An unexpected error occurred. Please refresh the page.',
        'Error'
      );
    }
  }

  private isProduction(): boolean {
    return environment.production;
  }
}
