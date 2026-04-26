import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import { query } from '../database/connection';
import { z } from 'zod';
import { validateQuery } from '../middleware/validation';

const router = Router();

// All audit routes require authentication + admin/staff role
router.use(authenticate, resolveTenant, authorize('admin', 'staff'));

const AuditQuerySchema = z.object({
  page:      z.string().optional().default('1').transform(Number),
  limit:     z.string().optional().default('50').transform(Number),
  userId:    z.string().uuid().optional(),
  action:    z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// GET /api/v1/audit — paginated audit log
router.get(
  '/',
  validateQuery(AuditQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, userId, action, startDate, endDate } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE al.school_id = $1';
    const params: any[] = [req.schoolId];

    if (userId) {
      whereClause += ` AND al.user_id = $${params.length + 1}`;
      params.push(userId);
    }
    if (action) {
      whereClause += ` AND al.action ILIKE $${params.length + 1}`;
      params.push(`%${action}%`);
    }
    if (startDate) {
      whereClause += ` AND al.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND al.created_at < ($${params.length + 1}::date + interval '1 day')`;
      params.push(endDate);
    }

    const [logsResult, countResult] = await Promise.all([
      query(
        `SELECT
           al.id,
           al.action,
           al.entity_type,
           al.entity_id,
           al.old_values,
           al.new_values,
           al.ip_address,
           al.user_agent,
           al.created_at,
           u.id   AS user_id,
           u.email,
           u.first_name,
           u.last_name,
           u.role
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM audit_logs al ${whereClause}`,
        params
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        items: logsResult.rows.map((row: any) => ({
          id:         row.id,
          action:     row.action,
          entityType: row.entity_type,
          entityId:   row.entity_id,
          oldValues:  row.old_values,
          newValues:  row.new_values,
          ipAddress:  row.ip_address,
          userAgent:  row.user_agent,
          createdAt:  row.created_at,
          user: row.user_id ? {
            id:        row.user_id,
            email:     row.email,
            firstName: row.first_name,
            lastName:  row.last_name,
            role:      row.role,
          } : null,
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

// GET /api/v1/audit/:id — single audit log entry
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await query(
      `SELECT
         al.*,
         u.email,
         u.first_name,
         u.last_name,
         u.role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.id = $1 AND al.school_id = $2`,
      [id, req.schoolId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Audit log not found' });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id:         row.id,
        action:     row.action,
        entityType: row.entity_type,
        entityId:   row.entity_id,
        oldValues:  row.old_values,
        newValues:  row.new_values,
        ipAddress:  row.ip_address,
        userAgent:  row.user_agent,
        createdAt:  row.created_at,
        user: row.user_id ? {
          id:        row.user_id,
          email:     row.email,
          firstName: row.first_name,
          lastName:  row.last_name,
          role:      row.role,
        } : null,
      },
    });
  })
);

export default router;
