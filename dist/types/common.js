"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogSchema = exports.NotificationSchema = exports.SearchQuerySchema = exports.FileResponseSchema = exports.FileUploadSchema = exports.BulkActionResponseSchema = exports.BulkActionSchema = exports.StatusSchema = exports.SortOrderSchema = exports.PaginatedResponseSchema = exports.ErrorResponseSchema = exports.SuccessResponseSchema = exports.PhoneSchema = exports.EmailSchema = exports.DateSchema = exports.PaginationSchema = exports.IdSchema = void 0;
const zod_1 = require("zod");
exports.IdSchema = zod_1.z.string().min(1, 'ID is required').refine((id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isNumber = /^\d+$/.test(id);
    return uuidRegex.test(id) || isNumber || id.length > 0;
}, 'Invalid ID format');
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().default('1').superRefine((val, ctx) => {
        const num = Number(val);
        if (isNaN(num) || !Number.isInteger(num) || num < 1) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: 'Page must be a positive integer >= 1' });
        }
    }).transform(val => Number(val)),
    limit: zod_1.z.string().optional().default('10').superRefine((val, ctx) => {
        const num = Number(val);
        if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 100) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: 'Limit must be an integer between 1 and 100' });
        }
    }).transform(val => Number(val)),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
exports.DateSchema = zod_1.z.string().refine((date) => {
    return !isNaN(Date.parse(date));
}, 'Invalid date format');
exports.EmailSchema = zod_1.z.string().email('Invalid email format');
exports.PhoneSchema = zod_1.z.string().min(10, 'Phone number must be at least 10 characters');
exports.SuccessResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean().default(true),
    message: zod_1.z.string(),
    data: zod_1.z.any().optional(),
});
exports.ErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean().default(false),
    message: zod_1.z.string(),
    error: zod_1.z.string().optional(),
    details: zod_1.z.any().optional(),
});
exports.PaginatedResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean().default(true),
    data: zod_1.z.array(zod_1.z.any()),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        total: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
exports.SortOrderSchema = zod_1.z.enum(['asc', 'desc']);
exports.StatusSchema = zod_1.z.enum(['active', 'inactive', 'pending', 'suspended']);
exports.BulkActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['activate', 'deactivate', 'delete', 'update']),
    ids: zod_1.z.array(exports.IdSchema).min(1, 'At least one ID is required'),
    data: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.BulkActionResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    processed: zod_1.z.number(),
    failed: zod_1.z.number(),
    errors: zod_1.z.array(zod_1.z.object({
        id: exports.IdSchema,
        error: zod_1.z.string(),
    })).optional(),
});
exports.FileUploadSchema = zod_1.z.object({
    fieldname: zod_1.z.string(),
    originalname: zod_1.z.string(),
    encoding: zod_1.z.string(),
    mimetype: zod_1.z.string(),
    size: zod_1.z.number(),
    filename: zod_1.z.string(),
    path: zod_1.z.string(),
});
exports.FileResponseSchema = zod_1.z.object({
    id: exports.IdSchema,
    filename: zod_1.z.string(),
    originalName: zod_1.z.string(),
    mimetype: zod_1.z.string(),
    size: zod_1.z.number(),
    url: zod_1.z.string(),
    uploadedBy: exports.IdSchema,
    uploadedAt: zod_1.z.string(),
});
exports.SearchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    fields: zod_1.z.array(zod_1.z.string()).optional(),
    filters: zod_1.z.record(zod_1.z.any()).optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
    sortBy: zod_1.z.string().optional(),
    sortOrder: exports.SortOrderSchema.optional().default('asc'),
});
exports.NotificationSchema = zod_1.z.object({
    id: exports.IdSchema,
    type: zod_1.z.enum(['info', 'success', 'warning', 'error']),
    title: zod_1.z.string(),
    message: zod_1.z.string(),
    userId: exports.IdSchema.optional(),
    isRead: zod_1.z.boolean().default(false),
    data: zod_1.z.record(zod_1.z.any()).optional(),
    expiresAt: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
});
exports.AuditLogSchema = zod_1.z.object({
    id: exports.IdSchema,
    action: zod_1.z.string(),
    entityType: zod_1.z.string(),
    entityId: exports.IdSchema,
    userId: exports.IdSchema,
    changes: zod_1.z.record(zod_1.z.any()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
});
//# sourceMappingURL=common.js.map