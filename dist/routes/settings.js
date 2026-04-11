"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.get('/', settingsController_1.settingsController.getSettings.bind(settingsController_1.settingsController));
router.put('/', settingsController_1.settingsController.updateSettings.bind(settingsController_1.settingsController));
router.post('/reset', settingsController_1.settingsController.resetSettings.bind(settingsController_1.settingsController));
router.post('/export-data', settingsController_1.settingsController.exportData.bind(settingsController_1.settingsController));
router.delete('/delete-account', settingsController_1.settingsController.deleteAccount.bind(settingsController_1.settingsController));
exports.default = router;
//# sourceMappingURL=settings.js.map