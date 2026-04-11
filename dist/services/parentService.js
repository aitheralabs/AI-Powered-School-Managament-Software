"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const auth_1 = require("../utils/auth");
class ParentService extends baseService_1.BaseService {
    async createParent(parentData) {
        const schoolId = this.requireSchool();
        const existingUser = await this.executeQuery('SELECT id FROM users WHERE email = $1 AND school_id = $2', [parentData.email, schoolId]);
        if (existingUser.rows.length > 0)
            throw new errorHandler_1.AppError('User with this email already exists', 409);
        const passwordHash = await (0, auth_1.hashPassword)(parentData.password);
        const sequentialId = await this.generateSequentialId('users');
        const result = await this.executeQuery(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, address, alt_id, school_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, alt_id, first_name, last_name, email, role, phone, address, is_active, created_at, updated_at`, [parentData.firstName, parentData.lastName, parentData.email, passwordHash, 'parent', parentData.phone || null, parentData.address || null, sequentialId, schoolId]);
        return this.transformParentResponse(result.rows[0]);
    }
    async getParents(req) {
        return await this.executeParentsQuery(req);
    }
    async executeParentsQuery(req) {
        const schoolId = this.requireSchool();
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
        const { isActive, search } = req.query;
        let whereClause = "WHERE role = 'parent' AND school_id = $1";
        const queryParams = [schoolId];
        if (isActive !== undefined) {
            whereClause += ` AND is_active = $${queryParams.length + 1}`;
            queryParams.push(isActive === 'true');
        }
        if (search) {
            whereClause += ` AND (first_name ILIKE $${queryParams.length + 1} OR last_name ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`;
            queryParams.push(`%${search}%`);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM users ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT id, alt_id, first_name, last_name, email, role, phone, address, is_active, created_at, updated_at
       FROM users ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        return {
            parents: result.rows.map((parent) => this.transformParentResponse(parent)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getParentById(id) {
        const parent = await this.checkEntityExists('users', id, 'alt_id');
        if (parent.role !== 'parent')
            throw new errorHandler_1.AppError('User is not a parent', 400);
        const childrenResult = await this.executeQuery(`SELECT sp.id as relationship_id, sp.relationship_type, sp.is_primary,
              s.id as student_id, s.student_id as student_number, s.class_id,
              u.first_name, u.last_name,
              c.name as class_name, c.grade, c.section
       FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`, [parent.id]);
        return {
            ...this.transformParentResponse(parent),
            children: childrenResult.rows.map((child) => ({
                relationshipId: child.relationship_id,
                relationshipType: child.relationship_type,
                isPrimary: child.is_primary,
                student: {
                    id: child.student_id, studentId: child.student_number,
                    name: `${child.first_name} ${child.last_name}`,
                    class: { id: child.class_id, name: child.class_name, grade: child.grade, section: child.section },
                },
            })),
        };
    }
    async updateParent(id, updateData) {
        const existingParent = await this.checkEntityExists('users', id, 'alt_id');
        if (existingParent.role !== 'parent')
            throw new errorHandler_1.AppError('User is not a parent', 400);
        const { query: updateQuery, values } = this.buildUpdateQuery('users', updateData);
        values.push(existingParent.id);
        const result = await this.executeQuery(updateQuery, values);
        return this.transformParentResponse(result.rows[0]);
    }
    async deleteParent(id) {
        const existingParent = await this.checkEntityExists('users', id, 'alt_id');
        if (existingParent.role !== 'parent')
            throw new errorHandler_1.AppError('User is not a parent', 400);
        const childrenCheck = await this.executeQuery(`SELECT COUNT(*) as children_count FROM student_parents sp JOIN students s ON sp.student_id = s.id WHERE sp.parent_user_id = $1 AND s.is_active = true`, [existingParent.id]);
        const childrenCount = parseInt(childrenCheck.rows[0].children_count);
        if (childrenCount > 0) {
            throw new errorHandler_1.AppError(`Cannot delete parent. They have ${childrenCount} active children relationships.`, 409);
        }
        await this.executeQuery('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [existingParent.id]);
        return { success: true };
    }
    async linkStudentToParent(linkData) {
        const schoolId = this.requireSchool();
        const studentExists = await this.executeQuery(`SELECT s.id, s.student_id, u.first_name, u.last_name
       FROM students s JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 AND s.school_id = $2 AND s.is_active = true AND u.is_active = true`, [linkData.studentId, schoolId]);
        if (studentExists.rows.length === 0)
            throw new errorHandler_1.AppError('Student not found or inactive', 404);
        const parentExists = await this.executeQuery(`SELECT id, first_name, last_name FROM users WHERE id = $1 AND school_id = $2 AND role = 'parent' AND is_active = true`, [linkData.parentUserId, schoolId]);
        if (parentExists.rows.length === 0)
            throw new errorHandler_1.AppError('Parent not found or inactive', 404);
        const existingRelationship = await this.executeQuery('SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2', [linkData.studentId, linkData.parentUserId]);
        if (existingRelationship.rows.length > 0)
            throw new errorHandler_1.AppError('Relationship between student and parent already exists', 409);
        return await this.executeTransaction(async (client) => {
            if (linkData.isPrimary) {
                await client.query('UPDATE student_parents SET is_primary = false WHERE student_id = $1', [linkData.studentId]);
            }
            const result = await client.query(`INSERT INTO student_parents (student_id, parent_user_id, relationship_type, is_primary, school_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, student_id, parent_user_id, relationship_type, is_primary, created_at, updated_at`, [linkData.studentId, linkData.parentUserId, linkData.relationshipType, linkData.isPrimary || false, schoolId]);
            const relationship = result.rows[0];
            const student = studentExists.rows[0];
            const parent = parentExists.rows[0];
            return {
                id: relationship.id, studentId: relationship.student_id, parentUserId: relationship.parent_user_id,
                relationshipType: relationship.relationship_type, isPrimary: relationship.is_primary,
                createdAt: relationship.created_at, updatedAt: relationship.updated_at,
                student: { id: student.id, studentId: student.student_id, name: `${student.first_name} ${student.last_name}` },
                parent: { id: parent.id, name: `${parent.first_name} ${parent.last_name}` },
            };
        });
    }
    async unlinkStudentFromParent(studentId, parentUserId) {
        const existingRelationship = await this.executeQuery('SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2', [studentId, parentUserId]);
        if (existingRelationship.rows.length === 0)
            throw new errorHandler_1.AppError('Relationship between student and parent not found', 404);
        await this.executeQuery('DELETE FROM student_parents WHERE student_id = $1 AND parent_user_id = $2', [studentId, parentUserId]);
        return { success: true };
    }
    async getParentChildren(parentId) {
        const parent = await this.checkEntityExists('users', parentId, 'alt_id');
        if (parent.role !== 'parent')
            throw new errorHandler_1.AppError('User is not a parent', 400);
        const childrenResult = await this.executeQuery(`SELECT sp.id as relationship_id, sp.relationship_type, sp.is_primary,
              s.id as student_id, s.student_id as student_number, s.class_id, s.enrollment_date,
              u.first_name, u.last_name, u.email,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name
       FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`, [parent.id]);
        const children = childrenResult.rows.map((child) => ({
            relationshipId: child.relationship_id,
            relationshipType: child.relationship_type,
            isPrimary: child.is_primary,
            student: {
                id: child.student_id, studentId: child.student_number,
                name: `${child.first_name} ${child.last_name}`, email: child.email,
                enrollmentDate: child.enrollment_date,
                class: { id: child.class_id, name: child.class_name, grade: child.grade, section: child.section, academicYear: child.academic_year_name },
            },
        }));
        return { parent: this.transformParentResponse(parent), children, totalChildren: children.length };
    }
    async getParentDashboard(parentId) {
        const schoolId = this.requireSchool();
        const parent = await this.checkEntityExists('users', parentId, 'alt_id');
        if (parent.role !== 'parent')
            throw new errorHandler_1.AppError('User is not a parent', 400);
        const childrenResult = await this.executeQuery(`SELECT s.id, s.student_id as student_number, u.first_name, u.last_name,
              c.name as class_name, c.grade, c.section
       FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true AND s.school_id = $2`, [parent.id, schoolId]);
        const childrenIds = childrenResult.rows.map((r) => r.id);
        let feeSummary = { totalDue: 0, totalPaid: 0, overdueFees: 0 };
        let attendanceSummary = [];
        if (childrenIds.length > 0) {
            const placeholders = childrenIds.map((_, i) => `$${i + 2}`).join(', ');
            const feeResult = await this.executeQuery(`SELECT COALESCE(SUM(sf.amount), 0) as total_due,
                COALESCE(SUM(CASE WHEN sf.status = 'paid' THEN sf.amount ELSE 0 END), 0) as total_paid,
                COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_count
         FROM student_fees sf
         WHERE sf.student_id IN (${placeholders}) AND sf.school_id = $1`, [schoolId, ...childrenIds]);
            const fr = feeResult.rows[0];
            feeSummary = { totalDue: parseFloat(fr.total_due), totalPaid: parseFloat(fr.total_paid), overdueFees: parseInt(fr.overdue_count) };
            const today = new Date().toISOString().split('T')[0];
            const attResult = await this.executeQuery(`SELECT s.id, u.first_name, u.last_name,
                COUNT(a.id) as total_days,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days
         FROM students s
         JOIN users u ON s.user_id = u.id
         LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= (CURRENT_DATE - INTERVAL '30 days')
         WHERE s.id IN (${placeholders}) AND s.school_id = $1
         GROUP BY s.id, u.first_name, u.last_name`, [schoolId, ...childrenIds]);
            attendanceSummary = attResult.rows.map((r) => ({
                studentId: r.id,
                name: `${r.first_name} ${r.last_name}`,
                totalDays: parseInt(r.total_days),
                presentDays: parseInt(r.present_days),
                percentage: r.total_days > 0 ? Math.round((r.present_days / r.total_days) * 100) : 0,
            }));
        }
        return {
            parent: this.transformParentResponse(parent),
            children: childrenResult.rows.map((c) => ({
                id: c.id, studentId: c.student_number,
                name: `${c.first_name} ${c.last_name}`,
                class: `${c.grade}-${c.section} (${c.class_name})`,
            })),
            feeSummary,
            attendanceSummary,
        };
    }
    transformParentResponse(parent) {
        return {
            id: parent.id, altId: parent.alt_id, firstName: parent.first_name, lastName: parent.last_name,
            email: parent.email, role: parent.role, phone: parent.phone, address: parent.address,
            isActive: parent.is_active, createdAt: parent.created_at, updatedAt: parent.updated_at,
        };
    }
}
exports.ParentService = ParentService;
//# sourceMappingURL=parentService.js.map