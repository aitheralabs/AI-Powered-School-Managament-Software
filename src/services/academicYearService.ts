import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateAcademicYear, UpdateAcademicYear } from '../types/academic';
import { getPaginationParams } from '../utils/pagination';
import { cacheService, CacheKeys, CacheTTL } from './cacheService';

export class AcademicYearService extends BaseService {
  async createAcademicYear(academicYearData: CreateAcademicYear) {
    const schoolId = this.requireSchool();

    const existingYear = await this.executeQuery(
      'SELECT id FROM academic_years WHERE name = $1 AND school_id = $2',
      [academicYearData.name, schoolId]
    );
    if (existingYear.rows.length > 0) {
      throw new AppError('Academic year with this name already exists', 409);
    }

    const result = await this.executeTransaction(async (client) => {
      if (academicYearData.isActive) {
        await client.query(
          'UPDATE academic_years SET is_active = false WHERE is_active = true AND school_id = $1',
          [schoolId]
        );
      }

      const sequentialId = await this.generateSequentialId('academic_years');

      const result = await client.query(
        `INSERT INTO academic_years (name, start_date, end_date, is_active, alt_id, school_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, alt_id, name, start_date, end_date, is_active, created_at, updated_at`,
        [academicYearData.name, academicYearData.startDate, academicYearData.endDate,
         academicYearData.isActive || false, sequentialId, schoolId]
      );

      return this.transformAcademicYearResponse(result.rows[0]);
    });

    await cacheService.delPattern(`${CacheKeys.ACADEMIC_YEAR}:${schoolId}:*`);
    return result;
  }

  async getAcademicYears(req: any) {
    const schoolId = this.requireSchool();
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'start_date');
    const { isActive } = req.query;

    let whereClause = 'WHERE school_id = $1';
    const queryParams: any[] = [schoolId];

    if (isActive !== undefined) {
      whereClause += ` AND is_active = $${queryParams.length + 1}`;
      queryParams.push(isActive === 'true');
    }

    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM academic_years ${whereClause}`, queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await this.executeQuery(
      `SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
       FROM academic_years ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    return {
      academicYears: result.rows.map((year: any) => this.transformAcademicYearResponse(year)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAcademicYearById(id: string) {
    const schoolId = this.requireSchool();
    const academicYear = await this.checkEntityExists('academic_years', id, 'alt_id');

    const semestersResult = await this.executeQuery(
      'SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at FROM semesters WHERE academic_year_id = $1 AND school_id = $2 ORDER BY start_date',
      [academicYear.id, schoolId]
    );

    return {
      ...this.transformAcademicYearResponse(academicYear),
      semesters: semestersResult.rows.map((s: any) => ({
        id: s.id, altId: s.alt_id, name: s.name,
        startDate: s.start_date, endDate: s.end_date,
        isActive: s.is_active, createdAt: s.created_at, updatedAt: s.updated_at,
      })),
    };
  }

  async updateAcademicYear(id: string, updateData: UpdateAcademicYear) {
    const schoolId = this.requireSchool();
    const existingYear = await this.checkEntityExists('academic_years', id, 'alt_id');
    const actualYearId = existingYear.id;

    return await this.executeTransaction(async (client) => {
      if (updateData.isActive) {
        await client.query(
          'UPDATE academic_years SET is_active = false WHERE is_active = true AND id != $1 AND school_id = $2',
          [actualYearId, schoolId]
        );
      }
      const { query: updateQuery, values } = this.buildUpdateQuery('academic_years', updateData);
      values.push(actualYearId);
      const result = await client.query(updateQuery, values);
      return this.transformAcademicYearResponse(result.rows[0]);
    });
  }

  async deleteAcademicYear(id: string) {
    const schoolId = this.requireSchool();
    const academicYear = await this.checkEntityExists('academic_years', id, 'alt_id');
    const actualYearId = academicYear.id;

    const dep = await this.executeQuery(
      `SELECT
         (SELECT COUNT(*) FROM classes       WHERE academic_year_id = $1 AND school_id = $2)::INT AS classes_count,
         (SELECT COUNT(*) FROM semesters     WHERE academic_year_id = $1 AND school_id = $2)::INT AS semesters_count,
         (SELECT COUNT(*) FROM fee_categories WHERE academic_year_id = $1 AND school_id = $2)::INT AS fee_categories_count`,
      [actualYearId, schoolId]
    );

    const d = dep.rows[0];
    if (d.classes_count + d.semesters_count + d.fee_categories_count > 0) {
      throw new AppError(
        `Cannot delete. Has ${d.classes_count} classes, ${d.semesters_count} semesters, ${d.fee_categories_count} fee categories.`,
        409
      );
    }

    await this.executeQuery(
      'DELETE FROM academic_years WHERE id = $1 AND school_id = $2',
      [actualYearId, schoolId]
    );
    return { success: true };
  }

  async getActiveAcademicYear() {
    const schoolId = this.requireSchool();
    return await cacheService.cacheQuery(
      `${CacheKeys.ACADEMIC_YEAR_ACTIVE}:${schoolId}`,
      async () => {
        const result = await this.executeQuery(
          'SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at FROM academic_years WHERE is_active = true AND school_id = $1 LIMIT 1',
          [schoolId]
        );
        if (result.rows.length === 0) throw new AppError('No active academic year found', 404);
        return this.transformAcademicYearResponse(result.rows[0]);
      },
      CacheTTL.ONE_HOUR
    );
  }

  private transformAcademicYearResponse(academicYear: any) {
    return {
      id: academicYear.id, altId: academicYear.alt_id, name: academicYear.name,
      startDate: academicYear.start_date, endDate: academicYear.end_date,
      isActive: academicYear.is_active, createdAt: academicYear.created_at, updatedAt: academicYear.updated_at,
    };
  }
}
