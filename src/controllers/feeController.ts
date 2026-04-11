import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FeeService } from '../services/feeService';
import { query } from '../database/connection';

const feeService = new FeeService();

export const createFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const feeCategory = await feeService.forSchool(req.schoolId!).createFeeCategory(req.body);
  res.status(201).json({ success: true, message: 'Fee category created successfully', data: feeCategory });
});

export const getFeeCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).getFeeCategories(req);
  res.json({ success: true, data: result.feeCategories, pagination: result.pagination });
});

export const getFeeCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const feeCategory = await feeService.forSchool(req.schoolId!).getFeeCategoryById(req.params.id);
  res.json({ success: true, data: feeCategory });
});

export const updateFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const feeCategory = await feeService.forSchool(req.schoolId!).updateFeeCategory(req.params.id, req.body);
  res.json({ success: true, message: 'Fee category updated successfully', data: feeCategory });
});

export const deleteFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  await feeService.forSchool(req.schoolId!).deleteFeeCategory(req.params.id);
  res.json({ success: true, message: 'Fee category deleted successfully' });
});

export const assignFeesToStudents = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).assignFeesToStudents(req.body);
  res.status(201).json({ success: true, message: 'Fees assigned to students successfully', data: result });
});

export const getStudentFees = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).getStudentFees(req);
  res.json({ success: true, data: result.studentFees, pagination: result.pagination });
});

export const assignFeesToClass = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).assignFeesToClass(req.body);
  res.status(201).json({ success: true, message: 'Fees assigned to class successfully', data: result });
});

export const getStudentFeeById = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feeService.forSchool(req.schoolId!).getStudentFeeById(req.params.id);
  res.json({ success: true, data: fee });
});

export const updateStudentFee = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feeService.forSchool(req.schoolId!).updateStudentFee(req.params.id, req.body);
  res.json({ success: true, message: 'Student fee updated successfully', data: fee });
});

export const deleteStudentFee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.schoolId!;
  const existing = await query('SELECT id FROM student_fees WHERE id = $1 AND school_id = $2', [id, schoolId]);
  if (existing.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Student fee not found' });
    return;
  }
  await query('DELETE FROM student_fees WHERE id = $1 AND school_id = $2', [id, schoolId]);
  res.json({ success: true, message: 'Student fee deleted successfully' });
});

export const getFeeStats = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const [feeRes, paymentRes, overdueCountRes] = await Promise.all([
    query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount END), 0) AS collected,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) AS pending,
         COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount END), 0) AS overdue_amount,
         COUNT(*) AS total_fees,
         COUNT(*) FILTER (WHERE status = 'paid')    AS paid_count,
         COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
         COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count
       FROM student_fees WHERE school_id = $1`,
      [schoolId]
    ),
    query(
      `SELECT COALESCE(SUM(p.amount), 0) AS total_payments,
              COUNT(p.id) AS payment_count
       FROM payments p
       JOIN student_fees sf ON sf.id = p.student_fee_id
       WHERE sf.school_id = $1`,
      [schoolId]
    ),
    query(
      `SELECT COUNT(DISTINCT student_id) AS defaulter_count
       FROM student_fees WHERE school_id = $1 AND status = 'overdue'`,
      [schoolId]
    ),
  ]);

  const fee = feeRes.rows[0];
  const collected = parseFloat(fee.collected);
  const pending   = parseFloat(fee.pending);
  const overdueAmt = parseFloat(fee.overdue_amount);
  const total = collected + pending + overdueAmt;

  res.json({
    success: true,
    data: {
      collected,
      pending,
      overdueAmount: overdueAmt,
      totalFees: total,
      collectionPercentage: total > 0 ? Math.round((collected / total) * 100) : 0,
      totalStudentFees: parseInt(fee.total_fees, 10),
      paidCount: parseInt(fee.paid_count, 10),
      pendingCount: parseInt(fee.pending_count, 10),
      overdueCount: parseInt(fee.overdue_count, 10),
      totalPayments: parseFloat(paymentRes.rows[0].total_payments),
      paymentCount: parseInt(paymentRes.rows[0].payment_count, 10),
      defaulterCount: parseInt(overdueCountRes.rows[0].defaulter_count, 10),
    },
  });
});

export const getStudentFeesByStudentId = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const { studentId } = req.params;
  const result = await query(
    `SELECT sf.*, fc.name AS category_name, fc.description AS category_description
     FROM student_fees sf
     LEFT JOIN fee_categories fc ON fc.id = sf.fee_category_id
     WHERE sf.student_id = $1 AND sf.school_id = $2
     ORDER BY sf.due_date ASC`,
    [studentId, schoolId]
  );
  res.json({ success: true, data: result.rows });
});
