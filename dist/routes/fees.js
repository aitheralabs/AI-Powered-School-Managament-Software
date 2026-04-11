"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feeController_1 = require("../controllers/feeController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const caching_1 = require("../middleware/caching");
const fee_1 = require("../types/fee");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.get('/stats', (0, auth_1.authorize)('admin', 'staff'), feeController_1.getFeeStats);
router.get('/student/:studentId', (0, validation_1.validateParams)(zod_1.z.object({ studentId: common_1.IdSchema })), feeController_1.getStudentFeesByStudentId);
router.post('/categories', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(fee_1.CreateFeeCategorySchema), (0, caching_1.invalidateCache)(['fees:*', 'stats:fees:*']), feeController_1.createFeeCategory);
router.get('/categories', (0, validation_1.validateQuery)(common_1.PaginationSchema.extend({
    academicYearId: common_1.IdSchema.optional(),
    frequency: zod_1.z.enum(['monthly', 'quarterly', 'semester', 'annual', 'one-time']).optional(),
    isActive: zod_1.z.string().optional().transform(val => val === 'true'),
    isMandatory: zod_1.z.string().optional().transform(val => val === 'true'),
})), (0, caching_1.cacheResponse)(600), feeController_1.getFeeCategories);
router.get('/categories/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, caching_1.cacheResponse)(600), feeController_1.getFeeCategoryById);
router.put('/categories/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(fee_1.UpdateFeeCategorySchema), feeController_1.updateFeeCategory);
router.delete('/categories/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), feeController_1.deleteFeeCategory);
router.post('/assign-students', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(fee_1.AssignFeesToStudentsSchema), feeController_1.assignFeesToStudents);
router.post('/assign-class', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(fee_1.AssignFeesToClassSchema), feeController_1.assignFeesToClass);
router.get('/student-fees', (0, validation_1.validateQuery)(fee_1.FeeQuerySchema), feeController_1.getStudentFees);
router.get('/student-fees/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), feeController_1.getStudentFeeById);
router.put('/student-fees/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(fee_1.UpdateStudentFeeSchema), feeController_1.updateStudentFee);
router.delete('/student-fees/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), feeController_1.deleteStudentFee);
exports.default = router;
//# sourceMappingURL=fees.js.map