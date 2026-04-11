"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staffController_1 = require("../controllers/staffController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const staff_1 = require("../types/staff");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.post('/', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(staff_1.CreateStaffSchema), staffController_1.createStaff);
router.get('/', (0, validation_1.validateQuery)(staff_1.StaffQuerySchema), staffController_1.getStaff);
router.get('/summary', (0, auth_1.authorize)('admin'), staffController_1.getStaffSummary);
router.get('/:id', staffController_1.getStaffById);
router.put('/:id', (0, validation_1.validateBody)(staff_1.UpdateStaffSchema), staffController_1.updateStaff);
router.delete('/:id', (0, auth_1.authorize)('admin'), staffController_1.deactivateStaff);
router.patch('/:id/reactivate', (0, auth_1.authorize)('admin'), staffController_1.reactivateStaff);
exports.default = router;
//# sourceMappingURL=staff.js.map