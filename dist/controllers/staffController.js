"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffSummary = exports.reactivateStaff = exports.deactivateStaff = exports.updateStaff = exports.getStaffById = exports.getStaff = exports.createStaff = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const staff_1 = require("../types/staff");
const staffService_1 = require("../services/staffService");
const staffService = new staffService_1.StaffService();
exports.createStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== 'admin')
        throw new errorHandler_1.AppError('Only administrators can create staff members', 403);
    const staffData = staff_1.CreateStaffSchema.parse(req.body);
    const staff = await staffService.forSchool(req.schoolId).createStaff(staffData, req.user.id);
    res.status(201).json({ success: true, data: staff, message: 'Staff member created successfully' });
});
exports.getStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = staff_1.StaffQuerySchema.parse(req.query);
    const { staff, total } = await staffService.forSchool(req.schoolId).getStaff(queryParams, req.user.role, req.user.id);
    res.json({
        success: true, data: staff,
        pagination: { page: queryParams.page, limit: queryParams.limit, total, pages: Math.ceil(total / queryParams.limit) }
    });
});
exports.getStaffById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const staff = await staffService.forSchool(req.schoolId).getStaffById(req.params.id, req.user.role, req.user.id);
    res.json({ success: true, data: staff });
});
exports.updateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const updateData = staff_1.UpdateStaffSchema.parse(req.body);
    const updatedStaff = await staffService.forSchool(req.schoolId).updateStaff(req.params.id, updateData, req.user.role, req.user.id);
    res.json({ success: true, data: updatedStaff, message: 'Staff member updated successfully' });
});
exports.deactivateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== 'admin')
        throw new errorHandler_1.AppError('Only administrators can deactivate staff members', 403);
    await staffService.forSchool(req.schoolId).deactivateStaff(req.params.id);
    res.json({ success: true, message: 'Staff member deactivated successfully' });
});
exports.reactivateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== 'admin')
        throw new errorHandler_1.AppError('Only administrators can reactivate staff members', 403);
    const updatedStaff = await staffService.forSchool(req.schoolId).reactivateStaff(req.params.id);
    res.json({ success: true, data: updatedStaff, message: 'Staff member reactivated successfully' });
});
exports.getStaffSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== 'admin')
        throw new errorHandler_1.AppError('Only administrators can view staff summary', 403);
    const summary = await staffService.forSchool(req.schoolId).getStaffSummary();
    res.json({ success: true, data: summary });
});
//# sourceMappingURL=staffController.js.map