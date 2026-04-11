import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ParentService } from '../services/parentService';

const parentService = new ParentService();

export const createParent = asyncHandler(async (req: Request, res: Response) => {
  const parent = await parentService.forSchool(req.schoolId!).createParent(req.body);
  res.status(201).json({ success: true, message: 'Parent account created successfully', data: parent });
});

export const getParents = asyncHandler(async (req: Request, res: Response) => {
  const result = await parentService.forSchool(req.schoolId!).getParents(req);
  res.json({ success: true, data: result.parents, pagination: result.pagination });
});

export const getParentById = asyncHandler(async (req: Request, res: Response) => {
  const parent = await parentService.forSchool(req.schoolId!).getParentById(req.params.id);
  res.json({ success: true, data: parent });
});

export const updateParent = asyncHandler(async (req: Request, res: Response) => {
  const parent = await parentService.forSchool(req.schoolId!).updateParent(req.params.id, req.body);
  res.json({ success: true, message: 'Parent updated successfully', data: parent });
});

export const deleteParent = asyncHandler(async (req: Request, res: Response) => {
  await parentService.forSchool(req.schoolId!).deleteParent(req.params.id);
  res.json({ success: true, message: 'Parent deleted successfully' });
});

export const linkStudentToParent = asyncHandler(async (req: Request, res: Response) => {
  const relationship = await parentService.forSchool(req.schoolId!).linkStudentToParent(req.body);
  res.status(201).json({ success: true, message: 'Student linked to parent successfully', data: relationship });
});

export const unlinkStudentFromParent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, parentId } = req.params;
  await parentService.forSchool(req.schoolId!).unlinkStudentFromParent(studentId, parentId);
  res.json({ success: true, message: 'Student unlinked from parent successfully' });
});

export const getParentChildren = asyncHandler(async (req: Request, res: Response) => {
  const result = await parentService.forSchool(req.schoolId!).getParentChildren(req.params.parentId);
  res.json({ success: true, data: result });
});

export const linkParentToStudent = linkStudentToParent;

export const updateParentStudentRelationship = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, parentId } = req.params;
  const { relationshipType, isPrimary } = req.body;
  // Update relationship type/isPrimary in student_parents table
  const svc = parentService.forSchool(req.schoolId!);
  const result = await (svc as any).executeQuery(
    `UPDATE student_parents SET relationship_type = COALESCE($1, relationship_type), is_primary = COALESCE($2, is_primary)
     WHERE student_id = $3 AND parent_user_id = $4
     RETURNING *`,
    [relationshipType || null, isPrimary !== undefined ? isPrimary : null, studentId, parentId]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Relationship not found' });
    return;
  }
  res.json({ success: true, message: 'Relationship updated', data: result.rows[0] });
});

export const removeParentStudentRelationship = unlinkStudentFromParent;

export const getParentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await parentService.forSchool(req.schoolId!).getParentDashboard(req.params.parentId);
  res.json({ success: true, data: dashboard });
});
