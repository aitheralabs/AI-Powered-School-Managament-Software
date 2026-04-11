import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { CreateAssessmentTypeSchema, UpdateAssessmentTypeSchema, AssessmentTypeResponse } from '../types/grade';
import { getPaginationParams } from '../utils/pagination';

export const createAssessmentType = asyncHandler(async (req: Request, res: Response) => {
  const assessmentData = CreateAssessmentTypeSchema.parse(req.body);
  const schoolId = req.schoolId!;

  if (req.user!.role !== 'admin') throw new AppError('Only administrators can create assessment types', 403);

  const existingCheck = await query(
    'SELECT id FROM assessment_types WHERE LOWER(name) = LOWER($1) AND school_id = $2 AND is_active = true',
    [assessmentData.name, schoolId]
  );
  if (existingCheck.rows.length > 0) throw new AppError('Assessment type with this name already exists', 409);

  const result = await query(
    `INSERT INTO assessment_types (name, description, weightage, is_active, school_id)
     VALUES ($1, $2, $3, true, $4)
     RETURNING *`,
    [assessmentData.name, assessmentData.description || null, assessmentData.weightage, schoolId]
  );

  res.status(201).json({ success: true, data: formatAssessmentTypeResponse(result.rows[0]), message: 'Assessment type created successfully' });
});

export const getAssessmentTypes = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const { page = '1', limit = '10', active = 'true' } = req.query;
  const { offset, limit: queryLimit } = getPaginationParams(req);

  let whereClause = 'WHERE school_id = $1';
  const queryParams: any[] = [schoolId];

  if (active === 'true') whereClause += ' AND is_active = true';

  const countResult = await query(`SELECT COUNT(*) as total FROM assessment_types ${whereClause}`, queryParams);
  const total = parseInt(countResult.rows[0].total);

  const result = await query(
    `SELECT * FROM assessment_types ${whereClause} ORDER BY name ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, queryLimit, offset]
  );

  res.json({
    success: true,
    data: result.rows.map(formatAssessmentTypeResponse),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  });
});

export const getAssessmentTypeById = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    'SELECT * FROM assessment_types WHERE id = $1 AND school_id = $2',
    [req.params.id, req.schoolId!]
  );
  if (result.rows.length === 0) throw new AppError('Assessment type not found', 404);
  res.json({ success: true, data: formatAssessmentTypeResponse(result.rows[0]) });
});

export const updateAssessmentType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = UpdateAssessmentTypeSchema.parse(req.body);
  const schoolId = req.schoolId!;

  if (req.user!.role !== 'admin') throw new AppError('Only administrators can update assessment types', 403);

  const existingResult = await query('SELECT * FROM assessment_types WHERE id = $1 AND school_id = $2', [id, schoolId]);
  if (existingResult.rows.length === 0) throw new AppError('Assessment type not found', 404);

  if (updateData.name) {
    const nameCheck = await query(
      'SELECT id FROM assessment_types WHERE LOWER(name) = LOWER($1) AND id != $2 AND school_id = $3 AND is_active = true',
      [updateData.name, id, schoolId]
    );
    if (nameCheck.rows.length > 0) throw new AppError('Assessment type with this name already exists', 409);
  }

  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramIndex = 1;

  if (updateData.name !== undefined) { updateFields.push(`name = $${paramIndex++}`); updateValues.push(updateData.name); }
  if (updateData.description !== undefined) { updateFields.push(`description = $${paramIndex++}`); updateValues.push(updateData.description); }
  if (updateData.weightage !== undefined) { updateFields.push(`weightage = $${paramIndex++}`); updateValues.push(updateData.weightage); }

  if (updateFields.length === 0) throw new AppError('No valid fields to update', 400);

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  updateValues.push(id);

  const result = await query(
    `UPDATE assessment_types SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND school_id = '${schoolId}' RETURNING *`,
    updateValues
  );

  res.json({ success: true, data: formatAssessmentTypeResponse(result.rows[0]), message: 'Assessment type updated successfully' });
});

export const deleteAssessmentType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.schoolId!;

  if (req.user!.role !== 'admin') throw new AppError('Only administrators can delete assessment types', 403);

  const existingResult = await query('SELECT * FROM assessment_types WHERE id = $1 AND school_id = $2', [id, schoolId]);
  if (existingResult.rows.length === 0) throw new AppError('Assessment type not found', 404);

  const usageCheck = await query('SELECT COUNT(*) as count FROM grades WHERE assessment_type_id = $1 AND school_id = $2', [id, schoolId]);
  const usageCount = parseInt(usageCheck.rows[0].count);

  if (usageCount > 0) {
    await query('UPDATE assessment_types SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    res.json({ success: true, message: `Assessment type deactivated successfully. It was used in ${usageCount} grade(s).` });
  } else {
    await query('DELETE FROM assessment_types WHERE id = $1', [id]);
    res.json({ success: true, message: 'Assessment type deleted successfully' });
  }
});

export const reactivateAssessmentType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.schoolId!;

  if (req.user!.role !== 'admin') throw new AppError('Only administrators can reactivate assessment types', 403);

  const existingResult = await query('SELECT * FROM assessment_types WHERE id = $1 AND school_id = $2 AND is_active = false', [id, schoolId]);
  if (existingResult.rows.length === 0) throw new AppError('Assessment type not found or already active', 404);

  const result = await query(
    'UPDATE assessment_types SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id]
  );

  res.json({ success: true, data: formatAssessmentTypeResponse(result.rows[0]), message: 'Assessment type reactivated successfully' });
});

function formatAssessmentTypeResponse(row: any): AssessmentTypeResponse {
  return {
    id: row.id.toString(), altId: null, name: row.name, description: row.description,
    weightage: parseFloat(row.weightage), isActive: row.is_active,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  };
}
