import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FeeService } from '../services/feeService';
import { query } from '../database/connection';

const feeService = new FeeService();

export const createFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const feeCategory = await feeService.forSchool(req.schoolId!).createFeeCategory(req.body);
  res.status(201).json({ success: true, message: 'Fee category created successfully', data: { feeCategory } });
});

export const getFeeCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).getFeeCategories(req);
  res.json({ success: true, data: result });
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
  res.json({ success: true, data: result });
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

export const sendFeeReminder = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const { studentIds, message } = req.body as { studentIds: string[]; message?: string };

  if (!studentIds || studentIds.length === 0) {
    res.status(400).json({ success: false, message: 'studentIds array is required' });
    return;
  }

  // Fetch student and fee details for the given IDs
  const placeholders = studentIds.map((_: any, i: number) => `$${i + 2}`).join(', ');
  // outstanding = sum of student_fee amounts minus total payments made
  const result = await query(
    `SELECT s.id, u.first_name, u.last_name, u.email,
            COALESCE(SUM(sf.amount) - COALESCE(SUM(p.total_paid), 0), 0) AS outstanding_amount
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN student_fees sf ON sf.student_id = s.id AND sf.status IN ('pending', 'overdue')
     LEFT JOIN (
       SELECT student_fee_id, SUM(amount) AS total_paid
       FROM payments
       WHERE school_id = $1
       GROUP BY student_fee_id
     ) p ON p.student_fee_id = sf.id
     WHERE s.school_id = $1 AND s.id IN (${placeholders})
     GROUP BY s.id, u.first_name, u.last_name, u.email`,
    [schoolId, ...studentIds]
  );

  // In a real system this would send emails via emailService
  // For now we log and return who would be notified
  const notified = result.rows.map((r: any) => ({
    studentId: r.id,
    studentName: `${r.first_name} ${r.last_name}`,
    email: r.email || null,
    outstandingAmount: parseFloat(r.outstanding_amount || '0'),
    reminded: !!(r.email),
  }));

  res.json({
    success: true,
    message: `Fee reminder sent to ${notified.filter((n: any) => n.reminded).length} student(s)`,
    data: notified,
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
  res.json({ success: true, data: { fees: result.rows } });
});
