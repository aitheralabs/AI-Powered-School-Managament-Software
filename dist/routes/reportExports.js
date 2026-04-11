"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportExportController_1 = require("../controllers/reportExportController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const report_1 = require("../types/report");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.post('/export/:reportId', (0, validation_1.validateQuery)(zod_1.z.object({
    format: report_1.ReportFormatSchema.optional().default('pdf'),
})), reportExportController_1.exportReport);
router.get('/download/:fileName', reportExportController_1.downloadReport);
router.post('/email/:reportId', (0, validation_1.validateBody)(zod_1.z.object({
    recipients: zod_1.z.array(zod_1.z.string().email()).min(1, 'At least one recipient is required'),
    format: report_1.ReportFormatSchema.optional().default('pdf'),
    message: zod_1.z.string().optional(),
})), reportExportController_1.emailReport);
router.post('/scheduled', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(report_1.CreateScheduledReportSchema), reportExportController_1.createScheduledReport);
router.get('/scheduled', (0, validation_1.validateQuery)(report_1.ReportQuerySchema), reportExportController_1.getScheduledReports);
router.get('/scheduled/:id', reportExportController_1.getScheduledReportById);
router.put('/scheduled/:id', (0, validation_1.validateBody)(report_1.UpdateScheduledReportSchema), reportExportController_1.updateScheduledReport);
router.delete('/scheduled/:id', reportExportController_1.deleteScheduledReport);
router.post('/scheduled/:id/execute', reportExportController_1.executeScheduledReport);
router.get('/history', (0, validation_1.validateQuery)(report_1.ReportQuerySchema), reportExportController_1.getReportHistory);
router.get('/statistics', (0, auth_1.authorize)('admin'), reportExportController_1.getExportStatistics);
exports.default = router;
//# sourceMappingURL=reportExports.js.map