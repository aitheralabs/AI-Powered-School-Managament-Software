"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3000').transform(Number),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.string().default('5432').transform(Number),
    DB_NAME: zod_1.z.string().default('school_management'),
    DB_USER: zod_1.z.string().default('postgres'),
    DB_PASSWORD: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000').transform(Number),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('100').transform(Number),
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.string().default('6379').transform(Number),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    REDIS_DB: zod_1.z.string().default('0').transform(Number),
    CACHE_TTL_SECONDS: zod_1.z.string().default('300').transform(Number),
    REDIS_ENABLED: zod_1.z.string().default('false').transform(val => val === 'true'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().default('587').transform(Number),
    SMTP_SECURE: zod_1.z.string().default('false').transform(val => val === 'true'),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SUPER_ADMIN_JWT_SECRET: zod_1.z.string().optional(),
    ANTHROPIC_API_KEY: zod_1.z.string().optional(),
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().optional(),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    SENTRY_DSN: zod_1.z.string().optional(),
});
const validateEnv = () => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        console.error('❌ Invalid environment variables:', error);
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
exports.env = validateEnv();
exports.default = exports.env;
//# sourceMappingURL=env.js.map