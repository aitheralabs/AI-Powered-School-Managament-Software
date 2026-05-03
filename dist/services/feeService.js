"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
class FeeService extends baseService_1.BaseService {
    async createFeeCategory(feeCategoryData) {
        const schoolId = this.requireSchool();
        let academicYearId = feeCategoryData.academicYearId;
        if (!academicYearId) {
            const activeYear = await this.executeQuery('SELECT id, name FROM academic_years WHERE school_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1', [schoolId]);
            if (activeYear.rows.length === 0)
                throw new errorHandler_1.AppError('No active academic year found', 404);
            academicYearId = activeYear.rows[0].id;
        }
        const academicYearExists = await this.executeQuery('SELECT id, name FROM academic_years WHERE id = $1 AND school_id = $2 AND is_active = true', [academicYearId, schoolId]);
        if (academicYearExists.rows.length === 0)
            throw new errorHandler_1.AppError('Academic year not found or inactive', 404);
        const existingCategory = await this.executeQuery('SELECT id FROM fee_categories WHERE name = $1 AND academic_year_id = $2 AND school_id = $3', [feeCategoryData.name, academicYearId, schoolId]);
        if (existingCategory.rows.length > 0) {
            throw new errorHandler_1.AppError('Fee category with this name already exists for the academic year', 409);
        }
        const sequentialId = await this.generateSequentialId('fee_categories');
        const result = await this.executeQuery(`INSERT INTO fee_categories (name, description, amount, frequency, is_mandatory, academic_year_id, alt_id, school_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, alt_id, name, description, amount, frequency, is_mandatory, academic_year_id, is_active, created_at, updated_at`, [
            feeCategoryData.name, feeCategoryData.description || null, feeCategoryData.amount,
            feeCategoryData.frequency, feeCategoryData.isMandatory, academicYearId,
            sequentialId, schoolId
        ]);
        const feeCategory = result.rows[0];
        const academicYear = academicYearExists.rows[0];
        return {
            ...this.transformFeeCategoryResponse(feeCategory),
            academicYear: { id: academicYear.id, name: academicYear.name },
        };
    }
    async getFeeCategories(req) {
        return await this.executeFeeCategoriesQuery(req);
    }
    async executeFeeCategoriesQuery(req) {
        const schoolId = this.requireSchool();
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'name');
        const { isActive, academicYearId, frequency, isMandatory } = req.query;
        let whereClause = 'WHERE fc.school_id = $1';
        const queryParams = [schoolId];
        if (isActive !== undefined) {
            whereClause += ` AND fc.is_active = $${queryParams.length + 1}`;
            queryParams.push(isActive === 'true');
        }
        if (academicYearId) {
            whereClause += ` AND fc.academic_year_id = $${queryParams.length + 1}`;
            queryParams.push(academicYearId);
        }
        if (frequency) {
            whereClause += ` AND fc.frequency = $${queryParams.length + 1}`;
            queryParams.push(frequency);
        }
        if (isMandatory !== undefined) {
            whereClause += ` AND fc.is_mandatory = $${queryParams.length + 1}`;
            queryParams.push(isMandatory === 'true');
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM fee_categories fc JOIN academic_years ay ON fc.academic_year_id = ay.id ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT fc.id, fc.alt_id, fc.name, fc.description, fc.amount, fc.frequency, fc.is_mandatory,
              fc.academic_year_id, fc.is_active, fc.created_at, fc.updated_at,
              ay.name as academic_year_name
       FROM fee_categories fc
       JOIN academic_years ay ON fc.academic_year_id = ay.id
       ${whereClause}
       ORDER BY fc.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const feeCategories = result.rows.map((category) => ({
            ...this.transformFeeCategoryResponse(category),
            academicYear: { id: category.academic_year_id, name: category.academic_year_name },
        }));
        return { feeCategories, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async getFeeCategoryById(id) {
        const feeCategory = await this.checkEntityExists('fee_categories', id, 'alt_id');
        const academicYearResult = await this.executeQuery('SELECT id, name FROM academic_years WHERE id = $1', [feeCategory.academic_year_id]);
        const studentsResult = await this.executeQuery(`SELECT COUNT(*) as total_students,
              COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as paid_students,
              COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) as pending_students,
              COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_students,
              COALESCE(SUM(sf.amount), 0) as total_amount,
              COALESCE(SUM(CASE WHEN sf.status = 'paid' THEN sf.amount ELSE 0 END), 0) as paid_amount
       FROM student_fees sf WHERE sf.fee_category_id = $1`, [feeCategory.id]);
        const stats = studentsResult.rows[0];
        return {
            ...this.transformFeeCategoryResponse(feeCategory),
            academicYear: { id: academicYearResult.rows[0].id, name: academicYearResult.rows[0].name },
            statistics: {
                totalStudents: parseInt(stats.total_students),
                paidStudents: parseInt(stats.paid_students),
                pendingStudents: parseInt(stats.pending_students),
                overdueStudents: parseInt(stats.overdue_students),
                totalAmount: parseFloat(stats.total_amount),
                paidAmount: parseFloat(stats.paid_amount),
                pendingAmount: parseFloat(stats.total_amount) - parseFloat(stats.paid_amount),
            },
        };
    }
    async updateFeeCategory(id, updateData) {
        const existingCategory = await this.checkEntityExists('fee_categories', id, 'alt_id');
        const actualCategoryId = existingCategory.id;
        if (updateData.name && updateData.name !== existingCategory.name) {
            const nameConflict = await this.executeQuery('SELECT id FROM fee_categories WHERE name = $1 AND academic_year_id = $2 AND id != $3', [updateData.name, existingCategory.academic_year_id, actualCategoryId]);
            if (nameConflict.rows.length > 0)
                throw new errorHandler_1.AppError('Fee category with this name already exists for the academic year', 409);
        }
        const { query: updateQuery, values } = this.buildUpdateQuery('fee_categories', updateData);
        values.push(actualCategoryId);
        const result = await this.executeQuery(updateQuery, values);
        return this.transformFeeCategoryResponse(result.rows[0]);
    }
    async deleteFeeCategory(id) {
        const existingCategory = await this.checkEntityExists('fee_categories', id, 'alt_id');
        const actualCategoryId = existingCategory.id;
        const dependenciesCheck = await this.executeQuery(`SELECT
         (SELECT COUNT(*) FROM student_fees WHERE fee_category_id = $1) as student_assignments,
         (SELECT COUNT(*) FROM payments p JOIN student_fees sf ON p.student_fee_id = sf.id WHERE sf.fee_category_id = $1) as payment_records`, [actualCategoryId]);
        const dependencies = dependenciesCheck.rows[0];
        const totalDependencies = parseInt(dependencies.student_assignments) + parseInt(dependencies.payment_records);
        if (totalDependencies > 0) {
            throw new errorHandler_1.AppError(`Cannot delete fee category. It has ${dependencies.student_assignments} student assignments and ${dependencies.payment_records} payment records.`, 409);
        }
        await this.executeQuery('UPDATE fee_categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [actualCategoryId]);
        return { success: true };
    }
    async assignFeesToStudents(assignmentData) {
        const schoolId = this.requireSchool();
        const feeCategoryExists = await this.executeQuery('SELECT id, name, amount FROM fee_categories WHERE id = $1 AND school_id = $2 AND is_active = true', [assignmentData.feeCategoryId, schoolId]);
        if (feeCategoryExists.rows.length === 0)
            throw new errorHandler_1.AppError('Fee category not found or inactive', 404);
        const feeCategory = feeCategoryExists.rows[0];
        return await this.executeTransaction(async (client) => {
            const assignments = [];
            for (const studentId of assignmentData.studentIds) {
                const studentExists = await client.query('SELECT id, student_id FROM students WHERE id = $1 AND school_id = $2 AND is_active = true', [studentId, schoolId]);
                if (studentExists.rows.length === 0)
                    throw new errorHandler_1.AppError(`Student with ID ${studentId} not found or inactive`, 404);
                const existingAssignment = await client.query('SELECT id FROM student_fees WHERE student_id = $1 AND fee_category_id = $2 AND school_id = $3', [studentId, assignmentData.feeCategoryId, schoolId]);
                if (existingAssignment.rows.length > 0)
                    continue;
                const result = await client.query(`INSERT INTO student_fees (student_id, fee_category_id, amount, due_date, status, school_id)
           VALUES ($1, $2, $3, $4, 'pending', $5)
           RETURNING id, student_id, fee_category_id, amount, due_date, status, created_at, updated_at`, [studentId, assignmentData.feeCategoryId, feeCategory.amount - (assignmentData.discountAmount || 0), assignmentData.dueDate, schoolId]);
                const student = studentExists.rows[0];
                assignments.push({
                    ...this.transformStudentFeeResponse(result.rows[0]),
                    student: { id: student.id, studentId: student.student_id },
                });
            }
            return { feeCategoryId: assignmentData.feeCategoryId, feeCategoryName: feeCategory.name, totalAssignments: assignments.length, assignments };
        });
    }
    async getStudentFees(req) {
        const schoolId = this.requireSchool();
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'due_date');
        const { studentId, feeCategoryId, status, overdue } = req.query;
        let whereClause = 'WHERE sf.school_id = $1';
        const queryParams = [schoolId];
        if (studentId) {
            whereClause += ` AND sf.student_id = $${queryParams.length + 1}`;
            queryParams.push(studentId);
        }
        if (feeCategoryId) {
            whereClause += ` AND sf.fee_category_id = $${queryParams.length + 1}`;
            queryParams.push(feeCategoryId);
        }
        if (status) {
            whereClause += ` AND sf.status = $${queryParams.length + 1}`;
            queryParams.push(status);
        }
        if (overdue === 'true')
            whereClause += ` AND sf.due_date < CURRENT_DATE AND sf.status != 'paid'`;
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM student_fees sf JOIN students s ON sf.student_id = s.id JOIN fee_categories fc ON sf.fee_category_id = fc.id ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT sf.id, sf.student_id, sf.fee_category_id, sf.amount, sf.due_date, sf.status, sf.created_at, sf.updated_at,
              s.student_id as student_number, u.first_name, u.last_name,
              fc.name as fee_category_name, fc.frequency,
              COALESCE(SUM(p.amount), 0) as paid_amount
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       LEFT JOIN payments p ON sf.id = p.student_fee_id
       ${whereClause}
       GROUP BY sf.id, s.student_id, u.first_name, u.last_name, fc.name, fc.frequency
       ORDER BY sf.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const studentFees = result.rows.map((fee) => ({
            ...this.transformStudentFeeResponse(fee),
            student: { id: fee.student_id, studentId: fee.student_number, name: `${fee.first_name} ${fee.last_name}` },
            feeCategory: { id: fee.fee_category_id, name: fee.fee_category_name, frequency: fee.frequency },
            paidAmount: parseFloat(fee.paid_amount),
            remainingAmount: parseFloat(fee.amount) - parseFloat(fee.paid_amount),
        }));
        return { studentFees, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async getStudentFeeById(id) {
        const schoolId = this.requireSchool();
        const result = await this.executeQuery(`SELECT sf.id, sf.student_id, sf.fee_category_id, sf.amount, sf.due_date, sf.status, sf.created_at, sf.updated_at,
              s.student_id as student_number, u.first_name, u.last_name,
              fc.name as fee_category_name, fc.frequency,
              COALESCE(SUM(p.amount), 0) as paid_amount
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       LEFT JOIN payments p ON sf.id = p.student_fee_id
       WHERE sf.id = $1 AND sf.school_id = $2
       GROUP BY sf.id, s.student_id, u.first_name, u.last_name, fc.name, fc.frequency`, [id, schoolId]);
        if (result.rows.length === 0)
            throw new errorHandler_1.AppError('Student fee not found', 404);
        const fee = result.rows[0];
        return {
            ...this.transformStudentFeeResponse(fee),
            student: { id: fee.student_id, studentId: fee.student_number, name: `${fee.first_name} ${fee.last_name}` },
            feeCategory: { id: fee.fee_category_id, name: fee.fee_category_name, frequency: fee.frequency },
            paidAmount: parseFloat(fee.paid_amount),
            remainingAmount: parseFloat(fee.amount) - parseFloat(fee.paid_amount),
        };
    }
    async updateStudentFee(id, updateData) {
        const schoolId = this.requireSchool();
        const existing = await this.executeQuery('SELECT id, status FROM student_fees WHERE id = $1 AND school_id = $2', [id, schoolId]);
        if (existing.rows.length === 0)
            throw new errorHandler_1.AppError('Student fee not found', 404);
        if (existing.rows[0].status === 'paid')
            throw new errorHandler_1.AppError('Cannot modify a paid fee record', 400);
        const fields = [];
        const values = [];
        if (updateData.dueDate !== undefined) {
            fields.push(`due_date = $${values.length + 1}`);
            values.push(updateData.dueDate);
        }
        if (updateData.amount !== undefined) {
            fields.push(`amount = $${values.length + 1}`);
            values.push(updateData.amount);
        }
        if (updateData.status !== undefined) {
            fields.push(`status = $${values.length + 1}`);
            values.push(updateData.status);
        }
        if (fields.length === 0)
            throw new errorHandler_1.AppError('No fields to update', 400);
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id, schoolId);
        const result = await this.executeQuery(`UPDATE student_fees SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND school_id = $${values.length} RETURNING *`, values);
        return this.transformStudentFeeResponse(result.rows[0]);
    }
    async assignFeesToClass(assignmentData) {
        const schoolId = this.requireSchool();
        const feeCategoryExists = await this.executeQuery('SELECT id, name, amount FROM fee_categories WHERE id = $1 AND school_id = $2 AND is_active = true', [assignmentData.feeCategoryId, schoolId]);
        if (feeCategoryExists.rows.length === 0)
            throw new errorHandler_1.AppError('Fee category not found or inactive', 404);
        const classExists = await this.executeQuery('SELECT id, name, grade, section FROM classes WHERE id = $1 AND school_id = $2 AND is_active = true', [assignmentData.classId, schoolId]);
        if (classExists.rows.length === 0)
            throw new errorHandler_1.AppError('Class not found or inactive', 404);
        const studentsResult = await this.executeQuery('SELECT id FROM students WHERE class_id = $1 AND school_id = $2 AND is_active = true', [assignmentData.classId, schoolId]);
        if (studentsResult.rows.length === 0)
            throw new errorHandler_1.AppError('No active students found in this class', 404);
        const studentIds = studentsResult.rows.map((r) => r.id);
        const feeCategory = feeCategoryExists.rows[0];
        const cls = classExists.rows[0];
        const amount = parseFloat(feeCategory.amount) - (assignmentData.discountAmount || 0);
        return await this.executeTransaction(async (client) => {
            let assigned = 0;
            let skipped = 0;
            for (const studentId of studentIds) {
                const existing = await client.query('SELECT id FROM student_fees WHERE student_id = $1 AND fee_category_id = $2 AND school_id = $3', [studentId, assignmentData.feeCategoryId, schoolId]);
                if (existing.rows.length > 0) {
                    skipped++;
                    continue;
                }
                await client.query(`INSERT INTO student_fees (student_id, fee_category_id, amount, due_date, status, school_id)
           VALUES ($1, $2, $3, $4, 'pending', $5)`, [studentId, assignmentData.feeCategoryId, amount, assignmentData.dueDate, schoolId]);
                assigned++;
            }
            return {
                class: { id: cls.id, name: cls.name, grade: cls.grade, section: cls.section },
                feeCategory: { id: feeCategory.id, name: feeCategory.name },
                totalStudents: studentIds.length,
                assigned,
                skipped,
            };
        });
    }
    transformFeeCategoryResponse(feeCategory) {
        return {
            id: feeCategory.id, altId: feeCategory.alt_id, name: feeCategory.name,
            description: feeCategory.description, amount: parseFloat(feeCategory.amount),
            frequency: feeCategory.frequency, isMandatory: feeCategory.is_mandatory,
            academicYearId: feeCategory.academic_year_id, isActive: feeCategory.is_active,
            createdAt: feeCategory.created_at, updatedAt: feeCategory.updated_at,
        };
    }
    transformStudentFeeResponse(studentFee) {
        return {
            id: studentFee.id, studentId: studentFee.student_id, feeCategoryId: studentFee.fee_category_id,
            amount: parseFloat(studentFee.amount), dueDate: studentFee.due_date, status: studentFee.status,
            createdAt: studentFee.created_at, updatedAt: studentFee.updated_at,
        };
    }
}
exports.FeeService = FeeService;
//# sourceMappingURL=feeService.js.map