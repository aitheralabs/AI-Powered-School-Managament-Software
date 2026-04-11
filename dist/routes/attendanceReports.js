"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceReportController_1 = require("../controllers/attendanceReportController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const report_1 = require("../types/report");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.get('/report', (0, validation_1.validateQuery)(report_1.AttendanceReportQuerySchema), attendanceReportController_1.generateAttendanceReport);
router.get('/trends', (0, validation_1.validateQuery)(zod_1.z.object({
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
    classId: zod_1.z.string().optional(),
    studentId: zod_1.z.string().optional(),
    period: zod_1.z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
})), attendanceReportController_1.getAttendanceTrends);
router.get('/statistics', (0, validation_1.validateQuery)(zod_1.z.object({
    period: zod_1.z.enum(['today', 'week', 'month', 'semester']).optional().default('today'),
})), attendanceReportController_1.getAttendanceStatistics);
router.get('/export', (0, validation_1.validateQuery)(zod_1.z.object({
    format: zod_1.z.enum(['csv', 'json', 'excel']).optional().default('csv'),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
    classId: zod_1.z.string().optional(),
    studentId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['present', 'absent', 'late', 'excused']).optional(),
})), attendanceReportController_1.exportAttendanceData);
exports.default = router;
//# sourceMappingURL=attendanceReports.js.map