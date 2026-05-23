import { Request, Response, NextFunction } from 'express';
import { sanitizeObject, sanitizeRequestBody, FIELD_DEFINITIONS } from '../utils/sanitization';

/**
 * Middleware to sanitize all request inputs
 */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  try {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    const sanitizedBody = sanitizeObject(req.body);
    // Replace body object properties instead of the whole object (safer for some frameworks)
    Object.keys(req.body).forEach(key => delete (req.body as any)[key]);
    Object.assign(req.body as any, sanitizedBody);
  }
  
  // Sanitize query parameters (do not reassign req.query - mutate keys)
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery = sanitizeObject(req.query);
    Object.keys(req.query).forEach(key => delete (req.query as any)[key]);
    Object.assign(req.query as any, sanitizedQuery);
  }
  
  // Sanitize URL parameters (do not reassign req.params - mutate keys)
  if (req.params && typeof req.params === 'object') {
    const sanitizedParams = sanitizeObject(req.params);
    Object.keys(req.params).forEach(key => delete (req.params as any)[key]);
    Object.assign(req.params as any, sanitizedParams);
  }
  
  next();
  } catch (error) {
    console.error('Error in input sanitization middleware:', error);
    // Fail fast with a 400 for sanitization errors instead of 500s later
    res.status(400).json({ success: false, message: 'Invalid input' });
  }
};

/**
 * Create entity-specific sanitization middleware
 */
export const createEntitySanitizer = (entityType: keyof typeof FIELD_DEFINITIONS) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'object') {
        const fieldDefinitions = FIELD_DEFINITIONS[entityType];
        const sanitizedBody = sanitizeRequestBody(req.body, fieldDefinitions);
        Object.keys(req.body).forEach(key => delete (req.body as any)[key]);
        Object.assign(req.body as any, sanitizedBody);
      }
      
      // Still sanitize other parts of the request (mutate, do not reassign)
      if (req.query && typeof req.query === 'object') {
        const sanitizedQuery = sanitizeObject(req.query);
        Object.keys(req.query).forEach(key => delete (req.query as any)[key]);
        Object.assign(req.query as any, sanitizedQuery);
      }
      
      if (req.params && typeof req.params === 'object') {
        const sanitizedParams = sanitizeObject(req.params);
        Object.keys(req.params).forEach(key => delete (req.params as any)[key]);
        Object.assign(req.params as any, sanitizedParams);
      }
      
      return next();
    } catch (error) {
      console.error(`Error in ${entityType} sanitization middleware:`, error);
      // Fail fast with client error for bad inputs
      res.status(400).json({ success: false, message: 'Invalid input' });
      return;
    }
  };
};

/**
 * Specific sanitization middlewares for different entities
 */
export const sanitizeUser = createEntitySanitizer('user');
export const sanitizeAcademicYear = createEntitySanitizer('academicYear');
export const sanitizeSemester = createEntitySanitizer('semester');
export const sanitizeSubject = createEntitySanitizer('subject');
export const sanitizeClass = createEntitySanitizer('class');
export const sanitizeTeacher = createEntitySanitizer('teacher');

/**
 * Middleware to add security headers for XSS protection
 */
export const addSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

/**
 * Middleware to validate content type for POST/PUT requests
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];

    // Skip validation for requests with no body (e.g. POST /2fa/setup)
    const hasBody = req.headers['content-length'] && req.headers['content-length'] !== '0';
    if (hasBody && (!contentType || !contentType.includes('application/json'))) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be application/json',
      });
    }
  }

  return next();
};