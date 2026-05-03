"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentSummarySchema = exports.StudentClassHistorySchema = exports.StudentQuerySchema = exports.StudentResponseSchema = exports.UpdateStudentSchema = exports.CreateStudentSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.CreateStudentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').optional(),
    phone: zod_1.z.string().optional(),
    dateOfBirth: common_1.DateSchema.optional(),
    address: zod_1.z.string().optional(),
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    classId: zod_1.z.string().optional().nullable().transform(v => v || null),
    enrollmentDate: common_1.DateSchema,
    guardianName: zod_1.z.string().min(2, 'Guardian name must be at least 2 characters'),
    guardianPhone: zod_1.z.string().min(10, 'Guardian phone must be at least 10 characters'),
    guardianEmail: zod_1.z.string().email('Invalid guardian email').optional(),
    emergencyContact: zod_1.z.string().min(10, 'Emergency contact is required'),
    medicalInfo: zod_1.z.string().optional(),
});
exports.UpdateStudentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').optional(),
    phone: zod_1.z.string().optional(),
    dateOfBirth: common_1.DateSchema.optional(),
    address: zod_1.z.string().optional(),
    classId: common_1.IdSchema.optional(),
    guardianName: zod_1.z.string().min(2, 'Guardian name must be at least 2 characters').optional(),
    guardianPhone: zod_1.z.string().min(10, 'Guardian phone must be at least 10 characters').optional(),
    guardianEmail: zod_1.z.string().email('Invalid guardian email').optional(),
    emergencyContact: zod_1.z.string().min(10, 'Emergency contact is required').optional(),
    medicalInfo: zod_1.z.string().optional(),
});
exports.StudentResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    userId: common_1.IdSchema,
    studentId: zod_1.z.string(),
    classId: common_1.IdSchema,
    enrollmentDate: zod_1.z.string(),
    guardianName: zod_1.z.string(),
    guardianPhone: zod_1.z.string(),
    guardianEmail: zod_1.z.string().nullable(),
    emergencyContact: zod_1.z.string(),
    medicalInfo: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    user: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        email: zod_1.z.string(),
        phone: zod_1.z.string().nullable(),
        dateOfBirth: zod_1.z.string().nullable(),
        address: zod_1.z.string().nullable(),
    }).optional(),
    class: zod_1.z.object({
        name: zod_1.z.string(),
        grade: zod_1.z.string(),
        section: zod_1.z.string(),
        academicYear: zod_1.z.object({
            name: zod_1.z.string(),
        }).optional(),
    }).optional(),
    parents: zod_1.z.array(zod_1.z.object({
        parentId: common_1.IdSchema,
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        relationshipType: zod_1.z.enum(['father', 'mother', 'guardian', 'other']),
        isPrimary: zod_1.z.boolean(),
    })).optional(),
});
exports.StudentQuerySchema = zod_1.z.object({
    classId: common_1.IdSchema.optional(),
    grade: zod_1.z.string().optional(),
    section: zod_1.z.string().optional(),
    academicYearId: common_1.IdSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
    search: zod_1.z.string().optional(),
    enrollmentDateFrom: common_1.DateSchema.optional(),
    enrollmentDateTo: common_1.DateSchema.optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
    sortBy: zod_1.z.enum(['firstName', 'lastName', 'studentId', 'enrollmentDate', 'className']).optional().default('firstName'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
exports.StudentClassHistorySchema = zod_1.z.object({
    id: common_1.IdSchema,
    studentId: common_1.IdSchema,
    classId: common_1.IdSchema,
    academicYearId: common_1.IdSchema,
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    class: zod_1.z.object({
        name: zod_1.z.string(),
        grade: zod_1.z.string(),
        section: zod_1.z.string(),
    }).optional(),
    academicYear: zod_1.z.object({
        name: zod_1.z.string(),
    }).optional(),
});
exports.StudentSummarySchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    personalInfo: zod_1.z.object({
        name: zod_1.z.string(),
        studentIdNumber: zod_1.z.string(),
        email: zod_1.z.string(),
        phone: zod_1.z.string().nullable(),
        dateOfBirth: zod_1.z.string().nullable(),
        address: zod_1.z.string().nullable(),
    }),
    academicInfo: zod_1.z.object({
        currentClass: zod_1.z.string(),
        enrollmentDate: zod_1.z.string(),
        academicYear: zod_1.z.string(),
    }),
    guardianInfo: zod_1.z.object({
        guardianName: zod_1.z.string(),
        guardianPhone: zod_1.z.string(),
        guardianEmail: zod_1.z.string().nullable(),
        emergencyContact: zod_1.z.string(),
    }),
    currentStats: zod_1.z.object({
        attendancePercentage: zod_1.z.number(),
        overallGrade: zod_1.z.string().nullable(),
        pendingFees: zod_1.z.number(),
        lastAttendanceDate: zod_1.z.string().nullable(),
        lastGradeDate: zod_1.z.string().nullable(),
    }).optional(),
});
//# sourceMappingURL=student.js.map