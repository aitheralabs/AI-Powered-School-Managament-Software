import { z } from 'zod';
import { IdSchema, DateSchema, EmailSchema, PhoneSchema } from './common';

// Staff schemas
export const CreateStaffSchema = z.object({
  // User information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone: z.preprocess(val => (val === '' || val === null) ? undefined : val, PhoneSchema.optional()),
  dateOfBirth: z.preprocess(val => (val === '' || val === null) ? undefined : val, DateSchema.optional()),
  address: z.string().optional(),

  // Staff-specific information
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  joiningDate: DateSchema,
  salary: z.preprocess(val => (val === '' || val === null) ? undefined : Number(val), z.number().min(0, 'Salary cannot be negative').optional()),
  responsibilities: z.string().optional(),
});

export const UpdateStaffSchema = z.object({
  // User information updates
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.preprocess(val => (val === '' || val === null) ? undefined : val, PhoneSchema.optional()),
  dateOfBirth: z.preprocess(val => (val === '' || val === null) ? undefined : val, DateSchema.optional()),
  address: z.string().optional(),
  
  // Staff-specific updates
  department: z.string().min(1, 'Department is required').optional(),
  position: z.string().min(1, 'Position is required').optional(),
  salary: z.preprocess(val => (val === '' || val === null) ? undefined : Number(val), z.number().min(0, 'Salary cannot be negative').optional()),
  responsibilities: z.string().optional(),
});

export const StaffResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  userId: IdSchema,
  employeeId: z.string(),
  department: z.string(),
  position: z.string(),
  joiningDate: z.string(),
  salary: z.number().nullable(),
  responsibilities: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // User relation
  user: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    address: z.string().nullable(),
  }).optional(),
});

// Staff query schemas
export const StaffQuerySchema = z.object({
  department: z.string().optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional(),
  joiningDateFrom: DateSchema.optional(),
  joiningDateTo: DateSchema.optional(),
  search: z.string().optional(), // Search by name, employee ID, or email
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.enum(['firstName', 'lastName', 'employeeId', 'department', 'position', 'joiningDate']).optional().default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Staff summary schemas
export const DepartmentSummarySchema = z.object({
  department: z.string(),
  totalStaff: z.number(),
  activeStaff: z.number(),
  positions: z.array(z.object({
    position: z.string(),
    count: z.number(),
  })),
});

export const StaffSummarySchema = z.object({
  totalStaff: z.number(),
  activeStaff: z.number(),
  inactiveStaff: z.number(),
  departmentBreakdown: z.array(DepartmentSummarySchema),
  recentJoinings: z.array(z.object({
    staffId: IdSchema,
    name: z.string(),
    department: z.string(),
    position: z.string(),
    joiningDate: z.string(),
  })),
});

// Staff report schemas
export const StaffReportQuerySchema = z.object({
  department: z.string().optional(),
  position: z.string().optional(),
  joiningDateFrom: DateSchema.optional(),
  joiningDateTo: DateSchema.optional(),
  isActive: z.boolean().optional(),
  groupBy: z.enum(['department', 'position', 'joiningYear']).optional().default('department'),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

export const StaffReportItemSchema = z.object({
  staffId: IdSchema,
  employeeId: z.string(),
  name: z.string(),
  email: z.string(),
  department: z.string(),
  position: z.string(),
  joiningDate: z.string(),
  salary: z.number().nullable(),
  isActive: z.boolean(),
});

export const StaffReportSchema = z.object({
  reportType: z.string(),
  generatedAt: z.string(),
  filters: z.object({
    department: z.string().nullable(),
    position: z.string().nullable(),
    isActive: z.boolean().nullable(),
  }),
  data: z.array(StaffReportItemSchema),
  summary: z.object({
    totalStaff: z.number(),
    activeStaff: z.number(),
    departmentCount: z.number(),
    positionCount: z.number(),
  }),
});

// Common department and position enums (can be customized per school)
export const CommonDepartmentsSchema = z.enum([
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

export const CommonPositionsSchema = z.enum([
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

// Types
export type CreateStaff = z.infer<typeof CreateStaffSchema>;
export type UpdateStaff = z.infer<typeof UpdateStaffSchema>;
export type StaffResponse = z.infer<typeof StaffResponseSchema>;

export type StaffQuery = z.infer<typeof StaffQuerySchema>;
export type DepartmentSummary = z.infer<typeof DepartmentSummarySchema>;
export type StaffSummary = z.infer<typeof StaffSummarySchema>;

export type StaffReportQuery = z.infer<typeof StaffReportQuerySchema>;
export type StaffReportItem = z.infer<typeof StaffReportItemSchema>;
export type StaffReport = z.infer<typeof StaffReportSchema>;

export type CommonDepartments = z.infer<typeof CommonDepartmentsSchema>;
export type CommonPositions = z.infer<typeof CommonPositionsSchema>;