"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentReceipt = exports.getPaymentHistory = exports.reversePayment = exports.getPaymentStatistics = exports.getPaymentSummary = exports.getPaymentById = exports.getPayments = exports.recordPayment = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const paymentService_1 = require("../services/paymentService");
const paymentService = new paymentService_1.PaymentService();
exports.recordPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const payment = await paymentService.forSchool(req.schoolId).recordPayment(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: { payment } });
});
exports.getPayments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await paymentService.forSchool(req.schoolId).getPayments(req);
    res.json({ success: true, data: result });
});
exports.getPaymentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const payment = await paymentService.forSchool(req.schoolId).getPaymentById(req.params.id);
    res.json({ success: true, data: payment });
});
exports.getPaymentSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const summary = await paymentService.forSchool(req.schoolId).getPaymentSummary(startDate, endDate);
    res.json({ success: true, data: summary });
});
exports.getPaymentStatistics = exports.getPaymentSummary;
exports.reversePayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reason } = req.body;
    const result = await paymentService.forSchool(req.schoolId).reversePayment(req.params.id, reason || 'No reason provided', req.user.id);
    res.json({ success: true, message: 'Payment reversed successfully', data: result });
});
exports.getPaymentHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const history = await paymentService.forSchool(req.schoolId).getPaymentHistory(studentId);
    res.json({ success: true, data: history });
});
exports.getPaymentReceipt = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const receipt = await paymentService.forSchool(req.schoolId).getPaymentReceipt(req.params.id);
    res.json({ success: true, data: receipt });
});
//# sourceMappingURL=paymentController.js.map