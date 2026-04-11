/**
 * AI Insights Routes
 *
 * All routes require:
 *   1. Authentication
 *   2. Active subscription
 *   3. feature_ai_insights = true (standard plan+) for AI endpoints
 *      Rule-based analytics (attendance/grade/fee risks) are available on basic+
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription, requireFeature } from '../middleware/tenant';
import {
  getAttendanceRisks,
  getGradeTrends,
  getFeeRisks,
  getSchoolHealthSummary,
  askSchoolAI,
} from '../controllers/aiInsightsController';

const router = Router();

// Apply auth + tenant resolution to all routes
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Rule-based analytics (available on all plans including basic)
router.get('/attendance-risks', authorize('admin', 'teacher'), getAttendanceRisks);
router.get('/grade-trends',     authorize('admin', 'teacher'), getGradeTrends);
router.get('/fee-risks',        authorize('admin', 'staff'),   getFeeRisks);

// AI-powered features (standard plan and above — feature_ai_insights required)
router.get('/school-health',    authorize('admin'), requireFeature('aiInsights'), getSchoolHealthSummary);
router.post('/ask',             authorize('admin', 'teacher'), requireFeature('aiInsights'), askSchoolAI);

export default router;
