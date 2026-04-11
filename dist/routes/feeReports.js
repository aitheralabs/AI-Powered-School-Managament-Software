"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feeReportController_1 = require("../controllers/feeReportController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const fee_1 = require("../types/fee");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.get('/collection', (0, validation_1.validateQuery)(fee_1.FeeReportQuerySchema), feeReportController_1.generateFeeCollectionReport);
router.get('/outstanding', (0, validation_1.validateQuery)(zod_1.z.object({
    classId: common_1.IdSchema.optional(),
    feeCategoryId: common_1.IdSchema.optional(),
    daysOverdue: zod_1.z.string().optional().default('0').transform(Number),
})), feeReportController_1.getOutstandingDuesReport);
router.get('/defaulters', (0, auth_1.authorize)('admin', 'staff'), (0, validation_1.validateQuery)(zod_1.z.object({
    minOutstandingAmount: zod_1.z.string().optional().default('0').transform(Number),
    minDaysOverdue: zod_1.z.string().optional().default('30').transform(Number),
})), feeReportController_1.getFeeDefaultersReport);
router.get('/payment-analysis', (0, validation_1.validateQuery)(zod_1.z.object({
    period: zod_1.z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
    classId: common_1.IdSchema.optional(),
    feeCategoryId: common_1.IdSchema.optional(),
})), feeReportController_1.getPaymentAnalysisReport);
router.get('/export', (0, validation_1.validateQuery)(zod_1.z.object({
    format: zod_1.z.enum(['csv', 'json', 'excel']).optional().default('csv'),
    reportType: zod_1.z.enum(['collection', 'outstanding', 'defaulters']).optional().default('collection'),
    classId: common_1.IdSchema.optional(),
    feeCategoryId: common_1.IdSchema.optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
})), feeReportController_1.exportFeeReportData);
exports.default = router;
//# sourceMappingURL=feeReports.js.map