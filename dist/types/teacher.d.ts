import { z } from 'zod';
export declare const CreateTeacherSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    phone: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    dateOfBirth: z.ZodEffects<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>, string | undefined, unknown>;
    address: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodString;
    qualification: z.ZodOptional<z.ZodString>;
    experienceYears: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodNumber>>, number, unknown>;
    specialization: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    joiningDate: z.ZodEffects<z.ZodString, string, string>;
    salary: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    experienceYears: number;
    joiningDate: string;
    password?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    qualification?: string | undefined;
    specialization?: string | undefined;
    salary?: number | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    joiningDate: string;
    password?: string | undefined;
    phone?: unknown;
    dateOfBirth?: unknown;
    address?: string | undefined;
    qualification?: string | undefined;
    experienceYears?: unknown;
    specialization?: unknown;
    salary?: unknown;
}>;
export declare const UpdateTeacherSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    dateOfBirth: z.ZodEffects<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>, string | undefined, unknown>;
    address: z.ZodOptional<z.ZodString>;
    qualification: z.ZodOptional<z.ZodString>;
    experienceYears: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
    specialization: z.ZodOptional<z.ZodString>;
    salary: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    qualification?: string | undefined;
    experienceYears?: number | undefined;
    specialization?: string | undefined;
    salary?: number | undefined;
}, {
    phone?: unknown;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dateOfBirth?: unknown;
    address?: string | undefined;
    qualification?: string | undefined;
    experienceYears?: unknown;
    specialization?: string | undefined;
    salary?: unknown;
}>;
export declare const TeacherResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    userId: z.ZodEffects<z.ZodString, string, string>;
    employeeId: z.ZodString;
    qualification: z.ZodNullable<z.ZodString>;
    experienceYears: z.ZodNumber;
    specialization: z.ZodNullable<z.ZodString>;
    joiningDate: z.ZodString;
    salary: z.ZodNullable<z.ZodNumber>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        dateOfBirth: z.ZodNullable<z.ZodString>;
        address: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        dateOfBirth: string | null;
        address: string | null;
    }, {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        dateOfBirth: string | null;
        address: string | null;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    employeeId: string;
    qualification: string | null;
    experienceYears: number;
    specialization: string | null;
    joiningDate: string;
    salary: number | null;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    user?: {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        dateOfBirth: string | null;
        address: string | null;
    } | undefined;
}, {
    userId: string;
    employeeId: string;
    qualification: string | null;
    experienceYears: number;
    specialization: string | null;
    joiningDate: string;
    salary: number | null;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    user?: {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        dateOfBirth: string | null;
        address: string | null;
    } | undefined;
}>;
export declare const CreateTeacherSubjectSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
    subjectId: string;
}, {
    teacherId: string;
    subjectId: string;
}>;
export declare const TeacherSubjectResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
    createdAt: z.ZodString;
    teacher: z.ZodOptional<z.ZodObject<{
        employeeId: z.ZodString;
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
        employeeId: string;
    }, {
        user: {
            firstName: string;
            lastName: string;
        };
        employeeId: string;
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
}, "strip", z.ZodTypeAny, {
    teacherId: string;
    id: string;
    createdAt: string;
    subjectId: string;
    subject?: {
        code: string;
        name: string;
    } | undefined;
    teacher?: {
        user: {
            firstName: string;
            lastName: string;
        };
        employeeId: string;
    } | undefined;
}, {
    teacherId: string;
    id: string;
    createdAt: string;
    subjectId: string;
    subject?: {
        code: string;
        name: string;
    } | undefined;
    teacher?: {
        user: {
            firstName: string;
            lastName: string;
        };
        employeeId: string;
    } | undefined;
}>;
export declare const TeacherAssignmentSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    classId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
    classId: string;
    subjectId: string;
}, {
    teacherId: string;
    classId: string;
    subjectId: string;
}>;
export declare const TeacherWorkloadSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    totalClasses: z.ZodNumber;
    totalSubjects: z.ZodNumber;
    totalStudents: z.ZodNumber;
    weeklyHours: z.ZodOptional<z.ZodNumber>;
    workloadIntensity: z.ZodOptional<z.ZodNumber>;
    workloadStatus: z.ZodOptional<z.ZodEnum<["light", "normal", "high", "overloaded"]>>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
    totalClasses: number;
    totalSubjects: number;
    totalStudents: number;
    weeklyHours?: number | undefined;
    workloadIntensity?: number | undefined;
    workloadStatus?: "high" | "light" | "normal" | "overloaded" | undefined;
}, {
    teacherId: string;
    totalClasses: number;
    totalSubjects: number;
    totalStudents: number;
    weeklyHours?: number | undefined;
    workloadIntensity?: number | undefined;
    workloadStatus?: "high" | "light" | "normal" | "overloaded" | undefined;
}>;
export declare const AssignmentConflictCheckSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    classId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
    classId: string;
    subjectId: string;
}, {
    teacherId: string;
    classId: string;
    subjectId: string;
}>;
export declare const TeacherSuggestionSchema: z.ZodObject<{
    teacher: z.ZodObject<{
        id: z.ZodEffects<z.ZodString, string, string>;
        employeeId: z.ZodString;
        name: z.ZodString;
        isMainTeacher: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        employeeId: string;
        id: string;
        isMainTeacher: boolean;
    }, {
        name: string;
        employeeId: string;
        id: string;
        isMainTeacher: boolean;
    }>;
    suitabilityScore: z.ZodNumber;
    recommendation: z.ZodEnum<["excellent", "good", "caution", "not_recommended"]>;
    currentWorkload: z.ZodObject<{
        assignments: z.ZodNumber;
        hours: z.ZodNumber;
        sameGradeAssignments: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        hours: number;
        assignments: number;
        sameGradeAssignments: number;
    }, {
        hours: number;
        assignments: number;
        sameGradeAssignments: number;
    }>;
    projectedWorkload: z.ZodObject<{
        assignments: z.ZodNumber;
        hours: z.ZodNumber;
        utilizationPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        hours: number;
        assignments: number;
        utilizationPercentage: number;
    }, {
        hours: number;
        assignments: number;
        utilizationPercentage: number;
    }>;
    conflicts: z.ZodArray<z.ZodString, "many">;
    canAssign: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    teacher: {
        name: string;
        employeeId: string;
        id: string;
        isMainTeacher: boolean;
    };
    suitabilityScore: number;
    recommendation: "excellent" | "good" | "caution" | "not_recommended";
    currentWorkload: {
        hours: number;
        assignments: number;
        sameGradeAssignments: number;
    };
    projectedWorkload: {
        hours: number;
        assignments: number;
        utilizationPercentage: number;
    };
    conflicts: string[];
    canAssign: boolean;
}, {
    teacher: {
        name: string;
        employeeId: string;
        id: string;
        isMainTeacher: boolean;
    };
    suitabilityScore: number;
    recommendation: "excellent" | "good" | "caution" | "not_recommended";
    currentWorkload: {
        hours: number;
        assignments: number;
        sameGradeAssignments: number;
    };
    projectedWorkload: {
        hours: number;
        assignments: number;
        utilizationPercentage: number;
    };
    conflicts: string[];
    canAssign: boolean;
}>;
export type CreateTeacher = z.infer<typeof CreateTeacherSchema>;
export type UpdateTeacher = z.infer<typeof UpdateTeacherSchema>;
export type TeacherResponse = z.infer<typeof TeacherResponseSchema>;
export type CreateTeacherSubject = z.infer<typeof CreateTeacherSubjectSchema>;
export type TeacherSubjectResponse = z.infer<typeof TeacherSubjectResponseSchema>;
export type TeacherAssignment = z.infer<typeof TeacherAssignmentSchema>;
export type TeacherWorkload = z.infer<typeof TeacherWorkloadSchema>;
export type AssignmentConflictCheck = z.infer<typeof AssignmentConflictCheckSchema>;
export type TeacherSuggestion = z.infer<typeof TeacherSuggestionSchema>;
//# sourceMappingURL=teacher.d.ts.map