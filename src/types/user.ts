import { z } from 'zod';
import { IdSchema, EmailSchema, PhoneSchema, DateSchema } from './common';

// User role enum
export const UserRoleSchema = z.enum(['admin', 'teacher', 'student', 'parent', 'staff']);

// User schemas
export const CreateUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(100, 'First name must be at most 100 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(100, 'Last name must be at most 100 characters'),
  email: EmailSchema,
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  role: UserRoleSchema,
  phone: PhoneSchema.optional(),
  dateOfBirth: DateSchema.optional(),
  address: z.string().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(10, 'New password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const UserResponseSchema = z.object({
  id: IdSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: UserRoleSchema,
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(10, 'New password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const ResendVerificationSchema = z.object({
  email: EmailSchema,
});

// Types
export type UserRole = z.infer<typeof UserRoleSchema>;
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
