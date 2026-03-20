# Task - TASK_001: Backend File Upload API with Storage and Validation

## Requirement Reference
- User Story: [us_028]
- Story Location: [.propel/context/tasks/us_028/us_028.md]
- Acceptance Criteria:
    - AC1: Validate file types (PDF, PNG, JPG, JPEG, DOCX only), check file size (<10MB per file, <50MB total per session)
    - AC1: Upload files to temporary storage, create ClinicalDocuments table entry with status="Uploaded"
- Edge Case:
    - EC1: File exceeds size limit → display error
    - EC2: Duplicate uploads → check file hash, warn user
    - EC3: Upload fails midway → support resume from last chunk

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | UXR-503 (Network error handling with retry) |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.18.x |
| Backend | PostgreSQL | 15.x |
| Backend | TypeScript | 5.3.x |
| Backend | Multer | 1.4.x (for file uploads) |

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
Create file upload API endpoint POST /api/documents/upload with multipart/form-data support using Multer middleware. Validate file types (PDF, PNG, JPG, JPEG, DOCX) via MIME type and magic number checking, enforce size limits (<10MB per file, <50MB total per upload session). Calculate file hash (SHA-256) to detect duplicates, check against existing documents, return warning if duplicate found. Store files in cloud storage (AWS S3, Azure Blob, or local filesystem /uploads directory) with organized path structure /uploads/{patient_id}/{document_type}/{filename}_{timestamp}. Create entry in clinical_documents table with status='Uploaded', document_type, uploaded_by_user_id, patient_id, original_filename, file_path, file_hash, file_size, uploaded_at. Support chunked uploads for large files and resume capability using resumable-upload protocol.

## Dependent Tasks
- US-007: ClinicalDocuments table schema
- NONE (first task for US_028, establishes upload infrastructure)

## Impacted Components
- **CREATE** server/src/routes/documentRoutes.ts - Document upload routes
- **CREATE** server/src/controllers/documentController.ts - uploadDocument(), checkDuplicate() controllers
- **CREATE** server/src/services/fileStorageService.ts - Store files to cloud/local storage
- **CREATE** server/src/services/fileValidationService.ts - Validate file type, size, hash calculation
- **CREATE** server/src/middleware/uploadMiddleware.ts - Multer configuration for file handling
- **CREATE** server/src/types/document.types.ts - DocumentUploadRequest, DocumentUploadResponse interfaces
- **MODIFY** server/src/app.ts - Register documentRoutes
- **CREATE** server/src/config/storage.config.ts - Storage configuration (cloud or local)

## Implementation Plan
1. **Create storage.config.ts**: Export storage config with STORAGE_TYPE from env ('local' | 's3' | 'azure'), local path: './uploads', cloud credentials (AWS_S3_BUCKET, AZURE_STORAGE_ACCOUNT), max file size: 10MB, max total size: 50MB, allowed MIME types array
2. **Create document.types.ts**: Define DocumentUploadRequest interface (patient_id, document_type: 'Lab Results' | 'Imaging' | 'Prescription' | 'Insurance Card' | 'Other', files: File[]), DocumentUploadResponse interface (document_id, file_path, file_hash, is_duplicate: boolean, uploaded_at), FileMetadata interface (original_filename, file_size, mime_type, file_hash)
3. **Create uploadMiddleware.ts**: Configure Multer with diskStorage or memoryStorage, destination: './uploads/temp', filename: `${uuid()}_${originalname}`, fileFilter: check MIME type against allowed list, limits: fileSize 10MB, files 10 per request, handle multer errors (LIMIT_FILE_SIZE, LIMIT_FILE_COUNT)
4. **Create fileValidationService.ts**: Implement validateFileType(file) - check MIME type and magic number (first bytes) to prevent MIME spoofing, validateFileSize(file, maxSize), calculateFileHash(filePath) using crypto.createHash('sha256'), checkDuplicate(hash, patientId) queries DB for existing hash, returns boolean + existing document info
5. **Create fileStorageService.ts**: Implement saveFile(file, destination) - if STORAGE_TYPE='local' use fs.rename to move from temp to final path, if 's3' use AWS SDK to upload, if 'azure' use Azure SDK, organize path: `${patientId}/${documentType}/${filename}_${timestamp}.${ext}`, return file_path URL
6. **Create documentController.ts**: Implement uploadDocument(req, res) - extract files from req.files (Multer), validate each file using fileValidationService, calculate hashes, check duplicates (if duplicate return warning flag), save files using fileStorageService, INSERT INTO clinical_documents for each file, return DocumentUploadResponse array with document_ids and paths
7. **Create documentRoutes.ts**: Define POST /upload with authenticate middleware, uploadMiddleware.array('files', 10), documentController.uploadDocument, POST /check-duplicate with file hash in body for pre-upload duplicate check
8. **Add Chunked Upload Support**: Implement POST /upload/chunk for resumable uploads, track upload session in Redis with session_id, chunk_index, total_chunks, merge chunks when complete, update progress in real-time

**Focus on how to implement**: Multer setup: `const upload = multer({ storage, fileFilter, limits })`. Magic number check for MIME validation: read first 4 bytes of file, compare against known signatures (PDF: %PDF, PNG: 89 50 4E 47, JPG: FF D8 FF). File hash: `const hash = crypto.createHash('sha256'); const stream = fs.createReadStream(filePath); stream.pipe(hash); hash.digest('hex')`. Duplicate check query: `SELECT id, original_filename FROM clinical_documents WHERE file_hash = $1 AND patient_id = $2`. Local storage path: `path.join(__dirname, '../../uploads', patientId, documentType, newFilename)`. AWS S3 upload: `await s3Client.send(new PutObjectCommand({ Bucket, Key, Body: fileStream }))`. Chunked upload: store chunks in temp directory, merge using stream: `chunks.forEach(chunk => fs.appendFileSync(finalPath, chunk))`.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   └── (documentRoutes.ts to be created)
│   ├── controllers/
│   │   └── (documentController.ts to be created)
│   ├── services/
│   │   ├── (fileStorageService.ts to be created)
│   │   └── (fileValidationService.ts to be created)
│   ├── middleware/
│   │   └── (uploadMiddleware.ts to be created)
│   ├── types/
│   │   └── (document.types.ts to be created)
│   ├── config/
│   │   └── (storage.config.ts to be created)
│   └── app.ts (to be modified)
├── uploads/ (directory to be created)
└── package.json (needs: multer@^1.4.5-lts.1, @aws-sdk/client-s3@^3.0.0 or @azure/storage-blob@^12.0.0)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/routes/documentRoutes.ts | POST /upload, POST /check-duplicate, POST /upload/chunk routes |
| CREATE | server/src/controllers/documentController.ts | uploadDocument(), checkDuplicate() with validation and storage logic |
| CREATE | server/src/services/fileStorageService.ts | Save files to local/S3/Azure with organized path structure |
| CREATE | server/src/services/fileValidationService.ts | Validate file type via MIME and magic numbers, calculate SHA-256 hash |
| CREATE | server/src/middleware/uploadMiddleware.ts | Multer configuration with file filters and size limits |
| CREATE | server/src/types/document.types.ts | DocumentUploadRequest, DocumentUploadResponse, FileMetadata interfaces |
| CREATE | server/src/config/storage.config.ts | Storage configuration (local/cloud, paths, credentials) |
| MODIFY | server/src/app.ts | Register /api/documents routes |

## External References
- **Multer Middleware**: https://github.com/expressjs/multer - File upload handling for Express
- **Magic Numbers**: https://en.wikipedia.org/wiki/List_of_file_signatures - File type detection via bytes
- **AWS S3 SDK**: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html - S3 file upload
- **Azure Blob Storage**: https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs - Azure file upload
- **Resumable Uploads**: https://github.com/tus/tus-node-server - Resumable upload protocol
- **File Hashing**: https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options - SHA-256 hashing

## Build Commands
- Install dependencies: `npm install multer@^1.4.5-lts.1 @aws-sdk/client-s3@^3.0.0` (or Azure SDK)
- Create uploads directory: `mkdir -p server/uploads/temp`
- Set storage env vars: Add `STORAGE_TYPE=local` to server/.env (or s3/azure with credentials)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (unit tests for file validation and storage)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for fileValidationService (MIME type, magic number, file size checks)
- [x] Unit tests pass for file hash calculation (SHA-256)
- [x] Integration test: Upload PDF file, verify stored in correct path and DB entry created
- [x] Integration test: Upload 11MB file, receive 413 Payload Too Large error
- [x] Integration test: Upload duplicate file, receive is_duplicate=true warning
- [x] Integration test: Upload unsupported file type (.exe), receive 400 error
- [x] Integration test: Upload session with >50MB total, receive error
- [x] Integration test: Chunked upload completes successfully, file merged correctly
- [x] Load test: 50 concurrent uploads (5MB each) complete within 10s

## Implementation Checklist
- [ ] Install dependencies: npm install multer@^1.4.5-lts.1 @aws-sdk/client-s3@^3.0.0 (or @azure/storage-blob@^12.0.0 for Azure)
- [ ] Create uploads directory structure: mkdir -p server/uploads/{temp,documents}
- [ ] Add storage config to .env (STORAGE_TYPE=local, AWS_S3_BUCKET or AZURE_STORAGE_ACCOUNT if cloud)
- [ ] Create storage.config.ts (export config with STORAGE_TYPE, LOCAL_PATH='./uploads', MAX_FILE_SIZE=10MB, MAX_TOTAL_SIZE=50MB, ALLOWED_MIME_TYPES=['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
- [ ] Create document.types.ts (DocumentUploadRequest with patient_id, document_type enum, files array; DocumentUploadResponse with document_id, file_path, file_hash, is_duplicate, uploaded_at; FileMetadata with original_filename, file_size, mime_type, file_hash)
- [ ] Create uploadMiddleware.ts (multer setup: storage diskStorage or memoryStorage, destination './uploads/temp', filename uuid+original, fileFilter checks MIME, limits fileSize 10MB and files 10, error handler for LIMIT_FILE_SIZE/LIMIT_FILE_COUNT)
- [ ] Create fileValidationService.ts (validateFileType: check MIME and read first 4 bytes for magic number %PDF/89504E47/FFD8FF, validateFileSize: file.size <= MAX_SIZE, calculateFileHash: crypto SHA-256 on file stream, checkDuplicate: SELECT FROM clinical_documents WHERE file_hash AND patient_id)
- [ ] Create fileStorageService.ts (saveFile function: if local use fs.rename from temp to final path {patientId}/{docType}/{filename}_{timestamp}, if s3 use PutObjectCommand, if azure use BlobClient.upload, return file_path URL)
- [ ] Create documentController.ts (uploadDocument: extract req.files, validate each, check duplicates, save files, INSERT INTO clinical_documents with status='Uploaded', return response array; checkDuplicate: extract hash from body, query DB, return is_duplicate boolean)
- [ ] Create documentRoutes.ts (express.Router, POST /upload with authenticate, uploadMiddleware.array('files', 10), documentController.uploadDocument; POST /check-duplicate with authenticate)
- [ ] Modify app.ts (import documentRoutes, app.use('/api/documents', documentRoutes))
- [ ] Add chunked upload support (POST /upload/chunk endpoint, track session in Redis, merge chunks on completion, return progress percentage)
