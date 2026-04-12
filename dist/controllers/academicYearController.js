"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateAcademicYear = exports.getActiveAcademicYear = exports.deleteAcademicYear = exports.updateAcademicYear = exports.getAcademicYearById = exports.getAcademicYears = exports.createAcademicYear = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const academicYearService_1 = require("../services/academicYearService");
const academicYearService = new academicYearService_1.AcademicYearService();
exports.createAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const academicYear = await academicYearService.forSchool(req.schoolId).createAcademicYear(req.body);
    res.status(201).json({ success: true, message: 'Academic year created successfully', data: { academicYear } });
});
exports.getAcademicYears = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await academicYearService.forSchool(req.schoolId).getAcademicYears(req);
    res.json({ success: true, data: { academicYears: result.academicYears, pagination: result.pagination } });
});
exports.getAcademicYearById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const academicYear = await academicYearService.forSchool(req.schoolId).getAcademicYearById(req.params.id);
    res.json({ success: true, data: { academicYear } });
});
exports.updateAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const academicYear = await academicYearService.forSchool(req.schoolId).updateAcademicYear(req.params.id, req.body);
    res.json({ success: true, message: 'Academic year updated successfully', data: { academicYear } });
});
exports.deleteAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await academicYearService.forSchool(req.schoolId).deleteAcademicYear(req.params.id);
    res.json({ success: true, message: 'Academic year deleted successfully' });
});
exports.getActiveAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const academicYear = await academicYearService.forSchool(req.schoolId).getActiveAcademicYear();
    res.json({ success: true, data: { academicYear } });
});
exports.activateAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const academicYear = await academicYearService.forSchool(req.schoolId).updateAcademicYear(req.params.id, { isActive: true });
    res.json({ success: true, message: 'Academic year activated successfully', data: { academicYear } });
});
//# sourceMappingURL=academicYearController.js.map