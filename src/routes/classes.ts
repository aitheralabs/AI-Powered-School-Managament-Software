import { Router } from 'express';
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  assignSubjectToClass,
  removeSubjectFromClass,
  getClassStatistics,
  enrollStudentToClass,
  bulkEnrollStudentsToClass,
  transferStudent,
  getClassStudents,
  getClassSubjects,
  getClassStats,
  removeStudentFromClass,
} from '../controllers/classController';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireActiveSubscription } from '../middleware/tenant';
import { cacheResponse, invalidateCache } from '../middleware/caching';

const router = Router();

// All routes require authentication
router.use(authenticate, resolveTenant, requireActiveSubscription);

// Class-level statistics (admin/staff) — must be before /:id
router.get('/stats', authorize('admin', 'staff'), getClassStats);

// Get all classes with filtering and pagination
router.get('/', cacheResponse(300), getClasses); // Cache for 5 minutes

// Get class by ID
router.get('/:id', cacheResponse(600), getClassById); // Cache for 10 minutes

// Get class statistics (admin and teachers only)
router.get('/:id/statistics', authorize('admin', 'teacher'), cacheResponse(300), getClassStatistics); // Cache for 5 minutes

// Get class students (admin and teachers only)
router.get('/:id/students', authorize('admin', 'teacher'), cacheResponse(300), getClassStudents); // Cache for 5 minutes

// Get class subjects (admin and teachers only)
router.get('/:id/subjects', authorize('admin', 'teacher'), cacheResponse(600), getClassSubjects); // Cache for 10 minutes

// Create class (admin and staff)
router.post('/', authorize('admin', 'staff'), invalidateCache(['class*', 'classes:*']), createClass);

// Assign subject to class (admin only)
router.post('/:id/subjects', authorize('admin'), invalidateCache(['class*', 'classes:*']), assignSubjectToClass);

// Enroll single student to class (admin only)
router.post('/:id/enroll', authorize('admin'), invalidateCache(['class*', 'students:*']), enrollStudentToClass);

// Bulk enroll students to class (admin only)
router.post('/:id/enroll/bulk', authorize('admin'), invalidateCache(['class*', 'students:*']), bulkEnrollStudentsToClass);

// Transfer student between classes (admin only)
router.post('/transfer', authorize('admin'), invalidateCache(['class*', 'students:*']), transferStudent);

// Update class (admin only)
router.put('/:id', authorize('admin'), invalidateCache(['class*', 'classes:*']), updateClass);

// Remove student from class (admin only)
router.delete('/:id/students/:studentId', authorize('admin'), invalidateCache(['class*', 'students:*']), removeStudentFromClass);

// Remove subject from class (admin only)
router.delete('/:id/subjects/:subjectId', authorize('admin'), invalidateCache(['class*', 'classes:*']), removeSubjectFromClass);

// Delete class (admin only)
router.delete('/:id', authorize('admin'), invalidateCache(['class*', 'classes:*']), deleteClass);

export default router;