import { z } from 'zod';
import { IdSchema, DateSchema } from './common';

// Fee frequency enum
export const FeeFrequencySchema = z.enum(['monthly', 'quarterly', 'semester', 'annual', 'one-time']);

// Fee status enum
export const FeeStatusSchema = z.enum(['pending', 'partial', 'paid', 'overdue', 'waived']);

// Payment method enum
export const PaymentMethodSchema = z.enum(['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi']);

// Fee Category schemas
export const CreateFeeCategorySchema = z.object({
  name: z.string().min(1, 'Fee category name is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount cannot be negative'),
  frequency: FeeFrequencySchema,
  isMandatory: z.boolean().optional().default(true),
  academicYearId: IdSchema.optional(),
});

export const UpdateFeeCategorySchema = CreateFeeCategorySchema.partial().omit({ academicYearId: true });

export const FeeCategoryResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  amount: z.number(),
  frequency: FeeFrequencySchema,
  isMandatory: z.boolean(),
  academicYearId: IdSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  academicYear: z.object({
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }).optional(),
});

// Student Fee schemas
export const CreateStudentFeeSchema = z.object({
  studentId: IdSchema,
  feeCategoryId: IdSchema,
  amount: z.number().min(0, 'Amount cannot be negative'),
  dueDate: DateSchema,
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
});

export const UpdateStudentFeeSchema = z.object({
  amount: z.number().min(0, 'Amount cannot be negative').optional(),
  dueDate: DateSchema.optional(),
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional(),
  status: FeeStatusSchema.optional(),
});

export const StudentFeeResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  studentId: IdSchema,
  feeCategoryId: IdSchema,
  amount: z.number(),
  dueDate: z.string(),
  status: FeeStatusSchema,
  discountAmount: z.number(),
  totalAmount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  student: z.object({
    studentId: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  }).optional(),
  feeCategory: z.object({
    name: z.string(),
    frequency: FeeFrequencySchema,
  }).optional(),
});

// Payment schemas
export const CreatePaymentSchema = z.object({
  studentFeeId: IdSchema,
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  paymentDate: DateSchema.optional(),
  paymentMethod: PaymentMethodSchema,
  transactionId: z.string().optional(),
  receiptNumber: z.string().optional(),
  remarks: z.string().optional(),
});

export const PaymentResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  studentFeeId: IdSchema,
  amount: z.number(),
  paymentDate: z.string(),
  paymentMethod: PaymentMethodSchema,
  transactionId: z.string().nullable(),
  receiptNumber: z.string(),
  processedBy: IdSchema,
  remarks: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  studentFee: z.object({
    student: z.object({
      studentId: z.string(),
      user: z.object({
        firstName: z.string(),
        lastName: z.string(),
      }),
    }),
    feeCategory: z.object({
      name: z.string(),
    }),
  }).optional(),
  processedByUser: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
});

// Fee assignment schemas
export const AssignFeesToStudentsSchema = z.object({
  feeCategoryId: IdSchema,
  studentIds: z.array(IdSchema).min(1, 'At least one student must be selected'),
  dueDate: DateSchema,
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
});

export const AssignFeesToClassSchema = z.object({
  feeCategoryId: IdSchema,
  classId: IdSchema,
  dueDate: DateSchema,
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
});

// Fee query schemas
export const FeeQuerySchema = z.object({
  studentId: IdSchema.optional(),
  classId: IdSchema.optional(),
  feeCategoryId: IdSchema.optional(),
  status: FeeStatusSchema.optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
});

// Fee summary schemas
export const StudentFeeSummarySchema = z.object({
  studentId: IdSchema,
  totalFees: z.number(),
  paidAmount: z.number(),
  pendingAmount: z.number(),
  overdueAmount: z.number(),
  discountAmount: z.number(),
  lastPaymentDate: z.string().nullable(),
});

export const ClassFeeSummarySchema = z.object({
  classId: IdSchema,
  className: z.string(),
  totalStudents: z.number(),
  totalFees: z.number(),
  totalPaid: z.number(),
  totalPending: z.number(),
  totalOverdue: z.number(),
  collectionPercentage: z.number(),
});

// Fee report schemas
export const FeeReportQuerySchema = z.object({
  classId: IdSchema.optional(),
  feeCategoryId: IdSchema.optional(),
  startDate: DateSchema,
  endDate: DateSchema,
  status: FeeStatusSchema.optional(),
  groupBy: z.enum(['student', 'class', 'category', 'date']).optional().default('student'),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

export const FeeReportItemSchema = z.object({
  studentId: IdSchema,
  studentName: z.string(),
  className: z.string(),
  feeCategoryName: z.string(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  pendingAmount: z.number(),
  status: FeeStatusSchema,
  dueDate: z.string(),
  lastPaymentDate: z.string().nullable(),
});

export const FeeReportSchema = z.object({
  reportType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  generatedAt: z.string(),
  data: z.array(FeeReportItemSchema),
  summary: z.object({
    totalStudents: z.number(),
    totalAmount: z.number(),
    totalPaid: z.number(),
    totalPending: z.number(),
    collectionPercentage: z.number(),
  }),
});

// Types
export type FeeFrequency = z.infer<typeof FeeFrequencySchema>;
export type FeeStatus = z.infer<typeof FeeStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export type CreateFeeCategory = z.infer<typeof CreateFeeCategorySchema>;
export type UpdateFeeCategory = z.infer<typeof UpdateFeeCategorySchema>;
export type FeeCategoryResponse = z.infer<typeof FeeCategoryResponseSchema>;

export type CreateStudentFee = z.infer<typeof CreateStudentFeeSchema>;
export type UpdateStudentFee = z.infer<typeof UpdateStudentFeeSchema>;
export type StudentFeeResponse = z.infer<typeof StudentFeeResponseSchema>;

export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

export type AssignFeesToStudents = z.infer<typeof AssignFeesToStudentsSchema>;
export type AssignFeesToClass = z.infer<typeof AssignFeesToClassSchema>;

export type FeeQuery = z.infer<typeof FeeQuerySchema>;
export type StudentFeeSummary = z.infer<typeof StudentFeeSummarySchema>;
export type ClassFeeSummary = z.infer<typeof ClassFeeSummarySchema>;

export type FeeReportQuery = z.infer<typeof FeeReportQuerySchema>;
export type FeeReportItem = z.infer<typeof FeeReportItemSchema>;
export type FeeReport = z.infer<typeof FeeReportSchema>;