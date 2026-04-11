import { z } from 'zod';
export declare const AttendanceStatusSchema: z.ZodEnum<["present", "absent", "late", "excused"]>;
export declare const CreateAttendanceSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    classId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    date: z.ZodEffects<z.ZodString, string, string>;
    status: z.ZodEnum<["present", "absent", "late", "excused"]>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "present" | "absent" | "late" | "excused";
    date: string;
    classId: string;
    studentId: string;
    subjectId?: string | undefined;
    remarks?: string | undefined;
}, {
    status: "present" | "absent" | "late" | "excused";
    date: string;
    classId: string;
    studentId: string;
    subjectId?: string | undefined;
    remarks?: string | undefined;
}>;
export declare const UpdateAttendanceSchema: z.ZodObject<{
    status: z.ZodEnum<["present", "absent", "late", "excused"]>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "present" | "absent" | "late" | "excused";
    remarks?: string | undefined;
}, {
    status: "present" | "absent" | "late" | "excused";
    remarks?: string | undefined;
}>;
export declare const AttendanceResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    studentId: z.ZodEffects<z.ZodString, string, string>;
    classId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodNullable<z.ZodEffects<z.ZodString, string, string>>;
    date: z.ZodString;
    status: z.ZodEnum<["present", "absent", "late", "excused"]>;
    markedBy: z.ZodEffects<z.ZodString, string, string>;
    markedAt: z.ZodString;
    remarks: z.ZodNullable<z.ZodString>;
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
    class: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        grade: z.ZodString;
        section: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        grade: string;
        section: string;
    }, {
        name: string;
        grade: string;
        section: string;
    }>>;
    subject: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
    }, {
        code: string;
        name: string;
    }>>;
    markedByUser: z.ZodOptional<z.ZodObject<{
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
    status: "present" | "absent" | "late" | "excused";
    date: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    classId: string;
    studentId: string;
    altId: string | null;
    subjectId: string | null;
    remarks: string | null;
    markedBy: string;
    markedAt: string;
    subject?: {
        code: string;
        name: string;
    } | undefined;
    class?: {
        name: string;
        grade: string;
        section: string;
    } | undefined;
    student?: {
        user: {
            firstName: string;
            lastName: string;
        };
        studentId: string;
    } | undefined;
    markedByUser?: {
        firstName: string;
        lastName: string;
    } | undefined;
}, {
    status: "present" | "absent" | "late" | "excused";
    date: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    classId: string;
    studentId: string;
    altId: string | null;
    subjectId: string | null;
    remarks: string | null;
    markedBy: string;
    markedAt: string;
    subject?: {
        code: string;
        name: string;
    } | undefined;
    class?: {
        name: string;
        grade: string;
        section: string;
    } | undefined;
    student?: {
        user: {
            firstName: string;
            lastName: string;
        };
        studentId: string;
    } | undefined;
    markedByUser?: {
        firstName: string;
        lastName: string;
    } | undefined;
}>;
export declare const BulkAttendanceItemSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    status: z.ZodEnum<["present", "absent", "late", "excused"]>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "present" | "absent" | "late" | "excused";
    studentId: string;
    remarks?: string | undefined;
}, {
    status: "present" | "absent" | "late" | "excused";
    studentId: string;
    remarks?: string | undefined;
}>;
export declare const CreateBulkAttendanceSchema: z.ZodObject<{
    classId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    date: z.ZodEffects<z.ZodString, string, string>;
    attendance: z.ZodArray<z.ZodObject<{
        studentId: z.ZodEffects<z.ZodString, string, string>;
        status: z.ZodEnum<["present", "absent", "late", "excused"]>;
        remarks: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "present" | "absent" | "late" | "excused";
        studentId: string;
        remarks?: string | undefined;
    }, {
        status: "present" | "absent" | "late" | "excused";
        studentId: string;
        remarks?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    date: string;
    classId: string;
    attendance: {
        status: "present" | "absent" | "late" | "excused";
        studentId: string;
        remarks?: string | undefined;
    }[];
    subjectId?: string | undefined;
}, {
    date: string;
    classId: string;
    attendance: {
        status: "present" | "absent" | "late" | "excused";
        studentId: string;
        remarks?: string | undefined;
    }[];
    subjectId?: string | undefined;
}>;
export declare const AttendanceQuerySchema: z.ZodObject<{
    studentId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    subjectId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    status: z.ZodOptional<z.ZodEnum<["present", "absent", "late", "excused"]>>;
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "present" | "absent" | "late" | "excused" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    classId?: string | undefined;
    studentId?: string | undefined;
    subjectId?: string | undefined;
}, {
    status?: "present" | "absent" | "late" | "excused" | undefined;
    limit?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    page?: string | undefined;
    classId?: string | undefined;
    studentId?: string | undefined;
    subjectId?: string | undefined;
}>;
export declare const StudentAttendanceSummarySchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    totalDays: z.ZodNumber;
    presentDays: z.ZodNumber;
    absentDays: z.ZodNumber;
    lateDays: z.ZodNumber;
    excusedDays: z.ZodNumber;
    attendancePercentage: z.ZodNumber;
    startDate: z.ZodString;
    endDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    studentId: string;
    attendancePercentage: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
}, {
    startDate: string;
    endDate: string;
    studentId: string;
    attendancePercentage: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
}>;
export declare const ClassAttendanceSummarySchema: z.ZodObject<{
    classId: z.ZodEffects<z.ZodString, string, string>;
    date: z.ZodString;
    totalStudents: z.ZodNumber;
    presentCount: z.ZodNumber;
    absentCount: z.ZodNumber;
    lateCount: z.ZodNumber;
    excusedCount: z.ZodNumber;
    attendancePercentage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    classId: string;
    attendancePercentage: number;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
}, {
    date: string;
    classId: string;
    attendancePercentage: number;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
}>;
export declare const AttendanceReportItemSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    studentName: z.ZodString;
    className: z.ZodString;
    totalDays: z.ZodNumber;
    presentDays: z.ZodNumber;
    absentDays: z.ZodNumber;
    lateDays: z.ZodNumber;
    excusedDays: z.ZodNumber;
    attendancePercentage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    className: string;
    attendancePercentage: number;
    studentName: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
}, {
    studentId: string;
    className: string;
    attendancePercentage: number;
    studentName: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
}>;
export declare const AttendanceReportSchema: z.ZodObject<{
    reportType: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    generatedAt: z.ZodString;
    data: z.ZodArray<z.ZodObject<{
        studentId: z.ZodEffects<z.ZodString, string, string>;
        studentName: z.ZodString;
        className: z.ZodString;
        totalDays: z.ZodNumber;
        presentDays: z.ZodNumber;
        absentDays: z.ZodNumber;
        lateDays: z.ZodNumber;
        excusedDays: z.ZodNumber;
        attendancePercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        studentId: string;
        className: string;
        attendancePercentage: number;
        studentName: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        excusedDays: number;
    }, {
        studentId: string;
        className: string;
        attendancePercentage: number;
        studentName: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        excusedDays: number;
    }>, "many">;
    summary: z.ZodObject<{
        totalStudents: z.ZodNumber;
        averageAttendance: z.ZodNumber;
        totalDays: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalDays: number;
        totalStudents: number;
        averageAttendance: number;
    }, {
        totalDays: number;
        totalStudents: number;
        averageAttendance: number;
    }>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    data: {
        studentId: string;
        className: string;
        attendancePercentage: number;
        studentName: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        excusedDays: number;
    }[];
    generatedAt: string;
    reportType: string;
    summary: {
        totalDays: number;
        totalStudents: number;
        averageAttendance: number;
    };
}, {
    startDate: string;
    endDate: string;
    data: {
        studentId: string;
        className: string;
        attendancePercentage: number;
        studentName: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        excusedDays: number;
    }[];
    generatedAt: string;
    reportType: string;
    summary: {
        totalDays: number;
        totalStudents: number;
        averageAttendance: number;
    };
}>;
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type CreateAttendance = z.infer<typeof CreateAttendanceSchema>;
export type UpdateAttendance = z.infer<typeof UpdateAttendanceSchema>;
export type AttendanceResponse = z.infer<typeof AttendanceResponseSchema>;
export type BulkAttendanceItem = z.infer<typeof BulkAttendanceItemSchema>;
export type CreateBulkAttendance = z.infer<typeof CreateBulkAttendanceSchema>;
export type AttendanceQuery = z.infer<typeof AttendanceQuerySchema>;
export type StudentAttendanceSummary = z.infer<typeof StudentAttendanceSummarySchema>;
export type ClassAttendanceSummary = z.infer<typeof ClassAttendanceSummarySchema>;
export type AttendanceReportItem = z.infer<typeof AttendanceReportItemSchema>;
export type AttendanceReport = z.infer<typeof AttendanceReportSchema>;
//# sourceMappingURL=attendance.d.ts.map