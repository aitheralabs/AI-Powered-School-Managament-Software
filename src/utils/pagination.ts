import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Common column mappings for camelCase to snake_case
const COLUMN_MAPPINGS: Record<string, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  dateOfBirth: 'date_of_birth',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  startDate: 'start_date',
  endDate: 'end_date',
  creditHours: 'credit_hours',
  academicYearId: 'academic_year_id',
  classId: 'class_id',
  studentId: 'student_id',
  parentUserId: 'parent_user_id',
  relationshipType: 'relationship_type'
};

export const getPaginationParams = (
  req: Request, 
  defaultSortBy: string = 'created_at',
  columnMappings: Record<string, string> = {}
): PaginationParams => {
  const { page: rawPage, limit: rawLimit, sortBy = defaultSortBy, sortOrder = 'asc' } = req.query as any;
  
  // Ensure page and limit are numbers with proper defaults
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = Math.max(1, Math.min(100, Number(rawLimit) || 10));
  const offset = (page - 1) * limit;
  
  // Map camelCase to snake_case for database columns
  // SECURITY: Only allow whitelisted column names to prevent SQL injection via ORDER BY
  const allMappings = { ...COLUMN_MAPPINGS, ...columnMappings };
  const mappedSortBy = allMappings[sortBy as string];

  // If sortBy is not in the whitelist, fall back to defaultSortBy
  const safeSortBy = mappedSortBy || defaultSortBy;

  return {
    page,
    limit,
    offset,
    sortBy: safeSortBy as string,
    sortOrder: (sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
  };
};