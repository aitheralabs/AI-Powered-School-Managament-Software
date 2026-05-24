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

// Export existing report (admin, teacher, staff)
router.post(
  '/export/:reportId',
  authorize('admin', 'teacher', 'staff'),
  validateQuery(z.object({
    format: ReportFormatSchema.optional().default('pdf'),
  })),
  exportReport
);

// Download exported report file (admin, teacher, staff)
router.get(
  '/download/:fileName',
  authorize('admin', 'teacher', 'staff'),
  downloadReport
);

// Email report (admin, staff)
router.post(
  '/email/:reportId',
  authorize('admin', 'staff'),
  validateBody(z.object({
    recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
    format: ReportFormatSchema.optional().default('pdf'),
    message: z.string().optional(),
  })),
  emailReport
);

// Scheduled Reports Management

// Create scheduled report (admin, staff)
router.post(
  '/scheduled',
  authorize('admin', 'staff'),
  validateBody(CreateScheduledReportSchema),
  createScheduledReport
);

// Get scheduled reports (admin, staff)
router.get(
  '/scheduled',
  authorize('admin', 'staff'),
  validateQuery(ReportQuerySchema),
  getScheduledReports
);

// Get scheduled report by ID (admin, staff)
router.get(
  '/scheduled/:id',
  authorize('admin', 'staff'),
  getScheduledReportById
);

// Update scheduled report (admin, staff)
router.put(
  '/scheduled/:id',
  authorize('admin', 'staff'),
  validateBody(UpdateScheduledReportSchema),
  updateScheduledReport
);

// Delete scheduled report (admin only)
router.delete(
  '/scheduled/:id',
  authorize('admin'),
  deleteScheduledReport
);

// Execute scheduled report manually (admin, staff)
router.post(
  '/scheduled/:id/execute',
  authorize('admin', 'staff'),
  executeScheduledReport
);

// Report History and Analytics

// Get report history (admin, staff)
router.get(
  '/history',
  authorize('admin', 'staff'),
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