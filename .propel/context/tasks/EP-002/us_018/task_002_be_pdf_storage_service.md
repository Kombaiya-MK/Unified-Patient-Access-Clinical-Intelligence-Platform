# Task - TASK_002: Backend PDF Storage Service

## Requirement Reference
- User Story: [us_018]
- Story Location: [.propel/context/tasks/us_018/us_018.md]
- Acceptance Criteria:
    - AC1: PDF saves to cloud storage/local filesystem with filename `confirmation_[appointment_id]_[timestamp].pdf`
    - AC2: System returns secure download URL valid for 7 days
    - AC3: System deletes PDFs older than 30 days from storage to save space
- Edge Case:
    - EC1: How is PDF storage managed long-term? Delete PDFs older than 30 days, patient can regenerate from appointment history

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js (Express) | 20.x LTS |
| Database | PostgreSQL | 15.x |
| Library | jsonwebtoken | 9.x |
| Library | node-cron | 3.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create a PDF storage service that saves generated PDF confirmation documents to the local filesystem with organized directory structure, generates secure time-limited download URLs using signed JWT tokens, and implements automated cleanup of PDFs older than 30 days. The service will track PDF metadata (appointment_id, file_path, generated_at, expires_at) in PostgreSQL for audit and regeneration purposes.

## Dependent Tasks
- TASK_001: Backend PDF Generation Service (generates PDF buffer that this service will store)
- US-007: Appointments table exists with appointment_id

## Impacted Components
- **NEW** server/src/services/storageService.ts - PDF storage service module
- **NEW** server/src/types/storage.types.ts - TypeScript interfaces for storage operations
- **NEW** server/src/jobs/pdfCleanupJob.ts - Cron job for deleting old PDFs
- **NEW** server/storage/pdfs/ - Directory for storing PDF files (create if not exists)
- **MODIFY** server/src/config/env.ts - Add PDF storage configuration (base path, URL expiry duration)
- **NEW** database/migrations/V008__create_pdf_metadata_table.sql - Database migration for pdf_metadata table

## Implementation Plan
1. **Create Storage Directory Structure**: Create server/storage/pdfs/ directory with subdirectories organized by year-month (e.g., 2026-03/)
2. **Create Database Migration**: Create V008__create_pdf_metadata_table.sql with columns: id, appointment_id (FK), file_path, file_size_bytes, generated_at, expires_at, created_by
3. **Create Storage Types**: Define TypeScript interfaces for PDFStorageOptions, PDFMetadata, SecureDownloadURL
4. **Implement savePDF() Function**: Accept PDF buffer and appointment_id, generate filename with timestamp, save to filesystem, insert metadata to database, return file_path
5. **Implement generateSecureDownloadURL() Function**: Create JWT token with payload {appointment_id, file_path, exp: 7 days}, sign with JWT_SECRET, return URL format: `/api/pdfs/download?token=<jwt>`
6. **Implement validateDownloadToken() Function**: Verify JWT token, check expiration, check if file exists on filesystem, return file_path if valid
7. **Implement getPDFMetadata() Function**: Query database for PDF metadata by appointment_id, return metadata or null
8. **Implement deletePDF() Function**: Delete file from filesystem, delete metadata record from database
9. **Implement Cleanup Job**: Create pdfCleanupJob.ts using node-cron, schedule daily at 2 AM, query for PDFs where expires_at < NOW() - 30 days, delete files and database records, log cleanup summary
10. **Add Error Handling**: Handle disk space errors, file permission errors, database errors with detailed logging

**Focus on how to implement**: Use Node.js fs.promises for async file operations. Store PDFs in organized subdirectories (year-month) to avoid filesystem limits. Use PostgreSQL for metadata tracking to enable regeneration from appointment history. Use signed JWT tokens for secure download URLs to prevent unauthorized access. Implement atomic operations (save file + insert DB record in transaction-like pattern with rollback on failure).

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── pdfService.ts (TASK_001)
│   │   └── (storageService.ts to be created)
│   ├── types/
│   │   ├── pdf.types.ts (TASK_001)
│   │   └── (storage.types.ts to be created)
│   ├── jobs/
│   │   ├── auditRetentionJob.ts
│   │   └── (pdfCleanupJob.ts to be created)
│   ├── config/
│   │   └── env.ts (to be modified)
│   └── app.ts
├── storage/
│   └── pdfs/ (to be created)
└── package.json
database/
├── migrations/
│   ├── V007__add_constraints.sql
│   └── (V008__create_pdf_metadata_table.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/storageService.ts | PDF storage service with savePDF(), generateSecureDownloadURL(), validateDownloadToken(), getPDFMetadata(), deletePDF() functions |
| CREATE | server/src/types/storage.types.ts | TypeScript interfaces: PDFStorageOptions, PDFMetadata, SecureDownloadURL, CleanupResult |
| CREATE | server/src/jobs/pdfCleanupJob.ts | Cron job for deleting PDFs older than 30 days, scheduled daily at 2 AM UTC |
| CREATE | server/storage/pdfs/.gitkeep | Placeholder file to ensure directory is tracked in git |
| MODIFY | server/src/config/env.ts | Add PDF_STORAGE_BASE_PATH, PDF_DOWNLOAD_URL_EXPIRY_DAYS (default 7) configuration |
| CREATE | database/migrations/V008__create_pdf_metadata_table.sql | Migration to create pdf_metadata table with columns: id, appointment_id, file_path, file_size_bytes, generated_at, expires_at, created_by |
| MODIFY | server/package.json | Add dependencies: node-cron@3.x, @types/node-cron@3.x |

## External References
- **Node.js fs Promises**: https://nodejs.org/api/fs.html#promises-api - Async file system operations
- **JWT Best Practices**: https://datatracker.ietf.org/doc/html/rfc8725 - JSON Web Token security best practices
- **node-cron Documentation**: https://www.npmjs.com/package/node-cron - Cron job scheduling for Node.js
- **Filesystem Organization**: https://www.baeldung.com/linux/file-organization - Best practices for organizing files by date
- **Signed URLs Pattern**: https://cloud.google.com/storage/docs/access-control/signed-urls - Secure time-limited download URLs concept
- **PostgreSQL Data Retention**: https://www.postgresql.org/docs/current/sql-delete.html - Efficient deletion strategies for large tables

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Run database migration: `npm run migrate` or `./database/scripts/run_migrations.ps1`
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run tests: `npm test` (execute unit tests for storage service)
- Run in development: `npm run dev` (start server with nodemon)

## Implementation Validation Strategy
- [x] Unit tests pass for storage service (all functions)
- [x] Integration tests pass: save PDF, generate download URL, validate token, delete PDF
- [x] Database migration runs successfully without errors
- [x] PDF file creation validation: verify file exists on filesystem after savePDF()
- [x] JWT token validation: generate token, verify expiration logic works correctly
- [x] Cleanup job validation: manually insert old PDF records, run job, verify files deleted
- [x] Error handling validation: test with disk full scenario (mock), insufficient permissions
- [x] Concurrent access test: multiple PDF saves simultaneously, verify no file conflicts

## Implementation Checklist
- [ ] Create V008__create_pdf_metadata_table.sql migration with pdf_metadata table (id, appointment_id FK, file_path, file_size_bytes, generated_at, expires_at, created_by, created_at)
- [ ] Run database migration to create pdf_metadata table
- [ ] Create storage.types.ts with PDFStorageOptions, PDFMetadata, SecureDownloadURL, CleanupResult interfaces
- [ ] Create storageService.ts with savePDF() function (save buffer to filesystem with year-month subdirectory, insert metadata to database, return file_path)
- [ ] Implement generateSecureDownloadURL() function (create JWT with 7-day expiry, return /api/pdfs/download?token=<jwt>)
- [ ] Implement validateDownloadToken() function (verify JWT, check file exists, return file_path or throw error)
- [ ] Implement getPDFMetadata() and deletePDF() functions for metadata management
- [ ] Create pdfCleanupJob.ts with node-cron scheduled for daily 2 AM UTC (query PDFs where expires_at < NOW() - 30 days, delete files and DB records, log summary)
