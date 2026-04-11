import { z } from 'zod';
export declare const FeeFrequencySchema: z.ZodEnum<["monthly", "quarterly", "semester", "annual", "one-time"]>;
export declare const FeeStatusSchema: z.ZodEnum<["pending", "partial", "paid", "overdue", "waived"]>;
export declare const PaymentMethodSchema: z.ZodEnum<["cash", "card", "bank_transfer", "cheque", "online", "upi"]>;
export declare const CreateFeeCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    frequency: z.ZodEnum<["monthly", "quarterly", "semester", "annual", "one-time"]>;
    isMandatory: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    name: string;
    academicYearId: string;
    amount: number;
    frequency: "semester" | "monthly" | "quarterly" | "annual" | "one-time";
    isMandatory: boolean;
    description?: string | undefined;
}, {
    name: string;
    academicYearId: string;
    amount: number;
    frequency: "semester" | "monthly" | "quarterly" | "annual" | "one-time";
    description?: string | undefined;
    isMandatory?: boolean | undefined;
}>;
export declare const UpdateFeeCategorySchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    amount: z.ZodOptional<z.ZodNumber>;
    frequency: z.ZodOptional<z.ZodEnum<["monthly", "quarterly", "semester", "annual", "one-time"]>>;
    isMandatory: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    academicYearId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "academicYearId">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    amount?: number | undefined;
    frequency?: "semester" | "monthly" | "quarterly" | "annual" | "one-time" | undefined;
    isMandatory?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    amount?: number | undefined;
    frequency?: "semester" | "monthly" | "quarterly" | "annual" | "one-time" | undefined;
    isMandatory?: boolean | undefined;
}>;
export declare const FeeCategoryResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    amount: z.ZodNumber;
    frequency: z.ZodEnum<["monthly", "quarterly", "semester", "annual", "one-time"]>;
    isMandatory: z.ZodBoolean;
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    academicYear: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        startDate: string;
        endDate: string;
    }, {
        name: string;
        startDate: string;
        endDate: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string | null;
    academicYearId: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    amount: number;
    frequency: "semester" | "monthly" | "quarterly" | "annual" | "one-time";
    isMandatory: boolean;
    academicYear?: {
        name: string;
        startDate: string;
        endDate: string;
    } | undefined;
}, {
    name: string;
    description: string | null;
    academicYearId: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    amount: number;
    frequency: "semester" | "monthly" | "quarterly" | "annual" | "one-time";
    isMandatory: boolean;
    academicYear?: {
        name: string;
        startDate: string;
        endDate: string;
    } | undefined;
}>;
export declare const CreateStudentFeeSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    feeCategoryId: z.ZodEffects<z.ZodString, string, string>;
    amount: z.ZodNumber;
    dueDate: z.ZodEffects<z.ZodString, string, string>;
    discountAmount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    amount: number;
    dueDate: string;
    feeCategoryId: string;
    discountAmount: number;
}, {
    studentId: string;
    amount: number;
    dueDate: string;
    feeCategoryId: string;
    discountAmount?: number | undefined;
}>;
export declare const UpdateStudentFeeSchema: z.ZodObject<{
    amount: z.ZodOptional<z.ZodNumber>;
    dueDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    discountAmount: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["pending", "partial", "paid", "overdue", "waived"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "overdue" | "partial" | "paid" | "waived" | undefined;
    amount?: number | undefined;
    dueDate?: string | undefined;
    discountAmount?: number | undefined;
}, {
    status?: "pending" | "overdue" | "partial" | "paid" | "waived" | undefined;
    amount?: number | undefined;
    dueDate?: string | undefined;
    discountAmount?: number | undefined;
}>;
export declare const StudentFeeResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    studentId: z.ZodEffects<z.ZodString, string, string>;
    feeCategoryId: z.ZodEffects<z.ZodString, string, string>;
    amount: z.ZodNumber;
    dueDate: z.ZodString;
    status: z.ZodEnum<["pending", "partial", "paid", "overdue", "waived"]>;
    discountAmount: z.ZodNumber;
    totalAmount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    student: z.ZodOptional<z.ZodObject<{
        studentId: z.ZodString;
        user: z.ZodObject<{
            firstName: z.ZodString;
            lastName: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            firstName: string;
            lastName: string;
        }, {
            firstName: string;
            lastName: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        user: {
            firstName: string;
            lastName: string;
        };
        studentId: string;
    }, {
        user: {
            firstName: string;
            lastName: string;
        };
        studentId: string;
    }>>;
    feeCategory: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        frequency: z.ZodEnum<["monthly", "quarterly", "semester", "annual", "one-time"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        frequency: "semester" | "monthly" | "quarterly" | "annual" | "one-time";
    }, {
        name: string;
        frequency: "semester" | "monthly" | "quarterly" | "annual" | "one-time";
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "overdue" | "partial" | "paid" | "waived";
    id: string;
    createdAt: string;
    updatedAt: string;
    studentId: string;
    altId: string | null;
    amount: number;
    dueDate: string;
    feeCategoryId: string;
    discountAmount: number;
    totalAmount: number;
    student?: {
        user: {
            firstName: string;
            lastName: string;
        };
        studentId: string;
    } | undefined;
    feeCategory?: {
        name: string;
        frequency: "semester" | "monthly" | "quarterly" | "annual" | "one-time";
    } | undefined;
}, {
    status: "pending" | "overdue" | "partial" | "paid" | "waived";
    id: string;
    createdAt: string;
    updatedAt: string;
    studentId: string;
    altId: string | null;
    amount: number;
    dueDate: string;
    feeCategoryId: string;
    discountAmount: number;
    totalAmount: number;
    student?: {
        user: {
            firstName: string;
            lastName: string;
        };
        studentId: string;
    } | undefined;
    feeCategory?: {
        name: string;
        frequency: "semester" | "monthly" | "quarterly" | "annual" | "one-time";
    } | undefined;
}>;
export declare const CreatePaymentSchema: z.ZodObject<{
    studentFeeId: z.ZodEffects<z.ZodString, string, string>;
    amount: z.ZodNumber;
    paymentDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    paymentMethod: z.ZodEnum<["cash", "card", "bank_transfer", "cheque", "online", "upi"]>;
    transactionId: z.ZodOptional<z.ZodString>;
    receiptNumber: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    paymentMethod: "card" | "cash" | "bank_transfer" | "cheque" | "online" | "upi";
    studentFeeId: string;
    paymentDate?: string | undefined;
    receiptNumber?: string | undefined;
    remarks?: string | undefined;
    transactionId?: string | undefined;
}, {
    amount: number;
    paymentMethod: "card" | "cash" | "bank_transfer" | "cheque" | "online" | "upi";
    studentFeeId: string;
    paymentDate?: string | undefined;
    receiptNumber?: string | undefined;
    remarks?: string | undefined;
    transactionId?: string | undefined;
}>;
export declare const PaymentResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    studentFeeId: z.ZodEffects<z.ZodString, string, string>;
    amount: z.ZodNumber;
    paymentDate: z.ZodString;
    paymentMethod: z.ZodEnum<["cash", "card", "bank_transfer", "cheque", "online", "upi"]>;
    transactionId: z.ZodNullable<z.ZodString>;
    receiptNumber: z.ZodString;
    processedBy: z.ZodEffects<z.ZodString, string, string>;
    remarks: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    studentFee: z.ZodOptional<z.ZodObject<{
        student: z.ZodObject<{
            studentId: z.ZodString;
            user: z.ZodObject<{
                firstName: z.ZodString;
                lastName: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                firstName: string;
                lastName: string;
            }, {
                firstName: string;
                lastName: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            user: {
                firstName: string;
                lastName: string;
            };
            studentId: string;
        }, {
            user: {
                firstName: string;
                lastName: string;
            };
            studentId: string;
        }>;
        feeCategory: z.ZodObject<{
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
        }, {
            name: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        student: {
            user: {
                firstName: string;
                lastName: string;
            };
            studentId: string;
        };
        feeCategory: {
            name: string;
        };
    }, {
        student: {
            user: {
                firstName: string;
                lastName: string;
            };
            studentId: string;
        };
        feeCategory: {
            name: string;
        };
    }>>;
    processedByUser: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
    }, {
        firstName: string;
        lastName: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    altId: string | null;
    amount: number;
    paymentDate: string;
    receiptNumber: string;
    remarks: string | null;
    paymentMethod: "card" | "cash" | "bank_transfer" | "cheque" | "online" | "upi";
    studentFeeId: string;
    transactionId: string | null;
    processedBy: string;
    studentFee?: {
        student: {
            user: {
                firstName: string;
                lastName: string;
            };
            studentId: string;
        };
        feeCategory: {
            name: string;
        };
    } | undefined;
    processedByUser?: {
        firstName: string;
        lastName: string;
    } | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    altId: string | null;
    amount: number;
    paymentDate: string;
    receiptNumber: string;
    remarks: string | null;
    paymentMethod: "card" | "cash" | "bank_transfer" | "cheque" | "online" | "upi";
    studentFeeId: string;
    transactionId: string | null;
    processedBy: string;
    studentFee?: {
        student: {
            user: {
                firstName: string;
                lastName: string;
            };
            studentId: string;
        };
        feeCategory: {
            name: string;
        };
    } | undefined;
    processedByUser?: {
        firstName: string;
        lastName: string;
    } | undefined;
}>;
export declare const AssignFeesToStudentsSchema: z.ZodObject<{
    feeCategoryId: z.ZodEffects<z.ZodString, string, string>;
    studentIds: z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">;
    dueDate: z.ZodEffects<z.ZodString, string, string>;
    discountAmount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    studentIds: string[];
    dueDate: string;
    feeCategoryId: string;
    discountAmount: number;
}, {
    studentIds: string[];
    dueDate: string;
    feeCategoryId: string;
    discountAmount?: number | undefined;
}>;
export declare const AssignFeesToClassSchema: z.ZodObject<{
    feeCategoryId: z.ZodEffects<z.ZodString, string, string>;
    classId: z.ZodEffects<z.ZodString, string, string>;
    dueDate: z.ZodEffects<z.ZodString, string, string>;
    discountAmount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    classId: string;
    dueDate: string;
    feeCategoryId: string;
    discountAmount: number;
}, {
    classId: string;
    dueDate: string;
    feeCategoryId: string;
    discountAmount?: number | undefined;
}>;
export declare const FeeQuerySchema: z.ZodObject<{
    studentId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    feeCategoryId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "partial", "paid", "overdue", "waived"]>>;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "pending" | "overdue" | "partial" | "paid" | "waived" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    classId?: string | undefined;
    studentId?: string | undefined;
    feeCategoryId?: string | undefined;
}, {
    status?: "pending" | "overdue" | "partial" | "paid" | "waived" | undefined;
    limit?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    page?: string | undefined;
    classId?: string | undefined;
    studentId?: string | undefined;
    feeCategoryId?: string | undefined;
}>;
export declare const StudentFeeSummarySchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    totalFees: z.ZodNumber;
    paidAmount: z.ZodNumber;
    pendingAmount: z.ZodNumber;
    overdueAmount: z.ZodNumber;
    discountAmount: z.ZodNumber;
    lastPaymentDate: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    totalFees: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    discountAmount: number;
    lastPaymentDate: string | null;
}, {
    studentId: string;
    totalFees: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    discountAmount: number;
    lastPaymentDate: string | null;
}>;
export declare const ClassFeeSummarySchema: z.ZodObject<{
    classId: z.ZodEffects<z.ZodString, string, string>;
    className: z.ZodString;
    totalStudents: z.ZodNumber;
    totalFees: z.ZodNumber;
    totalPaid: z.ZodNumber;
    totalPending: z.ZodNumber;
    totalOverdue: z.ZodNumber;
    collectionPercentage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    classId: string;
    className: string;
    totalFees: number;
    totalStudents: number;
    collectionPercentage: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
}, {
    classId: string;
    className: string;
    totalFees: number;
    totalStudents: number;
    collectionPercentage: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
}>;
export declare const FeeReportQuerySchema: z.ZodObject<{
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    feeCategoryId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    status: z.ZodOptional<z.ZodEnum<["pending", "partial", "paid", "overdue", "waived"]>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["student", "class", "category", "date"]>>>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf"]>>>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    format: "json" | "csv" | "pdf";
    groupBy: "date" | "class" | "student" | "category";
    status?: "pending" | "overdue" | "partial" | "paid" | "waived" | undefined;
    classId?: string | undefined;
    feeCategoryId?: string | undefined;
}, {
    startDate: string;
    endDate: string;
    status?: "pending" | "overdue" | "partial" | "paid" | "waived" | undefined;
    classId?: string | undefined;
    format?: "json" | "csv" | "pdf" | undefined;
    groupBy?: "date" | "class" | "student" | "category" | undefined;
    feeCategoryId?: string | undefined;
}>;
export declare const FeeReportItemSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    studentName: z.ZodString;
    className: z.ZodString;
    feeCategoryName: z.ZodString;
    totalAmount: z.ZodNumber;
    paidAmount: z.ZodNumber;
    pendingAmount: z.ZodNumber;
    status: z.ZodEnum<["pending", "partial", "paid", "overdue", "waived"]>;
    dueDate: z.ZodString;
    lastPaymentDate: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "overdue" | "partial" | "paid" | "waived";
    studentId: string;
    className: string;
    studentName: string;
    paidAmount: number;
    pendingAmount: number;
    dueDate: string;
    totalAmount: number;
    lastPaymentDate: string | null;
    feeCategoryName: string;
}, {
    status: "pending" | "overdue" | "partial" | "paid" | "waived";
    studentId: string;
    className: string;
    studentName: string;
    paidAmount: number;
    pendingAmount: number;
    dueDate: string;
    totalAmount: number;
    lastPaymentDate: string | null;
    feeCategoryName: string;
}>;
export declare const FeeReportSchema: z.ZodObject<{
    reportType: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    generatedAt: z.ZodString;
    data: z.ZodArray<z.ZodObject<{
        studentId: z.ZodEffects<z.ZodString, string, string>;
        studentName: z.ZodString;
        className: z.ZodString;
        feeCategoryName: z.ZodString;
        totalAmount: z.ZodNumber;
        paidAmount: z.ZodNumber;
        pendingAmount: z.ZodNumber;
        status: z.ZodEnum<["pending", "partial", "paid", "overdue", "waived"]>;
        dueDate: z.ZodString;
        lastPaymentDate: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "overdue" | "partial" | "paid" | "waived";
        studentId: string;
        className: string;
        studentName: string;
        paidAmount: number;
        pendingAmount: number;
        dueDate: string;
        totalAmount: number;
        lastPaymentDate: string | null;
        feeCategoryName: string;
    }, {
        status: "pending" | "overdue" | "partial" | "paid" | "waived";
        studentId: string;
        className: string;
        studentName: string;
        paidAmount: number;
        pendingAmount: number;
        dueDate: string;
        totalAmount: number;
        lastPaymentDate: string | null;
        feeCategoryName: string;
    }>, "many">;
    summary: z.ZodObject<{
        totalStudents: z.ZodNumber;
        totalAmount: z.ZodNumber;
        totalPaid: z.ZodNumber;
        totalPending: z.ZodNumber;
        collectionPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalStudents: number;
        collectionPercentage: number;
        totalAmount: number;
        totalPaid: number;
        totalPending: number;
    }, {
        totalStudents: number;
        collectionPercentage: number;
        totalAmount: number;
        totalPaid: number;
        totalPending: number;
    }>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    data: {
        status: "pending" | "overdue" | "partial" | "paid" | "waived";
        studentId: string;
        className: string;
        studentName: string;
        paidAmount: number;
        pendingAmount: number;
        dueDate: string;
        totalAmount: number;
        lastPaymentDate: string | null;
        feeCategoryName: string;
    }[];
    generatedAt: string;
    reportType: string;
    summary: {
        totalStudents: number;
        collectionPercentage: number;
        totalAmount: number;
        totalPaid: number;
        totalPending: number;
    };
}, {
    startDate: string;
    endDate: string;
    data: {
        status: "pending" | "overdue" | "partial" | "paid" | "waived";
        studentId: string;
        className: string;
        studentName: string;
        paidAmount: number;
        pendingAmount: number;
        dueDate: string;
        totalAmount: number;
        lastPaymentDate: string | null;
        feeCategoryName: string;
    }[];
    generatedAt: string;
    reportType: string;
    summary: {
        totalStudents: number;
        collectionPercentage: number;
        totalAmount: number;
        totalPaid: number;
        totalPending: number;
    };
}>;
export type FeeFrequency = z.infer<typeof FeeFrequencySchema>;
export type FeeStatus = z.infer<typeof FeeStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type CreateFeeCategory = z.infer<typeof CreateFeeCategorySchema>;
export type UpdateFeeCategory = z.infer<typeof UpdateFeeCategorySchema>;
export type FeeCategoryResponse = z.infer<typeof FeeCategoryResponseSchema>;
export type CreateStudentFee = z.infer<typeof CreateStudentFeeSchema>;
export type UpdateStudentFee = z.infer<typeof UpdateStudentFeeSchema>;
export type StudentFeeResponse = z.infer<typeof StudentFeeResponseSchema>;
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
export type AssignFeesToStudents = z.infer<typeof AssignFeesToStudentsSchema>;
export type AssignFeesToClass = z.infer<typeof AssignFeesToClassSchema>;
export type FeeQuery = z.infer<typeof FeeQuerySchema>;
export type StudentFeeSummary = z.infer<typeof StudentFeeSummarySchema>;
export type ClassFeeSummary = z.infer<typeof ClassFeeSummarySchema>;
export type FeeReportQuery = z.infer<typeof FeeReportQuerySchema>;
export type FeeReportItem = z.infer<typeof FeeReportItemSchema>;
export type FeeReport = z.infer<typeof FeeReportSchema>;
//# sourceMappingURL=fee.d.ts.map