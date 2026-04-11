"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicYearController_1 = require("../controllers/academicYearController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const sanitization_1 = require("../middleware/sanitization");
const rateLimiting_1 = require("../middleware/rateLimiting");
const caching_1 = require("../middleware/caching");
const academic_1 = require("../types/academic");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.post('/', (0, auth_1.authorize)('admin'), rateLimiting_1.adminRateLimit, sanitization_1.sanitizeAcademicYear, (0, validation_1.validateBody)(academic_1.CreateAcademicYearSchema), (0, caching_1.invalidateCache)(['academic_year*']), academicYearController_1.createAcademicYear);
router.get('/', (0, validation_1.validateQuery)(common_1.PaginationSchema.extend({
    isActive: zod_1.z.string().optional().transform(val => val === 'true'),
})), (0, caching_1.cacheResponse)(3600), academicYearController_1.getAcademicYears);
router.get('/active', (0, caching_1.cacheResponse)(3600), academicYearController_1.getActiveAcademicYear);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, caching_1.cacheResponse)(3600), academicYearController_1.getAcademicYearById);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), sanitization_1.sanitizeAcademicYear, (0, validation_1.validateBody)(academic_1.UpdateAcademicYearSchema), (0, caching_1.invalidateCache)(['academic_year*']), academicYearController_1.updateAcademicYear);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, caching_1.invalidateCache)(['academic_year*']), academicYearController_1.deleteAcademicYear);
exports.default = router;
//# sourceMappingURL=academicYears.js.map