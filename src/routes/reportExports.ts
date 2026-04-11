import { Router } from 'express';
import {
  exportReport,
  downloadReport,
  emailReport,
  createScheduledReport,
  getScheduledReports,
  getScheduledReportById,
  updateScheduledReport,
  deleteScheduledReport,
  executeScheduledReport,
  getReportHistory,
  getExportStatistics,
} from '../controllers/reportExportController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { 
  CreateScheduledReportSchema,
  UpdateScheduledReportSchema,
  ReportQuerySchema,
  ReportFormatSchema
} from '../types/report';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Export existing report
router.post(
  '/export/:reportId',
  validateQuery(z.object({
    format: ReportFormatSchema.optional().default('pdf'),
  })),
  exportReport
);

// Download exported report file
router.get(
  '/download/:fileName',
  downloadReport
);

// Email report
router.post(
  '/email/:reportId',
  validateBody(z.object({
    recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
    format: ReportFormatSchema.optional().default('pdf'),
    message: z.string().optional(),
  })),
  emailReport
);

// Scheduled Reports Management

// Create scheduled report (admin/staff only)
router.post(
  '/scheduled',
  authorize('admin'), // Note: authorize middleware may need to be updated to support multiple roles
  validateBody(CreateScheduledReportSchema),
  createScheduledReport
);

// Get scheduled reports
router.get(
  '/scheduled',
  validateQuery(ReportQuerySchema),
  getScheduledReports
);

// Get scheduled report by ID
router.get(
  '/scheduled/:id',
  getScheduledReportById
);

// Update scheduled report
router.put(
  '/scheduled/:id',
  validateBody(UpdateScheduledReportSchema),
  updateScheduledReport
);

// Delete scheduled report
router.delete(
  '/scheduled/:id',
  deleteScheduledReport
);

// Execute scheduled report manually
router.post(
  '/scheduled/:id/execute',
  executeScheduledReport
);

// Report History and Analytics

// Get report history
router.get(
  '/history',
  validateQuery(ReportQuerySchema),
  getReportHistory
);

// Get export statistics (admin only)
router.get(
  '/statistics',
  authorize('admin'),
  getExportStatistics
);

export default router;