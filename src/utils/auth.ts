import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { UserRole } from '../types/user';
import crypto from 'crypto';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  schoolId?: string; // included so resolveTenant skips the extra DB lookup
}

// Generate JWT access token (short-lived)
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '1h',
  } as jwt.SignOptions);
};

// Generate JWT refresh token (long-lived)
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    jwtid: crypto.randomUUID(),
  } as jwt.SignOptions);
};

// Generate both access and refresh tokens
export const generateTokens = (payload: TokenPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

// Legacy function for backward compatibility
export const generateToken = (payload: TokenPayload): string => {
  return generateAccessToken(payload);
};

// Verify JWT token
export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET);
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    jwt.verify(token, env.JWT_SECRET);
    return false;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return true;
    }
    throw error; // Re-throw other errors
  }
};
