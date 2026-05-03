"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeReportSchema = exports.FeeReportItemSchema = exports.FeeReportQuerySchema = exports.ClassFeeSummarySchema = exports.StudentFeeSummarySchema = exports.FeeQuerySchema = exports.AssignFeesToClassSchema = exports.AssignFeesToStudentsSchema = exports.PaymentResponseSchema = exports.CreatePaymentSchema = exports.StudentFeeResponseSchema = exports.UpdateStudentFeeSchema = exports.CreateStudentFeeSchema = exports.FeeCategoryResponseSchema = exports.UpdateFeeCategorySchema = exports.CreateFeeCategorySchema = exports.PaymentMethodSchema = exports.FeeStatusSchema = exports.FeeFrequencySchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.FeeFrequencySchema = zod_1.z.enum(['monthly', 'quarterly', 'semester', 'annual', 'one-time']);
exports.FeeStatusSchema = zod_1.z.enum(['pending', 'partial', 'paid', 'overdue', 'waived']);
exports.PaymentMethodSchema = zod_1.z.enum(['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi']);
exports.CreateFeeCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Fee category name is required'),
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
    frequency: exports.FeeFrequencySchema,
    isMandatory: zod_1.z.boolean().optional().default(true),
    academicYearId: common_1.IdSchema.optional(),
});
exports.UpdateFeeCategorySchema = exports.CreateFeeCategorySchema.partial().omit({ academicYearId: true });
exports.FeeCategoryResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    amount: zod_1.z.number(),
    frequency: exports.FeeFrequencySchema,
    isMandatory: zod_1.z.boolean(),
    academicYearId: common_1.IdSchema,
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    academicYear: zod_1.z.object({
        name: zod_1.z.string(),
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string(),
    }).optional(),
});
exports.CreateStudentFeeSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    feeCategoryId: common_1.IdSchema,
    amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
    dueDate: common_1.DateSchema,
    discountAmount: zod_1.z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
});
exports.UpdateStudentFeeSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0, 'Amount cannot be negative').optional(),
    dueDate: common_1.DateSchema.optional(),
    discountAmount: zod_1.z.number().min(0, 'Discount amount cannot be negative').optional(),
    status: exports.FeeStatusSchema.optional(),
});
exports.StudentFeeResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    studentId: common_1.IdSchema,
    feeCategoryId: common_1.IdSchema,
    amount: zod_1.z.number(),
    dueDate: zod_1.z.string(),
    status: exports.FeeStatusSchema,
    discountAmount: zod_1.z.number(),
    totalAmount: zod_1.z.number(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    student: zod_1.z.object({
        studentId: zod_1.z.string(),
        user: zod_1.z.object({
            firstName: zod_1.z.string(),
            lastName: zod_1.z.string(),
        }),
    }).optional(),
    feeCategory: zod_1.z.object({
        name: zod_1.z.string(),
        frequency: exports.FeeFrequencySchema,
    }).optional(),
});
exports.CreatePaymentSchema = zod_1.z.object({
    studentFeeId: common_1.IdSchema,
    amount: zod_1.z.number().min(0.01, 'Payment amount must be greater than 0'),
    paymentDate: common_1.DateSchema.optional(),
    paymentMethod: exports.PaymentMethodSchema,
    transactionId: zod_1.z.string().optional(),
    receiptNumber: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
exports.PaymentResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    studentFeeId: common_1.IdSchema,
    amount: zod_1.z.number(),
    paymentDate: zod_1.z.string(),
    paymentMethod: exports.PaymentMethodSchema,
    transactionId: zod_1.z.string().nullable(),
    receiptNumber: zod_1.z.string(),
    processedBy: common_1.IdSchema,
    remarks: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    studentFee: zod_1.z.object({
        student: zod_1.z.object({
            studentId: zod_1.z.string(),
            user: zod_1.z.object({
                firstName: zod_1.z.string(),
                lastName: zod_1.z.string(),
            }),
        }),
        feeCategory: zod_1.z.object({
            name: zod_1.z.string(),
        }),
    }).optional(),
    processedByUser: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
    }).optional(),
});
exports.AssignFeesToStudentsSchema = zod_1.z.object({
    feeCategoryId: common_1.IdSchema,
    studentIds: zod_1.z.array(common_1.IdSchema).min(1, 'At least one student must be selected'),
    dueDate: common_1.DateSchema,
    discountAmount: zod_1.z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
});
exports.AssignFeesToClassSchema = zod_1.z.object({
    feeCategoryId: common_1.IdSchema,
    classId: common_1.IdSchema,
    dueDate: common_1.DateSchema,
    discountAmount: zod_1.z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
});
exports.FeeQuerySchema = zod_1.z.object({
    studentId: common_1.IdSchema.optional(),
    classId: common_1.IdSchema.optional(),
    feeCategoryId: common_1.IdSchema.optional(),
    status: exports.FeeStatusSchema.optional(),
    startDate: common_1.DateSchema.optional(),
    endDate: common_1.DateSchema.optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
});
exports.StudentFeeSummarySchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    totalFees: zod_1.z.number(),
    paidAmount: zod_1.z.number(),
    pendingAmount: zod_1.z.number(),
    overdueAmount: zod_1.z.number(),
    discountAmount: zod_1.z.number(),
    lastPaymentDate: zod_1.z.string().nullable(),
});
exports.ClassFeeSummarySchema = zod_1.z.object({
    classId: common_1.IdSchema,
    className: zod_1.z.string(),
    totalStudents: zod_1.z.number(),
    totalFees: zod_1.z.number(),
    totalPaid: zod_1.z.number(),
    totalPending: zod_1.z.number(),
    totalOverdue: zod_1.z.number(),
    collectionPercentage: zod_1.z.number(),
});
exports.FeeReportQuerySchema = zod_1.z.object({
    classId: common_1.IdSchema.optional(),
    feeCategoryId: common_1.IdSchema.optional(),
    startDate: common_1.DateSchema,
    endDate: common_1.DateSchema,
    status: exports.FeeStatusSchema.optional(),
    groupBy: zod_1.z.enum(['student', 'class', 'category', 'date']).optional().default('student'),
    format: zod_1.z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});
exports.FeeReportItemSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    studentName: zod_1.z.string(),
    className: zod_1.z.string(),
    feeCategoryName: zod_1.z.string(),
    totalAmount: zod_1.z.number(),
    paidAmount: zod_1.z.number(),
    pendingAmount: zod_1.z.number(),
    status: exports.FeeStatusSchema,
    dueDate: zod_1.z.string(),
    lastPaymentDate: zod_1.z.string().nullable(),
});
exports.FeeReportSchema = zod_1.z.object({
    reportType: zod_1.z.string(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    generatedAt: zod_1.z.string(),
    data: zod_1.z.array(exports.FeeReportItemSchema),
    summary: zod_1.z.object({
        totalStudents: zod_1.z.number(),
        totalAmount: zod_1.z.number(),
        totalPaid: zod_1.z.number(),
        totalPending: zod_1.z.number(),
        collectionPercentage: zod_1.z.number(),
    }),
});
//# sourceMappingURL=fee.js.map