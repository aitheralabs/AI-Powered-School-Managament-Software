"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledReportService = exports.ScheduledReportService = void 0;
const cron = __importStar(require("node-cron"));
const connection_1 = require("../database/connection");
const reportExportService_1 = require("./reportExportService");
const errorHandler_1 = require("../middleware/errorHandler");
class ScheduledReportService {
    constructor() {
        this.scheduledJobs = new Map();
        setTimeout(() => this.initializeScheduledReports(), 3000);
    }
    static getInstance() {
        if (!ScheduledReportService.instance) {
            ScheduledReportService.instance = new ScheduledReportService();
        }
        return ScheduledReportService.instance;
    }
    async createScheduledReport(reportData, createdBy) {
        const client = await (0, connection_1.getClient)();
        try {
            await client.query('BEGIN');
            const idResult = await client.query('SELECT nextval(\'scheduled_reports_id_seq\') as id');
            const sequentialId = idResult.rows[0].id;
            const nextRunDate = this.calculateNextRunDate(reportData.frequency);
            const result = await client.query(`INSERT INTO scheduled_reports (
           id, name, description, report_type, parameters, frequency, format,
           recipients, is_active, next_run_date, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`, [
                sequentialId,
                reportData.name,
                reportData.description || null,
                reportData.reportType,
                JSON.stringify(reportData.parameters),
                reportData.frequency,
                reportData.format,
                JSON.stringify(reportData.recipients),
                reportData.isActive ?? true,
                nextRunDate,
                createdBy
            ]);
            await client.query('COMMIT');
            const scheduledReport = result.rows[0];
            if (scheduledReport.is_active) {
                this.scheduleReport(scheduledReport);
            }
            return this.formatScheduledReportResponse(scheduledReport);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getScheduledReports(filters, userId, userRole) {
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        if (userRole !== 'admin') {
            whereClause += ` AND sr.created_by = $${queryParams.length + 1}`;
            queryParams.push(userId);
        }
        if (filters.reportType) {
            whereClause += ` AND sr.report_type = $${queryParams.length + 1}`;
            queryParams.push(filters.reportType);
        }
        if (filters.frequency) {
            whereClause += ` AND sr.frequency = $${queryParams.length + 1}`;
            queryParams.push(filters.frequency);
        }
        if (filters.isActive !== undefined) {
            whereClause += ` AND sr.is_active = $${queryParams.length + 1}`;
            queryParams.push(filters.isActive);
        }
        const countResult = await (0, connection_1.query)(`SELECT COUNT(*) as total FROM scheduled_reports sr ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].total);
        const offset = (filters.page - 1) * filters.limit;
        const result = await (0, connection_1.query)(`SELECT 
         sr.*,
         u.first_name as created_by_first_name,
         u.last_name as created_by_last_name
       FROM scheduled_reports sr
       JOIN users u ON sr.created_by = u.id
       ${whereClause}
       ORDER BY sr.created_at DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, filters.limit, offset]);
        const reports = result.rows.map((row) => this.formatScheduledReportResponse(row));
        return { reports, total };
    }
    async getScheduledReportById(id, userId, userRole) {
        let authClause = '';
        const queryParams = [id];
        if (userRole !== 'admin') {
            authClause = ` AND sr.created_by = $2`;
            queryParams.push(userId);
        }
        const result = await (0, connection_1.query)(`SELECT 
         sr.*,
         u.first_name as created_by_first_name,
         u.last_name as created_by_last_name
       FROM scheduled_reports sr
       JOIN users u ON sr.created_by = u.id
       WHERE sr.id = $1${authClause}`, queryParams);
        if (result.rows.length === 0) {
            return null;
        }
        return this.formatScheduledReportResponse(result.rows[0]);
    }
    async updateScheduledReport(id, updateData, userId, userRole) {
        const client = await (0, connection_1.getClient)();
        try {
            await client.query('BEGIN');
            let authClause = '';
            const checkParams = [id];
            if (userRole !== 'admin') {
                authClause = ` AND created_by = $2`;
                checkParams.push(userId);
            }
            const existingReport = await client.query(`SELECT * FROM scheduled_reports WHERE id = $1${authClause}`, checkParams);
            if (existingReport.rows.length === 0) {
                throw new errorHandler_1.AppError('Scheduled report not found or access denied', 404);
            }
            const currentReport = existingReport.rows[0];
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
            if (updateData.parameters !== undefined) {
                updateFields.push(`parameters = $${paramIndex++}`);
                updateValues.push(JSON.stringify(updateData.parameters));
            }
            if (updateData.frequency !== undefined) {
                updateFields.push(`frequency = $${paramIndex++}`);
                updateValues.push(updateData.frequency);
                const nextRunDate = this.calculateNextRunDate(updateData.frequency);
                updateFields.push(`next_run_date = $${paramIndex++}`);
                updateValues.push(nextRunDate);
            }
            if (updateData.format !== undefined) {
                updateFields.push(`format = $${paramIndex++}`);
                updateValues.push(updateData.format);
            }
            if (updateData.recipients !== undefined) {
                updateFields.push(`recipients = $${paramIndex++}`);
                updateValues.push(JSON.stringify(updateData.recipients));
            }
            if (updateData.isActive !== undefined) {
                updateFields.push(`is_active = $${paramIndex++}`);
                updateValues.push(updateData.isActive);
            }
            if (updateFields.length === 0) {
                throw new errorHandler_1.AppError('No valid fields to update', 400);
            }
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(id);
            const result = await client.query(`UPDATE scheduled_reports 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`, updateValues);
            await client.query('COMMIT');
            const updatedReport = result.rows[0];
            this.unscheduleReport(id);
            if (updatedReport.is_active) {
                this.scheduleReport(updatedReport);
            }
            return this.formatScheduledReportResponse(updatedReport);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async deleteScheduledReport(id, userId, userRole) {
        let authClause = '';
        const queryParams = [id];
        if (userRole !== 'admin') {
            authClause = ` AND created_by = $2`;
            queryParams.push(userId);
        }
        const result = await (0, connection_1.query)(`DELETE FROM scheduled_reports WHERE id = $1${authClause}`, queryParams);
        if (result.rowCount === 0) {
            throw new errorHandler_1.AppError('Scheduled report not found or access denied', 404);
        }
        this.unscheduleReport(id);
    }
    async executeScheduledReport(id, userId, userRole) {
        const scheduledReport = await this.getScheduledReportById(id, userId, userRole);
        if (!scheduledReport) {
            throw new errorHandler_1.AppError('Scheduled report not found or access denied', 404);
        }
        return await this.generateAndSendReport(scheduledReport);
    }
    async initializeScheduledReports() {
        try {
            const result = await (0, connection_1.query)('SELECT * FROM scheduled_reports WHERE is_active = true', []);
            for (const report of result.rows) {
                this.scheduleReport(report);
            }
            console.log(`Initialized ${result.rows.length} scheduled reports`);
        }
        catch (error) {
            console.error('Failed to initialize scheduled reports:', error);
        }
    }
    scheduleReport(report) {
        const cronExpression = this.getCronExpression(report.frequency);
        if (!cronExpression) {
            console.warn(`Invalid frequency for report ${report.id}: ${report.frequency}`);
            return;
        }
        try {
            const task = cron.schedule(cronExpression, async () => {
                try {
                    console.log(`Executing scheduled report: ${report.name} (ID: ${report.id})`);
                    await this.generateAndSendReport(this.formatScheduledReportResponse(report));
                    await this.updateReportRunDates(report.id, report.frequency);
                }
                catch (error) {
                    console.error(`Failed to execute scheduled report ${report.id}:`, error);
                    await this.logReportError(report.id, error);
                }
            }, {
                timezone: process.env.TIMEZONE || 'UTC'
            });
            this.scheduledJobs.set(report.id.toString(), task);
            console.log(`Scheduled report ${report.id} with cron: ${cronExpression}`);
        }
        catch (error) {
            console.error(`Failed to schedule report ${report.id}:`, error);
        }
    }
    unscheduleReport(reportId) {
        const task = this.scheduledJobs.get(reportId);
        if (task) {
            task.stop();
            task.destroy();
            this.scheduledJobs.delete(reportId);
            console.log(`Unscheduled report ${reportId}`);
        }
    }
    async generateAndSendReport(scheduledReport) {
        try {
            const reportData = await this.generateReportData(scheduledReport.reportType, scheduledReport.parameters);
            const exportResult = await reportExportService_1.reportExportService.exportReport(reportData, scheduledReport.format);
            await reportExportService_1.reportExportService.emailReport(exportResult, scheduledReport.recipients, reportData, `This is your scheduled ${scheduledReport.name} report.`);
            await this.logReportExecution(scheduledReport.id, exportResult);
            return exportResult;
        }
        catch (error) {
            await this.logReportError(scheduledReport.id, error);
            throw error;
        }
    }
    async generateReportData(reportType, parameters) {
        return {
            metadata: {
                reportId: `scheduled-${Date.now()}`,
                reportType,
                title: `Scheduled ${reportType} Report`,
                generatedBy: 'system',
                generatedAt: new Date().toISOString(),
                parameters,
                format: 'json'
            },
            summary: {
                totalRecords: 0,
                dateRange: {
                    startDate: parameters.startDate || new Date().toISOString().split('T')[0],
                    endDate: parameters.endDate || new Date().toISOString().split('T')[0]
                },
                filters: parameters,
                aggregations: {}
            },
            data: []
        };
    }
    getCronExpression(frequency) {
        switch (frequency) {
            case 'daily':
                return '0 8 * * *';
            case 'weekly':
                return '0 8 * * 1';
            case 'monthly':
                return '0 8 1 * *';
            case 'quarterly':
                return '0 8 1 */3 *';
            case 'semester':
                return '0 8 1 1,7 *';
            case 'annual':
                return '0 8 1 1 *';
            default:
                return null;
        }
    }
    calculateNextRunDate(frequency) {
        const now = new Date();
        const nextRun = new Date(now);
        switch (frequency) {
            case 'daily':
                nextRun.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                nextRun.setDate(now.getDate() + 7);
                break;
            case 'monthly':
                nextRun.setMonth(now.getMonth() + 1, 1);
                break;
            case 'quarterly':
                nextRun.setMonth(now.getMonth() + 3, 1);
                break;
            case 'semester':
                nextRun.setMonth(now.getMonth() + 6, 1);
                break;
            case 'annual':
                nextRun.setFullYear(now.getFullYear() + 1, 0, 1);
                break;
            default:
                nextRun.setDate(now.getDate() + 1);
        }
        nextRun.setHours(8, 0, 0, 0);
        return nextRun;
    }
    async updateReportRunDates(reportId, frequency) {
        const nextRunDate = this.calculateNextRunDate(frequency);
        await (0, connection_1.query)(`UPDATE scheduled_reports 
       SET last_run_date = CURRENT_TIMESTAMP, next_run_date = $1
       WHERE id = $2`, [nextRunDate, reportId]);
    }
    async logReportExecution(reportId, exportResult) {
        try {
            await (0, connection_1.query)(`INSERT INTO report_history (
           scheduled_report_id, report_type, title, parameters, format,
           status, file_size, download_url, generated_by, generated_at
         ) VALUES ($1, 'scheduled', 'Scheduled Report', '{}', 'pdf', 'completed', $2, $3, 'system', CURRENT_TIMESTAMP)`, [reportId, exportResult.fileSize, exportResult.downloadUrl]);
        }
        catch (error) {
            console.error('Failed to log report execution:', error);
        }
    }
    async logReportError(reportId, error) {
        try {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await (0, connection_1.query)(`INSERT INTO report_history (
           scheduled_report_id, report_type, title, parameters, format,
           status, error, generated_by, generated_at
         ) VALUES ($1, 'scheduled', 'Scheduled Report', '{}', 'pdf', 'failed', $2, 'system', CURRENT_TIMESTAMP)`, [reportId, errorMessage]);
        }
        catch (logError) {
            console.error('Failed to log report error:', logError);
        }
    }
    formatScheduledReportResponse(row) {
        return {
            id: row.id.toString(),
            name: row.name,
            description: row.description,
            reportType: row.report_type,
            parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
            frequency: row.frequency,
            format: row.format,
            recipients: typeof row.recipients === 'string' ? JSON.parse(row.recipients) : row.recipients,
            isActive: row.is_active,
            nextRunDate: row.next_run_date?.toISOString() || null,
            lastRunDate: row.last_run_date?.toISOString() || null,
            createdBy: row.created_by.toString(),
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            createdByUser: row.created_by_first_name ? {
                firstName: row.created_by_first_name,
                lastName: row.created_by_last_name,
            } : undefined,
        };
    }
}
exports.ScheduledReportService = ScheduledReportService;
exports.scheduledReportService = ScheduledReportService.getInstance();
//# sourceMappingURL=scheduledReportService.js.map