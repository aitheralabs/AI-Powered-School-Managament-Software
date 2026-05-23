import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import env from '../config/env';
import { auditSecurity } from './auditLogger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode?: string;
  public context?: any;

  constructor(message: string, statusCode: number = 500, errorCode?: string, context?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication-specific error class
export class AuthError extends AppError {
  public attemptCount?: number;
  public lockoutTime?: Date;
  public ipAddress?: string;
  public userAgent?: string;
  public remainingAttempts?: number;

  constructor(
    message: string, 
    statusCode: number = 401, 
    errorCode?: string,
    context?: {
      attemptCount?: number;
      lockoutTime?: Date;
      ipAddress?: string;
      userAgent?: string;
      userId?: string;
      email?: string;
      remainingAttempts?: number;
    }
  ) {
    super(message, statusCode, errorCode, context);
    this.attemptCount = context?.attemptCount;
    this.lockoutTime = context?.lockoutTime;
    this.ipAddress = context?.ipAddress;
    this.userAgent = context?.userAgent;
    this.remainingAttempts = context?.remainingAttempts;
  }
}

// Security logger for authentication events
const logSecurityEvent = (event: string, details: any, req: Request) => {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    ...details,
  };

  // In production, this should go to a security monitoring system
  if (env.NODE_ENV === 'production') {
    console.log('🔒 SECURITY EVENT:', JSON.stringify(logData));
  } else {
    console.warn('🔒 Security Event:', logData);
  }
};

// Error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;
  let errorCode: string | undefined = undefined;

  // Handle different types of errors
  if (error instanceof AuthError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
    
    // Log security event for authentication failures
    logSecurityEvent('AUTH_FAILURE', {
      errorCode: error.errorCode,
      message: error.message,
      attemptCount: error.attemptCount,
      lockoutTime: error.lockoutTime,
      context: error.context,
    }, req);

    // Add rate limiting info to response if available
    if (error.attemptCount && error.attemptCount > 3) {
      details = {
        attemptCount: error.attemptCount,
        lockoutTime: error.lockoutTime,
        message: 'Multiple failed attempts detected. Account may be temporarily locked.',
      };
    }
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
    
    // Log authentication-related app errors
    if (statusCode === 401 || statusCode === 403) {
      logSecurityEvent('AUTH_ERROR', {
        errorCode: error.errorCode,
        message: error.message,
        context: error.context,
      }, req);
    }
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    errorCode = 'VALIDATION_ERROR';
    details = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
    
    logSecurityEvent('INVALID_TOKEN', {
      error: error.message,
    }, req);
    
    // Audit security event
    auditSecurity.unauthorizedAccess(req, 'Invalid JWT token');
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errorCode = 'TOKEN_EXPIRED';
    
    logSecurityEvent('TOKEN_EXPIRED', {
      error: error.message,
    }, req);
    
    // Audit security event
    auditSecurity.unauthorizedAccess(req, 'Expired JWT token');
  } else if (error.message.includes('duplicate key value')) {
    statusCode = 409;
    message = 'Resource already exists';
    errorCode = 'DUPLICATE_RESOURCE';
  } else if (error.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
    errorCode = 'INVALID_REFERENCE';
  } else if (error.message.includes('connection')) {
    statusCode = 503;
    message = 'Service temporarily unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  }

  // Log error details
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    console.error('❌ Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      errorCode,
    });
  } else {
    // In production, log errors without sensitive information
    console.error('❌ Error:', {
      message: statusCode >= 500 ? 'Internal server error' : message,
      statusCode,
      errorCode,
      timestamp: new Date().toISOString(),
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  // Sanitize error message for production
  const sanitizedMessage = env.NODE_ENV === 'production' && statusCode >= 500 
    ? 'Internal server error' 
    : message;

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: sanitizedMessage,
    ...(errorCode && { errorCode }),
    ...(details && { details }),
    ...((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && { stack: error.stack }),
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
