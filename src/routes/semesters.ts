import { Router } from 'express';
import {
  createSemester,
  getSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
  getCurrentSemester
} from '../controllers/semesterController';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Get current active semester (public for authenticated users)
router.get('/current', cacheResponse(3600), getCurrentSemester); // Cache for 1 hour

// Get all semesters with filtering and pagination
router.get('/', cacheResponse(3600), getSemesters); // Cache for 1 hour

// Get semester by ID
router.get('/:id', cacheResponse(3600), getSemesterById); // Cache for 1 hour

// Create semester (admin only)
router.post('/', authorize('admin'), invalidateCache(['semesters:*']), createSemester);

// Update semester (admin only)
router.put('/:id', authorize('admin'), invalidateCache(['semesters:*']), updateSemester);

// Delete semester (admin only)
router.delete('/:id', authorize('admin'), invalidateCache(['semesters:*']), deleteSemester);

export default router;