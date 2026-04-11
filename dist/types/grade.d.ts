import { z } from 'zod';
export declare const GradeLetterSchema: z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>;
export declare const CreateAssessmentTypeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    weightage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    weightage: number;
    description?: string | undefined;
}, {
    name: string;
    weightage: number;
    description?: string | undefined;
}>;
export declare const UpdateAssessmentTypeSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    weightage: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    weightage?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    weightage?: number | undefined;
}>;
export declare const AssessmentTypeResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    weightage: z.ZodNumber;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string | null;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    weightage: number;
}, {
    name: string;
    description: string | null;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    weightage: number;
}>;
export declare const CreateGradeSchema: z.ZodEffects<z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
    assessmentTypeId: z.ZodEffects<z.ZodString, string, string>;
    marksObtained: z.ZodNumber;
    totalMarks: z.ZodNumber;
    semesterId: z.ZodEffects<z.ZodString, string, string>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    subjectId: string;
    marksObtained: number;
    totalMarks: number;
    semesterId: string;
    assessmentTypeId: string;
    remarks?: string | undefined;
}, {
    studentId: string;
    subjectId: string;
    marksObtained: number;
    totalMarks: number;
    semesterId: string;
    assessmentTypeId: string;
    remarks?: string | undefined;
}>, {
    studentId: string;
    subjectId: string;
    marksObtained: number;
    totalMarks: number;
    semesterId: string;
    assessmentTypeId: string;
    remarks?: string | undefined;
}, {
    studentId: string;
    subjectId: string;
    marksObtained: number;
    totalMarks: number;
    semesterId: string;
    assessmentTypeId: string;
    remarks?: string | undefined;
}>;
export declare const UpdateGradeSchema: z.ZodEffects<z.ZodObject<{
    marksObtained: z.ZodOptional<z.ZodNumber>;
    totalMarks: z.ZodOptional<z.ZodNumber>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    marksObtained?: number | undefined;
    totalMarks?: number | undefined;
    remarks?: string | undefined;
}, {
    marksObtained?: number | undefined;
    totalMarks?: number | undefined;
    remarks?: string | undefined;
}>, {
    marksObtained?: number | undefined;
    totalMarks?: number | undefined;
    remarks?: string | undefined;
}, {
    marksObtained?: number | undefined;
    totalMarks?: number | undefined;
    remarks?: string | undefined;
}>;
export declare const GradeResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    studentId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
    assessmentTypeId: z.ZodEffects<z.ZodString, string, string>;
    marksObtained: z.ZodNumber;
    totalMarks: z.ZodNumber;
    percentage: z.ZodNumber;
    gradeLetter: z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>;
    semesterId: z.ZodEffects<z.ZodString, string, string>;
    recordedBy: z.ZodEffects<z.ZodString, string, string>;
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
    assessmentType: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        weightage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        weightage: number;
    }, {
        name: string;
        weightage: number;
    }>>;
    semester: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        academicYear: z.ZodObject<{
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
        }, {
            name: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        academicYear: {
            name: string;
        };
        name: string;
    }, {
        academicYear: {
            name: string;
        };
        name: string;
    }>>;
    recordedByUser: z.ZodOptional<z.ZodObject<{
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
    studentId: string;
    altId: string | null;
    subjectId: string;
    percentage: number;
    gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
    marksObtained: number;
    totalMarks: number;
    remarks: string | null;
    semesterId: string;
    assessmentTypeId: string;
    recordedBy: string;
    semester?: {
        academicYear: {
            name: string;
        };
        name: string;
    } | undefined;
    subject?: {
        code: string;
        name: string;
    } | undefined;
    student?: {
        user: {
            firstName: string;
            lastName: string;
        };
        studentId: string;
    } | undefined;
    assessmentType?: {
        name: string;
        weightage: number;
    } | undefined;
    recordedByUser?: {
        firstName: string;
        lastName: string;
    } | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    studentId: string;
    altId: string | null;
    subjectId: string;
    percentage: number;
    gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
    marksObtained: number;
    totalMarks: number;
    remarks: string | null;
    semesterId: string;
    assessmentTypeId: string;
    recordedBy: string;
    semester?: {
        academicYear: {
            name: string;
        };
        name: string;
    } | undefined;
    subject?: {
        code: string;
        name: string;
    } | undefined;
    student?: {
        user: {
            firstName: string;
            lastName: string;
        };
        studentId: string;
    } | undefined;
    assessmentType?: {
        name: string;
        weightage: number;
    } | undefined;
    recordedByUser?: {
        firstName: string;
        lastName: string;
    } | undefined;
}>;
export declare const CreateReportCardSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    semesterId: z.ZodEffects<z.ZodString, string, string>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    semesterId: string;
    remarks?: string | undefined;
}, {
    studentId: string;
    semesterId: string;
    remarks?: string | undefined;
}>;
export declare const UpdateReportCardSchema: z.ZodObject<{
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    remarks?: string | undefined;
}, {
    remarks?: string | undefined;
}>;
export declare const ReportCardResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    studentId: z.ZodEffects<z.ZodString, string, string>;
    semesterId: z.ZodEffects<z.ZodString, string, string>;
    overallPercentage: z.ZodNullable<z.ZodNumber>;
    overallGrade: z.ZodNullable<z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>>;
    rankInClass: z.ZodNullable<z.ZodNumber>;
    totalStudents: z.ZodNullable<z.ZodNumber>;
    remarks: z.ZodNullable<z.ZodString>;
    generatedBy: z.ZodEffects<z.ZodString, string, string>;
    generatedAt: z.ZodString;
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
    semester: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        academicYear: z.ZodObject<{
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
        }, {
            name: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        academicYear: {
            name: string;
        };
        name: string;
    }, {
        academicYear: {
            name: string;
        };
        name: string;
    }>>;
    grades: z.ZodOptional<z.ZodArray<z.ZodObject<{
        subject: z.ZodObject<{
            name: z.ZodString;
            code: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            code: string;
            name: string;
        }, {
            code: string;
            name: string;
        }>;
        assessmentType: z.ZodObject<{
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
        }, {
            name: string;
        }>;
        marksObtained: z.ZodNumber;
        totalMarks: z.ZodNumber;
        percentage: z.ZodNumber;
        gradeLetter: z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>;
    }, "strip", z.ZodTypeAny, {
        subject: {
            code: string;
            name: string;
        };
        percentage: number;
        assessmentType: {
            name: string;
        };
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        marksObtained: number;
        totalMarks: number;
    }, {
        subject: {
            code: string;
            name: string;
        };
        percentage: number;
        assessmentType: {
            name: string;
        };
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        marksObtained: number;
        totalMarks: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    studentId: string;
    generatedAt: string;
    altId: string | null;
    overallGrade: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F" | null;
    overallPercentage: number | null;
    totalStudents: number | null;
    remarks: string | null;
    semesterId: string;
    generatedBy: string;
    rankInClass: number | null;
    semester?: {
        academicYear: {
            name: string;
        };
        name: string;
    } | undefined;
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
    grades?: {
        subject: {
            code: string;
            name: string;
        };
        percentage: number;
        assessmentType: {
            name: string;
        };
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        marksObtained: number;
        totalMarks: number;
    }[] | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    studentId: string;
    generatedAt: string;
    altId: string | null;
    overallGrade: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F" | null;
    overallPercentage: number | null;
    totalStudents: number | null;
    remarks: string | null;
    semesterId: string;
    generatedBy: string;
    rankInClass: number | null;
    semester?: {
        academicYear: {
            name: string;
        };
        name: string;
    } | undefined;
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
    grades?: {
        subject: {
            code: string;
            name: string;
        };
        percentage: number;
        assessmentType: {
            name: string;
        };
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        marksObtained: number;
        totalMarks: number;
    }[] | undefined;
}>;
export declare const GradeQuerySchema: z.ZodObject<{
    studentId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    subjectId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    assessmentTypeId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    semesterId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    minPercentage: z.ZodOptional<z.ZodNumber>;
    maxPercentage: z.ZodOptional<z.ZodNumber>;
    gradeLetter: z.ZodOptional<z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>>;
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    classId?: string | undefined;
    studentId?: string | undefined;
    subjectId?: string | undefined;
    gradeLetter?: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F" | undefined;
    semesterId?: string | undefined;
    assessmentTypeId?: string | undefined;
    minPercentage?: number | undefined;
    maxPercentage?: number | undefined;
}, {
    limit?: string | undefined;
    page?: string | undefined;
    classId?: string | undefined;
    studentId?: string | undefined;
    subjectId?: string | undefined;
    gradeLetter?: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F" | undefined;
    semesterId?: string | undefined;
    assessmentTypeId?: string | undefined;
    minPercentage?: number | undefined;
    maxPercentage?: number | undefined;
}>;
export declare const StudentGradeSummarySchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    semesterId: z.ZodEffects<z.ZodString, string, string>;
    totalSubjects: z.ZodNumber;
    averagePercentage: z.ZodNumber;
    overallGrade: z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>;
    rankInClass: z.ZodNullable<z.ZodNumber>;
    totalStudents: z.ZodNumber;
    subjectGrades: z.ZodArray<z.ZodObject<{
        subjectId: z.ZodEffects<z.ZodString, string, string>;
        subjectName: z.ZodString;
        subjectCode: z.ZodString;
        averagePercentage: z.ZodNumber;
        gradeLetter: z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>;
        assessments: z.ZodArray<z.ZodObject<{
            assessmentType: z.ZodString;
            marksObtained: z.ZodNumber;
            totalMarks: z.ZodNumber;
            percentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            percentage: number;
            assessmentType: string;
            marksObtained: number;
            totalMarks: number;
        }, {
            percentage: number;
            assessmentType: string;
            marksObtained: number;
            totalMarks: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        subjectId: string;
        subjectName: string;
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        subjectCode: string;
        averagePercentage: number;
        assessments: {
            percentage: number;
            assessmentType: string;
            marksObtained: number;
            totalMarks: number;
        }[];
    }, {
        subjectId: string;
        subjectName: string;
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        subjectCode: string;
        averagePercentage: number;
        assessments: {
            percentage: number;
            assessmentType: string;
            marksObtained: number;
            totalMarks: number;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    overallGrade: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
    averagePercentage: number;
    totalSubjects: number;
    totalStudents: number;
    semesterId: string;
    rankInClass: number | null;
    subjectGrades: {
        subjectId: string;
        subjectName: string;
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        subjectCode: string;
        averagePercentage: number;
        assessments: {
            percentage: number;
            assessmentType: string;
            marksObtained: number;
            totalMarks: number;
        }[];
    }[];
}, {
    studentId: string;
    overallGrade: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
    averagePercentage: number;
    totalSubjects: number;
    totalStudents: number;
    semesterId: string;
    rankInClass: number | null;
    subjectGrades: {
        subjectId: string;
        subjectName: string;
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        subjectCode: string;
        averagePercentage: number;
        assessments: {
            percentage: number;
            assessmentType: string;
            marksObtained: number;
            totalMarks: number;
        }[];
    }[];
}>;
export declare const ClassGradeSummarySchema: z.ZodObject<{
    classId: z.ZodEffects<z.ZodString, string, string>;
    semesterId: z.ZodEffects<z.ZodString, string, string>;
    className: z.ZodString;
    totalStudents: z.ZodNumber;
    averagePercentage: z.ZodNumber;
    topPerformer: z.ZodNullable<z.ZodObject<{
        studentId: z.ZodEffects<z.ZodString, string, string>;
        studentName: z.ZodString;
        percentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        studentId: string;
        studentName: string;
        percentage: number;
    }, {
        studentId: string;
        studentName: string;
        percentage: number;
    }>>;
    gradeDistribution: z.ZodObject<{
        'A+': z.ZodNumber;
        A: z.ZodNumber;
        'B+': z.ZodNumber;
        B: z.ZodNumber;
        'C+': z.ZodNumber;
        C: z.ZodNumber;
        D: z.ZodNumber;
        F: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        D: number;
        'A+': number;
        A: number;
        'B+': number;
        B: number;
        'C+': number;
        C: number;
        F: number;
    }, {
        D: number;
        'A+': number;
        A: number;
        'B+': number;
        B: number;
        'C+': number;
        C: number;
        F: number;
    }>;
}, "strip", z.ZodTypeAny, {
    classId: string;
    className: string;
    averagePercentage: number;
    totalStudents: number;
    semesterId: string;
    topPerformer: {
        studentId: string;
        studentName: string;
        percentage: number;
    } | null;
    gradeDistribution: {
        D: number;
        'A+': number;
        A: number;
        'B+': number;
        B: number;
        'C+': number;
        C: number;
        F: number;
    };
}, {
    classId: string;
    className: string;
    averagePercentage: number;
    totalStudents: number;
    semesterId: string;
    topPerformer: {
        studentId: string;
        studentName: string;
        percentage: number;
    } | null;
    gradeDistribution: {
        D: number;
        'A+': number;
        A: number;
        'B+': number;
        B: number;
        'C+': number;
        C: number;
        F: number;
    };
}>;
export declare const GradeReportQuerySchema: z.ZodObject<{
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    subjectId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    semesterId: z.ZodEffects<z.ZodString, string, string>;
    assessmentTypeId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["student", "subject", "class"]>>>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf"]>>>;
}, "strip", z.ZodTypeAny, {
    format: "json" | "csv" | "pdf";
    groupBy: "subject" | "class" | "student";
    semesterId: string;
    classId?: string | undefined;
    subjectId?: string | undefined;
    assessmentTypeId?: string | undefined;
}, {
    semesterId: string;
    classId?: string | undefined;
    subjectId?: string | undefined;
    format?: "json" | "csv" | "pdf" | undefined;
    groupBy?: "subject" | "class" | "student" | undefined;
    assessmentTypeId?: string | undefined;
}>;
export declare const GradeReportItemSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    studentName: z.ZodString;
    className: z.ZodString;
    subjectName: z.ZodString;
    assessmentType: z.ZodString;
    marksObtained: z.ZodNumber;
    totalMarks: z.ZodNumber;
    percentage: z.ZodNumber;
    gradeLetter: z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    className: string;
    studentName: string;
    percentage: number;
    subjectName: string;
    assessmentType: string;
    gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
    marksObtained: number;
    totalMarks: number;
}, {
    studentId: string;
    className: string;
    studentName: string;
    percentage: number;
    subjectName: string;
    assessmentType: string;
    gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
    marksObtained: number;
    totalMarks: number;
}>;
export declare const GradeReportSchema: z.ZodObject<{
    reportType: z.ZodString;
    semesterName: z.ZodString;
    generatedAt: z.ZodString;
    data: z.ZodArray<z.ZodObject<{
        studentId: z.ZodEffects<z.ZodString, string, string>;
        studentName: z.ZodString;
        className: z.ZodString;
        subjectName: z.ZodString;
        assessmentType: z.ZodString;
        marksObtained: z.ZodNumber;
        totalMarks: z.ZodNumber;
        percentage: z.ZodNumber;
        gradeLetter: z.ZodEnum<["A+", "A", "B+", "B", "C+", "C", "D", "F"]>;
    }, "strip", z.ZodTypeAny, {
        studentId: string;
        className: string;
        studentName: string;
        percentage: number;
        subjectName: string;
        assessmentType: string;
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        marksObtained: number;
        totalMarks: number;
    }, {
        studentId: string;
        className: string;
        studentName: string;
        percentage: number;
        subjectName: string;
        assessmentType: string;
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        marksObtained: number;
        totalMarks: number;
    }>, "many">;
    summary: z.ZodObject<{
        totalStudents: z.ZodNumber;
        averagePercentage: z.ZodNumber;
        passPercentage: z.ZodNumber;
        gradeDistribution: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        averagePercentage: number;
        totalStudents: number;
        gradeDistribution: Record<string, number>;
        passPercentage: number;
    }, {
        averagePercentage: number;
        totalStudents: number;
        gradeDistribution: Record<string, number>;
        passPercentage: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        studentId: string;
        className: string;
        studentName: string;
        percentage: number;
        subjectName: string;
        assessmentType: string;
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        marksObtained: number;
        totalMarks: number;
    }[];
    generatedAt: string;
    reportType: string;
    summary: {
        averagePercentage: number;
        totalStudents: number;
        gradeDistribution: Record<string, number>;
        passPercentage: number;
    };
    semesterName: string;
}, {
    data: {
        studentId: string;
        className: string;
        studentName: string;
        percentage: number;
        subjectName: string;
        assessmentType: string;
        gradeLetter: "D" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "F";
        marksObtained: number;
        totalMarks: number;
    }[];
    generatedAt: string;
    reportType: string;
    summary: {
        averagePercentage: number;
        totalStudents: number;
        gradeDistribution: Record<string, number>;
        passPercentage: number;
    };
    semesterName: string;
}>;
export type GradeLetter = z.infer<typeof GradeLetterSchema>;
export type CreateAssessmentType = z.infer<typeof CreateAssessmentTypeSchema>;
export type UpdateAssessmentType = z.infer<typeof UpdateAssessmentTypeSchema>;
export type AssessmentTypeResponse = z.infer<typeof AssessmentTypeResponseSchema>;
export type CreateGrade = z.infer<typeof CreateGradeSchema>;
export type UpdateGrade = z.infer<typeof UpdateGradeSchema>;
export type GradeResponse = z.infer<typeof GradeResponseSchema>;
export type CreateReportCard = z.infer<typeof CreateReportCardSchema>;
export type UpdateReportCard = z.infer<typeof UpdateReportCardSchema>;
export type ReportCardResponse = z.infer<typeof ReportCardResponseSchema>;
export type GradeQuery = z.infer<typeof GradeQuerySchema>;
export type StudentGradeSummary = z.infer<typeof StudentGradeSummarySchema>;
export type ClassGradeSummary = z.infer<typeof ClassGradeSummarySchema>;
export type GradeReportQuery = z.infer<typeof GradeReportQuerySchema>;
export type GradeReportItem = z.infer<typeof GradeReportItemSchema>;
export type GradeReport = z.infer<typeof GradeReportSchema>;
//# sourceMappingURL=grade.d.ts.map