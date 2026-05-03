"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
class BaseService {
    constructor() {
        this.schoolId = '';
    }
    forSchool(id) {
        const scoped = Object.create(this);
        scoped.schoolId = id;
        return scoped;
    }
    requireSchool() {
        if (!this.schoolId) {
            throw new errorHandler_1.AppError('Tenant context missing — call forSchool(schoolId) before using this service', 500);
        }
        return this.schoolId;
    }
    async executeQuery(sql, params = []) {
        try {
            return await (0, connection_1.query)(sql, params);
        }
        catch (error) {
            const code = error?.code || error?.original?.code;
            if (code === '22P02') {
                throw new errorHandler_1.AppError('Invalid ID format', 400);
            }
            if (code === '23505') {
                throw new errorHandler_1.AppError('Resource already exists', 409);
            }
            if (code === '40P01') {
                throw new errorHandler_1.AppError('Service temporarily unavailable', 503);
            }
            throw new errorHandler_1.AppError('Database operation failed', 500);
        }
    }
    async executeTransaction(callback) {
        const client = await (0, connection_1.getClient)();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    validateUUID(id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }
    async checkEntityExists(tableName, id, altIdColumn) {
        const isUUID = this.validateUUID(id);
        const params = [id];
        let schoolCondition = '';
        if (this.schoolId) {
            params.push(this.schoolId);
            schoolCondition = ` AND school_id = $${params.length}`;
        }
        let result;
        if (isUUID) {
            result = await this.executeQuery(`SELECT * FROM ${tableName} WHERE id = $1${schoolCondition}`, params);
        }
        else if (altIdColumn) {
            result = await this.executeQuery(`SELECT * FROM ${tableName} WHERE (${altIdColumn} = $1 OR id::text = $1)${schoolCondition}`, params);
        }
        else {
            result = await this.executeQuery(`SELECT * FROM ${tableName} WHERE id::text = $1${schoolCondition}`, params);
        }
        if (result.rows.length === 0) {
            const entityName = tableName.replace(/_/g, ' ').slice(0, -1);
            throw new errorHandler_1.AppError(`${entityName} not found`, 404);
        }
        return result.rows[0];
    }
    async generateSequentialId(tableName) {
        const result = await this.executeQuery('SELECT generate_sequential_id($1) as next_id', [tableName]);
        return result.rows[0].next_id.toString();
    }
    buildUpdateQuery(tableName, updateData, idField = 'id') {
        const updateFields = [];
        const values = [];
        let paramCount = 1;
        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                updateFields.push(`${this.camelToSnake(key)} = $${paramCount++}`);
                values.push(value);
            }
        }
        if (updateFields.length === 0) {
            throw new errorHandler_1.AppError('No fields to update', 400);
        }
        const queryStr = `UPDATE ${tableName} SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE ${idField} = $${paramCount} RETURNING *`;
        return { query: queryStr, values };
    }
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    transformRowToCamelCase(row) {
        const transformed = {};
        for (const [key, value] of Object.entries(row)) {
            transformed[this.snakeToCamel(key)] = value;
        }
        return transformed;
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=baseService.js.map