"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonPositionsSchema = exports.CommonDepartmentsSchema = exports.StaffReportSchema = exports.StaffReportItemSchema = exports.StaffReportQuerySchema = exports.StaffSummarySchema = exports.DepartmentSummarySchema = exports.StaffQuerySchema = exports.StaffResponseSchema = exports.UpdateStaffSchema = exports.CreateStaffSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.CreateStaffSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    email: common_1.EmailSchema,
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').optional(),
    phone: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : val, common_1.PhoneSchema.optional()),
    dateOfBirth: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : val, common_1.DateSchema.optional()),
    address: zod_1.z.string().optional(),
    employeeId: zod_1.z.string().min(1, 'Employee ID is required'),
    department: zod_1.z.string().min(1, 'Department is required'),
    position: zod_1.z.string().min(1, 'Position is required'),
    joiningDate: common_1.DateSchema,
    salary: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : Number(val), zod_1.z.number().min(0, 'Salary cannot be negative').optional()),
    responsibilities: zod_1.z.string().optional(),
});
exports.UpdateStaffSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').optional(),
    phone: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : val, common_1.PhoneSchema.optional()),
    dateOfBirth: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : val, common_1.DateSchema.optional()),
    address: zod_1.z.string().optional(),
    department: zod_1.z.string().min(1, 'Department is required').optional(),
    position: zod_1.z.string().min(1, 'Position is required').optional(),
    salary: zod_1.z.preprocess(val => (val === '' || val === null) ? undefined : Number(val), zod_1.z.number().min(0, 'Salary cannot be negative').optional()),
    responsibilities: zod_1.z.string().optional(),
});
exports.StaffResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    userId: common_1.IdSchema,
    employeeId: zod_1.z.string(),
    department: zod_1.z.string(),
    position: zod_1.z.string(),
    joiningDate: zod_1.z.string(),
    salary: zod_1.z.number().nullable(),
    responsibilities: zod_1.z.string().nullable(),
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
exports.StaffQuerySchema = zod_1.z.object({
    department: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    joiningDateFrom: common_1.DateSchema.optional(),
    joiningDateTo: common_1.DateSchema.optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
    sortBy: zod_1.z.enum(['firstName', 'lastName', 'employeeId', 'department', 'position', 'joiningDate']).optional().default('firstName'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
exports.DepartmentSummarySchema = zod_1.z.object({
    department: zod_1.z.string(),
    totalStaff: zod_1.z.number(),
    activeStaff: zod_1.z.number(),
    positions: zod_1.z.array(zod_1.z.object({
        position: zod_1.z.string(),
        count: zod_1.z.number(),
    })),
});
exports.StaffSummarySchema = zod_1.z.object({
    totalStaff: zod_1.z.number(),
    activeStaff: zod_1.z.number(),
    inactiveStaff: zod_1.z.number(),
    departmentBreakdown: zod_1.z.array(exports.DepartmentSummarySchema),
    recentJoinings: zod_1.z.array(zod_1.z.object({
        staffId: common_1.IdSchema,
        name: zod_1.z.string(),
        department: zod_1.z.string(),
        position: zod_1.z.string(),
        joiningDate: zod_1.z.string(),
    })),
});
exports.StaffReportQuerySchema = zod_1.z.object({
    department: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    joiningDateFrom: common_1.DateSchema.optional(),
    joiningDateTo: common_1.DateSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
    groupBy: zod_1.z.enum(['department', 'position', 'joiningYear']).optional().default('department'),
    format: zod_1.z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});
exports.StaffReportItemSchema = zod_1.z.object({
    staffId: common_1.IdSchema,
    employeeId: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string(),
    department: zod_1.z.string(),
    position: zod_1.z.string(),
    joiningDate: zod_1.z.string(),
    salary: zod_1.z.number().nullable(),
    isActive: zod_1.z.boolean(),
});
exports.StaffReportSchema = zod_1.z.object({
    reportType: zod_1.z.string(),
    generatedAt: zod_1.z.string(),
    filters: zod_1.z.object({
        department: zod_1.z.string().nullable(),
        position: zod_1.z.string().nullable(),
        isActive: zod_1.z.boolean().nullable(),
    }),
    data: zod_1.z.array(exports.StaffReportItemSchema),
    summary: zod_1.z.object({
        totalStaff: zod_1.z.number(),
        activeStaff: zod_1.z.number(),
        departmentCount: zod_1.z.number(),
        positionCount: zod_1.z.number(),
    }),
});
exports.CommonDepartmentsSchema = zod_1.z.enum([
    'Administration',
    'Academics',
    'Finance',
    'Library',
    'IT',
    'Maintenance',
    'Security',
    'Transport',
    'Cafeteria',
    'Medical',
    'Sports',
    'Other'
]);
exports.CommonPositionsSchema = zod_1.z.enum([
    'Principal',
    'Vice Principal',
    'Academic Coordinator',
    'Librarian',
    'Accountant',
    'Clerk',
    'IT Administrator',
    'Security Guard',
    'Maintenance Staff',
    'Driver',
    'Cook',
    'Nurse',
    'Sports Instructor',
    'Counselor',
    'Other'
]);
//# sourceMappingURL=staff.js.map