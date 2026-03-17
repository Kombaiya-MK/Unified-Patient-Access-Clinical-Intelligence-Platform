# Task - TASK_002_BE_DOCUMENT_UPLOAD_API

## Requirement Reference
- User Story: US_028
- Story Location: `.propel/context/tasks/us_028/us_028.md`
- Acceptance Criteria:
    - AC1: POST /api/documents accepts multipart/form-data, validates file type/size, uploads to storage, creates ClinicalDocuments entry with status="Uploaded", returns document metadata with thumbnail URL
- Edge Cases:
    - File size exceeded: Return 413 "File exceeds 10MB limit"
    - Duplicate file hash: Return warning, allow override with force=true param
    - Upload failure: Clean up partially uploaded files, return 500 with retry instructions

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
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | Multer | 1.x (file upload) |
| Database | PostgreSQL | 16.x |
| Storage | Local filesystem | N/A |
| AI/ML | N/A | N/A |

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
Implement document upload API: (1) POST /api/documents with multer middleware for multipart/form-data, (2) Validate file types (PDF, PNG, JPG, JPEG, DOCX), max 10MB per file, (3) Calculate SHA-256 file hash for duplicate detection, (4) Upload to server/storage/documents/{patientId}/ directory, (5) Create ClinicalDocuments table entry: document_id UUID, patient_id, uploaded_by_user_id, original_filename, file_path, file_hash, document_type, file_size, mime_type, status="Uploaded", uploaded_at, (6) GET /api/documents/check-hash?hash={hash} checks for existing file, (7) GET /api/documents/:id/download streams file with Content-Disposition attachment, (8) DELETE /api/documents/:id soft-deletes (sets deleted_at), (9) Trigger extraction job (US_029) after upload, (10) Return document metadata + download URL.

## Dependent Tasks
- US_003 Task 001: ClinicalDocuments table schema
- US_029: Document extraction service (triggered after upload)

## Impacted Components
**New:**
- server/src/controllers/documents.controller.ts (Upload, download, delete handlers)
- server/src/routes/documents.routes.ts (POST, GET, DELETE endpoints)
- server/src/services/documents.service.ts (Upload logic, hash calculation)
- server/src/middleware/upload.middleware.ts (Multer configuration)
- server/storage/documents/ (File storage directory)

**Modified:**
- server/db/schema.sql (Ensure ClinicalDocuments has file_hash, file_size, deleted_at columns)

## Implementation Plan
1. Install multer: npm install multer @types/multer
2. Create upload.middleware.ts: multer.diskStorage with destination server/storage/documents/{patientId}/, filename {timestamp}-{originalname}
3. File validation: fileFilter checks mimetype (application/pdf, image/png, image/jpeg, application/vnd.openxmlformats-officedocument.wordprocessingml.document), limits size 10MB
4. Calculate file hash: Use crypto.createHash('sha256').update(fileBuffer).digest('hex')
5. Implement documentsService.uploadDocument: Validate, save file, calculate hash, INSERT ClinicalDocuments
6. POST /api/documents route: upload.single('file'), verifyToken, requireRole('patient', 'staff'), call uploadDocument
7. GET /api/documents/:id/download: Validate ownership, stream file with res.sendFile
8. GET /api/documents/check-hash?hash={hash}: Query ClinicalDocuments WHERE file_hash=$1 AND deleted_at IS NULL
9. DELETE /api/documents/:id: Soft delete (UPDATE deleted_at=NOW()), don't delete physical file immediately
10. Trigger extraction: After upload success, publish to Bull job queue for US_029 processing

## Current Project State
```
ASSIGNMENT/server/src/
├── db/schema.sql (ClinicalDocuments table exists)
└── (document upload service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/documents.controller.ts | Upload/download handlers |
| CREATE | server/src/routes/documents.routes.ts | POST, GET, DELETE routes |
| CREATE | server/src/services/documents.service.ts | Upload logic + hash |
| CREATE | server/src/middleware/upload.middleware.ts | Multer config |
| CREATE | server/storage/documents/.gitkeep | Storage directory |
| UPDATE | server/package.json | Add multer |

## External References
- [Multer Documentation](https://www.npmjs.com/package/multer)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
- [FR-006 Document Upload](../../../.propel/context/docs/spec.md#FR-006)
- [DR-003 ClinicalDocuments Schema](../../../.propel/context/docs/spec.md#DR-003)

## Build Commands
```bash
cd server
npm install multer @types/multer
npm run dev

# Test upload
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/document.pdf" \
  -F "documentType=Lab Results"

# Test download
curl -X GET http://localhost:3001/api/documents/<doc-id>/download \
  -H "Authorization: Bearer <token>" \
  -o downloaded.pdf
```

## Implementation Validation Strategy
- [ ] Unit tests: documentsService calculates file hash correctly
- [ ] Integration tests: Upload document → file saved + database entry created
- [ ] multer installed: package.json shows multer@1.x
- [ ] Storage directory exists: ls server/storage/documents/
- [ ] Upload endpoint protected: Try POST without auth → 401
- [ ] File type validation: Upload .txt file → 400 "Unsupported file type"
- [ ] Size validation: Upload 15MB file → 413 "File exceeds 10MB limit"
- [ ] Upload success: POST with PDF → file saved to storage/documents/{patientId}/
- [ ] Database entry: Query ClinicalDocuments → entry with status="Uploaded", file_path, file_hash
- [ ] Hash calculation: Upload same file twice → hashes match
- [ ] Duplicate check: GET /check-hash?hash={hash} → returns existing document
- [ ] Download works: GET /documents/:id/download → streams file
- [ ] Delete soft deletes: DELETE /documents/:id → deleted_at set, file remains
- [ ] Ownership verified: Patient A tries download Patient B's doc → 403 Forbidden
- [ ] Extraction triggered: After upload → verify extraction job queued (US_029)

## Implementation Checklist
- [ ] Install multer: `npm install multer @types/multer`
- [ ] Create server/storage/documents/ directory
- [ ] Create upload.middleware.ts with multer config
- [ ] Implement documents.service.ts with hash calculation
- [ ] Create documents.controller.ts handlers
- [ ] Create documents.routes.ts with POST, GET, DELETE
- [ ] Mount /api/documents routes in app.ts
- [ ] Test upload + download + delete flow
- [ ] Document document API in server/README.md
