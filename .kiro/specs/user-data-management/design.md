# Design Document: User Data Management

## Overview

This design document outlines the implementation of user data management features for the School Management System, specifically data export (download) and account deletion functionality. The solution integrates with the existing authentication, authorization, and audit logging systems while maintaining data integrity and security.

The implementation follows the existing architectural patterns in the codebase:
- Service layer for business logic
- Controller layer for HTTP handling
- Type-safe interfaces
- Audit logging for sensitive operations
- Cache invalidation for data consistency

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Angular)      │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  API Gateway    │
│  (Express)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Settings       │─────▶│  User        │
│  Controller     │      │  Service     │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Data Export    │─────▶│  Database    │
│  Service        │      │  (PostgreSQL)│
└─────────────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  File System    │
│  (Temp Storage) │
└─────────────────┘
```

### Component Interaction Flow

**Data Export Flow:**
1. User clicks "Download Data" button
2. Frontend sends POST request to `/api/settings/export-data`
3. Controller authenticates user and validates request
4. Service collects user data from multiple tables
5. Service generates JSON and PDF files
6. Files are temporarily stored with unique identifiers
7. Response includes download URLs
8. Frontend triggers file downloads
9. Background job cleans up files after 24 hours

**Account Deletion Flow:**
1. User clicks "Delete Account" button
2. Frontend shows confirmation dialog
3. User enters password for verification
4. Frontend sends DELETE request to `/api/settings/delete-account`
5. Controller authenticates and validates password
6. Service logs deletion action to audit trail
7. Service handles data dependencies (cascade/anonymize)
8. Service performs soft delete on user account
9. Service invalidates all user sessions and tokens
10. User is logged out and redirected to login page

## Components and Interfaces

### Backend Components

#### 1. Data Export Service (`src/services/dataExportService.ts`)

```typescript
export class DataExportService extends BaseService {
  async exportUserData(userId: string): Promise<ExportResult>
  async generateJSONExport(userData: UserDataExport): Promise<string>
  async generatePDFExport(userData: UserDataExport): Promise<string>
  async collectUserData(userId: string): Promise<UserDataExport>
  async scheduleFileCleanup(filePath: string, delayHours: number): Promise<void>
  private collectProfileData(userId: string): Promise<any>
  private collectSettingsData(userId: string): Promise<any>
  private collectRoleSpecificData(userId: string, role: string): Promise<any>
  private collectAuditLogs(userId: string): Promise<any>
}
```

#### 2. Account Deletion Service (`src/services/accountDeletionService.ts`)

```typescript
export class AccountDeletionService extends BaseService {
  async deleteUserAccount(userId: string, password: string): Promise<void>
  async verifyPassword(userId: string, password: string): Promise<boolean>
  async handleDataDependencies(userId: string, role: string): Promise<void>
  async invalidateUserSessions(userId: string): Promise<void>
  private deleteTeacherData(userId: string): Promise<void>
  private deleteStudentData(userId: string): Promise<void>
  private deleteParentData(userId: string): Promise<void>
  private anonymizeRecords(userId: string): Promise<void>
}
```

#### 3. Settings Controller Extension (`src/controllers/settingsController.ts`)

```typescript
export class SettingsController {
  // Existing methods...
  async exportData(req: Request, res: Response, next: NextFunction): Promise<void>
  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void>
}
```

#### 4. Routes Extension (`src/routes/settings.ts`)

```typescript
// New routes
router.post('/export-data', settingsController.exportData.bind(settingsController));
router.delete('/delete-account', settingsController.deleteAccount.bind(settingsController));
```

### Frontend Components

#### 1. Settings Service Extension (`school-management-frontend/src/app/services/settings.service.ts`)

```typescript
export class SettingsService {
  // Existing methods...
  exportData(): Observable<ApiResponse<ExportResult>>
  deleteAccount(password: string): Observable<ApiResponse<void>>
}
```

#### 2. Settings Component Extension (`school-management-frontend/src/app/components/settings/settings.component.ts`)

```typescript
export class SettingsComponent {
  // Existing methods...
  onDownloadData(): void
  onDeleteAccount(): void
  private downloadFile(url: string, filename: string): void
  private showDeleteConfirmation(): void
}
```

#### 3. Delete Account Confirmation Dialog

```typescript
@Component({
  selector: 'app-delete-account-dialog',
  template: '...'
})
export class DeleteAccountDialogComponent {
  passwordControl: FormControl
  onConfirm(): void
  onCancel(): void
}
```

## Data Models

### Export Data Types

```typescript
export interface UserDataExport {
  profile: UserProfile;
  settings: UserSettings;
  roleSpecificData: RoleSpecificData;
  auditLogs: AuditLog[];
  exportMetadata: ExportMetadata;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleSpecificData {
  teacher?: TeacherData;
  student?: StudentData;
  parent?: ParentData;
  staff?: StaffData;
}

export interface TeacherData {
  classes: ClassInfo[];
  subjects: SubjectInfo[];
  assignments: AssignmentInfo[];
  grades: GradeInfo[];
}

export interface StudentData {
  enrollments: EnrollmentInfo[];
  grades: GradeInfo[];
  attendance: AttendanceInfo[];
  fees: FeeInfo[];
}

export interface ParentData {
  children: StudentInfo[];
  communications: CommunicationInfo[];
}

export interface ExportMetadata {
  exportDate: Date;
  exportedBy: string;
  dataVersion: string;
  recordCount: number;
}

export interface ExportResult {
  jsonUrl: string;
  pdfUrl: string;
  expiresAt: Date;
  fileSize: {
    json: number;
    pdf: number;
  };
}
```

### Account Deletion Types

```typescript
export interface DeleteAccountRequest {
  password: string;
  confirmation: boolean;
}

export interface DeletionResult {
  success: boolean;
  deletedAt: Date;
  recordsAffected: {
    user: number;
    roleSpecific: number;
    sessions: number;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Export completeness
*For any* user with data in the system, when data export is requested, the generated export file should contain all required sections: profile, settings, role-specific data, and audit logs.
**Validates: Requirements 1.1, 1.2**

### Property 2: JSON format validity
*For any* user data export, the generated JSON file should be valid, parseable JSON that can be deserialized back into the UserDataExport type.
**Validates: Requirements 1.3**

### Property 3: Export audit logging
*For any* successful data export operation, an audit log entry should be created with the user ID, action type, and timestamp.
**Validates: Requirements 1.5**

### Property 4: Password verification requirement
*For any* account deletion request, if the provided password does not match the user's password, the deletion should be rejected with an authentication error.
**Validates: Requirements 2.1**

### Property 5: Account deletion completeness
*For any* user account, after successful deletion, querying for that user should return a not-found error or show the account as inactive.
**Validates: Requirements 2.3**

### Property 6: Deletion audit logging
*For any* account deletion, an audit log entry should be created before the deletion occurs, capturing the user ID and deletion timestamp.
**Validates: Requirements 2.4**

### Property 7: Session invalidation
*For any* deleted user account, all previously valid authentication tokens for that user should become invalid and fail authentication checks.
**Validates: Requirements 2.5**

### Property 8: Related records handling
*For any* user with related records (classes, enrollments, etc.), after account deletion, those records should either be deleted or anonymized according to the role-specific business rules.
**Validates: Requirements 3.1, 3.2**

### Property 9: Teacher data preservation
*For any* teacher account deletion, all classes and assignments associated with that teacher should be either reassigned to another teacher or archived, not left orphaned.
**Validates: Requirements 3.3**

### Property 10: Student academic record preservation
*For any* student account deletion, academic records (grades, attendance) should remain in the system but with personal information anonymized.
**Validates: Requirements 3.4**

### Property 11: Parent relationship removal
*For any* parent account deletion, the parent-student relationships should be removed, but the student accounts and their data should remain intact.
**Validates: Requirements 3.5**

### Property 12: Authentication requirement
*For any* data export or account deletion request without valid authentication, the system should reject the request with a 401 Unauthorized status.
**Validates: Requirements 4.1**

### Property 13: File cleanup
*For any* generated export file, after 24 hours from creation, the file should no longer exist in the file system.
**Validates: Requirements 4.4**

### Property 14: Rate limiting
*For any* user making multiple rapid export requests, after exceeding the rate limit threshold, subsequent requests should be rejected with a 429 Too Many Requests status.
**Validates: Requirements 4.5**

### Property 15: HTTP status code correctness
*For any* API operation, the returned HTTP status code should match the operation result: 200 for success, 401 for auth failure, 400 for validation errors, 500 for server errors.
**Validates: Requirements 5.3**

### Property 16: Error message descriptiveness
*For any* failed operation, the error response should contain a message field with a non-empty, descriptive error message.
**Validates: Requirements 5.4**

### Property 17: Success response completeness
*For any* successful operation, the response should contain a success field set to true and relevant data or confirmation details.
**Validates: Requirements 5.5**

## Error Handling

### Error Categories

1. **Authentication Errors (401)**
   - Missing or invalid authentication token
   - Expired token
   - User account not found or inactive

2. **Authorization Errors (403)**
   - Insufficient permissions for operation
   - Attempting to access another user's data

3. **Validation Errors (400)**
   - Invalid password format
   - Missing required fields
   - Invalid data format

4. **Resource Errors (404)**
   - User not found
   - Export file not found or expired

5. **Rate Limiting Errors (429)**
   - Too many export requests in short time
   - Exceeded rate limit threshold

6. **Server Errors (500)**
   - Database connection failures
   - File system errors
   - PDF generation failures

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Error Handling Strategy

1. **Graceful Degradation**: If PDF generation fails, still provide JSON export
2. **Retry Logic**: Implement retry for transient database errors
3. **Logging**: Log all errors with context for debugging
4. **User Feedback**: Provide clear, actionable error messages to users
5. **Audit Trail**: Log failed attempts for security monitoring

## Testing Strategy

### Unit Testing

The implementation will include unit tests for:

1. **Data Collection Logic**
   - Test collecting profile data for different user roles
   - Test collecting role-specific data (teacher, student, parent)
   - Test handling users with no role-specific data

2. **File Generation**
   - Test JSON export generation with various data sizes
   - Test PDF export generation with formatted content
   - Test file path generation and uniqueness

3. **Password Verification**
   - Test correct password validation
   - Test incorrect password rejection
   - Test password hashing comparison

4. **Data Dependency Handling**
   - Test teacher data reassignment logic
   - Test student data anonymization
   - Test parent relationship removal

5. **Session Invalidation**
   - Test token invalidation after deletion
   - Test cache clearing for deleted users

### Property-Based Testing

The implementation will use property-based testing with a suitable library (e.g., fast-check for TypeScript) to verify the correctness properties defined above. Each property test will:

- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the specific correctness property
- Use the format: `**Feature: user-data-management, Property {number}: {property_text}**`

Property tests will cover:

1. **Export Completeness** (Property 1)
   - Generate random users with varying data
   - Verify all sections present in export

2. **JSON Validity** (Property 2)
   - Generate random user data
   - Verify JSON parse/stringify round-trip

3. **Audit Logging** (Properties 3, 6)
   - Perform random operations
   - Verify audit logs created

4. **Authentication** (Properties 4, 12)
   - Generate random valid/invalid credentials
   - Verify correct acceptance/rejection

5. **Deletion Completeness** (Properties 5, 7, 8)
   - Create random users with relationships
   - Verify proper deletion and cleanup

6. **Rate Limiting** (Property 14)
   - Generate rapid request sequences
   - Verify rate limit enforcement

7. **HTTP Semantics** (Properties 15, 16, 17)
   - Generate various request scenarios
   - Verify correct status codes and responses

### Integration Testing

Integration tests will verify:

1. **End-to-End Export Flow**
   - User authentication → data collection → file generation → download
   - Verify files are accessible and contain correct data

2. **End-to-End Deletion Flow**
   - User authentication → password verification → data cleanup → account deletion
   - Verify user cannot log in after deletion

3. **Cross-Service Integration**
   - Verify audit logging service integration
   - Verify cache service integration
   - Verify file service integration

4. **Database Transaction Integrity**
   - Verify rollback on errors during deletion
   - Verify atomic operations for related records

## Security Considerations

### Data Export Security

1. **Access Control**: Users can only export their own data
2. **File Security**: Export files stored with unique, non-guessable names
3. **Encryption**: Sensitive data encrypted in export files
4. **Expiration**: Files automatically deleted after 24 hours
5. **Rate Limiting**: Prevent abuse through request throttling

### Account Deletion Security

1. **Password Verification**: Require current password for deletion
2. **Audit Trail**: Log deletion before removing data
3. **Session Invalidation**: Immediately invalidate all user sessions
4. **Data Retention**: Preserve audit logs even after deletion
5. **Irreversibility**: Clear warning about permanent nature

### GDPR Compliance

1. **Right to Data Portability**: Export provides machine-readable format (JSON)
2. **Right to Erasure**: Account deletion removes personal data
3. **Data Minimization**: Only collect and export necessary data
4. **Audit Trail**: Maintain logs of data access and deletion
5. **Consent**: Clear confirmation required for deletion

## Performance Considerations

### Data Export Optimization

1. **Pagination**: Collect large datasets in batches
2. **Async Processing**: Use background jobs for large exports
3. **Caching**: Cache frequently accessed reference data
4. **Streaming**: Stream large files instead of loading into memory
5. **Compression**: Compress export files to reduce size

### Account Deletion Optimization

1. **Batch Operations**: Delete related records in batches
2. **Transaction Management**: Use database transactions for atomicity
3. **Index Usage**: Ensure proper indexes on foreign keys
4. **Cascade Rules**: Leverage database cascade rules where appropriate
5. **Background Cleanup**: Move non-critical cleanup to background jobs

## Implementation Notes

### File Storage

- Export files stored in `uploads/exports/{userId}/{timestamp}/`
- Unique filenames using UUID to prevent collisions
- Automatic cleanup via scheduled job (cron or background worker)

### PDF Generation

- Use library like `pdfkit` or `puppeteer` for PDF generation
- Template-based approach for consistent formatting
- Include metadata (export date, user info) in PDF

### Database Considerations

- Use transactions for account deletion to ensure atomicity
- Implement soft delete for user accounts (set `is_active = false`)
- Preserve audit logs even after account deletion
- Consider archiving deleted user data for compliance

### Rate Limiting

- Implement using existing rate limiting service
- Limits: 5 export requests per hour per user
- Store rate limit state in Redis for distributed systems

### Background Jobs

- Implement file cleanup job running every hour
- Implement async export processing for large datasets
- Use job queue (Bull, BullMQ) for reliable processing

## Dependencies

### Backend Dependencies

- `pdfkit` or `puppeteer`: PDF generation
- `archiver`: ZIP file creation (if bundling multiple files)
- `bcrypt`: Password verification (already in use)
- Existing services: `auditLogger`, `cacheService`, `rateLimitingService`

### Frontend Dependencies

- `file-saver`: Trigger file downloads
- Angular Material Dialog: Confirmation dialogs
- Existing services: `AuthService`, `NotificationService`, `ErrorService`

## Deployment Considerations

1. **Database Migration**: No new tables required, uses existing schema
2. **File System**: Ensure `uploads/exports` directory exists with proper permissions
3. **Environment Variables**: Configure file retention period, rate limits
4. **Monitoring**: Add metrics for export requests, deletion operations
5. **Backup**: Ensure deleted data is backed up before permanent removal
