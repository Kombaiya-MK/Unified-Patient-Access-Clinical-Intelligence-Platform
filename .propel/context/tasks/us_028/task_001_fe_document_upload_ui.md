# Task - TASK_001_FE_DOCUMENT_UPLOAD_UI

## Requirement Reference
- User Story: US_028
- Story Location: `.propel/context/tasks/us_028/us_028.md`
- Acceptance Criteria:
    - AC1: Drag-and-drop upload zone accepts PDF/PNG/JPG/DOCX, validates file types (<10MB each, <50MB total), shows progress bars, creates ClinicalDocuments entry, displays thumbnail preview
- Edge Cases:
    - File exceeds limit: Error "File [name] exceeds 10MB limit"
    - Duplicate detection: Check file hash, warn "Already uploaded. Upload anyway?"
    - Network failure: Support resume upload, "Resume Upload" button

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-008 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-008-document-upload.html |
| **Screen Spec** | SCR-008 (Document Upload page) |
| **UXR Requirements** | UXR-401 (Progress indicator <200ms), UXR-503 (Network error with retry) |
| **Design Tokens** | Upload zone: dashed #007BFF border, hover #0056B3 solid, Progress bar: #4CAF50 green, Error: #DC3545 red, Success thumbnail: white card with shadow |

> **Wireframe Components:**
> - Upload zone: Dashed border box, cloud upload icon, "Drag files here or click to browse"
> - File type dropdown: Above upload zone (Lab Results, Imaging, Prescription, Insurance, Other)
> - Progress list: Each file with progress bar (0-100%), file size, cancel button
> - Thumbnail gallery: Uploaded files with preview (PDF=icon, images=thumbnail), filename, size, type tag, View + Delete buttons
> - Drag overlay: Full-page highlight when dragging files "Drop to upload"
> - Supported formats note: "Accepted: PDF, PNG, JPG, DOCX (max 10MB each, 50MB total)"

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | react-dropzone | 14.x |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
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
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement document upload UI: (1) DocumentUpload page with react-dropzone for drag-and-drop, (2) File type selector dropdown (Lab Results, Imaging, Prescription, Insurance Card, Other), (3) File validation: accept only PDF/PNG/JPG/JPEG/DOCX, max 10MB per file, max 50MB total per session, (4) Upload progress tracking with percentage + estimated time, (5) useDocumentUpload hook: POST /api/documents with multipart/form-data, (6) Thumbnail gallery showing uploaded documents (PDF icon or image preview), (7) View + Delete actions per document, (8) Duplicate detection: Calculate file hash, warn if exists, (9) Resume upload on network failure (chunked upload), (10) Drag overlay full-page when dragging files, (11) WCAG AA compliant.

## Dependent Tasks
- US_028 Task 002: Document upload API endpoint (POST /api/documents)
- US_029: Document extraction service (processes uploaded docs)

## Impacted Components
**New:**
- app/src/pages/DocumentUpload.tsx (Upload page)
- app/src/components/DocumentDropzone.tsx (Drag-and-drop zone)
- app/src/components/UploadProgress.tsx (Progress bars per file)
- app/src/components/DocumentThumbnail.tsx (Thumbnail gallery item)
- app/src/hooks/useDocumentUpload.ts (Upload mutation with progress)
- app/src/utils/fileHash.ts (Calculate file hash for duplicate detection)

## Implementation Plan
1. Install react-dropzone: npm install react-dropzone
2. Create DocumentDropzone: accept={{'.pdf': [], '.png': [], '.jpg': [], '.jpeg': [], '.docx': []}}, maxSize=10*1024*1024 (10MB)
3. File type selector: Dropdown with options (Lab Results, Imaging, Prescription, Insurance Card, Other), default "Other"
4. Validation: onDrop → validate total size <50MB, reject oversized files with error toast
5. useDocumentUpload hook: FormData with file + documentType + patientId, XMLHttpRequest for upload progress tracking, onUploadProgress callback updates progress state
6. UploadProgress: Display filename, size (KB/MB), progress bar (0-100%), estimated time (based on upload speed), cancel button
7. File hash: Use crypto.subtle.digest('SHA-256', arrayBuffer) for duplicate detection
8. Duplicate check: Before upload, calculate hash → call GET /api/documents/check-hash?hash={hash} → if exists, show confirmation dialog "Already uploaded on [date]. Upload anyway?"
9. Thumbnail gallery: After upload success, display thumbnail (images) or PDF icon, filename, size, type tag (Lab Results), View + Delete buttons
10. Chunked upload: Use resumable.js or tus.js for resume support (future enhancement)

## Current Project State
```
ASSIGNMENT/app/src/
├── pages/ (dashboard exists)
└── (document upload components to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/DocumentUpload.tsx | Upload page |
| CREATE | app/src/components/DocumentDropzone.tsx | Drag-and-drop zone |
| CREATE | app/src/components/UploadProgress.tsx | Progress indicator |
| CREATE | app/src/components/DocumentThumbnail.tsx | Thumbnail gallery item |
| CREATE | app/src/hooks/useDocumentUpload.ts | Upload mutation with progress |
| CREATE | app/src/utils/fileHash.ts | SHA-256 hash utility |

## External References
- [react-dropzone Documentation](https://react-dropzone.js.org/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)
- [FR-006 Document Upload](../../../.propel/context/docs/spec.md#FR-006)
- [UXR-401 Progress Indicator <200ms](../../../.propel/context/docs/spec.md#UXR-401)

## Build Commands
```bash
cd app
npm install react-dropzone
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: fileHash utility generates consistent SHA-256
- [ ] Integration tests: Upload file → document created in database
- [ ] Upload page renders: Navigate to /documents/upload → see dropzone
- [ ] File type selector: Dropdown shows all document types
- [ ] Drag-and-drop: Drag PDF → dropzone highlights, drop → upload starts
- [ ] Click to browse: Click dropzone → file picker opens
- [ ] File validation: Upload .txt file → rejected with "Unsupported file type"
- [ ] Size validation: Upload 15MB file → error "Exceeds 10MB limit"
- [ ] Total size limit: Upload 5×11MB files → error "Total exceeds 50MB"
- [ ] Progress tracking: Upload → progress bar shows 0-100%, estimated time
- [ ] Cancel upload: Click cancel button → upload aborted
- [ ] Duplicate detection: Upload same file twice → warning "Already uploaded on [date]"
- [ ] Thumbnail display: After upload → thumbnail gallery shows preview
- [ ] View document: Click "View" → opens document in modal/new tab
- [ ] Delete document: Click "Delete" → confirmation → removed from gallery
- [ ] Responsive: Mobile → upload zone full width, thumbnails stack
- [ ] WCAG AA: Keyboard upload (Tab + Enter), ARIA labels, 4.5:1 contrast

## Implementation Checklist
- [ ] Install react-dropzone: `npm install react-dropzone`
- [ ] Create fileHash.ts utility with SubtleCrypto
- [ ] Create DocumentDropzone.tsx with drag-and-drop
- [ ] Create UploadProgress.tsx with progress bars
- [ ] Create DocumentThumbnail.tsx gallery component
- [ ] Implement useDocumentUpload.ts with progress tracking
- [ ] Create DocumentUpload.tsx page
- [ ] Add routing: /documents/upload → DocumentUpload
- [ ] Test upload flow end-to-end
- [ ] Validate WCAG AA compliance
- [ ] Document upload feature in app/README.md
