/**
 * Notification Controller
 *
 * REST endpoints for in-app notifications:
 *   GET    /notifications          - Get user's notifications
 *   PATCH  /notifications/:id/read - Mark single notification as read
 *   PATCH  /notifications/read-all - Mark all notifications as read
 *   DELETE /notifications/:id      - Delete notification
 *   DELETE /notifications          - Delete all notifications
 */

import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getPaginationParams } from '../utils/pagination';

/** GET /notifications — paginated list for current user */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page, limit, offset } = getPaginationParams(req);
  const unreadOnly = req.query.unreadOnly === 'true';

  const whereClause = unreadOnly
    ? `WHERE user_id = $1 AND channel = 'in_app' AND status != 'read'`
    : `WHERE user_id = $1 AND channel = 'in_app'`;

  const [rows, countRow] = await Promise.all([
    query(
      `SELECT id, type, title, body, data, status, created_at, read_at
       FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      [userId]
    ),
  ]);

  // Unread count
  const unreadCount = await query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE user_id = $1 AND channel = 'in_app' AND status != 'read'`,
    [userId]
  );

  const total = parseInt(countRow.rows[0].total);
  res.json({
    success: true,
    data: {
      items: rows.rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    },
  });
});

/** GET /notifications/unread-count */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE user_id = $1 AND channel = 'in_app' AND status != 'read'`,
    [userId]
  );
  res.json({ success: true, data: { count: parseInt(result.rows[0].count) } });
});

/** PATCH /notifications/:id/read — mark single as read */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = await query(
    `UPDATE notifications
     SET status = 'read', read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found', 404);
  }

  res.json({ success: true, message: 'Notification marked as read' });
});

/** PATCH /notifications/read-all — mark all unread as read */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await query(
    `UPDATE notifications
     SET status = 'read', read_at = NOW()
     WHERE user_id = $1 AND channel = 'in_app' AND status != 'read'
     RETURNING id`,
    [userId]
  );

  res.json({
    success: true,
    message: `${result.rows.length} notifications marked as read`,
    data: { updated: result.rows.length },
  });
});

/** DELETE /notifications/:id */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = await query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found', 404);
  }

  res.json({ success: true, message: 'Notification deleted' });
});

/** DELETE /notifications — delete all for user */
export const deleteAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await query(
    `DELETE FROM notifications WHERE user_id = $1 AND channel = 'in_app' RETURNING id`,
    [userId]
  );

  res.json({
    success: true,
    message: `${result.rows.length} notifications deleted`,
    data: { deleted: result.rows.length },
  });
});
