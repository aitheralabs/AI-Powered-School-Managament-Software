import { z } from 'zod';

// Common validation schemas - accepts both UUID and regular IDs
export const IdSchema = z.string().min(1, 'ID is required').refine((id) => {
  // Check if it's a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Check if it's a number (for regular IDs)
  const isNumber = /^\d+$/.test(id);
  // Accept both UUID and numeric IDs
  return uuidRegex.test(id) || isNumber || id.length > 0;
}, 'Invalid ID format');

export const PaginationSchema = z.object({
  page: z.string().optional().default('1').superRefine((val, ctx) => {
    const num = Number(val);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Page must be a positive integer >= 1' });
    }
  }).transform(val => Number(val)),
  limit: z.string().optional().default('10').superRefine((val, ctx) => {
    const num = Number(val);
    if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Limit must be an integer between 1 and 100' });
    }
  }).transform(val => Number(val)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const DateSchema = z.string().refine((date) => {
  return !isNaN(Date.parse(date));
}, 'Invalid date format');

export const EmailSchema = z.string().email('Invalid email format');

export const PhoneSchema = z.string().min(10, 'Phone number must be at least 10 characters');

// Response schemas
export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string(),
  data: z.any().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  message: z.string(),
  error: z.string().optional(),
  details: z.any().optional(),
});

export const PaginatedResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// Additional common schemas
export const SortOrderSchema = z.enum(['asc', 'desc']);

export const StatusSchema = z.enum(['active', 'inactive', 'pending', 'suspended']);

export const BulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete', 'update']),
  ids: z.array(IdSchema).min(1, 'At least one ID is required'),
  data: z.record(z.any()).optional(),
});

export const BulkActionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  processed: z.number(),
  failed: z.number(),
  errors: z.array(z.object({
    id: IdSchema,
    error: z.string(),
  })).optional(),
});

// File upload schemas
export const FileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number(),
  filename: z.string(),
  path: z.string(),
});

export const FileResponseSchema = z.object({
  id: IdSchema,
  filename: z.string(),
  originalName: z.string(),
  mimetype: z.string(),
  size: z.number(),
  url: z.string(),
  uploadedBy: IdSchema,
  uploadedAt: z.string(),
});

// Search and filter schemas
export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.string().optional(),
  sortOrder: SortOrderSchema.optional().default('asc'),
});

// Notification schemas
export const NotificationSchema = z.object({
  id: IdSchema,
  type: z.enum(['info', 'success', 'warning', 'error']),
  title: z.string(),
  message: z.string(),
  userId: IdSchema.optional(),
  isRead: z.boolean().default(false),
  data: z.record(z.any()).optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
});

// Audit log schemas
export const AuditLogSchema = z.object({
  id: IdSchema,
  action: z.string(),
  entityType: z.string(),
  entityId: IdSchema,
  userId: IdSchema,
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.string(),
});

// Types
export type Id = z.infer<typeof IdSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;

export type SortOrder = z.infer<typeof SortOrderSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type BulkAction = z.infer<typeof BulkActionSchema>;
export type BulkActionResponse = z.infer<typeof BulkActionResponseSchema>;

export type FileUpload = z.infer<typeof FileUploadSchema>;
export type FileResponse = z.infer<typeof FileResponseSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
