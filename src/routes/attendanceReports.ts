import { Router } from 'express';
import {
  generateAttendanceReport,
  getAttendanceTrends,
  getAttendanceStatistics,
  exportAttendanceData,
} from '../controllers/attendanceReportController';
import { validateQuery } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';
import { AttendanceReportQuerySchema } from '../types/report';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Generate attendance report
router.get(
  '/report',
  validateQuery(AttendanceReportQuerySchema),
  generateAttendanceReport
);

// Get attendance trends and analytics
router.get(
  '/trends',
  validateQuery(z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
    classId: z.string().optional(),
    studentId: z.string().optional(),
    period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
  })),
  getAttendanceTrends
);

// Get attendance statistics for dashboard
router.get(
  '/statistics',
  validateQuery(z.object({
    period: z.enum(['today', 'week', 'month', 'semester']).optional().default('today'),
  })),
  getAttendanceStatistics
);

// Export attendance data
router.get(
  '/export',
  validateQuery(z.object({
    format: z.enum(['csv', 'json', 'excel']).optional().default('csv'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
    classId: z.string().optional(),
    studentId: z.string().optional(),
    status: z.enum(['present', 'absent', 'late', 'excused']).optional(),
  })),
  exportAttendanceData
);

export default router;