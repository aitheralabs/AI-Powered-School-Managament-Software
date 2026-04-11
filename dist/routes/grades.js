"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gradeController_1 = require("../controllers/gradeController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const caching_1 = require("../middleware/caching");
const grade_1 = require("../types/grade");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.get('/stats', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateQuery)(zod_1.z.object({
    classId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    semesterId: common_1.IdSchema.optional(),
})), gradeController_1.getGradeStats);
router.get('/student/:studentId', (0, validation_1.validateParams)(zod_1.z.object({ studentId: common_1.IdSchema })), (0, validation_1.validateQuery)(zod_1.z.object({
    semesterId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
})), gradeController_1.getStudentGrades);
router.get('/class/:classId', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ classId: common_1.IdSchema })), (0, validation_1.validateQuery)(zod_1.z.object({
    semesterId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    assessmentTypeId: common_1.IdSchema.optional(),
})), gradeController_1.getClassGrades);
router.post('/bulk', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(zod_1.z.object({
    grades: zod_1.z.array(zod_1.z.object({
        studentId: common_1.IdSchema,
        subjectId: common_1.IdSchema,
        assessmentTypeId: common_1.IdSchema,
        marksObtained: zod_1.z.number().min(0),
        totalMarks: zod_1.z.number().min(1),
        semesterId: common_1.IdSchema,
        remarks: zod_1.z.string().optional(),
    })).min(1),
})), (0, caching_1.invalidateCache)(['report:grades*', 'stats:*']), gradeController_1.bulkCreateGrades);
router.post('/', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(grade_1.CreateGradeSchema), (0, caching_1.invalidateCache)(['report:grades*', 'stats:*']), gradeController_1.createGrade);
router.get('/', (0, validation_1.validateQuery)(grade_1.GradeQuerySchema), (0, caching_1.cacheResponse)(300), gradeController_1.getGrades);
router.get('/:id', gradeController_1.getGradeById);
router.put('/:id', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(grade_1.UpdateGradeSchema), gradeController_1.updateGrade);
router.delete('/:id', (0, auth_1.authorize)('admin', 'teacher'), gradeController_1.deleteGrade);
exports.default = router;
//# sourceMappingURL=grades.js.map