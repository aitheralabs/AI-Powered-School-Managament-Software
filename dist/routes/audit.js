"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const connection_1 = require("../database/connection");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.resolveTenant, (0, auth_1.authorize)('admin', 'staff'));
const AuditQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('50').transform(Number),
    userId: zod_1.z.string().uuid().optional(),
    action: zod_1.z.string().optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
router.get('/', (0, validation_1.validateQuery)(AuditQuerySchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, userId, action, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE al.school_id = $1';
    const params = [req.schoolId];
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
        (0, connection_1.query)(`SELECT
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
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
        (0, connection_1.query)(`SELECT COUNT(*) AS total FROM audit_logs al ${whereClause}`, params),
    ]);
    const total = parseInt(countResult.rows[0].total);
    res.json({
        success: true,
        data: {
            items: logsResult.rows.map((row) => ({
                id: row.id,
                action: row.action,
                entityType: row.entity_type,
                entityId: row.entity_id,
                oldValues: row.old_values,
                newValues: row.new_values,
                ipAddress: row.ip_address,
                userAgent: row.user_agent,
                createdAt: row.created_at,
                user: row.user_id ? {
                    id: row.user_id,
                    email: row.email,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    role: row.role,
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
}));
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await (0, connection_1.query)(`SELECT
         al.*,
         u.email,
         u.first_name,
         u.last_name,
         u.role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.id = $1 AND al.school_id = $2`, [id, req.schoolId]);
    if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Audit log not found' });
        return;
    }
    const row = result.rows[0];
    res.json({
        success: true,
        data: {
            id: row.id,
            action: row.action,
            entityType: row.entity_type,
            entityId: row.entity_id,
            oldValues: row.old_values,
            newValues: row.new_values,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            createdAt: row.created_at,
            user: row.user_id ? {
                id: row.user_id,
                email: row.email,
                firstName: row.first_name,
                lastName: row.last_name,
                role: row.role,
            } : null,
        },
    });
}));
exports.default = router;
//# sourceMappingURL=audit.js.map