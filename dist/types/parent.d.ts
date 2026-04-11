import { z } from 'zod';
export declare const RelationshipTypeSchema: z.ZodEnum<["father", "mother", "guardian", "other"]>;
export declare const CreateParentSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
    address?: string | undefined;
}, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
    address?: string | undefined;
}>;
export declare const UpdateParentSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    address?: string | undefined;
}, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    address?: string | undefined;
}>;
export declare const ParentResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    address: string | null;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
}, {
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    address: string | null;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
}>;
export declare const CreateStudentParentSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    parentUserId: z.ZodEffects<z.ZodString, string, string>;
    relationshipType: z.ZodEnum<["father", "mother", "guardian", "other"]>;
    isPrimary: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    parentUserId: string;
    relationshipType: "father" | "mother" | "guardian" | "other";
    isPrimary: boolean;
}, {
    studentId: string;
    parentUserId: string;
    relationshipType: "father" | "mother" | "guardian" | "other";
    isPrimary?: boolean | undefined;
}>;
export declare const UpdateStudentParentSchema: z.ZodObject<{
    relationshipType: z.ZodOptional<z.ZodEnum<["father", "mother", "guardian", "other"]>>;
    isPrimary: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    relationshipType?: "father" | "mother" | "guardian" | "other" | undefined;
    isPrimary?: boolean | undefined;
}, {
    relationshipType?: "father" | "mother" | "guardian" | "other" | undefined;
    isPrimary?: boolean | undefined;
}>;
export declare const StudentParentResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    studentId: z.ZodEffects<z.ZodString, string, string>;
    parentUserId: z.ZodEffects<z.ZodString, string, string>;
    relationshipType: z.ZodEnum<["father", "mother", "guardian", "other"]>;
    isPrimary: z.ZodBoolean;
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
        class: z.ZodObject<{
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
        }>;
    }, "strip", z.ZodTypeAny, {
        user: {
            firstName: string;
            lastName: string;
        };
        class: {
            name: string;
            grade: string;
            section: string;
        };
        studentId: string;
    }, {
        user: {
            firstName: string;
            lastName: string;
        };
        class: {
            name: string;
            grade: string;
            section: string;
        };
        studentId: string;
    }>>;
    parent: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
    }, {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    studentId: string;
    parentUserId: string;
    relationshipType: "father" | "mother" | "guardian" | "other";
    isPrimary: boolean;
    student?: {
        user: {
            firstName: string;
            lastName: string;
        };
        class: {
            name: string;
            grade: string;
            section: string;
        };
        studentId: string;
    } | undefined;
    parent?: {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
    } | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    studentId: string;
    parentUserId: string;
    relationshipType: "father" | "mother" | "guardian" | "other";
    isPrimary: boolean;
    student?: {
        user: {
            firstName: string;
            lastName: string;
        };
        class: {
            name: string;
            grade: string;
            section: string;
        };
        studentId: string;
    } | undefined;
    parent?: {
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
    } | undefined;
}>;
export declare const ParentDashboardSchema: z.ZodObject<{
    parentId: z.ZodEffects<z.ZodString, string, string>;
    children: z.ZodArray<z.ZodObject<{
        studentId: z.ZodEffects<z.ZodString, string, string>;
        studentName: z.ZodString;
        studentIdNumber: z.ZodString;
        className: z.ZodString;
        relationshipType: z.ZodEnum<["father", "mother", "guardian", "other"]>;
        isPrimary: z.ZodBoolean;
        recentAttendance: z.ZodOptional<z.ZodObject<{
            percentage: z.ZodNumber;
            lastWeekPresent: z.ZodNumber;
            lastWeekTotal: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            percentage: number;
            lastWeekPresent: number;
            lastWeekTotal: number;
        }, {
            percentage: number;
            lastWeekPresent: number;
            lastWeekTotal: number;
        }>>;
        recentGrades: z.ZodOptional<z.ZodArray<z.ZodObject<{
            subjectName: z.ZodString;
            assessmentType: z.ZodString;
            percentage: z.ZodNumber;
            gradeLetter: z.ZodString;
            date: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            date: string;
            percentage: number;
            subjectName: string;
            assessmentType: string;
            gradeLetter: string;
        }, {
            date: string;
            percentage: number;
            subjectName: string;
            assessmentType: string;
            gradeLetter: string;
        }>, "many">>;
        feeStatus: z.ZodOptional<z.ZodObject<{
            totalDue: z.ZodNumber;
            overdue: z.ZodNumber;
            nextDueDate: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            totalDue: number;
            overdue: number;
            nextDueDate: string | null;
        }, {
            totalDue: number;
            overdue: number;
            nextDueDate: string | null;
        }>>;
    }, "strip", z.ZodTypeAny, {
        studentId: string;
        relationshipType: "father" | "mother" | "guardian" | "other";
        isPrimary: boolean;
        className: string;
        studentIdNumber: string;
        studentName: string;
        recentAttendance?: {
            percentage: number;
            lastWeekPresent: number;
            lastWeekTotal: number;
        } | undefined;
        recentGrades?: {
            date: string;
            percentage: number;
            subjectName: string;
            assessmentType: string;
            gradeLetter: string;
        }[] | undefined;
        feeStatus?: {
            totalDue: number;
            overdue: number;
            nextDueDate: string | null;
        } | undefined;
    }, {
        studentId: string;
        relationshipType: "father" | "mother" | "guardian" | "other";
        isPrimary: boolean;
        className: string;
        studentIdNumber: string;
        studentName: string;
        recentAttendance?: {
            percentage: number;
            lastWeekPresent: number;
            lastWeekTotal: number;
        } | undefined;
        recentGrades?: {
            date: string;
            percentage: number;
            subjectName: string;
            assessmentType: string;
            gradeLetter: string;
        }[] | undefined;
        feeStatus?: {
            totalDue: number;
            overdue: number;
            nextDueDate: string | null;
        } | undefined;
    }>, "many">;
    notifications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodEffects<z.ZodString, string, string>;
        type: z.ZodEnum<["attendance", "grade", "fee", "announcement", "event"]>;
        title: z.ZodString;
        message: z.ZodString;
        studentId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        isRead: z.ZodBoolean;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        type: "grade" | "attendance" | "fee" | "announcement" | "event";
        id: string;
        title: string;
        isRead: boolean;
        createdAt: string;
        studentId?: string | undefined;
    }, {
        message: string;
        type: "grade" | "attendance" | "fee" | "announcement" | "event";
        id: string;
        title: string;
        isRead: boolean;
        createdAt: string;
        studentId?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    parentId: string;
    children: {
        studentId: string;
        relationshipType: "father" | "mother" | "guardian" | "other";
        isPrimary: boolean;
        className: string;
        studentIdNumber: string;
        studentName: string;
        recentAttendance?: {
            percentage: number;
            lastWeekPresent: number;
            lastWeekTotal: number;
        } | undefined;
        recentGrades?: {
            date: string;
            percentage: number;
            subjectName: string;
            assessmentType: string;
            gradeLetter: string;
        }[] | undefined;
        feeStatus?: {
            totalDue: number;
            overdue: number;
            nextDueDate: string | null;
        } | undefined;
    }[];
    notifications?: {
        message: string;
        type: "grade" | "attendance" | "fee" | "announcement" | "event";
        id: string;
        title: string;
        isRead: boolean;
        createdAt: string;
        studentId?: string | undefined;
    }[] | undefined;
}, {
    parentId: string;
    children: {
        studentId: string;
        relationshipType: "father" | "mother" | "guardian" | "other";
        isPrimary: boolean;
        className: string;
        studentIdNumber: string;
        studentName: string;
        recentAttendance?: {
            percentage: number;
            lastWeekPresent: number;
            lastWeekTotal: number;
        } | undefined;
        recentGrades?: {
            date: string;
            percentage: number;
            subjectName: string;
            assessmentType: string;
            gradeLetter: string;
        }[] | undefined;
        feeStatus?: {
            totalDue: number;
            overdue: number;
            nextDueDate: string | null;
        } | undefined;
    }[];
    notifications?: {
        message: string;
        type: "grade" | "attendance" | "fee" | "announcement" | "event";
        id: string;
        title: string;
        isRead: boolean;
        createdAt: string;
        studentId?: string | undefined;
    }[] | undefined;
}>;
export declare const ParentAccessQuerySchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    dataType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["attendance", "grades", "fees", "all"]>>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    dataType: "fees" | "all" | "attendance" | "grades";
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    studentId: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    dataType?: "fees" | "all" | "attendance" | "grades" | undefined;
}>;
export declare const ParentStudentDataSchema: z.ZodObject<{
    student: z.ZodObject<{
        studentId: z.ZodString;
        name: z.ZodString;
        className: z.ZodString;
        enrollmentDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        studentId: string;
        enrollmentDate: string;
        className: string;
    }, {
        name: string;
        studentId: string;
        enrollmentDate: string;
        className: string;
    }>;
    attendance: z.ZodOptional<z.ZodObject<{
        totalDays: z.ZodNumber;
        presentDays: z.ZodNumber;
        percentage: z.ZodNumber;
        recentRecords: z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            status: z.ZodEnum<["present", "absent", "late", "excused"]>;
            subject: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status: "present" | "absent" | "late" | "excused";
            date: string;
            subject: string | null;
        }, {
            status: "present" | "absent" | "late" | "excused";
            date: string;
            subject: string | null;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        percentage: number;
        totalDays: number;
        presentDays: number;
        recentRecords: {
            status: "present" | "absent" | "late" | "excused";
            date: string;
            subject: string | null;
        }[];
    }, {
        percentage: number;
        totalDays: number;
        presentDays: number;
        recentRecords: {
            status: "present" | "absent" | "late" | "excused";
            date: string;
            subject: string | null;
        }[];
    }>>;
    grades: z.ZodOptional<z.ZodObject<{
        currentSemester: z.ZodString;
        overallPercentage: z.ZodNullable<z.ZodNumber>;
        overallGrade: z.ZodNullable<z.ZodString>;
        subjects: z.ZodArray<z.ZodObject<{
            subjectName: z.ZodString;
            subjectCode: z.ZodString;
            averagePercentage: z.ZodNumber;
            gradeLetter: z.ZodString;
            recentAssessments: z.ZodArray<z.ZodObject<{
                assessmentType: z.ZodString;
                marksObtained: z.ZodNumber;
                totalMarks: z.ZodNumber;
                percentage: z.ZodNumber;
                date: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                date: string;
                percentage: number;
                assessmentType: string;
                marksObtained: number;
                totalMarks: number;
            }, {
                date: string;
                percentage: number;
                assessmentType: string;
                marksObtained: number;
                totalMarks: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            subjectName: string;
            gradeLetter: string;
            subjectCode: string;
            averagePercentage: number;
            recentAssessments: {
                date: string;
                percentage: number;
                assessmentType: string;
                marksObtained: number;
                totalMarks: number;
            }[];
        }, {
            subjectName: string;
            gradeLetter: string;
            subjectCode: string;
            averagePercentage: number;
            recentAssessments: {
                date: string;
                percentage: number;
                assessmentType: string;
                marksObtained: number;
                totalMarks: number;
            }[];
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        subjects: {
            subjectName: string;
            gradeLetter: string;
            subjectCode: string;
            averagePercentage: number;
            recentAssessments: {
                date: string;
                percentage: number;
                assessmentType: string;
                marksObtained: number;
                totalMarks: number;
            }[];
        }[];
        overallGrade: string | null;
        currentSemester: string;
        overallPercentage: number | null;
    }, {
        subjects: {
            subjectName: string;
            gradeLetter: string;
            subjectCode: string;
            averagePercentage: number;
            recentAssessments: {
                date: string;
                percentage: number;
                assessmentType: string;
                marksObtained: number;
                totalMarks: number;
            }[];
        }[];
        overallGrade: string | null;
        currentSemester: string;
        overallPercentage: number | null;
    }>>;
    fees: z.ZodOptional<z.ZodObject<{
        totalFees: z.ZodNumber;
        paidAmount: z.ZodNumber;
        pendingAmount: z.ZodNumber;
        overdueAmount: z.ZodNumber;
        recentPayments: z.ZodArray<z.ZodObject<{
            amount: z.ZodNumber;
            paymentDate: z.ZodString;
            receiptNumber: z.ZodString;
            feeCategory: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount: number;
            paymentDate: string;
            receiptNumber: string;
            feeCategory: string;
        }, {
            amount: number;
            paymentDate: string;
            receiptNumber: string;
            feeCategory: string;
        }>, "many">;
        upcomingDues: z.ZodArray<z.ZodObject<{
            feeCategory: z.ZodString;
            amount: z.ZodNumber;
            dueDate: z.ZodString;
            status: z.ZodEnum<["pending", "partial", "overdue"]>;
        }, "strip", z.ZodTypeAny, {
            status: "pending" | "overdue" | "partial";
            amount: number;
            feeCategory: string;
            dueDate: string;
        }, {
            status: "pending" | "overdue" | "partial";
            amount: number;
            feeCategory: string;
            dueDate: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        totalFees: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        recentPayments: {
            amount: number;
            paymentDate: string;
            receiptNumber: string;
            feeCategory: string;
        }[];
        upcomingDues: {
            status: "pending" | "overdue" | "partial";
            amount: number;
            feeCategory: string;
            dueDate: string;
        }[];
    }, {
        totalFees: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        recentPayments: {
            amount: number;
            paymentDate: string;
            receiptNumber: string;
            feeCategory: string;
        }[];
        upcomingDues: {
            status: "pending" | "overdue" | "partial";
            amount: number;
            feeCategory: string;
            dueDate: string;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    student: {
        name: string;
        studentId: string;
        enrollmentDate: string;
        className: string;
    };
    fees?: {
        totalFees: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        recentPayments: {
            amount: number;
            paymentDate: string;
            receiptNumber: string;
            feeCategory: string;
        }[];
        upcomingDues: {
            status: "pending" | "overdue" | "partial";
            amount: number;
            feeCategory: string;
            dueDate: string;
        }[];
    } | undefined;
    attendance?: {
        percentage: number;
        totalDays: number;
        presentDays: number;
        recentRecords: {
            status: "present" | "absent" | "late" | "excused";
            date: string;
            subject: string | null;
        }[];
    } | undefined;
    grades?: {
        subjects: {
            subjectName: string;
            gradeLetter: string;
            subjectCode: string;
            averagePercentage: number;
            recentAssessments: {
                date: string;
                percentage: number;
                assessmentType: string;
                marksObtained: number;
                totalMarks: number;
            }[];
        }[];
        overallGrade: string | null;
        currentSemester: string;
        overallPercentage: number | null;
    } | undefined;
}, {
    student: {
        name: string;
        studentId: string;
        enrollmentDate: string;
        className: string;
    };
    fees?: {
        totalFees: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        recentPayments: {
            amount: number;
            paymentDate: string;
            receiptNumber: string;
            feeCategory: string;
        }[];
        upcomingDues: {
            status: "pending" | "overdue" | "partial";
            amount: number;
            feeCategory: string;
            dueDate: string;
        }[];
    } | undefined;
    attendance?: {
        percentage: number;
        totalDays: number;
        presentDays: number;
        recentRecords: {
            status: "present" | "absent" | "late" | "excused";
            date: string;
            subject: string | null;
        }[];
    } | undefined;
    grades?: {
        subjects: {
            subjectName: string;
            gradeLetter: string;
            subjectCode: string;
            averagePercentage: number;
            recentAssessments: {
                date: string;
                percentage: number;
                assessmentType: string;
                marksObtained: number;
                totalMarks: number;
            }[];
        }[];
        overallGrade: string | null;
        currentSemester: string;
        overallPercentage: number | null;
    } | undefined;
}>;
export declare const ParentQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    hasChildren: z.ZodOptional<z.ZodBoolean>;
    relationshipType: z.ZodOptional<z.ZodEnum<["father", "mother", "guardian", "other"]>>;
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "email", "createdAt"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: "email" | "firstName" | "lastName" | "createdAt";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    relationshipType?: "father" | "mother" | "guardian" | "other" | undefined;
    hasChildren?: boolean | undefined;
}, {
    search?: string | undefined;
    limit?: string | undefined;
    page?: string | undefined;
    sortBy?: "email" | "firstName" | "lastName" | "createdAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    relationshipType?: "father" | "mother" | "guardian" | "other" | undefined;
    hasChildren?: boolean | undefined;
}>;
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type CreateParent = z.infer<typeof CreateParentSchema>;
export type UpdateParent = z.infer<typeof UpdateParentSchema>;
export type ParentResponse = z.infer<typeof ParentResponseSchema>;
export type CreateStudentParent = z.infer<typeof CreateStudentParentSchema>;
export type UpdateStudentParent = z.infer<typeof UpdateStudentParentSchema>;
export type StudentParentResponse = z.infer<typeof StudentParentResponseSchema>;
export type ParentDashboard = z.infer<typeof ParentDashboardSchema>;
export type ParentAccessQuery = z.infer<typeof ParentAccessQuerySchema>;
export type ParentStudentData = z.infer<typeof ParentStudentDataSchema>;
export type ParentQuery = z.infer<typeof ParentQuerySchema>;
//# sourceMappingURL=parent.d.ts.map