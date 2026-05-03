"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAttendanceData = exports.getAttendanceStatistics = exports.getAttendanceTrends = exports.generateAttendanceReport = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const attendanceReportService_1 = require("../services/attendanceReportService");
const attendanceReportService = new attendanceReportService_1.AttendanceReportService();
exports.generateAttendanceReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const report = await attendanceReportService.forSchool(req.schoolId).generateAttendanceReport(req.query, req.user.id, req.user.role);
    res.json({ success: true, data: report });
});
exports.getAttendanceTrends = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const report = await attendanceReportService.forSchool(req.schoolId).getAttendanceTrends(req.query, req.user.id, req.user.role);
    res.json({ success: true, data: report });
});
exports.getAttendanceStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = 'month' } = req.query;
    const report = await attendanceReportService.forSchool(req.schoolId).getAttendanceStatistics(period, req.user.id, req.user.role);
    res.json({ success: true, data: report });
});
exports.exportAttendanceData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { format = 'csv', ...reportQuery } = req.query;
    const result = await attendanceReportService
        .forSchool(req.schoolId)
        .exportAttendanceData(format, reportQuery, req.user.id, req.user.role);
    if (format === 'json') {
        res.json({ success: true, data: result });
        return;
    }
    const { csvData, filename, mimeType } = result;
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
});
//# sourceMappingURL=attendanceReportController.js.map