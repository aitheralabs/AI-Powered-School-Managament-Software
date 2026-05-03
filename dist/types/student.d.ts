import { z } from 'zod';
export declare const CreateStudentSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodString>;
    studentId: z.ZodString;
    classId: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
    enrollmentDate: z.ZodEffects<z.ZodString, string, string>;
    guardianName: z.ZodString;
    guardianPhone: z.ZodString;
    guardianEmail: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodString;
    medicalInfo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    classId: string | null;
    studentId: string;
    enrollmentDate: string;
    guardianName: string;
    guardianPhone: string;
    emergencyContact: string;
    password?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    guardianEmail?: string | undefined;
    medicalInfo?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    studentId: string;
    enrollmentDate: string;
    guardianName: string;
    guardianPhone: string;
    emergencyContact: string;
    password?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    classId?: string | null | undefined;
    guardianEmail?: string | undefined;
    medicalInfo?: string | undefined;
}>;
export declare const UpdateStudentSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    guardianName: z.ZodOptional<z.ZodString>;
    guardianPhone: z.ZodOptional<z.ZodString>;
    guardianEmail: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodOptional<z.ZodString>;
    medicalInfo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    classId?: string | undefined;
    guardianName?: string | undefined;
    guardianPhone?: string | undefined;
    guardianEmail?: string | undefined;
    emergencyContact?: string | undefined;
    medicalInfo?: string | undefined;
}, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    classId?: string | undefined;
    guardianName?: string | undefined;
    guardianPhone?: string | undefined;
    guardianEmail?: string | undefined;
    emergencyContact?: string | undefined;
    medicalInfo?: string | undefined;
}>;
export declare const StudentResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    userId: z.ZodEffects<z.ZodString, string, string>;
    studentId: z.ZodString;
    classId: z.ZodEffects<z.ZodString, string, string>;
    enrollmentDate: z.ZodString;
    guardianName: z.ZodString;
    guardianPhone: z.ZodString;
    guardianEmail: z.ZodNullable<z.ZodString>;
    emergencyContact: z.ZodString;
    medicalInfo: z.ZodNullable<z.ZodString>;
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
    class: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        grade: z.ZodString;
        section: z.ZodString;
        academicYear: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
        }, {
            name: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        grade: string;
        section: string;
        academicYear?: {
            name: string;
        } | undefined;
    }, {
        name: string;
        grade: string;
        section: string;
        academicYear?: {
            name: string;
        } | undefined;
    }>>;
    parents: z.ZodOptional<z.ZodArray<z.ZodObject<{
        parentId: z.ZodEffects<z.ZodString, string, string>;
        firstName: z.ZodString;
        lastName: z.ZodString;
        relationshipType: z.ZodEnum<["father", "mother", "guardian", "other"]>;
        isPrimary: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        relationshipType: "father" | "mother" | "guardian" | "other";
        parentId: string;
        isPrimary: boolean;
    }, {
        firstName: string;
        lastName: string;
        relationshipType: "father" | "mother" | "guardian" | "other";
        parentId: string;
        isPrimary: boolean;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    classId: string;
    studentId: string;
    altId: string | null;
    enrollmentDate: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string | null;
    emergencyContact: string;
    medicalInfo: string | null;
    user?: {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        dateOfBirth: string | null;
        address: string | null;
    } | undefined;
    class?: {
        name: string;
        grade: string;
        section: string;
        academicYear?: {
            name: string;
        } | undefined;
    } | undefined;
    parents?: {
        firstName: string;
        lastName: string;
        relationshipType: "father" | "mother" | "guardian" | "other";
        parentId: string;
        isPrimary: boolean;
    }[] | undefined;
}, {
    userId: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    classId: string;
    studentId: string;
    altId: string | null;
    enrollmentDate: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string | null;
    emergencyContact: string;
    medicalInfo: string | null;
    user?: {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        dateOfBirth: string | null;
        address: string | null;
    } | undefined;
    class?: {
        name: string;
        grade: string;
        section: string;
        academicYear?: {
            name: string;
        } | undefined;
    } | undefined;
    parents?: {
        firstName: string;
        lastName: string;
        relationshipType: "father" | "mother" | "guardian" | "other";
        parentId: string;
        isPrimary: boolean;
    }[] | undefined;
}>;
export declare const StudentQuerySchema: z.ZodObject<{
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    grade: z.ZodOptional<z.ZodString>;
    section: z.ZodOptional<z.ZodString>;
    academicYearId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
    enrollmentDateFrom: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    enrollmentDateTo: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "studentId", "enrollmentDate", "className"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: "firstName" | "lastName" | "studentId" | "enrollmentDate" | "className";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    academicYearId?: string | undefined;
    grade?: string | undefined;
    section?: string | undefined;
    isActive?: boolean | undefined;
    classId?: string | undefined;
    enrollmentDateFrom?: string | undefined;
    enrollmentDateTo?: string | undefined;
}, {
    search?: string | undefined;
    limit?: string | undefined;
    academicYearId?: string | undefined;
    grade?: string | undefined;
    section?: string | undefined;
    page?: string | undefined;
    sortBy?: "firstName" | "lastName" | "studentId" | "enrollmentDate" | "className" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    isActive?: boolean | undefined;
    classId?: string | undefined;
    enrollmentDateFrom?: string | undefined;
    enrollmentDateTo?: string | undefined;
}>;
export declare const StudentClassHistorySchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    studentId: z.ZodEffects<z.ZodString, string, string>;
    classId: z.ZodEffects<z.ZodString, string, string>;
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
    startDate: z.ZodString;
    endDate: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
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
    academicYear: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string | null;
    academicYearId: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    classId: string;
    studentId: string;
    academicYear?: {
        name: string;
    } | undefined;
    class?: {
        name: string;
        grade: string;
        section: string;
    } | undefined;
}, {
    startDate: string;
    endDate: string | null;
    academicYearId: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    classId: string;
    studentId: string;
    academicYear?: {
        name: string;
    } | undefined;
    class?: {
        name: string;
        grade: string;
        section: string;
    } | undefined;
}>;
export declare const StudentSummarySchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    personalInfo: z.ZodObject<{
        name: z.ZodString;
        studentIdNumber: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        dateOfBirth: z.ZodNullable<z.ZodString>;
        address: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
        name: string;
        studentIdNumber: string;
    }, {
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
        name: string;
        studentIdNumber: string;
    }>;
    academicInfo: z.ZodObject<{
        currentClass: z.ZodString;
        enrollmentDate: z.ZodString;
        academicYear: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        academicYear: string;
        enrollmentDate: string;
        currentClass: string;
    }, {
        academicYear: string;
        enrollmentDate: string;
        currentClass: string;
    }>;
    guardianInfo: z.ZodObject<{
        guardianName: z.ZodString;
        guardianPhone: z.ZodString;
        guardianEmail: z.ZodNullable<z.ZodString>;
        emergencyContact: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        guardianName: string;
        guardianPhone: string;
        guardianEmail: string | null;
        emergencyContact: string;
    }, {
        guardianName: string;
        guardianPhone: string;
        guardianEmail: string | null;
        emergencyContact: string;
    }>;
    currentStats: z.ZodOptional<z.ZodObject<{
        attendancePercentage: z.ZodNumber;
        overallGrade: z.ZodNullable<z.ZodString>;
        pendingFees: z.ZodNumber;
        lastAttendanceDate: z.ZodNullable<z.ZodString>;
        lastGradeDate: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        attendancePercentage: number;
        overallGrade: string | null;
        pendingFees: number;
        lastAttendanceDate: string | null;
        lastGradeDate: string | null;
    }, {
        attendancePercentage: number;
        overallGrade: string | null;
        pendingFees: number;
        lastAttendanceDate: string | null;
        lastGradeDate: string | null;
    }>>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    personalInfo: {
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
        name: string;
        studentIdNumber: string;
    };
    academicInfo: {
        academicYear: string;
        enrollmentDate: string;
        currentClass: string;
    };
    guardianInfo: {
        guardianName: string;
        guardianPhone: string;
        guardianEmail: string | null;
        emergencyContact: string;
    };
    currentStats?: {
        attendancePercentage: number;
        overallGrade: string | null;
        pendingFees: number;
        lastAttendanceDate: string | null;
        lastGradeDate: string | null;
    } | undefined;
}, {
    studentId: string;
    personalInfo: {
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
        name: string;
        studentIdNumber: string;
    };
    academicInfo: {
        academicYear: string;
        enrollmentDate: string;
        currentClass: string;
    };
    guardianInfo: {
        guardianName: string;
        guardianPhone: string;
        guardianEmail: string | null;
        emergencyContact: string;
    };
    currentStats?: {
        attendancePercentage: number;
        overallGrade: string | null;
        pendingFees: number;
        lastAttendanceDate: string | null;
        lastGradeDate: string | null;
    } | undefined;
}>;
export type CreateStudent = z.infer<typeof CreateStudentSchema>;
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;
export type StudentResponse = z.infer<typeof StudentResponseSchema>;
export type StudentQuery = z.infer<typeof StudentQuerySchema>;
export type StudentClassHistory = z.infer<typeof StudentClassHistorySchema>;
export type StudentSummary = z.infer<typeof StudentSummarySchema>;
//# sourceMappingURL=student.d.ts.map