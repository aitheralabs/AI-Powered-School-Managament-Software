import { query, getClient } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

export abstract class BaseService {
  /** The current tenant's school ID. Set via forSchool(). */
  protected schoolId: string = '';

  /**
   * Return a school-scoped copy of this service.
   * Controllers call: service.forSchool(req.schoolId!).method(args)
   *
   * Uses Object.create so we get the same class (with all methods) but
   * with a fresh schoolId assigned — no constructor changes required.
   */
  forSchool(id: string): this {
    const scoped = Object.create(this) as this;
    scoped.schoolId = id;
    return scoped;
  }

  /** Assert that schoolId has been set (call inside methods that need it). */
  protected requireSchool(): string {
    if (!this.schoolId) {
      throw new AppError('Tenant context missing — call forSchool(schoolId) before using this service', 500);
    }
    return this.schoolId;
  }

  protected async executeQuery(sql: string, params: any[] = []) {
    try {
      return await query(sql, params);
    } catch (error: any) {
      const code = error?.code || error?.original?.code;
      if (code === '22P02') {
        throw new AppError('Invalid ID format', 400);
      }
      if (code === '23505') {
        throw new AppError('Resource already exists', 409);
      }
      if (code === '40P01') {
        throw new AppError('Service temporarily unavailable', 503);
      }
      throw new AppError('Database operation failed', 500);
    }
  }

  protected async executeTransaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  protected validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Check that an entity exists, scoped to the current school.
   * Adds `AND school_id = <this.schoolId>` automatically when schoolId is set.
   */
  protected async checkEntityExists(
    tableName: string,
    id: string,
    altIdColumn?: string
  ): Promise<any> {
    const isUUID = this.validateUUID(id);
    const schoolFilter = this.schoolId ? ` AND school_id = '${this.schoolId}'` : '';

    let result;
    if (isUUID) {
      result = await this.executeQuery(
        `SELECT * FROM ${tableName} WHERE id = $1${schoolFilter}`,
        [id]
      );
    } else if (altIdColumn) {
      result = await this.executeQuery(
        `SELECT * FROM ${tableName} WHERE (${altIdColumn} = $1 OR id::text = $1)${schoolFilter}`,
        [id]
      );
    } else {
      result = await this.executeQuery(
        `SELECT * FROM ${tableName} WHERE id::text = $1${schoolFilter}`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      const entityName = tableName.replace(/_/g, ' ').slice(0, -1);
      throw new AppError(`${entityName} not found`, 404);
    }

    return result.rows[0];
  }

  protected async generateSequentialId(tableName: string): Promise<string> {
    const result = await this.executeQuery(
      'SELECT generate_sequential_id($1) as next_id',
      [tableName]
    );
    return result.rows[0].next_id.toString();
  }

  protected buildUpdateQuery(
    tableName: string,
    updateData: Record<string, any>,
    idField: string = 'id'
  ): { query: string; values: any[] } {
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
      throw new AppError('No fields to update', 400);
    }

    const queryStr = `UPDATE ${tableName} SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE ${idField} = $${paramCount} RETURNING *`;

    return { query: queryStr, values };
  }

  protected camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  protected transformRowToCamelCase(row: any): any {
    const transformed: any = {};
    for (const [key, value] of Object.entries(row)) {
      transformed[this.snakeToCamel(key)] = value;
    }
    return transformed;
  }
}
