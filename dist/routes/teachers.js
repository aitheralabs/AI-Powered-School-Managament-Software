"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacherController_1 = require("../controllers/teacherController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const caching_1 = require("../middleware/caching");
const sanitization_1 = require("../middleware/sanitization");
const teacher_1 = require("../types/teacher");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.post('/', (0, auth_1.authorize)('admin'), sanitization_1.sanitizeTeacher, (0, validation_1.validateBody)(teacher_1.CreateTeacherSchema), (0, caching_1.invalidateCache)(['teachers:*', 'teacher:*']), teacherController_1.createTeacher);
router.get('/', (0, validation_1.validateQuery)(common_1.PaginationSchema.extend({
    isActive: zod_1.z.string().optional().transform(val => val === 'true'),
    search: zod_1.z.string().optional(),
    specialization: zod_1.z.string().optional(),
})), (0, caching_1.cacheResponse)(300), teacherController_1.getTeachers);
router.get('/stats', (0, auth_1.authorize)('admin', 'staff'), teacherController_1.getTeacherStats);
router.get('/assignments', (0, auth_1.authorize)('admin'), (0, validation_1.validateQuery)(common_1.PaginationSchema.extend({
    academicYearId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    classId: common_1.IdSchema.optional(),
})), teacherController_1.getAllTeacherAssignments);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, caching_1.cacheResponse)(600), teacherController_1.getTeacherById);
router.get('/:id/classes', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), teacherController_1.getTeacherClasses);
router.get('/:id/subjects', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), teacherController_1.getTeacherSubjects);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), sanitization_1.sanitizeTeacher, (0, validation_1.validateBody)(teacher_1.UpdateTeacherSchema), (0, caching_1.invalidateCache)(['teachers:*', 'teacher:*']), teacherController_1.updateTeacher);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, caching_1.invalidateCache)(['teachers:*', 'teacher:*', 'classes:*']), teacherController_1.deleteTeacher);
router.get('/:id/workload', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, caching_1.cacheResponse)(600), teacherController_1.getTeacherWorkload);
router.post('/check-conflicts', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(zod_1.z.object({
    teacherId: common_1.IdSchema,
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
})), teacherController_1.checkAssignmentConflicts);
router.get('/suggestions/:classId/:subjectId', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
})), teacherController_1.getOptimalTeacherSuggestions);
router.post('/assign-subject', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(zod_1.z.object({
    teacherId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
})), (0, caching_1.invalidateCache)(['teacher:*', 'teachers:*']), teacherController_1.assignTeacherToSubject);
router.delete('/:teacherId/subjects/:subjectId', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({
    teacherId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
})), (0, caching_1.invalidateCache)(['teacher:*', 'teachers:*']), teacherController_1.removeTeacherFromSubject);
router.post('/assign-class', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(zod_1.z.object({
    teacherId: common_1.IdSchema,
    classId: common_1.IdSchema,
})), (0, caching_1.invalidateCache)(['teacher:*', 'teachers:*', 'classes:*']), teacherController_1.assignTeacherToClass);
router.delete('/classes/:classId/teacher', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ classId: common_1.IdSchema })), teacherController_1.removeTeacherFromClass);
router.post('/assign-class-subject', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(zod_1.z.object({
    teacherId: common_1.IdSchema,
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
})), teacherController_1.assignTeacherToClassSubject);
router.delete('/classes/:classId/subjects/:subjectId/teacher', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
})), teacherController_1.removeTeacherFromClassSubject);
exports.default = router;
//# sourceMappingURL=teachers.js.map