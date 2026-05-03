import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().default('school_management'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // Redis Cache
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),
  CACHE_TTL_SECONDS: z.string().default('300').transform(Number),
  REDIS_ENABLED: z.string().default('false').transform(val => val === 'true'),

  // Email / SMTP
  SMTP_HOST:   z.string().optional(),
  SMTP_PORT:   z.string().default('587').transform(Number),
  SMTP_SECURE: z.string().default('false').transform(val => val === 'true'),
  SMTP_USER:   z.string().optional(),
  SMTP_PASS:   z.string().optional(),
  SMTP_FROM:   z.string().optional(),

  // Application metadata (used in emails and links)
  APP_URL:  z.string().default('http://localhost:4200'),
  APP_NAME: z.string().default('School Management'),

  // File uploads
  UPLOAD_DIR:           z.string().default('./uploads'),
  MAX_FILE_SIZE:        z.string().default('5242880').transform(Number),
  ALLOWED_FILE_TYPES:   z.string().default('jpg,jpeg,png,gif,pdf,docx,xlsx,csv,txt'),

  // Super-admin JWT (separate secret for platform operators)
  SUPER_ADMIN_JWT_SECRET: z.string().min(32, 'SUPER_ADMIN_JWT_SECRET must be at least 32 characters').optional(),

  // AI
  ANTHROPIC_API_KEY: z.string().optional(),

  // Payment gateways
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
});

// Validate and export environment variables
const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    
    // In test environment, provide more helpful error info
    if (process.env.NODE_ENV === 'test') {
      console.error('Test environment variables:', {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET'
      });
    }
    
    process.exit(1);
  }
};

export const env = validateEnv();

export default env;
