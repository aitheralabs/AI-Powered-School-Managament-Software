"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentFeesByStudentId = exports.getFeeStats = exports.deleteStudentFee = exports.updateStudentFee = exports.getStudentFeeById = exports.assignFeesToClass = exports.getStudentFees = exports.assignFeesToStudents = exports.deleteFeeCategory = exports.updateFeeCategory = exports.getFeeCategoryById = exports.getFeeCategories = exports.createFeeCategory = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const feeService_1 = require("../services/feeService");
const connection_1 = require("../database/connection");
const feeService = new feeService_1.FeeService();
exports.createFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const feeCategory = await feeService.forSchool(req.schoolId).createFeeCategory(req.body);
    res.status(201).json({ success: true, message: 'Fee category created successfully', data: feeCategory });
});
exports.getFeeCategories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await feeService.forSchool(req.schoolId).getFeeCategories(req);
    res.json({ success: true, data: result.feeCategories, pagination: result.pagination });
});
exports.getFeeCategoryById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const feeCategory = await feeService.forSchool(req.schoolId).getFeeCategoryById(req.params.id);
    res.json({ success: true, data: feeCategory });
});
exports.updateFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const feeCategory = await feeService.forSchool(req.schoolId).updateFeeCategory(req.params.id, req.body);
    res.json({ success: true, message: 'Fee category updated successfully', data: feeCategory });
});
exports.deleteFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await feeService.forSchool(req.schoolId).deleteFeeCategory(req.params.id);
    res.json({ success: true, message: 'Fee category deleted successfully' });
});
exports.assignFeesToStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await feeService.forSchool(req.schoolId).assignFeesToStudents(req.body);
    res.status(201).json({ success: true, message: 'Fees assigned to students successfully', data: result });
});
exports.getStudentFees = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await feeService.forSchool(req.schoolId).getStudentFees(req);
    res.json({ success: true, data: result.studentFees, pagination: result.pagination });
});
exports.assignFeesToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await feeService.forSchool(req.schoolId).assignFeesToClass(req.body);
    res.status(201).json({ success: true, message: 'Fees assigned to class successfully', data: result });
});
exports.getStudentFeeById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const fee = await feeService.forSchool(req.schoolId).getStudentFeeById(req.params.id);
    res.json({ success: true, data: fee });
});
exports.updateStudentFee = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const fee = await feeService.forSchool(req.schoolId).updateStudentFee(req.params.id, req.body);
    res.json({ success: true, message: 'Student fee updated successfully', data: fee });
});
exports.deleteStudentFee = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const schoolId = req.schoolId;
    const existing = await (0, connection_1.query)('SELECT id FROM student_fees WHERE id = $1 AND school_id = $2', [id, schoolId]);
    if (existing.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Student fee not found' });
        return;
    }
    await (0, connection_1.query)('DELETE FROM student_fees WHERE id = $1 AND school_id = $2', [id, schoolId]);
    res.json({ success: true, message: 'Student fee deleted successfully' });
});
exports.getFeeStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const [feeRes, paymentRes, overdueCountRes] = await Promise.all([
        (0, connection_1.query)(`SELECT
         COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount END), 0) AS collected,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) AS pending,
         COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount END), 0) AS overdue_amount,
         COUNT(*) AS total_fees,
         COUNT(*) FILTER (WHERE status = 'paid')    AS paid_count,
         COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
         COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count
       FROM student_fees WHERE school_id = $1`, [schoolId]),
        (0, connection_1.query)(`SELECT COALESCE(SUM(p.amount), 0) AS total_payments,
              COUNT(p.id) AS payment_count
       FROM payments p
       JOIN student_fees sf ON sf.id = p.student_fee_id
       WHERE sf.school_id = $1`, [schoolId]),
        (0, connection_1.query)(`SELECT COUNT(DISTINCT student_id) AS defaulter_count
       FROM student_fees WHERE school_id = $1 AND status = 'overdue'`, [schoolId]),
    ]);
    const fee = feeRes.rows[0];
    const collected = parseFloat(fee.collected);
    const pending = parseFloat(fee.pending);
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
exports.getStudentFeesByStudentId = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const { studentId } = req.params;
    const result = await (0, connection_1.query)(`SELECT sf.*, fc.name AS category_name, fc.description AS category_description
     FROM student_fees sf
     LEFT JOIN fee_categories fc ON fc.id = sf.fee_category_id
     WHERE sf.student_id = $1 AND sf.school_id = $2
     ORDER BY sf.due_date ASC`, [studentId, schoolId]);
    res.json({ success: true, data: result.rows });
});
//# sourceMappingURL=feeController.js.map