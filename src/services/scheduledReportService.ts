import * as cron from 'node-cron';
import { query, getClient } from '../database/connection';
import { reportExportService, ExportResult } from './reportExportService';
import { AppError } from '../middleware/errorHandler';
import { 
  CreateScheduledReport, 
  UpdateScheduledReport, 
  ScheduledReportResponse,
  ReportFrequency,
  ReportFormat,
  ReportType
} from '../types/report';

export class ScheduledReportService {
  private static instance: ScheduledReportService;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {
    // Delay initialization to allow DB pool to warm up
    setTimeout(() => this.initializeScheduledReports(), 3000);
  }

  public static getInstance(): ScheduledReportService {
    if (!ScheduledReportService.instance) {
      ScheduledReportService.instance = new ScheduledReportService();
    }
    return ScheduledReportService.instance;
  }

  /**
   * Create a new scheduled report
   */
  public async createScheduledReport(
    reportData: CreateScheduledReport,
    createdBy: string
  ): Promise<ScheduledReportResponse> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Generate sequential ID
      const idResult = await client.query('SELECT nextval(\'scheduled_reports_id_seq\') as id');
      const sequentialId = idResult.rows[0].id;

      // Calculate next run date
      const nextRunDate = this.calculateNextRunDate(reportData.frequency);

      // Insert scheduled report
      const result = await client.query(
        `INSERT INTO scheduled_reports (
           id, name, description, report_type, parameters, frequency, format,
           recipients, is_active, next_run_date, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
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
        ]
      );

      await client.query('COMMIT');

      const scheduledReport = result.rows[0];

      // Schedule the cron job if active
      if (scheduledReport.is_active) {
        this.scheduleReport(scheduledReport);
      }

      return this.formatScheduledReportResponse(scheduledReport);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get scheduled reports with filtering and pagination
   */
  public async getScheduledReports(
    filters: ScheduledReportFilters,
    userId: string,
    userRole: string
  ): Promise<{ reports: ScheduledReportResponse[]; total: number }> {
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    // Add authorization filters
    if (userRole !== 'admin') {
      whereClause += ` AND sr.created_by = $${queryParams.length + 1}`;
      queryParams.push(userId);
    }

    // Add optional filters
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

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM scheduled_reports sr ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].total);

    // Get reports with pagination
    const offset = (filters.page - 1) * filters.limit;
    const result = await query(
      `SELECT 
         sr.*,
         u.first_name as created_by_first_name,
         u.last_name as created_by_last_name
       FROM scheduled_reports sr
       JOIN users u ON sr.created_by = u.id
       ${whereClause}
       ORDER BY sr.created_at DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, filters.limit, offset]
    );

    const reports = result.rows.map((row: any) => this.formatScheduledReportResponse(row));

    return { reports, total };
  }

  /**
   * Get scheduled report by ID
   */
  public async getScheduledReportById(
    id: string,
    userId: string,
    userRole: string
  ): Promise<ScheduledReportResponse | null> {
    let authClause = '';
    const queryParams = [id];

    if (userRole !== 'admin') {
      authClause = ` AND sr.created_by = $2`;
      queryParams.push(userId);
    }

    const result = await query(
      `SELECT 
         sr.*,
         u.first_name as created_by_first_name,
         u.last_name as created_by_last_name
       FROM scheduled_reports sr
       JOIN users u ON sr.created_by = u.id
       WHERE sr.id = $1${authClause}`,
      queryParams
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatScheduledReportResponse(result.rows[0]);
  }

  /**
   * Update scheduled report
   */
  public async updateScheduledReport(
    id: string,
    updateData: UpdateScheduledReport,
    userId: string,
    userRole: string
  ): Promise<ScheduledReportResponse> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if report exists and user has permission
      let authClause = '';
      const checkParams = [id];

      if (userRole !== 'admin') {
        authClause = ` AND created_by = $2`;
        checkParams.push(userId);
      }

      const existingReport = await client.query(
        `SELECT * FROM scheduled_reports WHERE id = $1${authClause}`,
        checkParams
      );

      if (existingReport.rows.length === 0) {
        throw new AppError('Scheduled report not found or access denied', 404);
      }

      const currentReport = existingReport.rows[0];

      // Build update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
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
        
        // Recalculate next run date if frequency changed
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
        throw new AppError('No valid fields to update', 400);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      // Update report
      const result = await client.query(
        `UPDATE scheduled_reports 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        updateValues
      );

      await client.query('COMMIT');

      const updatedReport = result.rows[0];

      // Update cron job
      this.unscheduleReport(id);
      if (updatedReport.is_active) {
        this.scheduleReport(updatedReport);
      }

      return this.formatScheduledReportResponse(updatedReport);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete scheduled report
   */
  public async deleteScheduledReport(
    id: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    let authClause = '';
    const queryParams = [id];

    if (userRole !== 'admin') {
      authClause = ` AND created_by = $2`;
      queryParams.push(userId);
    }

    const result = await query(
      `DELETE FROM scheduled_reports WHERE id = $1${authClause}`,
      queryParams
    );

    if (result.rowCount === 0) {
      throw new AppError('Scheduled report not found or access denied', 404);
    }

    // Remove cron job
    this.unscheduleReport(id);
  }

  /**
   * Execute scheduled report manually
   */
  public async executeScheduledReport(
    id: string,
    userId: string,
    userRole: string
  ): Promise<ExportResult> {
    const scheduledReport = await this.getScheduledReportById(id, userId, userRole);

    if (!scheduledReport) {
      throw new AppError('Scheduled report not found or access denied', 404);
    }

    return await this.generateAndSendReport(scheduledReport);
  }

  /**
   * Initialize all scheduled reports on startup
   */
  private async initializeScheduledReports(): Promise<void> {
    try {
      const result = await query(
        'SELECT * FROM scheduled_reports WHERE is_active = true',
        []
      );

      for (const report of result.rows) {
        this.scheduleReport(report);
      }

      console.log(`Initialized ${result.rows.length} scheduled reports`);
    } catch (error) {
      console.error('Failed to initialize scheduled reports:', error);
    }
  }

  /**
   * Schedule a report using cron
   */
  private scheduleReport(report: any): void {
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
          
          // Update last run date and calculate next run date
          await this.updateReportRunDates(report.id, report.frequency);
        } catch (error) {
          console.error(`Failed to execute scheduled report ${report.id}:`, error);
          await this.logReportError(report.id, error);
        }
      }, {
        timezone: process.env.TIMEZONE || 'UTC'
      });

      this.scheduledJobs.set(report.id.toString(), task);
      console.log(`Scheduled report ${report.id} with cron: ${cronExpression}`);
    } catch (error) {
      console.error(`Failed to schedule report ${report.id}:`, error);
    }
  }

  /**
   * Unschedule a report
   */
  private unscheduleReport(reportId: string): void {
    const task = this.scheduledJobs.get(reportId);
    if (task) {
      task.stop();
      task.destroy();
      this.scheduledJobs.delete(reportId);
      console.log(`Unscheduled report ${reportId}`);
    }
  }

  /**
   * Generate and send report
   */
  private async generateAndSendReport(scheduledReport: ScheduledReportResponse): Promise<ExportResult> {
    try {
      // Generate report data based on parameters
      const reportData = await this.generateReportData(
        scheduledReport.reportType,
        scheduledReport.parameters
      );

      // Export report
      const exportResult = await reportExportService.exportReport(
        reportData,
        scheduledReport.format
      );

      // Send via email
      await reportExportService.emailReport(
        exportResult,
        scheduledReport.recipients,
        reportData,
        `This is your scheduled ${scheduledReport.name} report.`
      );

      // Log successful execution
      await this.logReportExecution(scheduledReport.id, exportResult);

      return exportResult;
    } catch (error) {
      await this.logReportError(scheduledReport.id, error);
      throw error;
    }
  }

  /**
   * Generate report data based on type and parameters
   */
  private async generateReportData(reportType: ReportType, parameters: any): Promise<any> {
    // This would integrate with the existing report generation logic
    // For now, we'll return a mock structure
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

  /**
   * Get cron expression for frequency
   */
  private getCronExpression(frequency: ReportFrequency): string | null {
    switch (frequency) {
      case 'daily':
        return '0 8 * * *'; // 8 AM daily
      case 'weekly':
        return '0 8 * * 1'; // 8 AM every Monday
      case 'monthly':
        return '0 8 1 * *'; // 8 AM on 1st of every month
      case 'quarterly':
        return '0 8 1 */3 *'; // 8 AM on 1st of every 3rd month
      case 'semester':
        return '0 8 1 1,7 *'; // 8 AM on Jan 1st and July 1st
      case 'annual':
        return '0 8 1 1 *'; // 8 AM on January 1st
      default:
        return null;
    }
  }

  /**
   * Calculate next run date
   */
  private calculateNextRunDate(frequency: ReportFrequency): Date {
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
        // Next semester (6 months)
        nextRun.setMonth(now.getMonth() + 6, 1);
        break;
      case 'annual':
        nextRun.setFullYear(now.getFullYear() + 1, 0, 1);
        break;
      default:
        nextRun.setDate(now.getDate() + 1);
    }

    nextRun.setHours(8, 0, 0, 0); // Set to 8 AM
    return nextRun;
  }

  /**
   * Update report run dates
   */
  private async updateReportRunDates(reportId: string, frequency: ReportFrequency): Promise<void> {
    const nextRunDate = this.calculateNextRunDate(frequency);
    
    await query(
      `UPDATE scheduled_reports 
       SET last_run_date = CURRENT_TIMESTAMP, next_run_date = $1
       WHERE id = $2`,
      [nextRunDate, reportId]
    );
  }

  /**
   * Log report execution
   */
  private async logReportExecution(reportId: string, exportResult: ExportResult): Promise<void> {
    try {
      await query(
        `INSERT INTO report_history (
           scheduled_report_id, report_type, title, parameters, format,
           status, file_size, download_url, generated_by, generated_at
         ) VALUES ($1, 'scheduled', 'Scheduled Report', '{}', 'pdf', 'completed', $2, $3, 'system', CURRENT_TIMESTAMP)`,
        [reportId, exportResult.fileSize, exportResult.downloadUrl]
      );
    } catch (error) {
      console.error('Failed to log report execution:', error);
    }
  }

  /**
   * Log report error
   */
  private async logReportError(reportId: string, error: any): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await query(
        `INSERT INTO report_history (
           scheduled_report_id, report_type, title, parameters, format,
           status, error, generated_by, generated_at
         ) VALUES ($1, 'scheduled', 'Scheduled Report', '{}', 'pdf', 'failed', $2, 'system', CURRENT_TIMESTAMP)`,
        [reportId, errorMessage]
      );
    } catch (logError) {
      console.error('Failed to log report error:', logError);
    }
  }

  /**
   * Format scheduled report response
   */
  private formatScheduledReportResponse(row: any): ScheduledReportResponse {
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

// Types
export interface ScheduledReportFilters {
  reportType?: ReportType;
  frequency?: ReportFrequency;
  isActive?: boolean;
  page: number;
  limit: number;
}

// Export singleton instance
export const scheduledReportService = ScheduledReportService.getInstance();