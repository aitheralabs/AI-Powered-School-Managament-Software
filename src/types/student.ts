import { z } from 'zod';
import { IdSchema, DateSchema } from './common';

// Enhanced Student schemas
export const CreateStudentSchema = z.object({
  // User information (will create user account)
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone: z.string().optional(),
  dateOfBirth: DateSchema.optional(),
  address: z.string().optional(),

  // Student-specific information
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().optional().nullable().transform(v => v || null),
  enrollmentDate: DateSchema,
  guardianName: z.string().min(2, 'Guardian name must be at least 2 characters'),
  guardianPhone: z.string().min(10, 'Guardian phone must be at least 10 characters'),
  guardianEmail: z.string().email('Invalid guardian email').optional(),
  emergencyContact: z.string().min(10, 'Emergency contact is required'),
  medicalInfo: z.string().optional(),
});

export const UpdateStudentSchema = z.object({
  // User information updates
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  dateOfBirth: DateSchema.optional(),
  address: z.string().optional(),
  
  // Student-specific updates
  classId: IdSchema.optional(),
  guardianName: z.string().min(2, 'Guardian name must be at least 2 characters').optional(),
  guardianPhone: z.string().min(10, 'Guardian phone must be at least 10 characters').optional(),
  guardianEmail: z.string().email('Invalid guardian email').optional(),
  emergencyContact: z.string().min(10, 'Emergency contact is required').optional(),
  medicalInfo: z.string().optional(),
});

export const StudentResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  userId: IdSchema,
  studentId: z.string(),
  classId: IdSchema,
  enrollmentDate: z.string(),
  guardianName: z.string(),
  guardianPhone: z.string(),
  guardianEmail: z.string().nullable(),
  emergencyContact: z.string(),
  medicalInfo: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  user: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    address: z.string().nullable(),
  }).optional(),
  class: z.object({
    name: z.string(),
    grade: z.string(),
    section: z.string(),
    academicYear: z.object({
      name: z.string(),
    }).optional(),
  }).optional(),
  parents: z.array(z.object({
    parentId: IdSchema,
    firstName: z.string(),
    lastName: z.string(),
    relationshipType: z.enum(['father', 'mother', 'guardian', 'other']),
    isPrimary: z.boolean(),
  })).optional(),
});

// Student query schemas
export const StudentQuerySchema = z.object({
  classId: IdSchema.optional(),
  grade: z.string().optional(),
  section: z.string().optional(),
  academicYearId: IdSchema.optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(), // Search by name, student ID, or email
  enrollmentDateFrom: DateSchema.optional(),
  enrollmentDateTo: DateSchema.optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.enum(['firstName', 'lastName', 'studentId', 'enrollmentDate', 'className']).optional().default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Student class history schemas
export const StudentClassHistorySchema = z.object({
  id: IdSchema,
  studentId: IdSchema,
  classId: IdSchema,
  academicYearId: IdSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  class: z.object({
    name: z.string(),
    grade: z.string(),
    section: z.string(),
  }).optional(),
  academicYear: z.object({
    name: z.string(),
  }).optional(),
});

// Student summary schemas
export const StudentSummarySchema = z.object({
  studentId: IdSchema,
  personalInfo: z.object({
    name: z.string(),
    studentIdNumber: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    address: z.string().nullable(),
  }),
  academicInfo: z.object({
    currentClass: z.string(),
    enrollmentDate: z.string(),
    academicYear: z.string(),
  }),
  guardianInfo: z.object({
    guardianName: z.string(),
    guardianPhone: z.string(),
    guardianEmail: z.string().nullable(),
    emergencyContact: z.string(),
  }),
  currentStats: z.object({
    attendancePercentage: z.number(),
    overallGrade: z.string().nullable(),
    pendingFees: z.number(),
    lastAttendanceDate: z.string().nullable(),
    lastGradeDate: z.string().nullable(),
  }).optional(),
});

// Types
export type CreateStudent = z.infer<typeof CreateStudentSchema>;
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;
export type StudentResponse = z.infer<typeof StudentResponseSchema>;

export type StudentQuery = z.infer<typeof StudentQuerySchema>;
export type StudentClassHistory = z.infer<typeof StudentClassHistorySchema>;
export type StudentSummary = z.infer<typeof StudentSummarySchema>;
