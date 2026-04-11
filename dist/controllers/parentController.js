"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentDashboard = exports.removeParentStudentRelationship = exports.updateParentStudentRelationship = exports.linkParentToStudent = exports.getParentChildren = exports.unlinkStudentFromParent = exports.linkStudentToParent = exports.deleteParent = exports.updateParent = exports.getParentById = exports.getParents = exports.createParent = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const parentService_1 = require("../services/parentService");
const parentService = new parentService_1.ParentService();
exports.createParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const parent = await parentService.forSchool(req.schoolId).createParent(req.body);
    res.status(201).json({ success: true, message: 'Parent account created successfully', data: parent });
});
exports.getParents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await parentService.forSchool(req.schoolId).getParents(req);
    res.json({ success: true, data: result.parents, pagination: result.pagination });
});
exports.getParentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const parent = await parentService.forSchool(req.schoolId).getParentById(req.params.id);
    res.json({ success: true, data: parent });
});
exports.updateParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const parent = await parentService.forSchool(req.schoolId).updateParent(req.params.id, req.body);
    res.json({ success: true, message: 'Parent updated successfully', data: parent });
});
exports.deleteParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await parentService.forSchool(req.schoolId).deleteParent(req.params.id);
    res.json({ success: true, message: 'Parent deleted successfully' });
});
exports.linkStudentToParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const relationship = await parentService.forSchool(req.schoolId).linkStudentToParent(req.body);
    res.status(201).json({ success: true, message: 'Student linked to parent successfully', data: relationship });
});
exports.unlinkStudentFromParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentId, parentId } = req.params;
    await parentService.forSchool(req.schoolId).unlinkStudentFromParent(studentId, parentId);
    res.json({ success: true, message: 'Student unlinked from parent successfully' });
});
exports.getParentChildren = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await parentService.forSchool(req.schoolId).getParentChildren(req.params.parentId);
    res.json({ success: true, data: result });
});
exports.linkParentToStudent = exports.linkStudentToParent;
exports.updateParentStudentRelationship = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentId, parentId } = req.params;
    const { relationshipType, isPrimary } = req.body;
    const svc = parentService.forSchool(req.schoolId);
    const result = await svc.executeQuery(`UPDATE student_parents SET relationship_type = COALESCE($1, relationship_type), is_primary = COALESCE($2, is_primary)
     WHERE student_id = $3 AND parent_user_id = $4
     RETURNING *`, [relationshipType || null, isPrimary !== undefined ? isPrimary : null, studentId, parentId]);
    if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Relationship not found' });
        return;
    }
    res.json({ success: true, message: 'Relationship updated', data: result.rows[0] });
});
exports.removeParentStudentRelationship = exports.unlinkStudentFromParent;
exports.getParentDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const dashboard = await parentService.forSchool(req.schoolId).getParentDashboard(req.params.parentId);
    res.json({ success: true, data: dashboard });
});
//# sourceMappingURL=parentController.js.map