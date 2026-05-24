import { Router } from 'express';
import {
  register, login, getProfile, updateProfile, changePassword,
  refreshToken, logout, logoutAll,
  forgotPassword, resetPassword, verifyEmail, resendVerification
} from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
  CreateUserSchema, LoginSchema, UpdateUserSchema, ChangePasswordSchema,
  ForgotPasswordSchema, ResetPasswordSchema, VerifyEmailSchema, ResendVerificationSchema
} from '../types/user';
import { sanitizeUser } from '../middleware/sanitization';
import { authRateLimit, registrationRateLimit, passwordResetRateLimit } from '../middleware/rateLimiting';
import { z } from 'zod';

const router = Router();

// Refresh token schema
const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Public routes
router.post('/register', registrationRateLimit, sanitizeUser, validateBody(CreateUserSchema), register);
router.post('/login', authRateLimit, validateBody(LoginSchema), login);
router.post('/refresh', authRateLimit, validateBody(RefreshTokenSchema), refreshToken);
router.post('/forgot-password', passwordResetRateLimit, validateBody(ForgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetRateLimit, validateBody(ResetPasswordSchema), resetPassword);
router.post('/verify-email', registrationRateLimit, validateBody(VerifyEmailSchema), verifyEmail);
router.post('/resend-verification', passwordResetRateLimit, validateBody(ResendVerificationSchema), resendVerification);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, sanitizeUser, validateBody(UpdateUserSchema.partial()), updateProfile);
router.post('/change-password', authenticate, validateBody(ChangePasswordSchema), changePassword);
router.post('/logout', validateBody(RefreshTokenSchema), logout);
router.post('/logout-all', authenticate, logoutAll);

export default router;
