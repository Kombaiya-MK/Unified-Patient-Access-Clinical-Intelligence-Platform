# Task - TASK_003: Frontend Upload Progress Tracking and Document Preview

## Requirement Reference
- User Story: [us_028]
- Story Location: [.propel/context/tasks/us_028/us_028.md]
- Acceptance Criteria:
    - AC1: Show upload progress bar with percentage and estimated time remaining
    - AC1: Display success confirmation with thumbnail preview of uploaded documents
- Edge Case:
    - EC2: Duplicate uploads → warn with "Upload anyway?" option
    - EC3: Upload fails midway → show "Resume Upload" button

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-008-document-upload.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-008 |
| **UXR Requirements** | UXR-401 (Progress appears <200ms), UXR-503 (Retry on failure) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #progress-bars |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference the wireframe file/URL during UI implementation
- **MUST** match layout, spacing, typography, and colors from the wireframe
- **MUST** implement all states shown in wireframe (default, hover, focus, error, loading)
- **MUST** validate implementation against wireframe at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify pixel-perfect alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | Axios | 1.x |
| Frontend | CSS Modules | N/A |

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
Create upload progress tracking using Axios upload progress events. Display progress bar for each uploading file showing percentage (0-100%), estimated time remaining calculated from upload speed, and current/total bytes. Add cancel button per file during upload. On upload success, display success toast "X documents uploaded successfully", show uploaded files section below upload zone as thumbnail gallery with file preview (PDF first page, image thumbnail, DOCX icon), filename, file size, document type tag, "View" and "Delete" buttons. Handle duplicate detection: if backend returns is_duplicate=true, show confirmation modal "This file appears to be already uploaded. Upload anyway?" with Yes/No buttons. Handle upload failures: show error toast with specific message, add "Retry" button, support resume from last chunk for large files.

## Dependent Tasks
- TASK_001: Backend File Upload API (provides upload endpoint with progress support)
- TASK_002: Frontend Drag-Drop Interface (upload trigger)

## Impacted Components
- **CREATE** app/src/components/documents/UploadProgress.tsx - Progress bar with percentage and ETA
- **CREATE** app/src/components/documents/UploadedFileGallery.tsx - Thumbnail grid of uploaded documents
- **CREATE** app/src/components/documents/DocumentThumbnail.tsx - Single document preview card
- **CREATE** app/src/components/documents/DuplicateConfirmModal.tsx - Confirmation for duplicate uploads
- **MODIFY** app/src/hooks/useFileUpload.ts - Add upload function with progress tracking
- **CREATE** app/src/utils/thumbnailGenerator.ts - Generate thumbnails for preview
- **MODIFY** app/src/pages/DocumentUploadPage.tsx - Integrate progress and gallery

## Implementation Plan
1. **Modify useFileUpload hook**: Add uploadFiles async function using axios.post with FormData, track upload progress with onUploadProgress callback updates state {loaded, total, percentage, speed, eta}, calculate speed = loaded / elapsedTime, eta = (total - loaded) / speed, support cancel with AbortController, handle errors with retry logic, check for is_duplicate in response and trigger confirmation modal
2. **Create UploadProgress component**: Display progress bar for each file, render filename, file size, progress bar width={percentage}%, percentage text "45%", estimated time "2 minutes remaining", speed "1.2 MB/s", cancel button (X icon), on complete show checkmark and "Uploaded" text, on error show error icon and "Failed - Retry" button
3. **Create thumbnailGenerator.ts**: For PDF files use pdf.js to render first page to canvas then toDataURL, for images use FileReader to read as DataURL, for DOCX show generic document icon, cache generated thumbnails in localStorage with file_hash as key, return thumbnail URL
4. **Create DocumentThumbnail component**: Render card with thumbnail image or icon, filename truncated with tooltip on hover, file size, document type badge (color-coded: Lab Results blue, Imaging purple, Prescription green, Insurance orange, Other gray), "View" button opens document in new tab/modal, "Delete" button with confirmation "Delete this document?"
5. **Create UploadedFileGallery component**: Grid layout (3 columns desktop, 2 tablet, 1 mobile), map uploaded documents to DocumentThumbnail components, section header "Uploaded Documents (X)", sort by uploaded_at descending (newest first), pagination if >20 documents
6. **Create DuplicateConfirmModal component**: Modal with warning icon, heading "Duplicate File Detected", message "This file appears to be already uploaded on [date]. Upload anyway?", show existing file info (filename, upload date, uploaded by), "No, Cancel" button (secondary) and "Yes, Upload Anyway" button (primary), if Yes re-trigger upload with force_duplicate flag
7. **Modify DocumentUploadPage**: Below upload zone add "Uploading (X files)" section showing UploadProgress components, after upload complete show success toast and render UploadedFileGallery with newly uploaded documents, on duplicate detection show DuplicateConfirmModal
8. **Add Resume Upload**: Store upload session in localStorage with file hash and uploaded chunks, on page reload check for incomplete uploads, show "Resume Upload" button for incomplete files, resume from last chunk using Range headers in axios request

**Focus on how to implement**: Axios progress: `axios.post('/api/documents/upload', formData, { onUploadProgress: (progressEvent) => { const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total); setProgress(prev => ({...prev, [fileId]: {loaded: progressEvent.loaded, total: progressEvent.total, percentage}})); } })`. Speed calculation: track startTime, `const elapsedSeconds = (Date.now() - startTime) / 1000; const speed = progressEvent.loaded / elapsedSeconds; const eta = (progressEvent.total - progressEvent.loaded) / speed`. Cancel upload: `const abortController = new AbortController(); axios.post(..., { signal: abortController.signal }); // cancel: abortController.abort()`. PDF thumbnail: `import * as pdfjsLib from 'pdfjs-dist'; const pdf = await pdfjsLib.getDocument(file).promise; const page = await pdf.getPage(1); const canvas = document.createElement('canvas'); const context = canvas.getContext('2d'); await page.render({canvasContext: context, viewport}).promise; const thumbnail = canvas.toDataURL()`. Image thumbnail: `const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => setThumbnail(reader.result)`. Gallery CSS Grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px`.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── DocumentUploadPage.tsx (TASK_002, to be modified)
│   ├── components/
│   │   ├── documents/
│   │   │   ├── DropZone.tsx (TASK_002)
│   │   │   └── (UploadProgress.tsx, UploadedFileGallery.tsx, etc. to be created)
│   │   └── common/
│   │       └── Toast.tsx (may exist)
│   ├── hooks/
│   │   └── useFileUpload.ts (TASK_002, to be modified)
│   └── utils/
│       └── (thumbnailGenerator.ts to be created)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/documents/UploadProgress.tsx | Progress bar with percentage, ETA, speed, cancel button per file |
| CREATE | app/src/components/documents/UploadedFileGallery.tsx | Grid of uploaded documents with thumbnails |
| CREATE | app/src/components/documents/DocumentThumbnail.tsx | Single document card with preview, metadata, View/Delete buttons |
| CREATE | app/src/components/documents/DuplicateConfirmModal.tsx | Confirmation modal for duplicate file uploads |
| CREATE | app/src/utils/thumbnailGenerator.ts | Generate thumbnails for PDF (first page) and images |
| MODIFY | app/src/hooks/useFileUpload.ts | Add uploadFiles function with progress tracking and error handling |
| MODIFY | app/src/pages/DocumentUploadPage.tsx | Integrate progress display and uploaded files gallery |

## External References
- **Axios Upload Progress**: https://axios-http.com/docs/req_config - onUploadProgress callback
- **PDF.js**: https://mozilla.github.io/pdf.js/ - Render PDF pages to canvas for thumbnails
- **FileReader API**: https://developer.mozilla.org/en-US/docs/Web/API/FileReader - Read files as DataURL
- **AbortController**: https://developer.mozilla.org/en-US/docs/Web/API/AbortController - Cancel axios requests
- **CSS Grid Layout**: https://css-tricks.com/snippets/css/complete-guide-grid/ - Responsive grid for gallery

## Build Commands
- Install dependencies: `npm install pdfjs-dist@^3.11.174` (for PDF thumbnails)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for upload progress and thumbnail generation)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Upload 5MB file, progress bar animates smoothly 0-100%
- [x] ETA displays and updates correctly during upload
- [x] Cancel button aborts upload mid-progress
- [x] Success toast appears after upload completes
- [x] Uploaded files section displays with thumbnails
- [x] PDF thumbnail shows first page preview
- [x] Image thumbnails display correctly
- [x] Duplicate file triggers confirmation modal
- [x] "Upload anyway" completes upload successfully
- [x] Upload failure shows error message with Retry button
- [x] Resume upload works after page refresh

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-008-document-upload.html during implementation
- [ ] Install dependencies: npm install pdfjs-dist@^3.11.174
- [ ] Create thumbnailGenerator.ts (generateThumbnail async function: if PDF use pdfjs-dist to render page 1 to canvas, if image use FileReader readAsDataURL, if DOCX return generic icon path, cache in localStorage with file_hash key, return thumbnail URL string)
- [ ] Modify useFileUpload.ts uploadFiles function (create FormData, append files and document_type, axios.post with onUploadProgress callback, track progress state per file with loaded/total/percentage/speed/eta, calculate speed = loaded / elapsedTime, eta = (total - loaded) / speed, use AbortController for cancel, on response check is_duplicate flag, on error store for retry)
- [ ] Create UploadProgress.tsx component (props: file, progress {loaded, total, percentage, speed, eta}, onCancel, render filename, file size, progress bar div with width style, percentage text, ETA text "X minutes remaining", speed "X MB/s", cancel button, on complete show checkmark and "Uploaded", on error show error icon and Retry button)
- [ ] Create DocumentThumbnail.tsx component (props: document {id, filename, file_size, document_type, file_path, thumbnail}, onView, onDelete, render card with thumbnail img or icon, filename with ellipsis overflow, file size formatted, document type badge color-coded by type, View button opens file_path, Delete button with confirmation dialog)
- [ ] Create UploadedFileGallery.tsx component (props: documents array, onDelete, render grid layout CSS Grid 3 columns desktop, section header "Uploaded Documents (X)", map documents to DocumentThumbnail, sort by uploaded_at DESC, pagination if >20 with Load More button)
- [ ] Create DuplicateConfirmModal.tsx component (props: isOpen, existingFile, onConfirm, onCancel, render modal with warning icon, heading "Duplicate File Detected", message with existing file info, No Cancel button secondary, Yes Upload Anyway button primary, onConfirm calls upload with force_duplicate=true flag)
- [ ] Modify DocumentUploadPage.tsx (add uploadProgress state, during upload show UploadProgress components for each file, on complete show success toast, fetch uploaded documents and render UploadedFileGallery, on duplicate detection show DuplicateConfirmModal, pass onConfirm to retry upload)
- [ ] Add resume upload logic (store upload session in localStorage: {fileHash, uploadedChunks, totalChunks}, on page load check localStorage, show Resume Upload button if incomplete, on click resume from last chunk using axios Range header: headers: {'Content-Range': `bytes ${lastChunk}-*/${totalSize}`})
- [ ] Add cancel upload functionality (on cancel button click call abortController.abort(), update progress state to canceled, show "Upload canceled" message, allow restart)
