# Implementation Plan: User Data Management

- [x] 1. Set up data export infrastructure
  - [x] 1.1 Create data export service with base structure
    - Create `src/services/dataExportService.ts` extending BaseService
    - Implement data collection methods for profile, settings, and audit logs
    - Add role-specific data collection methods (teacher, student, parent, staff)
    - _Requirements: 1.1, 1.2_

  - [ ] 1.2 Write property test for export completeness
    - **Property 1: Export completeness**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 1.3 Implement JSON export generation
    - Create method to serialize UserDataExport to JSON
    - Add metadata (export date, version, record count)
    - Implement file writing to temporary storage
    - _Requirements: 1.3_

  - [ ] 1.4 Write property test for JSON validity
    - **Property 2: JSON format validity**
    - **Validates: Requirements 1.3**

  - [ ] 1.5 Implement PDF export generation (SKIPPED - JSON only for now)
    - Install and configure PDF generation library (pdfkit or puppeteer)
    - Create PDF template with formatted user data
    - Implement PDF file generation and storage
    - _Requirements: 1.4_

  - [x] 1.6 Add file cleanup scheduling
    - Create method to schedule file deletion after 24 hours
    - Implement background job or cron task for cleanup
    - _Requirements: 4.4_

  - [ ] 1.7 Write property test for file cleanup
    - **Property 13: File cleanup**
    - **Validates: Requirements 4.4**

- [x] 2. Implement data export API endpoints
  - [x] 2.1 Extend settings controller with export endpoint
    - Add `exportData` method to SettingsController
    - Implement authentication and authorization checks
    - Call data export service and return file URLs
    - Add audit logging for export operations
    - _Requirements: 1.5, 4.1, 5.1_

  - [ ] 2.2 Write property test for export audit logging
    - **Property 3: Export audit logging**
    - **Validates: Requirements 1.5**

  - [ ] 2.3 Write property test for authentication requirement
    - **Property 12: Authentication requirement**
    - **Validates: Requirements 4.1**

  - [x] 2.4 Add rate limiting to export endpoint
    - Configure rate limiter for export requests (5 per hour)
    - Return 429 status when limit exceeded
    - _Requirements: 4.5_

  - [ ] 2.5 Write property test for rate limiting
    - **Property 14: Rate limiting**
    - **Validates: Requirements 4.5**

  - [x] 2.6 Add export route to settings router
    - Register POST `/api/settings/export-data` route
    - Apply authentication middleware
    - Bind controller method
    - _Requirements: 5.1_

  - [ ] 2.7 Write unit tests for export endpoint
    - Test successful export with valid authentication
    - Test rejection without authentication
    - Test rate limiting behavior
    - Test error handling for various failure scenarios
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 3. Implement account deletion infrastructure
  - [x] 3.1 Create account deletion service
    - Create `src/services/accountDeletionService.ts` extending BaseService
    - Implement password verification method
    - Add session invalidation logic
    - _Requirements: 2.1, 2.5_

  - [ ] 3.2 Write property test for password verification
    - **Property 4: Password verification requirement**
    - **Validates: Requirements 2.1**

  - [ ] 3.3 Write property test for session invalidation
    - **Property 7: Session invalidation**
    - **Validates: Requirements 2.5**

  - [x] 3.4 Implement data dependency handling
    - Create method to identify related records for a user
    - Implement cascade delete logic for appropriate records
    - Implement anonymization logic for preserved records
    - _Requirements: 3.1, 3.2_

  - [ ] 3.5 Write property test for related records handling
    - **Property 8: Related records handling**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 3.6 Implement role-specific deletion logic
    - Add teacher data handling (reassign/archive classes)
    - Add student data handling (preserve academics, anonymize personal)
    - Add parent data handling (remove relationships, preserve students)
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ] 3.7 Write property tests for role-specific deletion
    - **Property 9: Teacher data preservation**
    - **Property 10: Student academic record preservation**
    - **Property 11: Parent relationship removal**
    - **Validates: Requirements 3.3, 3.4, 3.5**

- [x] 4. Implement account deletion API endpoint
  - [x] 4.1 Extend settings controller with deletion endpoint
    - Add `deleteAccount` method to SettingsController
    - Implement authentication check
    - Verify password from request body
    - Call account deletion service
    - Add audit logging before deletion
    - _Requirements: 2.3, 2.4, 5.2_

  - [ ] 4.2 Write property test for deletion completeness
    - **Property 5: Account deletion completeness**
    - **Validates: Requirements 2.3**

  - [ ] 4.3 Write property test for deletion audit logging
    - **Property 6: Deletion audit logging**
    - **Validates: Requirements 2.4**

  - [x] 4.4 Add deletion route to settings router
    - Register DELETE `/api/settings/delete-account` route
    - Apply authentication middleware
    - Bind controller method
    - _Requirements: 5.2_

  - [ ] 4.5 Write unit tests for deletion endpoint
    - Test successful deletion with correct password
    - Test rejection with incorrect password
    - Test rejection without authentication
    - Test proper error responses
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 5. Create TypeScript types and interfaces
  - [x] 5.1 Add export-related types
    - Create `UserDataExport`, `ExportResult`, `ExportMetadata` interfaces
    - Create `RoleSpecificData` and related interfaces
    - Add types to `src/types/settings.ts` or new file
    - _Requirements: 1.1, 1.2_

  - [x] 5.2 Add deletion-related types
    - Create `DeleteAccountRequest`, `DeletionResult` interfaces
    - Add to `src/types/settings.ts` or new file
    - _Requirements: 2.1, 2.3_

- [x] 6. Implement frontend data export functionality
  - [x] 6.1 Extend settings service with export method
    - Add `exportData()` method to SettingsService
    - Return Observable with export result
    - Handle HTTP errors appropriately
    - _Requirements: 1.1, 6.1_

  - [x] 6.2 Update settings component for data export
    - Implement `onDownloadData()` method
    - Show loading indicator during export
    - Handle export response and trigger file downloads
    - Display success/error notifications
    - _Requirements: 6.1, 6.3, 6.5_

  - [x] 6.3 Add file download helper method
    - Create method to trigger browser file download
    - Handle JSON downloads (PDF skipped for now)
    - Use native browser API
    - _Requirements: 6.3_

  - [ ] 6.4 Write unit tests for export UI
    - Test loading state during export
    - Test success notification display
    - Test error handling and display
    - Test file download triggering
    - _Requirements: 6.1, 6.3, 6.5_

- [x] 7. Implement frontend account deletion functionality
  - [x] 7.1 Create delete account confirmation dialog component
    - Create `DeleteAccountDialogComponent` with password input
    - Add warning message about irreversibility
    - Implement confirm and cancel actions
    - Style with Material Design
    - _Requirements: 2.2, 6.4_

  - [x] 7.2 Extend settings service with deletion method
    - Add `deleteAccount(password: string)` method to SettingsService
    - Return Observable with deletion result
    - Handle HTTP errors appropriately
    - _Requirements: 2.1, 2.3_

  - [x] 7.3 Update settings component for account deletion
    - Implement `onDeleteAccount()` method
    - Show confirmation dialog
    - Handle dialog result and call deletion service
    - Log user out after successful deletion
    - Redirect to login page
    - _Requirements: 2.2, 2.3, 6.4, 6.5_

  - [ ] 7.4 Write unit tests for deletion UI
    - Test confirmation dialog display
    - Test password validation
    - Test successful deletion flow
    - Test error handling and display
    - Test logout and redirect after deletion
    - _Requirements: 6.4, 6.5_

- [ ] 8. Add HTTP status code and response validation
  - [ ] 8.1 Write property test for HTTP status codes
    - **Property 15: HTTP status code correctness**
    - **Validates: Requirements 5.3**

  - [ ] 8.2 Write property test for error messages
    - **Property 16: Error message descriptiveness**
    - **Validates: Requirements 5.4**

  - [ ] 8.3 Write property test for success responses
    - **Property 17: Success response completeness**
    - **Validates: Requirements 5.5**

- [ ] 9. Integration testing and final validation
  - [ ] 9.1 Write integration test for end-to-end export flow
    - Test complete flow: authentication → export → download
    - Verify files are created and accessible
    - Verify audit logs are created
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 9.2 Write integration test for end-to-end deletion flow
    - Test complete flow: authentication → password verification → deletion
    - Verify user cannot log in after deletion
    - Verify related data is handled correctly
    - Verify audit logs are created
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 3.1, 3.2_

  - [ ] 9.3 Write integration test for role-specific deletion
    - Test teacher account deletion with classes
    - Test student account deletion with grades
    - Test parent account deletion with children
    - Verify data preservation and anonymization
    - _Requirements: 3.3, 3.4, 3.5_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
