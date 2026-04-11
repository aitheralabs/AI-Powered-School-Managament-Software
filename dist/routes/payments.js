"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const caching_1 = require("../middleware/caching");
const fee_1 = require("../types/fee");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.post('/', (0, auth_1.authorize)('admin', 'staff'), (0, validation_1.validateBody)(fee_1.CreatePaymentSchema), (0, caching_1.invalidateCache)(['payments:*', 'fees:*', 'stats:fees:*']), paymentController_1.recordPayment);
router.get('/', (0, validation_1.validateQuery)(fee_1.FeeQuerySchema), (0, caching_1.cacheResponse)(300), paymentController_1.getPayments);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, caching_1.cacheResponse)(600), paymentController_1.getPaymentById);
router.get('/:id/receipt', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), paymentController_1.getPaymentReceipt);
router.get('/student/:studentId/history', (0, validation_1.validateParams)(zod_1.z.object({ studentId: common_1.IdSchema })), paymentController_1.getPaymentHistory);
router.get('/statistics/overview', (0, validation_1.validateQuery)(zod_1.z.object({
    period: zod_1.z.enum(['today', 'week', 'month', 'year']).optional().default('month'),
    classId: common_1.IdSchema.optional(),
    feeCategoryId: common_1.IdSchema.optional(),
})), paymentController_1.getPaymentStatistics);
router.delete('/:id/reverse', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(zod_1.z.object({
    reason: zod_1.z.string().min(10, 'Reason must be at least 10 characters'),
})), paymentController_1.reversePayment);
exports.default = router;
//# sourceMappingURL=payments.js.map