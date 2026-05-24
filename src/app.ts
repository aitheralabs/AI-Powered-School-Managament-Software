import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import {
  sanitizeInputs,
  addSecurityHeaders,
  validateContentType,
} from "./middleware/sanitization";
import {
  generalRateLimit,
  rateLimitLogger,
  speedLimiter,
} from "./middleware/rateLimiting";
import { preventSQLInjection } from "./middleware/sqlInjectionPrevention";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import schoolRoutes from "./routes/schools";
import aiInsightsRoutes from "./routes/aiInsights";
import superadminRoutes from "./routes/superadmin";
import webhookRoutes from "./routes/webhooks";
import academicYearRoutes from "./routes/academicYears";
import semesterRoutes from "./routes/semesters";
import subjectRoutes from "./routes/subjects";
import classRoutes from "./routes/classes";
import studentRoutes from "./routes/students";
import parentRoutes from "./routes/parents";
import teacherRoutes from "./routes/teachers";
import attendanceRoutes from "./routes/attendance";
import attendanceReportRoutes from "./routes/attendanceReports";
import feeRoutes from "./routes/fees";
import paymentRoutes from "./routes/payments";
import feeReportRoutes from "./routes/feeReports";
import gradeRoutes from "./routes/grades";
import assessmentTypeRoutes from "./routes/assessmentTypes";
import reportCardRoutes from "./routes/reportCards";
import staffRoutes from "./routes/staff";
import reportExportRoutes from "./routes/reportExports";
import healthRoutes from "./routes/health";
import cacheRoutes from "./routes/cache";
import fileRoutes from "./routes/files";
import monitoringRoutes from "./routes/monitoring";
import settingsRoutes from "./routes/settings";
import dashboardRoutes from "./routes/dashboard";
import timetableRoutes from "./routes/timetable";
import notificationRoutes from "./routes/notifications";
import auditRoutes from "./routes/audit";

// Import monitoring service
import { monitoringService } from "./services/monitoringService";
// Scheduled tasks (dunning, trial warnings, overage alerts)
import { startScheduledTasks } from "./cron/scheduledTasks";
import { requestTimingMiddleware } from "./middleware/requestTiming";
import statusMonitor from "express-status-monitor";
import { cacheResponse } from "./middleware/caching";
import { tenantContext } from "./database/connection";

const app = express();

// AsyncLocalStorage wrapper for RLS tenant isolation (must be before all other middleware)
app.use((req, res, next) => {
  tenantContext.run({}, next);
});

// Initialize Sentry monitoring (must be first)
monitoringService.initializeSentry(app);

// Sentry request handler (must be before other middleware)
app.use(monitoringService.getRequestHandler());
app.use(monitoringService.getTracingHandler());

// Status monitor dashboard — protected with HTTP Basic Auth in production
// Access at /status (username: admin, password: STATUS_DASHBOARD_PASSWORD env var)
const statusMonitorConfig: any = {
  title: "School Management System - Status",
  path: "/status",
  spans: [
    { interval: 1, retention: 60 },
    { interval: 5, retention: 60 },
    { interval: 15, retention: 60 },
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true,
  },
  healthChecks: [
    {
      protocol: "http",
      host: "localhost",
      path: "/health",
      port: parseInt(process.env.PORT || "3000"),
    },
  ],
};

if (env.NODE_ENV === "production" && process.env.STATUS_DASHBOARD_PASSWORD) {
  statusMonitorConfig.authorize = (req: any, res: any) => {
    const authHeader = req.headers.authorization || "";
    const [type, credentials] = authHeader.split(" ");
    if (type !== "Basic" || !credentials) return false;
    const [user, pass] = Buffer.from(credentials, "base64").toString().split(":");
    return user === "admin" && pass === process.env.STATUS_DASHBOARD_PASSWORD;
  };
}

app.use(statusMonitor(statusMonitorConfig));

// Request timing middleware
app.use(requestTimingMiddleware);

// Security middleware
app.use(helmet());

// Rate limiting (must be early in the middleware stack)
app.use(rateLimitLogger);
app.use(generalRateLimit);
app.use(speedLimiter);

// Additional security headers for XSS protection
app.use(addSecurityHeaders);

// CORS — supports comma-separated origins: CORS_ORIGIN=https://a.com,https://b.com
const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls, health checks, and Postman (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-School-ID",
      "X-Request-ID",
    ],
    exposedHeaders: [
      "X-Request-ID",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
    ],
  }),
);

// Logging middleware
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Webhook routes — MUST be before express.json() and sanitization middleware
// so that webhook payloads are not corrupted by sanitization/SQL-injection middleware.
app.use("/api/v1/webhooks", express.json({ limit: "10mb" }), webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Handle malformed JSON bodies gracefully
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ success: false, message: "Malformed JSON" });
      return;
    }
    next(err);
  },
);

// Content type validation
app.use(validateContentType);

// Input sanitization middleware (must be after body parsing)
app.use(sanitizeInputs);

// SQL Injection prevention middleware
app.use(preventSQLInjection);

// Webhook routes are registered above (before body parsing/sanitization)

// Health check endpoints (Phase 3.2.1)
app.use("/health", healthRoutes);
app.use("/api/v1/health", healthRoutes);

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/academic-years", academicYearRoutes);
app.use("/api/v1/semesters", semesterRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/parents", parentRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/attendance-reports", attendanceReportRoutes);
app.use("/api/v1/fees", feeRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/fee-reports", feeReportRoutes);
app.use("/api/v1/grades", gradeRoutes);
app.use("/api/v1/assessment-types", assessmentTypeRoutes);
app.use("/api/v1/report-cards", reportCardRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/reports", reportExportRoutes);
app.use("/api/v1/cache", cacheRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/monitoring", monitoringRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/timetable", timetableRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/audit", auditRoutes);

// Multi-tenant & SaaS routes
app.use("/api/v1/schools", schoolRoutes);
app.use("/api/v1/ai", aiInsightsRoutes);
app.use("/api/v1/superadmin", superadminRoutes);

// Serve static files (uploaded files) with proper download headers
app.use(
  "/uploads",
  (req, res, next) => {
    // Check if it's an export file (JSON or PDF)
    if (
      req.path.includes("/exports/") &&
      (req.path.endsWith(".json") || req.path.endsWith(".pdf"))
    ) {
      const filename = req.path.split("/").pop();
      const contentType = req.path.endsWith(".json")
        ? "application/json"
        : "application/pdf";

      // Set headers to force download
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
    }
    next();
  },
  express.static("uploads"),
);

// API documentation endpoint
app.get("/api/v1", cacheResponse(300), (_req, res) => {
  res.json({
    success: true,
    message: "School Management API v1",
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      schools: "/api/v1/schools",
      superadmin: "/api/v1/superadmin",
      academicYears: "/api/v1/academic-years",
      semesters: "/api/v1/semesters",
      subjects: "/api/v1/subjects",
      classes: "/api/v1/classes",
      students: "/api/v1/students",
      parents: "/api/v1/parents",
      teachers: "/api/v1/teachers",
      staff: "/api/v1/staff",
      attendance: "/api/v1/attendance",
      attendanceReports: "/api/v1/attendance-reports",
      fees: "/api/v1/fees",
      payments: "/api/v1/payments",
      feeReports: "/api/v1/fee-reports",
      grades: "/api/v1/grades",
      assessmentTypes: "/api/v1/assessment-types",
      reportCards: "/api/v1/report-cards",
      timetable: "/api/v1/timetable",
      reports: "/api/v1/reports",
      dashboard: "/api/v1/dashboard",
      notifications: "/api/v1/notifications",
      settings: "/api/v1/settings",
      files: "/api/v1/files",
      ai: "/api/v1/ai",
      audit: "/api/v1/audit",
      health: "/api/v1/health",
      cache: "/api/v1/cache",
      monitoring: "/api/v1/monitoring",
    },
  });
});

// Test endpoint (used by integration tests)
app.post("/test", (req, res) => {
  res.json({
    success: true,
    message: "Test endpoint working",
    receivedBody: req.body,
  });
});

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before other error handlers)
app.use(monitoringService.getErrorHandler());

// Error handling middleware (must be last)
app.use(errorHandler);

// Start background cron jobs (skip in test to avoid timer leaks)
if (process.env.NODE_ENV !== "test") {
  startScheduledTasks();
}

export default app;
export { app };
