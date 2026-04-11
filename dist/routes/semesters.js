"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const semesterController_1 = require("../controllers/semesterController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const caching_1 = require("../middleware/caching");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.get('/current', (0, caching_1.cacheResponse)(3600), semesterController_1.getCurrentSemester);
router.get('/', (0, caching_1.cacheResponse)(3600), semesterController_1.getSemesters);
router.get('/:id', (0, caching_1.cacheResponse)(3600), semesterController_1.getSemesterById);
router.post('/', (0, auth_1.authorize)('admin'), (0, caching_1.invalidateCache)(['semesters:*']), semesterController_1.createSemester);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, caching_1.invalidateCache)(['semesters:*']), semesterController_1.updateSemester);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, caching_1.invalidateCache)(['semesters:*']), semesterController_1.deleteSemester);
exports.default = router;
//# sourceMappingURL=semesters.js.map