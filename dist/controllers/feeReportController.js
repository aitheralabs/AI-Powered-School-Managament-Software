"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFeeReportData = exports.getPaymentAnalysisReport = exports.getFeeDefaultersReport = exports.getOutstandingDuesReport = exports.generateFeeCollectionReport = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const feeReportService_1 = require("../services/feeReportService");
const feeReportService = new feeReportService_1.FeeReportService();
exports.generateFeeCollectionReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const report = await feeReportService.forSchool(req.schoolId).generateFeeCollectionReport(req.query, req.user.id, req.user.role);
    res.json({ success: true, data: report });
});
exports.getOutstandingDuesReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const report = await feeReportService.forSchool(req.schoolId).getOutstandingDuesReport(req.query, req.user.id, req.user.role);
    res.json({ success: true, data: report });
});
exports.getFeeDefaultersReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const report = await feeReportService.forSchool(req.schoolId).getFeeDefaultersReport(req.query, req.user.id, req.user.role);
    res.json({ success: true, data: report });
});
exports.getPaymentAnalysisReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const report = await feeReportService.forSchool(req.schoolId).getPaymentAnalysisReport(req.query, req.user.id, req.user.role);
    res.json({ success: true, data: report });
});
exports.exportFeeReportData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { format = 'csv', reportType = 'collection', ...filters } = req.query;
    const exportResult = await feeReportService.forSchool(req.schoolId).exportFeeReportData(format, reportType, filters, req.user.id);
    if (format === 'json') {
        res.json({ success: true, data: exportResult.data, exportInfo: exportResult.exportInfo });
    }
    else {
        res.setHeader('Content-Type', exportResult.mimeType || 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename || 'report.csv'}"`);
        res.send(exportResult.csvData);
    }
});
//# sourceMappingURL=feeReportController.js.map