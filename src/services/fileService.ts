import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../middleware/errorHandler';
import { query } from '../database/connection';

export class FileService {
  private static instance: FileService;

  private constructor() {}

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  /**
   * Save file metadata to database
   */
  async saveFileMetadata(fileData: {
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    entityType: string; // 'student', 'teacher', 'staff', 'document', etc.
    entityId: string;
    fileType: string; // 'profile_picture', 'document', 'certificate', etc.
  }): Promise<any> {
    const result = await query(
      `INSERT INTO files (
        file_name, original_name, file_path, file_size, mime_type,
        uploaded_by, entity_type, entity_id, file_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        fileData.fileName,
        fileData.originalName,
        fileData.filePath,
        fileData.fileSize,
        fileData.mimeType,
        fileData.uploadedBy,
        fileData.entityType,
        fileData.entityId,
        fileData.fileType,
      ]
    );

    return this.formatFileRecord(result.rows[0]);
  }

  /**
   * Get file metadata by ID (with optional school_id for tenant isolation)
   */
  async getFileById(fileId: string, schoolId?: string): Promise<any> {
    let sql = `SELECT * FROM files WHERE id = $1 AND deleted_at IS NULL`;
    const params: any[] = [fileId];

    if (schoolId) {
      sql += ` AND school_id = $2`;
      params.push(schoolId);
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404);
    }

    return this.formatFileRecord(result.rows[0]);
  }

  /**
   * Get files by entity (with optional school_id for tenant isolation)
   */
  async getFilesByEntity(entityType: string, entityId: string, fileType?: string, schoolId?: string): Promise<any[]> {
    let sql = `SELECT * FROM files WHERE entity_type = $1 AND entity_id = $2 AND deleted_at IS NULL`;
    const params: any[] = [entityType, entityId];
    let paramIndex = 3;

    if (schoolId) {
      sql += ` AND school_id = $${paramIndex++}`;
      params.push(schoolId);
    }

    if (fileType) {
      sql += ` AND file_type = $${paramIndex++}`;
      params.push(fileType);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map((row: any) => this.formatFileRecord(row));
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    // Get file info
    const file = await this.getFileById(fileId);

    // Soft delete in database
    await query(
      `UPDATE files SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2`,
      [userId, fileId]
    );

    // Optionally delete physical file
    try {
      await fs.unlink(file.filePath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
      // Don't throw error if physical file deletion fails
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(fileId: string, updates: {
    fileName?: string;
    fileType?: string;
  }): Promise<any> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.fileName) {
      setClauses.push(`file_name = $${paramIndex++}`);
      params.push(updates.fileName);
    }

    if (updates.fileType) {
      setClauses.push(`file_type = $${paramIndex++}`);
      params.push(updates.fileType);
    }

    if (setClauses.length === 0) {
      throw new AppError('No updates provided', 400);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(fileId);

    const result = await query(
      `UPDATE files SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404);
    }

    return this.formatFileRecord(result.rows[0]);
  }

  /**
   * Get file statistics
   */
  async getFileStatistics(entityType?: string): Promise<any> {
    let whereClause = 'WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (entityType) {
      whereClause += ' AND entity_type = $1';
      params.push(entityType);
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as average_size,
        COUNT(DISTINCT entity_id) as unique_entities,
        COUNT(DISTINCT uploaded_by) as unique_uploaders,
        mode() WITHIN GROUP (ORDER BY file_type) as most_common_type,
        mode() WITHIN GROUP (ORDER BY mime_type) as most_common_mime_type
      FROM files ${whereClause}`,
      params
    );

    const stats = result.rows[0];

    // Get file type distribution
    const typeDistribution = await query(
      `SELECT 
        file_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM files ${whereClause}
      GROUP BY file_type
      ORDER BY count DESC`,
      params
    );

    return {
      totalFiles: parseInt(stats.total_files) || 0,
      totalSize: parseInt(stats.total_size) || 0,
      averageSize: parseFloat(stats.average_size) || 0,
      uniqueEntities: parseInt(stats.unique_entities) || 0,
      uniqueUploaders: parseInt(stats.unique_uploaders) || 0,
      mostCommonType: stats.most_common_type || 'N/A',
      mostCommonMimeType: stats.most_common_mime_type || 'N/A',
      typeDistribution: typeDistribution.rows.map((row: any) => ({
        fileType: row.file_type,
        count: parseInt(row.count),
        totalSize: parseInt(row.total_size),
      })),
    };
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  /**
   * Format file record
   */
  private formatFileRecord(row: any): any {
    return {
      id: row.id.toString(),
      fileName: row.file_name,
      originalName: row.original_name,
      filePath: row.file_path,
      fileUrl: `/uploads/${row.file_path.replace(/^uploads\//, '')}`,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      uploadedBy: row.uploaded_by?.toString(),
      entityType: row.entity_type,
      entityId: row.entity_id?.toString(),
      fileType: row.file_type,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
      deletedAt: row.deleted_at?.toISOString() || null,
      deletedBy: row.deleted_by?.toString() || null,
    };
  }
}

export const fileService = FileService.getInstance();
