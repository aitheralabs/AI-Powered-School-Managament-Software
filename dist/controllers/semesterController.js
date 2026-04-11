"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSemester = exports.deleteSemester = exports.updateSemester = exports.getSemesterById = exports.getSemesters = exports.createSemester = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const semesterService_1 = require("../services/semesterService");
const semesterService = new semesterService_1.SemesterService();
exports.createSemester = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const semester = await semesterService.forSchool(req.schoolId).createSemester(req.body);
    res.status(201).json({ success: true, message: 'Semester created successfully', data: { semester } });
});
exports.getSemesters = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await semesterService.forSchool(req.schoolId).getSemesters(req);
    res.json({ success: true, data: result });
});
exports.getSemesterById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const semester = await semesterService.forSchool(req.schoolId).getSemesterById(req.params.id);
    res.json({ success: true, data: { semester } });
});
exports.updateSemester = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const semester = await semesterService.forSchool(req.schoolId).updateSemester(req.params.id, req.body);
    res.json({ success: true, message: 'Semester updated successfully', data: { semester } });
});
exports.deleteSemester = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await semesterService.forSchool(req.schoolId).deleteSemester(req.params.id);
    res.json({ success: true, message: 'Semester deleted successfully' });
});
exports.getCurrentSemester = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const semester = await semesterService.forSchool(req.schoolId).getActiveSemester();
    res.json({ success: true, data: { semester } });
});
//# sourceMappingURL=semesterController.js.map