import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import {
  adminDashboard,
  teacherDashboard,
  studentDashboard,
  parentDashboard,
  superAdminDashboard,
} from '../controllers/dashboardController';

const router = Router();

// ─── School-scoped dashboards (require auth + active subscription) ───────────

// Admin / Staff dashboard
router.get(
  '/admin',
  authenticate,
  resolveTenant,
  requireActiveSubscription,
  authorize('admin', 'staff'),
  adminDashboard
);

// Teacher dashboard
router.get(
  '/teacher',
  authenticate,
  resolveTenant,
  requireActiveSubscription,
  authorize('teacher'),
  teacherDashboard
);

// Student dashboard
router.get(
  '/student',
  authenticate,
  resolveTenant,
  requireActiveSubscription,
  authorize('student'),
  studentDashboard
);

// Parent dashboard
router.get(
  '/parent',
  authenticate,
  resolveTenant,
  requireActiveSubscription,
  authorize('parent'),
  parentDashboard
);

// ─── Platform-level super-admin dashboard (separate JWT, no tenant) ──────────
router.get('/superadmin', superAdminDashboard);

export default router;
