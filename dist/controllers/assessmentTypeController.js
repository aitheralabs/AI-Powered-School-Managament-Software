"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactivateAssessmentType = exports.deleteAssessmentType = exports.updateAssessmentType = exports.getAssessmentTypeById = exports.getAssessmentTypes = exports.createAssessmentType = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const grade_1 = require("../types/grade");
const pagination_1 = require("../utils/pagination");
exports.createAssessmentType = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const assessmentData = grade_1.CreateAssessmentTypeSchema.parse(req.body);
    const schoolId = req.schoolId;
    if (req.user.role !== 'admin')
        throw new errorHandler_1.AppError('Only administrators can create assessment types', 403);
    const existingCheck = await (0, connection_1.query)('SELECT id FROM assessment_types WHERE LOWER(name) = LOWER($1) AND school_id = $2 AND is_active = true', [assessmentData.name, schoolId]);
    if (existingCheck.rows.length > 0)
        throw new errorHandler_1.AppError('Assessment type with this name already exists', 409);
    const result = await (0, connection_1.query)(`INSERT INTO assessment_types (name, description, weightage, is_active, school_id)
     VALUES ($1, $2, $3, true, $4)
     RETURNING *`, [assessmentData.name, assessmentData.description || null, assessmentData.weightage, schoolId]);
    res.status(201).json({ success: true, data: formatAssessmentTypeResponse(result.rows[0]), message: 'Assessment type created successfully' });
});
exports.getAssessmentTypes = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const { page = '1', limit = '10', active = 'true' } = req.query;
    const { offset, limit: queryLimit } = (0, pagination_1.getPaginationParams)(req);
    let whereClause = 'WHERE school_id = $1';
    const queryParams = [schoolId];
    if (active === 'true')
        whereClause += ' AND is_active = true';
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) as total FROM assessment_types ${whereClause}`, queryParams);
    const total = parseInt(countResult.rows[0].total);
    const result = await (0, connection_1.query)(`SELECT * FROM assessment_types ${whereClause} ORDER BY name ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, queryLimit, offset]);
    res.json({
        success: true,
        data: result.rows.map(formatAssessmentTypeResponse),
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
});
exports.getAssessmentTypeById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, connection_1.query)('SELECT * FROM assessment_types WHERE id = $1 AND school_id = $2', [req.params.id, req.schoolId]);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Assessment type not found', 404);
    res.json({ success: true, data: formatAssessmentTypeResponse(result.rows[0]) });
});
exports.updateAssessmentType = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = grade_1.UpdateAssessmentTypeSchema.parse(req.body);
    const schoolId = req.schoolId;
    if (req.user.role !== 'admin')
        throw new errorHandler_1.AppError('Only administrators can update assessment types', 403);
    const existingResult = await (0, connection_1.query)('SELECT * FROM assessment_types WHERE id = $1 AND school_id = $2', [id, schoolId]);
    if (existingResult.rows.length === 0)
        throw new errorHandler_1.AppError('Assessment type not found', 404);
    if (updateData.name) {
        const nameCheck = await (0, connection_1.query)('SELECT id FROM assessment_types WHERE LOWER(name) = LOWER($1) AND id != $2 AND school_id = $3 AND is_active = true', [updateData.name, id, schoolId]);
        if (nameCheck.rows.length > 0)
            throw new errorHandler_1.AppError('Assessment type with this name already exists', 409);
    }
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(updateData.name);
    }
    if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(updateData.description);
    }
    if (updateData.weightage !== undefined) {
        updateFields.push(`weightage = $${paramIndex++}`);
        updateValues.push(updateData.weightage);
    }
    if (updateFields.length === 0)
        throw new errorHandler_1.AppError('No valid fields to update', 400);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);
    const result = await (0, connection_1.query)(`UPDATE assessment_types SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND school_id = '${schoolId}' RETURNING *`, updateValues);
    res.json({ success: true, data: formatAssessmentTypeResponse(result.rows[0]), message: 'Assessment type updated successfully' });
});
exports.deleteAssessmentType = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const schoolId = req.schoolId;
    if (req.user.role !== 'admin')
        throw new errorHandler_1.AppError('Only administrators can delete assessment types', 403);
    const existingResult = await (0, connection_1.query)('SELECT * FROM assessment_types WHERE id = $1 AND school_id = $2', [id, schoolId]);
    if (existingResult.rows.length === 0)
        throw new errorHandler_1.AppError('Assessment type not found', 404);
    const usageCheck = await (0, connection_1.query)('SELECT COUNT(*) as count FROM grades WHERE assessment_type_id = $1 AND school_id = $2', [id, schoolId]);
    const usageCount = parseInt(usageCheck.rows[0].count);
    if (usageCount > 0) {
        await (0, connection_1.query)('UPDATE assessment_types SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        res.json({ success: true, message: `Assessment type deactivated successfully. It was used in ${usageCount} grade(s).` });
    }
    else {
        await (0, connection_1.query)('DELETE FROM assessment_types WHERE id = $1', [id]);
        res.json({ success: true, message: 'Assessment type deleted successfully' });
    }
});
exports.reactivateAssessmentType = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const schoolId = req.schoolId;
    if (req.user.role !== 'admin')
        throw new errorHandler_1.AppError('Only administrators can reactivate assessment types', 403);
    const existingResult = await (0, connection_1.query)('SELECT * FROM assessment_types WHERE id = $1 AND school_id = $2 AND is_active = false', [id, schoolId]);
    if (existingResult.rows.length === 0)
        throw new errorHandler_1.AppError('Assessment type not found or already active', 404);
    const result = await (0, connection_1.query)('UPDATE assessment_types SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [id]);
    res.json({ success: true, data: formatAssessmentTypeResponse(result.rows[0]), message: 'Assessment type reactivated successfully' });
});
function formatAssessmentTypeResponse(row) {
    return {
        id: row.id.toString(), altId: null, name: row.name, description: row.description,
        weightage: parseFloat(row.weightage), isActive: row.is_active,
        createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    };
}
//# sourceMappingURL=assessmentTypeController.js.map