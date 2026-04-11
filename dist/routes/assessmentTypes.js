"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assessmentTypeController_1 = require("../controllers/assessmentTypeController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const grade_1 = require("../types/grade");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.post('/', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(grade_1.CreateAssessmentTypeSchema), assessmentTypeController_1.createAssessmentType);
router.get('/', (0, validation_1.validateQuery)(zod_1.z.object({
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
    active: zod_1.z.string().optional().default('true'),
})), assessmentTypeController_1.getAssessmentTypes);
router.get('/:id', assessmentTypeController_1.getAssessmentTypeById);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(grade_1.UpdateAssessmentTypeSchema), assessmentTypeController_1.updateAssessmentType);
router.delete('/:id', (0, auth_1.authorize)('admin'), assessmentTypeController_1.deleteAssessmentType);
router.patch('/:id/reactivate', (0, auth_1.authorize)('admin'), assessmentTypeController_1.reactivateAssessmentType);
exports.default = router;
//# sourceMappingURL=assessmentTypes.js.map