import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from './error.service';

describe('ErrorService', () => {
  let service: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorService]
    });
    service = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('processError()', () => {
    it('should handle 400 Bad Request', () => {
      const error = new HttpErrorResponse({ status: 400, error: { message: 'Invalid input' } });
      const result = service.processError(error);
      expect(result.title).toBe('Invalid Request');
      expect(result.message).toBe('Invalid input');
    });

    it('should handle 401 Unauthorized', () => {
      const error = new HttpErrorResponse({ status: 401 });
      const result = service.processError(error);
      expect(result.title).toBe('Authentication Required');
    });

    it('should handle 403 Forbidden', () => {
      const error = new HttpErrorResponse({ status: 403 });
      const result = service.processError(error);
      expect(result.title).toBe('Access Denied');
    });

    it('should handle 404 Not Found', () => {
      const error = new HttpErrorResponse({ status: 404 });
      const result = service.processError(error);
      expect(result.title).toBe('Not Found');
    });

    it('should handle 409 Conflict', () => {
      const error = new HttpErrorResponse({ status: 409, error: { message: 'Email exists' } });
      const result = service.processError(error);
      expect(result.title).toBe('Conflict');
      expect(result.message).toBe('Email exists');
    });

    it('should handle 422 with validation errors array', () => {
      const error = new HttpErrorResponse({
        status: 422,
        error: { errors: [{ message: 'Name required' }, { message: 'Email invalid' }] }
      });
      const result = service.processError(error);
      expect(result.title).toBe('Validation Error');
      expect(result.message).toContain('Name required');
      expect(result.message).toContain('Email invalid');
    });

    it('should handle 500 Server Error', () => {
      const error = new HttpErrorResponse({ status: 500 });
      const result = service.processError(error);
      expect(result.title).toBe('Server Error');
    });

    it('should handle 503 Service Unavailable', () => {
      const error = new HttpErrorResponse({ status: 503 });
      const result = service.processError(error);
      expect(result.title).toBe('Service Unavailable');
    });

    it('should handle network error (status 0)', () => {
      const error = new HttpErrorResponse({ status: 0 });
      const result = service.processError(error);
      expect(result.title).toBe('Connection Error');
    });

    it('should handle unknown errors', () => {
      const result = service.processError({ some: 'error' });
      expect(result.type).toBe('error');
    });
  });

  describe('getErrorMessage()', () => {
    it('should return message for known code', () => {
      expect(service.getErrorMessage('TOKEN_EXPIRED')).toContain('session has expired');
    });

    it('should return default for unknown code', () => {
      expect(service.getErrorMessage('UNKNOWN_CODE')).toContain('unexpected error');
    });
  });

  describe('logError()', () => {
    it('should log error without throwing', () => {
      spyOn(console, 'error');
      expect(() => service.logError(new Error('test'), 'TestContext')).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('should log HttpErrorResponse details', () => {
      spyOn(console, 'error');
      const error = new HttpErrorResponse({ status: 500, url: '/api/test' });
      service.logError(error, 'API');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
