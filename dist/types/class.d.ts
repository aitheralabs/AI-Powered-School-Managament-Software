import { z } from 'zod';
export declare const CreateClassSchema: z.ZodObject<{
    name: z.ZodString;
    grade: z.ZodString;
    section: z.ZodString;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    capacity: z.ZodNumber;
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
    room: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    academicYearId: string;
    grade: string;
    section: string;
    capacity: number;
    teacherId: string;
    description?: string | undefined;
    room?: string | undefined;
}, {
    name: string;
    academicYearId: string;
    grade: string;
    section: string;
    capacity: number;
    teacherId: string;
    description?: string | undefined;
    room?: string | undefined;
}>;
export declare const UpdateClassSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    grade: z.ZodOptional<z.ZodString>;
    section: z.ZodOptional<z.ZodString>;
    teacherId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    capacity: z.ZodOptional<z.ZodNumber>;
    academicYearId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    room: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    academicYearId?: string | undefined;
    grade?: string | undefined;
    section?: string | undefined;
    capacity?: number | undefined;
    room?: string | undefined;
    teacherId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    academicYearId?: string | undefined;
    grade?: string | undefined;
    section?: string | undefined;
    capacity?: number | undefined;
    room?: string | undefined;
    teacherId?: string | undefined;
}>;
export declare const ClassResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    name: z.ZodString;
    grade: z.ZodString;
    section: z.ZodString;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    capacity: z.ZodNumber;
    currentEnrollment: z.ZodNumber;
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
    room: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    teacher: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
    }, {
        email: string;
        firstName: string;
        lastName: string;
    }>>;
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
    grade: string;
    section: string;
    capacity: number;
    room: string | null;
    teacherId: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    currentEnrollment: number;
    academicYear?: {
        name: string;
        startDate: string;
        endDate: string;
    } | undefined;
    teacher?: {
        email: string;
        firstName: string;
        lastName: string;
    } | undefined;
}, {
    name: string;
    description: string | null;
    academicYearId: string;
    grade: string;
    section: string;
    capacity: number;
    room: string | null;
    teacherId: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    currentEnrollment: number;
    academicYear?: {
        name: string;
        startDate: string;
        endDate: string;
    } | undefined;
    teacher?: {
        email: string;
        firstName: string;
        lastName: string;
    } | undefined;
}>;
export declare const EnrollStudentSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    enrollmentDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    enrollmentDate?: string | undefined;
}, {
    studentId: string;
    enrollmentDate?: string | undefined;
}>;
export declare const BulkEnrollStudentsSchema: z.ZodObject<{
    studentIds: z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">;
    enrollmentDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentIds: string[];
    enrollmentDate?: string | undefined;
}, {
    studentIds: string[];
    enrollmentDate?: string | undefined;
}>;
export declare const TransferStudentSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    newClassId: z.ZodEffects<z.ZodString, string, string>;
    transferDate: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    newClassId: string;
    reason?: string | undefined;
    transferDate?: string | undefined;
}, {
    studentId: string;
    newClassId: string;
    reason?: string | undefined;
    transferDate?: string | undefined;
}>;
export declare const ClassRosterQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    enrollmentDateFrom: z.ZodOptional<z.ZodString>;
    enrollmentDateTo: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "studentId", "enrollmentDate"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    sortBy: "firstName" | "lastName" | "studentId" | "enrollmentDate";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    isActive?: boolean | undefined;
    enrollmentDateFrom?: string | undefined;
    enrollmentDateTo?: string | undefined;
}, {
    search?: string | undefined;
    sortBy?: "firstName" | "lastName" | "studentId" | "enrollmentDate" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    isActive?: boolean | undefined;
    enrollmentDateFrom?: string | undefined;
    enrollmentDateTo?: string | undefined;
}>;
export declare const UpdateClassTeacherSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
}, {
    teacherId: string;
}>;
export declare const ClassTeacherAssignmentSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    subjectsCount: z.ZodOptional<z.ZodNumber>;
    subjects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isClassTeacher: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    teacherId: string;
    subjects?: string[] | undefined;
    subjectsCount?: number | undefined;
    isClassTeacher?: boolean | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    teacherId: string;
    subjects?: string[] | undefined;
    subjectsCount?: number | undefined;
    isClassTeacher?: boolean | undefined;
}>;
export declare const ClassEnrollmentHistorySchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    studentId: z.ZodEffects<z.ZodString, string, string>;
    studentNumber: z.ZodString;
    studentName: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodNullable<z.ZodString>;
    isCurrentlyEnrolled: z.ZodBoolean;
    academicYear: z.ZodObject<{
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
    }>;
}, "strip", z.ZodTypeAny, {
    academicYear: {
        name: string;
        startDate: string;
        endDate: string;
    };
    startDate: string;
    endDate: string | null;
    id: string;
    studentId: string;
    studentName: string;
    studentNumber: string;
    isCurrentlyEnrolled: boolean;
}, {
    academicYear: {
        name: string;
        startDate: string;
        endDate: string;
    };
    startDate: string;
    endDate: string | null;
    id: string;
    studentId: string;
    studentName: string;
    studentNumber: string;
    isCurrentlyEnrolled: boolean;
}>;
export declare const ClassEnrollmentHistoryQuerySchema: z.ZodObject<{
    academicYearId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    academicYearId?: string | undefined;
}, {
    academicYearId?: string | undefined;
}>;
export type CreateClass = z.infer<typeof CreateClassSchema>;
export type UpdateClass = z.infer<typeof UpdateClassSchema>;
export type ClassResponse = z.infer<typeof ClassResponseSchema>;
export type EnrollStudent = z.infer<typeof EnrollStudentSchema>;
export type BulkEnrollStudents = z.infer<typeof BulkEnrollStudentsSchema>;
export type TransferStudent = z.infer<typeof TransferStudentSchema>;
export type ClassRosterQuery = z.infer<typeof ClassRosterQuerySchema>;
export type UpdateClassTeacher = z.infer<typeof UpdateClassTeacherSchema>;
export type ClassTeacherAssignment = z.infer<typeof ClassTeacherAssignmentSchema>;
export type ClassEnrollmentHistory = z.infer<typeof ClassEnrollmentHistorySchema>;
export type ClassEnrollmentHistoryQuery = z.infer<typeof ClassEnrollmentHistoryQuerySchema>;
//# sourceMappingURL=class.d.ts.map