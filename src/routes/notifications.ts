import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate, resolveTenant);

router.get('/',            getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all',  markAllAsRead);
router.patch('/:id/read',  markAsRead);
router.delete('/',         deleteAllNotifications);
router.delete('/:id',      deleteNotification);

export default router;
