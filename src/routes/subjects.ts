import { Router } from 'express';
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus,
  getSubjectStatistics,
} from '../controllers/subjectController';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Get all subjects with filtering and pagination
router.get('/', cacheResponse(3600), getSubjects); // Cache for 1 hour

// Get subject by ID
router.get('/:id', cacheResponse(3600), getSubjectById); // Cache for 1 hour

// Get subject statistics (admin and teachers only)
router.get('/:id/statistics', authorize('admin', 'teacher'), cacheResponse(600), getSubjectStatistics); // Cache for 10 minutes

// Create subject (admin only)
router.post('/', authorize('admin'), invalidateCache(['subject*']), createSubject);

// Update subject (admin only)
router.put('/:id', authorize('admin'), invalidateCache(['subject*']), updateSubject);

// Toggle subject status (admin only)
router.patch('/:id/status', authorize('admin'), invalidateCache(['subject*']), toggleSubjectStatus);

// Delete subject (admin only)
router.delete('/:id', authorize('admin'), invalidateCache(['subject*']), deleteSubject);

export default router;