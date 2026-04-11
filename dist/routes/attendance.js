"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController_1 = require("../controllers/attendanceController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const caching_1 = require("../middleware/caching");
const attendance_1 = require("../types/attendance");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, tenant_1.requireActiveSubscription);
router.get('/stats', (0, auth_1.authorize)('admin', 'staff', 'teacher'), attendanceController_1.getAttendanceStats);
router.post('/', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(attendance_1.CreateAttendanceSchema), (0, caching_1.invalidateCache)(['report:attendance*', 'stats:attendance*']), attendanceController_1.markAttendance);
router.post('/bulk', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(attendance_1.CreateBulkAttendanceSchema), (0, caching_1.invalidateCache)(['report:attendance*', 'stats:attendance*']), attendanceController_1.markBulkAttendance);
router.get('/', (0, validation_1.validateQuery)(attendance_1.AttendanceQuerySchema), (0, caching_1.cacheResponse)(300), attendanceController_1.getAttendanceRecords);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), attendanceController_1.getAttendanceById);
router.put('/:id', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(attendance_1.UpdateAttendanceSchema), attendanceController_1.updateAttendance);
router.delete('/:id', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), attendanceController_1.deleteAttendance);
router.get('/class/:classId', (0, validation_1.validateParams)(zod_1.z.object({ classId: common_1.IdSchema })), (0, validation_1.validateQuery)(zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    subjectId: common_1.IdSchema.optional(),
})), attendanceController_1.getClassAttendance);
router.get('/student/:studentId', (0, validation_1.validateParams)(zod_1.z.object({ studentId: common_1.IdSchema })), (0, validation_1.validateQuery)(zod_1.z.object({
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})), attendanceController_1.getStudentAttendanceList);
router.get('/student/:studentId/summary', (0, validation_1.validateParams)(zod_1.z.object({ studentId: common_1.IdSchema })), (0, validation_1.validateQuery)(zod_1.z.object({
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
})), attendanceController_1.getStudentAttendanceSummary);
exports.default = router;
//# sourceMappingURL=attendance.js.map