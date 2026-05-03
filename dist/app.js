"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = __importDefault(require("./config/env"));
const errorHandler_1 = require("./middleware/errorHandler");
const sanitization_1 = require("./middleware/sanitization");
const rateLimiting_1 = require("./middleware/rateLimiting");
const sqlInjectionPrevention_1 = require("./middleware/sqlInjectionPrevention");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const schools_1 = __importDefault(require("./routes/schools"));
const aiInsights_1 = __importDefault(require("./routes/aiInsights"));
const superadmin_1 = __importDefault(require("./routes/superadmin"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const academicYears_1 = __importDefault(require("./routes/academicYears"));
const semesters_1 = __importDefault(require("./routes/semesters"));
const subjects_1 = __importDefault(require("./routes/subjects"));
const classes_1 = __importDefault(require("./routes/classes"));
const students_1 = __importDefault(require("./routes/students"));
const parents_1 = __importDefault(require("./routes/parents"));
const teachers_1 = __importDefault(require("./routes/teachers"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const attendanceReports_1 = __importDefault(require("./routes/attendanceReports"));
const fees_1 = __importDefault(require("./routes/fees"));
const payments_1 = __importDefault(require("./routes/payments"));
const feeReports_1 = __importDefault(require("./routes/feeReports"));
const grades_1 = __importDefault(require("./routes/grades"));
const assessmentTypes_1 = __importDefault(require("./routes/assessmentTypes"));
const reportCards_1 = __importDefault(require("./routes/reportCards"));
const staff_1 = __importDefault(require("./routes/staff"));
const reportExports_1 = __importDefault(require("./routes/reportExports"));
const health_1 = __importDefault(require("./routes/health"));
const cache_1 = __importDefault(require("./routes/cache"));
const files_1 = __importDefault(require("./routes/files"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const settings_1 = __importDefault(require("./routes/settings"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const timetable_1 = __importDefault(require("./routes/timetable"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const audit_1 = __importDefault(require("./routes/audit"));
const monitoringService_1 = require("./services/monitoringService");
const requestTiming_1 = require("./middleware/requestTiming");
const express_status_monitor_1 = __importDefault(require("express-status-monitor"));
const caching_1 = require("./middleware/caching");
const app = (0, express_1.default)();
exports.app = app;
monitoringService_1.monitoringService.initializeSentry(app);
app.use(monitoringService_1.monitoringService.getRequestHandler());
app.use(monitoringService_1.monitoringService.getTracingHandler());
app.use((0, express_status_monitor_1.default)({
    title: 'School Management System - Status',
    path: '/status',
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
            protocol: 'http',
            host: 'localhost',
            path: '/health',
            port: parseInt(process.env.PORT || '3000'),
        },
    ],
}));
app.use(requestTiming_1.requestTimingMiddleware);
app.use((0, helmet_1.default)());
app.use(rateLimiting_1.rateLimitLogger);
app.use(rateLimiting_1.generalRateLimit);
app.use(rateLimiting_1.speedLimiter);
app.use(sanitization_1.addSecurityHeaders);
const allowedOrigins = env_1.default.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-School-ID', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
}));
app.use((0, morgan_1.default)(env_1.default.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((err, _req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ success: false, message: 'Malformed JSON' });
        return;
    }
    next(err);
});
app.use(sanitization_1.validateContentType);
app.use(sanitization_1.sanitizeInputs);
app.use(sqlInjectionPrevention_1.preventSQLInjection);
app.use('/api/v1/webhooks/stripe', express_1.default.raw({ type: 'application/json' }));
app.use('/api/v1/webhooks', webhooks_1.default);
app.use('/health', health_1.default);
app.use('/api/v1/health', health_1.default);
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/users', users_1.default);
app.use('/api/v1/academic-years', academicYears_1.default);
app.use('/api/v1/semesters', semesters_1.default);
app.use('/api/v1/subjects', subjects_1.default);
app.use('/api/v1/classes', classes_1.default);
app.use('/api/v1/students', students_1.default);
app.use('/api/v1/parents', parents_1.default);
app.use('/api/v1/teachers', teachers_1.default);
app.use('/api/v1/attendance', attendance_1.default);
app.use('/api/v1/attendance-reports', attendanceReports_1.default);
app.use('/api/v1/fees', fees_1.default);
app.use('/api/v1/payments', payments_1.default);
app.use('/api/v1/fee-reports', feeReports_1.default);
app.use('/api/v1/grades', grades_1.default);
app.use('/api/v1/assessment-types', assessmentTypes_1.default);
app.use('/api/v1/report-cards', reportCards_1.default);
app.use('/api/v1/staff', staff_1.default);
app.use('/api/v1/reports', reportExports_1.default);
app.use('/api/v1/cache', cache_1.default);
app.use('/api/v1/files', files_1.default);
app.use('/api/v1/monitoring', monitoring_1.default);
app.use('/api/v1/settings', settings_1.default);
app.use('/api/v1/dashboard', dashboard_1.default);
app.use('/api/v1/timetable', timetable_1.default);
app.use('/api/v1/notifications', notifications_1.default);
app.use('/api/v1/audit', audit_1.default);
app.use('/api/v1/schools', schools_1.default);
app.use('/api/v1/ai', aiInsights_1.default);
app.use('/api/v1/superadmin', superadmin_1.default);
app.use('/uploads', (req, res, next) => {
    if (req.path.includes('/exports/') && (req.path.endsWith('.json') || req.path.endsWith('.pdf'))) {
        const filename = req.path.split('/').pop();
        const contentType = req.path.endsWith('.json') ? 'application/json' : 'application/pdf';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    next();
}, express_1.default.static('uploads'));
app.get('/api/v1', (0, caching_1.cacheResponse)(300), (_req, res) => {
    res.json({
        success: true,
        message: 'School Management API v1',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            schools: '/api/v1/schools',
            superadmin: '/api/v1/superadmin',
            academicYears: '/api/v1/academic-years',
            semesters: '/api/v1/semesters',
            subjects: '/api/v1/subjects',
            classes: '/api/v1/classes',
            students: '/api/v1/students',
            parents: '/api/v1/parents',
            teachers: '/api/v1/teachers',
            staff: '/api/v1/staff',
            attendance: '/api/v1/attendance',
            attendanceReports: '/api/v1/attendance-reports',
            fees: '/api/v1/fees',
            payments: '/api/v1/payments',
            feeReports: '/api/v1/fee-reports',
            grades: '/api/v1/grades',
            assessmentTypes: '/api/v1/assessment-types',
            reportCards: '/api/v1/report-cards',
            timetable: '/api/v1/timetable',
            reports: '/api/v1/reports',
            dashboard: '/api/v1/dashboard',
            notifications: '/api/v1/notifications',
            settings: '/api/v1/settings',
            files: '/api/v1/files',
            ai: '/api/v1/ai',
            audit: '/api/v1/audit',
            health: '/api/v1/health',
            cache: '/api/v1/cache',
            monitoring: '/api/v1/monitoring',
        },
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use(monitoringService_1.monitoringService.getErrorHandler());
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map