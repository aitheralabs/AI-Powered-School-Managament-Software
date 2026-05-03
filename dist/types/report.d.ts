import { z } from 'zod';
export declare const ReportTypeSchema: z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>;
export declare const ReportFormatSchema: z.ZodEnum<["json", "csv", "pdf", "excel"]>;
export declare const ReportFrequencySchema: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "semester", "annual", "custom"]>;
export declare const BaseReportQuerySchema: z.ZodObject<{
    reportType: z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>;
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf", "excel"]>>>;
    includeInactive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    includeInactive: boolean;
}, {
    startDate: string;
    endDate: string;
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    format?: "json" | "csv" | "pdf" | "excel" | undefined;
    includeInactive?: boolean | undefined;
}>;
export declare const AttendanceReportQuerySchema: z.ZodObject<{
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf", "excel"]>>>;
    includeInactive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
} & {
    reportType: z.ZodLiteral<"attendance">;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    studentId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    subjectId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    status: z.ZodOptional<z.ZodEnum<["present", "absent", "late", "excused"]>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["student", "class", "date", "subject"]>>>;
    minAttendancePercentage: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "attendance";
    includeInactive: boolean;
    groupBy: "date" | "subject" | "class" | "student";
    status?: "present" | "absent" | "late" | "excused" | undefined;
    classId?: string | undefined;
    studentId?: string | undefined;
    subjectId?: string | undefined;
    minAttendancePercentage?: number | undefined;
}, {
    startDate: string;
    endDate: string;
    reportType: "attendance";
    status?: "present" | "absent" | "late" | "excused" | undefined;
    classId?: string | undefined;
    studentId?: string | undefined;
    subjectId?: string | undefined;
    format?: "json" | "csv" | "pdf" | "excel" | undefined;
    includeInactive?: boolean | undefined;
    groupBy?: "date" | "subject" | "class" | "student" | undefined;
    minAttendancePercentage?: number | undefined;
}>;
export declare const AcademicReportQuerySchema: z.ZodObject<{
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf", "excel"]>>>;
    includeInactive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
} & {
    reportType: z.ZodLiteral<"academic">;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    subjectId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    semesterId: z.ZodEffects<z.ZodString, string, string>;
    assessmentTypeId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["student", "subject", "class", "assessment"]>>>;
    minPercentage: z.ZodOptional<z.ZodNumber>;
    gradeLetter: z.ZodOptional<z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "academic";
    includeInactive: boolean;
    groupBy: "subject" | "class" | "student" | "assessment";
    semesterId: string;
    classId?: string | undefined;
    subjectId?: string | undefined;
    gradeLetter?: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F" | undefined;
    assessmentTypeId?: string | undefined;
    minPercentage?: number | undefined;
}, {
    startDate: string;
    endDate: string;
    reportType: "academic";
    semesterId: string;
    classId?: string | undefined;
    subjectId?: string | undefined;
    format?: "json" | "csv" | "pdf" | "excel" | undefined;
    gradeLetter?: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F" | undefined;
    includeInactive?: boolean | undefined;
    groupBy?: "subject" | "class" | "student" | "assessment" | undefined;
    assessmentTypeId?: string | undefined;
    minPercentage?: number | undefined;
}>;
export declare const FinancialReportQuerySchema: z.ZodObject<{
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf", "excel"]>>>;
    includeInactive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
} & {
    reportType: z.ZodLiteral<"financial">;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    feeCategoryId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["cash", "card", "bank_transfer", "cheque", "online", "upi"]>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "partial", "paid", "overdue", "waived"]>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["student", "class", "category", "date", "method"]>>>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "financial";
    includeInactive: boolean;
    groupBy: "date" | "method" | "class" | "student" | "category";
    status?: "pending" | "overdue" | "partial" | "paid" | "waived" | undefined;
    classId?: string | undefined;
    feeCategoryId?: string | undefined;
    paymentMethod?: "card" | "cash" | "bank_transfer" | "cheque" | "online" | "upi" | undefined;
}, {
    startDate: string;
    endDate: string;
    reportType: "financial";
    status?: "pending" | "overdue" | "partial" | "paid" | "waived" | undefined;
    classId?: string | undefined;
    format?: "json" | "csv" | "pdf" | "excel" | undefined;
    includeInactive?: boolean | undefined;
    groupBy?: "date" | "method" | "class" | "student" | "category" | undefined;
    feeCategoryId?: string | undefined;
    paymentMethod?: "card" | "cash" | "bank_transfer" | "cheque" | "online" | "upi" | undefined;
}>;
export declare const EnrollmentReportQuerySchema: z.ZodObject<{
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf", "excel"]>>>;
    includeInactive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
} & {
    reportType: z.ZodLiteral<"enrollment">;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    academicYearId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["class", "grade", "month", "academic_year"]>>>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "enrollment";
    includeInactive: boolean;
    groupBy: "class" | "grade" | "academic_year" | "month";
    academicYearId?: string | undefined;
    classId?: string | undefined;
}, {
    startDate: string;
    endDate: string;
    reportType: "enrollment";
    academicYearId?: string | undefined;
    classId?: string | undefined;
    format?: "json" | "csv" | "pdf" | "excel" | undefined;
    includeInactive?: boolean | undefined;
    groupBy?: "class" | "grade" | "academic_year" | "month" | undefined;
}>;
export declare const TeacherWorkloadReportQuerySchema: z.ZodObject<{
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf", "excel"]>>>;
    includeInactive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
} & {
    reportType: z.ZodLiteral<"teacher_workload">;
    teacherId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    subjectId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["teacher", "subject", "class"]>>>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "teacher_workload";
    includeInactive: boolean;
    groupBy: "subject" | "class" | "teacher";
    teacherId?: string | undefined;
    subjectId?: string | undefined;
}, {
    startDate: string;
    endDate: string;
    reportType: "teacher_workload";
    teacherId?: string | undefined;
    subjectId?: string | undefined;
    format?: "json" | "csv" | "pdf" | "excel" | undefined;
    includeInactive?: boolean | undefined;
    groupBy?: "subject" | "class" | "teacher" | undefined;
}>;
export declare const ReportMetadataSchema: z.ZodObject<{
    reportId: z.ZodEffects<z.ZodString, string, string>;
    reportType: z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    generatedBy: z.ZodEffects<z.ZodString, string, string>;
    generatedAt: z.ZodString;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    format: z.ZodEnum<["json", "csv", "pdf", "excel"]>;
    fileSize: z.ZodOptional<z.ZodNumber>;
    downloadUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    generatedAt: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    reportId: string;
    generatedBy: string;
    parameters: Record<string, any>;
    description?: string | undefined;
    fileSize?: number | undefined;
    downloadUrl?: string | undefined;
}, {
    title: string;
    generatedAt: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    reportId: string;
    generatedBy: string;
    parameters: Record<string, any>;
    description?: string | undefined;
    fileSize?: number | undefined;
    downloadUrl?: string | undefined;
}>;
export declare const ReportSummarySchema: z.ZodObject<{
    totalRecords: z.ZodNumber;
    dateRange: z.ZodObject<{
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        endDate: string;
    }, {
        startDate: string;
        endDate: string;
    }>;
    filters: z.ZodRecord<z.ZodString, z.ZodAny>;
    aggregations: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    filters: Record<string, any>;
    totalRecords: number;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    aggregations: Record<string, any>;
}, {
    filters: Record<string, any>;
    totalRecords: number;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    aggregations: Record<string, any>;
}>;
export declare const ReportResponseSchema: z.ZodObject<{
    metadata: z.ZodObject<{
        reportId: z.ZodEffects<z.ZodString, string, string>;
        reportType: z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        generatedBy: z.ZodEffects<z.ZodString, string, string>;
        generatedAt: z.ZodString;
        parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        format: z.ZodEnum<["json", "csv", "pdf", "excel"]>;
        fileSize: z.ZodOptional<z.ZodNumber>;
        downloadUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        generatedAt: string;
        format: "json" | "csv" | "pdf" | "excel";
        reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
        reportId: string;
        generatedBy: string;
        parameters: Record<string, any>;
        description?: string | undefined;
        fileSize?: number | undefined;
        downloadUrl?: string | undefined;
    }, {
        title: string;
        generatedAt: string;
        format: "json" | "csv" | "pdf" | "excel";
        reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
        reportId: string;
        generatedBy: string;
        parameters: Record<string, any>;
        description?: string | undefined;
        fileSize?: number | undefined;
        downloadUrl?: string | undefined;
    }>;
    summary: z.ZodObject<{
        totalRecords: z.ZodNumber;
        dateRange: z.ZodObject<{
            startDate: z.ZodString;
            endDate: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            startDate: string;
            endDate: string;
        }, {
            startDate: string;
            endDate: string;
        }>;
        filters: z.ZodRecord<z.ZodString, z.ZodAny>;
        aggregations: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        filters: Record<string, any>;
        totalRecords: number;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        aggregations: Record<string, any>;
    }, {
        filters: Record<string, any>;
        totalRecords: number;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        aggregations: Record<string, any>;
    }>;
    data: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">;
    charts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["bar", "line", "pie", "area", "scatter"]>;
        title: z.ZodString;
        data: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">;
        config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "bar" | "line" | "pie" | "area" | "scatter";
        data: Record<string, any>[];
        title: string;
        config?: Record<string, any> | undefined;
    }, {
        type: "bar" | "line" | "pie" | "area" | "scatter";
        data: Record<string, any>[];
        title: string;
        config?: Record<string, any> | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, any>[];
    metadata: {
        title: string;
        generatedAt: string;
        format: "json" | "csv" | "pdf" | "excel";
        reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
        reportId: string;
        generatedBy: string;
        parameters: Record<string, any>;
        description?: string | undefined;
        fileSize?: number | undefined;
        downloadUrl?: string | undefined;
    };
    summary: {
        filters: Record<string, any>;
        totalRecords: number;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        aggregations: Record<string, any>;
    };
    charts?: {
        type: "bar" | "line" | "pie" | "area" | "scatter";
        data: Record<string, any>[];
        title: string;
        config?: Record<string, any> | undefined;
    }[] | undefined;
}, {
    data: Record<string, any>[];
    metadata: {
        title: string;
        generatedAt: string;
        format: "json" | "csv" | "pdf" | "excel";
        reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
        reportId: string;
        generatedBy: string;
        parameters: Record<string, any>;
        description?: string | undefined;
        fileSize?: number | undefined;
        downloadUrl?: string | undefined;
    };
    summary: {
        filters: Record<string, any>;
        totalRecords: number;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        aggregations: Record<string, any>;
    };
    charts?: {
        type: "bar" | "line" | "pie" | "area" | "scatter";
        data: Record<string, any>[];
        title: string;
        config?: Record<string, any> | undefined;
    }[] | undefined;
}>;
export declare const CreateScheduledReportSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    reportType: z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    frequency: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "semester", "annual", "custom"]>;
    format: z.ZodEnum<["json", "csv", "pdf", "excel"]>;
    recipients: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    nextRunDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    parameters: Record<string, any>;
    frequency: "custom" | "semester" | "monthly" | "daily" | "weekly" | "quarterly" | "annual";
    recipients: string[];
    description?: string | undefined;
    nextRunDate?: string | undefined;
}, {
    name: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    parameters: Record<string, any>;
    frequency: "custom" | "semester" | "monthly" | "daily" | "weekly" | "quarterly" | "annual";
    recipients: string[];
    description?: string | undefined;
    isActive?: boolean | undefined;
    nextRunDate?: string | undefined;
}>;
export declare const UpdateScheduledReportSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    reportType: z.ZodOptional<z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>>;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    frequency: z.ZodOptional<z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "semester", "annual", "custom"]>>;
    format: z.ZodOptional<z.ZodEnum<["json", "csv", "pdf", "excel"]>>;
    recipients: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    nextRunDate: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    format?: "json" | "csv" | "pdf" | "excel" | undefined;
    reportType?: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress" | undefined;
    parameters?: Record<string, any> | undefined;
    frequency?: "custom" | "semester" | "monthly" | "daily" | "weekly" | "quarterly" | "annual" | undefined;
    recipients?: string[] | undefined;
    nextRunDate?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    format?: "json" | "csv" | "pdf" | "excel" | undefined;
    reportType?: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress" | undefined;
    parameters?: Record<string, any> | undefined;
    frequency?: "custom" | "semester" | "monthly" | "daily" | "weekly" | "quarterly" | "annual" | undefined;
    recipients?: string[] | undefined;
    nextRunDate?: string | undefined;
}>;
export declare const ScheduledReportResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    reportType: z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    frequency: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "semester", "annual", "custom"]>;
    format: z.ZodEnum<["json", "csv", "pdf", "excel"]>;
    recipients: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodBoolean;
    nextRunDate: z.ZodNullable<z.ZodString>;
    lastRunDate: z.ZodNullable<z.ZodString>;
    createdBy: z.ZodEffects<z.ZodString, string, string>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdByUser: z.ZodOptional<z.ZodObject<{
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
    name: string;
    description: string | null;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    parameters: Record<string, any>;
    frequency: "custom" | "semester" | "monthly" | "daily" | "weekly" | "quarterly" | "annual";
    recipients: string[];
    nextRunDate: string | null;
    lastRunDate: string | null;
    createdBy: string;
    createdByUser?: {
        firstName: string;
        lastName: string;
    } | undefined;
}, {
    name: string;
    description: string | null;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    parameters: Record<string, any>;
    frequency: "custom" | "semester" | "monthly" | "daily" | "weekly" | "quarterly" | "annual";
    recipients: string[];
    nextRunDate: string | null;
    lastRunDate: string | null;
    createdBy: string;
    createdByUser?: {
        firstName: string;
        lastName: string;
    } | undefined;
}>;
export declare const ReportHistorySchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    scheduledReportId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    reportType: z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>;
    title: z.ZodString;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    format: z.ZodEnum<["json", "csv", "pdf", "excel"]>;
    status: z.ZodEnum<["pending", "generating", "completed", "failed"]>;
    fileSize: z.ZodNullable<z.ZodNumber>;
    downloadUrl: z.ZodNullable<z.ZodString>;
    generatedBy: z.ZodEffects<z.ZodString, string, string>;
    generatedAt: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
    error: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "failed" | "generating" | "completed";
    error: string | null;
    id: string;
    title: string;
    generatedAt: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    generatedBy: string;
    parameters: Record<string, any>;
    fileSize: number | null;
    downloadUrl: string | null;
    expiresAt?: string | undefined;
    scheduledReportId?: string | undefined;
}, {
    status: "pending" | "failed" | "generating" | "completed";
    error: string | null;
    id: string;
    title: string;
    generatedAt: string;
    format: "json" | "csv" | "pdf" | "excel";
    reportType: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress";
    generatedBy: string;
    parameters: Record<string, any>;
    fileSize: number | null;
    downloadUrl: string | null;
    expiresAt?: string | undefined;
    scheduledReportId?: string | undefined;
}>;
export declare const DashboardReportSchema: z.ZodObject<{
    overview: z.ZodObject<{
        totalStudents: z.ZodNumber;
        totalTeachers: z.ZodNumber;
        totalClasses: z.ZodNumber;
        totalStaff: z.ZodNumber;
        activeAcademicYear: z.ZodString;
        currentSemester: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currentSemester: string;
        totalClasses: number;
        totalStudents: number;
        totalTeachers: number;
        totalStaff: number;
        activeAcademicYear: string;
    }, {
        currentSemester: string;
        totalClasses: number;
        totalStudents: number;
        totalTeachers: number;
        totalStaff: number;
        activeAcademicYear: string;
    }>;
    attendance: z.ZodObject<{
        todayAttendance: z.ZodNumber;
        weeklyAverage: z.ZodNumber;
        monthlyAverage: z.ZodNumber;
        lowAttendanceStudents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        todayAttendance: number;
        weeklyAverage: number;
        monthlyAverage: number;
        lowAttendanceStudents: number;
    }, {
        todayAttendance: number;
        weeklyAverage: number;
        monthlyAverage: number;
        lowAttendanceStudents: number;
    }>;
    academic: z.ZodObject<{
        averageGrade: z.ZodString;
        topPerformingClass: z.ZodString;
        studentsNeedingAttention: z.ZodNumber;
        recentAssessments: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        recentAssessments: number;
        averageGrade: string;
        topPerformingClass: string;
        studentsNeedingAttention: number;
    }, {
        recentAssessments: number;
        averageGrade: string;
        topPerformingClass: string;
        studentsNeedingAttention: number;
    }>;
    financial: z.ZodObject<{
        totalFeesCollected: z.ZodNumber;
        pendingFees: z.ZodNumber;
        overdueFees: z.ZodNumber;
        collectionPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        pendingFees: number;
        totalFeesCollected: number;
        overdueFees: number;
        collectionPercentage: number;
    }, {
        pendingFees: number;
        totalFeesCollected: number;
        overdueFees: number;
        collectionPercentage: number;
    }>;
    recent: z.ZodObject<{
        newEnrollments: z.ZodArray<z.ZodObject<{
            studentName: z.ZodString;
            className: z.ZodString;
            enrollmentDate: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enrollmentDate: string;
            className: string;
            studentName: string;
        }, {
            enrollmentDate: string;
            className: string;
            studentName: string;
        }>, "many">;
        recentPayments: z.ZodArray<z.ZodObject<{
            studentName: z.ZodString;
            amount: z.ZodNumber;
            paymentDate: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            studentName: string;
            amount: number;
            paymentDate: string;
        }, {
            studentName: string;
            amount: number;
            paymentDate: string;
        }>, "many">;
        upcomingEvents: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            date: z.ZodString;
            type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            date: string;
            title: string;
        }, {
            type: string;
            date: string;
            title: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        recentPayments: {
            studentName: string;
            amount: number;
            paymentDate: string;
        }[];
        newEnrollments: {
            enrollmentDate: string;
            className: string;
            studentName: string;
        }[];
        upcomingEvents: {
            type: string;
            date: string;
            title: string;
        }[];
    }, {
        recentPayments: {
            studentName: string;
            amount: number;
            paymentDate: string;
        }[];
        newEnrollments: {
            enrollmentDate: string;
            className: string;
            studentName: string;
        }[];
        upcomingEvents: {
            type: string;
            date: string;
            title: string;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    attendance: {
        todayAttendance: number;
        weeklyAverage: number;
        monthlyAverage: number;
        lowAttendanceStudents: number;
    };
    academic: {
        recentAssessments: number;
        averageGrade: string;
        topPerformingClass: string;
        studentsNeedingAttention: number;
    };
    financial: {
        pendingFees: number;
        totalFeesCollected: number;
        overdueFees: number;
        collectionPercentage: number;
    };
    overview: {
        currentSemester: string;
        totalClasses: number;
        totalStudents: number;
        totalTeachers: number;
        totalStaff: number;
        activeAcademicYear: string;
    };
    recent: {
        recentPayments: {
            studentName: string;
            amount: number;
            paymentDate: string;
        }[];
        newEnrollments: {
            enrollmentDate: string;
            className: string;
            studentName: string;
        }[];
        upcomingEvents: {
            type: string;
            date: string;
            title: string;
        }[];
    };
}, {
    attendance: {
        todayAttendance: number;
        weeklyAverage: number;
        monthlyAverage: number;
        lowAttendanceStudents: number;
    };
    academic: {
        recentAssessments: number;
        averageGrade: string;
        topPerformingClass: string;
        studentsNeedingAttention: number;
    };
    financial: {
        pendingFees: number;
        totalFeesCollected: number;
        overdueFees: number;
        collectionPercentage: number;
    };
    overview: {
        currentSemester: string;
        totalClasses: number;
        totalStudents: number;
        totalTeachers: number;
        totalStaff: number;
        activeAcademicYear: string;
    };
    recent: {
        recentPayments: {
            studentName: string;
            amount: number;
            paymentDate: string;
        }[];
        newEnrollments: {
            enrollmentDate: string;
            className: string;
            studentName: string;
        }[];
        upcomingEvents: {
            type: string;
            date: string;
            title: string;
        }[];
    };
}>;
export declare const ReportQuerySchema: z.ZodObject<{
    reportType: z.ZodOptional<z.ZodEnum<["attendance", "academic", "financial", "enrollment", "teacher_workload", "class_performance", "fee_collection", "student_progress", "custom"]>>;
    generatedBy: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "generating", "completed", "failed"]>>;
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["generatedAt", "reportType", "title"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: "title" | "generatedAt" | "reportType";
    sortOrder: "asc" | "desc";
    status?: "pending" | "failed" | "generating" | "completed" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    reportType?: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress" | undefined;
    generatedBy?: string | undefined;
}, {
    status?: "pending" | "failed" | "generating" | "completed" | undefined;
    limit?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    page?: string | undefined;
    sortBy?: "title" | "generatedAt" | "reportType" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    reportType?: "custom" | "attendance" | "academic" | "financial" | "enrollment" | "teacher_workload" | "class_performance" | "fee_collection" | "student_progress" | undefined;
    generatedBy?: string | undefined;
}>;
export type ReportType = z.infer<typeof ReportTypeSchema>;
export type ReportFormat = z.infer<typeof ReportFormatSchema>;
export type ReportFrequency = z.infer<typeof ReportFrequencySchema>;
export type BaseReportQuery = z.infer<typeof BaseReportQuerySchema>;
export type AttendanceReportQuery = z.infer<typeof AttendanceReportQuerySchema>;
export type AcademicReportQuery = z.infer<typeof AcademicReportQuerySchema>;
export type FinancialReportQuery = z.infer<typeof FinancialReportQuerySchema>;
export type EnrollmentReportQuery = z.infer<typeof EnrollmentReportQuerySchema>;
export type TeacherWorkloadReportQuery = z.infer<typeof TeacherWorkloadReportQuerySchema>;
export type ReportMetadata = z.infer<typeof ReportMetadataSchema>;
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
export type CreateScheduledReport = z.infer<typeof CreateScheduledReportSchema>;
export type UpdateScheduledReport = z.infer<typeof UpdateScheduledReportSchema>;
export type ScheduledReportResponse = z.infer<typeof ScheduledReportResponseSchema>;
export type ReportHistory = z.infer<typeof ReportHistorySchema>;
export type DashboardReport = z.infer<typeof DashboardReportSchema>;
export type ReportQuery = z.infer<typeof ReportQuerySchema>;
//# sourceMappingURL=report.d.ts.map