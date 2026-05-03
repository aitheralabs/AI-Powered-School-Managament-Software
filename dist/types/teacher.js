"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherSuggestionSchema = exports.AssignmentConflictCheckSchema = exports.TeacherWorkloadSchema = exports.TeacherAssignmentSchema = exports.TeacherSubjectResponseSchema = exports.CreateTeacherSubjectSchema = exports.TeacherResponseSchema = exports.UpdateTeacherSchema = exports.CreateTeacherSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.CreateTeacherSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    email: common_1.EmailSchema,
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').optional(),
    phone: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : val, common_1.PhoneSchema.optional()),
    dateOfBirth: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : val, common_1.DateSchema.optional()),
    address: zod_1.z.string().optional(),
    employeeId: zod_1.z.string().min(1, 'Employee ID is required'),
    qualification: zod_1.z.string().optional(),
    experienceYears: zod_1.z.preprocess(val => (val == null || val === '') ? 0 : Number(val), zod_1.z.number().min(0, 'Experience years cannot be negative').optional().default(0)),
    specialization: zod_1.z.preprocess(val => Array.isArray(val) ? val.join(', ') : val, zod_1.z.string().optional()),
    joiningDate: common_1.DateSchema,
    salary: zod_1.z.preprocess(val => (val == null || val === '') ? undefined : Number(val), zod_1.z.number().min(0, 'Salary cannot be negative').optional()),
});
exports.UpdateTeacherSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').optional(),
    phone: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : val, common_1.PhoneSchema.optional()),
    dateOfBirth: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : val, common_1.DateSchema.optional()),
    address: zod_1.z.string().optional(),
    qualification: zod_1.z.string().optional(),
    experienceYears: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : Number(val), zod_1.z.number().min(0, 'Experience years cannot be negative').optional()),
    specialization: zod_1.z.string().optional(),
    salary: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : Number(val), zod_1.z.number().min(0, 'Salary cannot be negative').optional()),
});
exports.TeacherResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    userId: common_1.IdSchema,
    employeeId: zod_1.z.string(),
    qualification: zod_1.z.string().nullable(),
    experienceYears: zod_1.z.number(),
    specialization: zod_1.z.string().nullable(),
    joiningDate: zod_1.z.string(),
    salary: zod_1.z.number().nullable(),
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
});
exports.CreateTeacherSubjectSchema = zod_1.z.object({
    teacherId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
});
exports.TeacherSubjectResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    teacherId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
    createdAt: zod_1.z.string(),
    teacher: zod_1.z.object({
        employeeId: zod_1.z.string(),
        user: zod_1.z.object({
            firstName: zod_1.z.string(),
            lastName: zod_1.z.string(),
        }),
    }).optional(),
    subject: zod_1.z.object({
        name: zod_1.z.string(),
        code: zod_1.z.string(),
    }).optional(),
});
exports.TeacherAssignmentSchema = zod_1.z.object({
    teacherId: common_1.IdSchema,
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
});
exports.TeacherWorkloadSchema = zod_1.z.object({
    teacherId: common_1.IdSchema,
    totalClasses: zod_1.z.number(),
    totalSubjects: zod_1.z.number(),
    totalStudents: zod_1.z.number(),
    weeklyHours: zod_1.z.number().optional(),
    workloadIntensity: zod_1.z.number().optional(),
    workloadStatus: zod_1.z.enum(['light', 'normal', 'high', 'overloaded']).optional(),
});
exports.AssignmentConflictCheckSchema = zod_1.z.object({
    teacherId: common_1.IdSchema,
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
});
exports.TeacherSuggestionSchema = zod_1.z.object({
    teacher: zod_1.z.object({
        id: common_1.IdSchema,
        employeeId: zod_1.z.string(),
        name: zod_1.z.string(),
        isMainTeacher: zod_1.z.boolean(),
    }),
    suitabilityScore: zod_1.z.number(),
    recommendation: zod_1.z.enum(['excellent', 'good', 'caution', 'not_recommended']),
    currentWorkload: zod_1.z.object({
        assignments: zod_1.z.number(),
        hours: zod_1.z.number(),
        sameGradeAssignments: zod_1.z.number(),
    }),
    projectedWorkload: zod_1.z.object({
        assignments: zod_1.z.number(),
        hours: zod_1.z.number(),
        utilizationPercentage: zod_1.z.number(),
    }),
    conflicts: zod_1.z.array(zod_1.z.string()),
    canAssign: zod_1.z.boolean(),
});
//# sourceMappingURL=teacher.js.map