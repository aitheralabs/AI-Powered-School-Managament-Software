"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subjectController_1 = require("../controllers/subjectController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const caching_1 = require("../middleware/caching");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.get('/', (0, caching_1.cacheResponse)(3600), subjectController_1.getSubjects);
router.get('/:id', (0, caching_1.cacheResponse)(3600), subjectController_1.getSubjectById);
router.get('/:id/statistics', (0, auth_1.authorize)('admin', 'teacher'), (0, caching_1.cacheResponse)(600), subjectController_1.getSubjectStatistics);
router.post('/', (0, auth_1.authorize)('admin'), (0, caching_1.invalidateCache)(['subject*']), subjectController_1.createSubject);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, caching_1.invalidateCache)(['subject*']), subjectController_1.updateSubject);
router.patch('/:id/status', (0, auth_1.authorize)('admin'), (0, caching_1.invalidateCache)(['subject*']), subjectController_1.toggleSubjectStatus);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, caching_1.invalidateCache)(['subject*']), subjectController_1.deleteSubject);
exports.default = router;
//# sourceMappingURL=subjects.js.map