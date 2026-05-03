import { z } from 'zod';
import { IdSchema, DateSchema, EmailSchema, PhoneSchema } from './common';

// Teacher schemas
export const CreateTeacherSchema = z.object({
  // User information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone: z.preprocess(val => (val === '' || val === null) ? undefined : val, PhoneSchema.optional()),
  dateOfBirth: z.preprocess(val => (val === '' || val === null) ? undefined : val, DateSchema.optional()),
  address: z.string().optional(),

  // Teacher-specific information
  employeeId: z.string().min(1, 'Employee ID is required'),
  qualification: z.string().optional(),
  experienceYears: z.preprocess(val => (val == null || val === '') ? 0 : Number(val), z.number().min(0, 'Experience years cannot be negative').optional().default(0)),
  specialization: z.preprocess(val => Array.isArray(val) ? val.join(', ') : val, z.string().optional()),
  joiningDate: DateSchema,
  salary: z.preprocess(val => (val == null || val === '') ? undefined : Number(val), z.number().min(0, 'Salary cannot be negative').optional()),
});

export const UpdateTeacherSchema = z.object({
  // User information updates
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.preprocess(val => (val === '' || val === null) ? undefined : val, PhoneSchema.optional()),
  dateOfBirth: z.preprocess(val => (val === '' || val === null) ? undefined : val, DateSchema.optional()),
  address: z.string().optional(),

  // Teacher-specific updates
  qualification: z.string().optional(),
  experienceYears: z.preprocess(val => (val === '' || val === null) ? undefined : Number(val), z.number().min(0, 'Experience years cannot be negative').optional()),
  specialization: z.string().optional(),
  salary: z.preprocess(val => (val === '' || val === null) ? undefined : Number(val), z.number().min(0, 'Salary cannot be negative').optional()),
});

export const TeacherResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  userId: IdSchema,
  employeeId: z.string(),
  qualification: z.string().nullable(),
  experienceYears: z.number(),
  specialization: z.string().nullable(),
  joiningDate: z.string(),
  salary: z.number().nullable(),
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

// Teacher-Subject assignment schemas
export const CreateTeacherSubjectSchema = z.object({
  teacherId: IdSchema,
  subjectId: IdSchema,
});

export const TeacherSubjectResponseSchema = z.object({
  id: IdSchema,
  teacherId: IdSchema,
  subjectId: IdSchema,
  createdAt: z.string(),
  // Relations
  teacher: z.object({
    employeeId: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  }).optional(),
  subject: z.object({
    name: z.string(),
    code: z.string(),
  }).optional(),
});

// Teacher assignment schemas
export const TeacherAssignmentSchema = z.object({
  teacherId: IdSchema,
  classId: IdSchema,
  subjectId: IdSchema,
});

// Teacher workload summary schema
export const TeacherWorkloadSchema = z.object({
  teacherId: IdSchema,
  totalClasses: z.number(),
  totalSubjects: z.number(),
  totalStudents: z.number(),
  weeklyHours: z.number().optional(),
  workloadIntensity: z.number().optional(),
  workloadStatus: z.enum(['light', 'normal', 'high', 'overloaded']).optional(),
});

// Assignment conflict check schema
export const AssignmentConflictCheckSchema = z.object({
  teacherId: IdSchema,
  classId: IdSchema,
  subjectId: IdSchema,
});

// Teacher suggestion schema
export const TeacherSuggestionSchema = z.object({
  teacher: z.object({
    id: IdSchema,
    employeeId: z.string(),
    name: z.string(),
    isMainTeacher: z.boolean(),
  }),
  suitabilityScore: z.number(),
  recommendation: z.enum(['excellent', 'good', 'caution', 'not_recommended']),
  currentWorkload: z.object({
    assignments: z.number(),
    hours: z.number(),
    sameGradeAssignments: z.number(),
  }),
  projectedWorkload: z.object({
    assignments: z.number(),
    hours: z.number(),
    utilizationPercentage: z.number(),
  }),
  conflicts: z.array(z.string()),
  canAssign: z.boolean(),
});

// Types
export type CreateTeacher = z.infer<typeof CreateTeacherSchema>;
export type UpdateTeacher = z.infer<typeof UpdateTeacherSchema>;
export type TeacherResponse = z.infer<typeof TeacherResponseSchema>;

export type CreateTeacherSubject = z.infer<typeof CreateTeacherSubjectSchema>;
export type TeacherSubjectResponse = z.infer<typeof TeacherSubjectResponseSchema>;

export type TeacherAssignment = z.infer<typeof TeacherAssignmentSchema>;
export type TeacherWorkload = z.infer<typeof TeacherWorkloadSchema>;
export type AssignmentConflictCheck = z.infer<typeof AssignmentConflictCheckSchema>;
export type TeacherSuggestion = z.infer<typeof TeacherSuggestionSchema>;