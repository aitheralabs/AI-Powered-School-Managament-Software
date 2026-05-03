import { z } from 'zod';
export declare const IdSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodEffects<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, string, string | undefined>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, string, string | undefined>, number, string | undefined>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    limit?: string | undefined;
    page?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const DateSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const EmailSchema: z.ZodString;
export declare const PhoneSchema: z.ZodString;
export declare const SuccessResponseSchema: z.ZodObject<{
    success: z.ZodDefault<z.ZodBoolean>;
    message: z.ZodString;
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    data?: any;
}, {
    message: string;
    success?: boolean | undefined;
    data?: any;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodDefault<z.ZodBoolean>;
    message: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    details?: any;
    error?: string | undefined;
}, {
    message: string;
    success?: boolean | undefined;
    details?: any;
    error?: string | undefined;
}>;
export declare const PaginatedResponseSchema: z.ZodObject<{
    success: z.ZodDefault<z.ZodBoolean>;
    data: z.ZodArray<z.ZodAny, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
    }, {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: any[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
    };
}, {
    data: any[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
    };
    success?: boolean | undefined;
}>;
export declare const SortOrderSchema: z.ZodEnum<["asc", "desc"]>;
export declare const StatusSchema: z.ZodEnum<["active", "inactive", "pending", "suspended"]>;
export declare const BulkActionSchema: z.ZodObject<{
    action: z.ZodEnum<["activate", "deactivate", "delete", "update"]>;
    ids: z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "activate" | "deactivate" | "delete" | "update";
    ids: string[];
    data?: Record<string, any> | undefined;
}, {
    action: "activate" | "deactivate" | "delete" | "update";
    ids: string[];
    data?: Record<string, any> | undefined;
}>;
export declare const BulkActionResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    processed: z.ZodNumber;
    failed: z.ZodNumber;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodEffects<z.ZodString, string, string>;
        error: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        error: string;
        id: string;
    }, {
        error: string;
        id: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    processed: number;
    failed: number;
    errors?: {
        error: string;
        id: string;
    }[] | undefined;
}, {
    message: string;
    success: boolean;
    processed: number;
    failed: number;
    errors?: {
        error: string;
        id: string;
    }[] | undefined;
}>;
export declare const FileUploadSchema: z.ZodObject<{
    fieldname: z.ZodString;
    originalname: z.ZodString;
    encoding: z.ZodString;
    mimetype: z.ZodString;
    size: z.ZodNumber;
    filename: z.ZodString;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    filename: string;
}, {
    path: string;
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    filename: string;
}>;
export declare const FileResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    filename: z.ZodString;
    originalName: z.ZodString;
    mimetype: z.ZodString;
    size: z.ZodNumber;
    url: z.ZodString;
    uploadedBy: z.ZodEffects<z.ZodString, string, string>;
    uploadedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    id: string;
    mimetype: string;
    size: number;
    filename: string;
    originalName: string;
    uploadedBy: string;
    uploadedAt: string;
}, {
    url: string;
    id: string;
    mimetype: string;
    size: number;
    filename: string;
    originalName: string;
    uploadedBy: string;
    uploadedAt: string;
}>;
export declare const SearchQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
    q?: string | undefined;
    fields?: string[] | undefined;
    filters?: Record<string, any> | undefined;
}, {
    limit?: string | undefined;
    page?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    q?: string | undefined;
    fields?: string[] | undefined;
    filters?: Record<string, any> | undefined;
}>;
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    type: z.ZodEnum<["info", "success", "warning", "error"]>;
    title: z.ZodString;
    message: z.ZodString;
    userId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    isRead: z.ZodDefault<z.ZodBoolean>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    expiresAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "success" | "error" | "info" | "warning";
    id: string;
    title: string;
    isRead: boolean;
    createdAt: string;
    userId?: string | undefined;
    data?: Record<string, any> | undefined;
    expiresAt?: string | undefined;
}, {
    message: string;
    type: "success" | "error" | "info" | "warning";
    id: string;
    title: string;
    createdAt: string;
    userId?: string | undefined;
    data?: Record<string, any> | undefined;
    isRead?: boolean | undefined;
    expiresAt?: string | undefined;
}>;
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    action: z.ZodString;
    entityType: z.ZodString;
    entityId: z.ZodEffects<z.ZodString, string, string>;
    userId: z.ZodEffects<z.ZodString, string, string>;
    changes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    action: string;
    userId: string;
    id: string;
    createdAt: string;
    entityType: string;
    entityId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    changes?: Record<string, any> | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    action: string;
    userId: string;
    id: string;
    createdAt: string;
    entityType: string;
    entityId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    changes?: Record<string, any> | undefined;
    metadata?: Record<string, any> | undefined;
}>;
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
//# sourceMappingURL=common.d.ts.map