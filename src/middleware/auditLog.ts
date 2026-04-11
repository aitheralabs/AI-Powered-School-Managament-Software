/**
 * Audit Logging Middleware
 *
 * Creates an immutable audit trail for all write operations (POST, PUT, PATCH, DELETE).
 * Logs: who did what, to which entity, when, from where.
 * Used for compliance, debugging, and security forensics.
 */

import { Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';

interface AuditEntry {
  schoolId?: string;
  userId?: string;
  userRole?: string;
  action: string;
  entity?: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs
         (school_id, user_id, user_role, action, entity, entity_id, old_data, new_data, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::inet,$10)`,
      [
        entry.schoolId || null,
        entry.userId || null,
        entry.userRole || null,
        entry.action,
        entry.entity || null,
        entry.entityId || null,
        entry.oldData ? JSON.stringify(entry.oldData) : null,
        entry.newData ? JSON.stringify(entry.newData) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
      ]
    );
  } catch (err) {
    // Audit log failure must never crash the main request
    console.error('[AuditLog] Failed to write audit entry:', err);
  }
}

/**
 * Express middleware that automatically logs write operations.
 * Attach per-router or per-route as needed.
 *
 * Usage:
 *   router.post('/', auditMiddleware('student.create', 'students'), createStudent);
 */
export const auditMiddleware = (action: string, entity?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Intercept response to capture the created/updated entity id
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      const entityId = body?.data?.id || body?.id;
      const user = req.user as any;

      writeAuditLog({
        schoolId: req.schoolId,
        userId: user?.id,
        userRole: user?.role,
        action,
        entity,
        entityId,
        newData: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      }).catch(() => {});  // fire-and-forget

      return originalJson(body);
    };
    next();
  };
};
