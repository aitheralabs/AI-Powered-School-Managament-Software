"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjectStatistics = exports.toggleSubjectStatus = exports.deleteSubject = exports.updateSubject = exports.getSubjectById = exports.getSubjects = exports.createSubject = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const subjectService_1 = require("../services/subjectService");
const subjectService = new subjectService_1.SubjectService();
exports.createSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const subject = await subjectService.forSchool(req.schoolId).createSubject(req.body);
    res.status(201).json({ success: true, message: 'Subject created successfully', data: { subject } });
});
exports.getSubjects = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await subjectService.forSchool(req.schoolId).getSubjects(req);
    res.json({ success: true, data: result });
});
exports.getSubjectById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const subject = await subjectService.forSchool(req.schoolId).getSubjectById(req.params.id);
    res.json({ success: true, data: { subject } });
});
exports.updateSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const subject = await subjectService.forSchool(req.schoolId).updateSubject(req.params.id, req.body);
    res.json({ success: true, message: 'Subject updated successfully', data: { subject } });
});
exports.deleteSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await subjectService.forSchool(req.schoolId).deleteSubject(req.params.id);
    res.json({ success: true, message: 'Subject deleted successfully' });
});
exports.toggleSubjectStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { isActive } = req.body;
    const subject = await subjectService.forSchool(req.schoolId).toggleSubjectStatus(req.params.id, isActive);
    res.json({ success: true, message: `Subject ${isActive ? 'activated' : 'deactivated'} successfully`, data: { subject } });
});
exports.getSubjectStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await subjectService.forSchool(req.schoolId).getSubjectStatistics(req.params.id);
    res.json({ success: true, data: result });
});
//# sourceMappingURL=subjectController.js.map