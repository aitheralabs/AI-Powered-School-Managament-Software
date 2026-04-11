"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportCardController_1 = require("../controllers/reportCardController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const grade_1 = require("../types/grade");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.post('/', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(grade_1.CreateReportCardSchema), reportCardController_1.generateReportCard);
router.get('/', (0, validation_1.validateQuery)(zod_1.z.object({
    studentId: common_1.IdSchema.optional(),
    semesterId: common_1.IdSchema.optional(),
    classId: common_1.IdSchema.optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
})), reportCardController_1.getReportCards);
router.get('/:id', reportCardController_1.getReportCardById);
router.put('/:id', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(grade_1.UpdateReportCardSchema), reportCardController_1.updateReportCard);
router.delete('/:id', (0, auth_1.authorize)('admin'), reportCardController_1.deleteReportCard);
router.patch('/:id/regenerate', (0, auth_1.authorize)('admin', 'teacher'), reportCardController_1.regenerateReportCard);
exports.default = router;
//# sourceMappingURL=reportCards.js.map