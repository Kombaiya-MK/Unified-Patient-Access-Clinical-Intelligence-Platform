# Task - TASK_002: Frontend Drag-Drop Upload Interface with Validation

## Requirement Reference
- User Story: [us_028]
- Story Location: [.propel/context/tasks/us_028/us_028.md]
- Acceptance Criteria:
    - AC1: Drag PDF/PNG/JPG/DOCX files into upload zone or click "Browse Files"
    - AC1: Validate file types and size limits client-side before upload
    - AC1: Show upload progress bar with percentage and estimated time
- Edge Case:
    - EC1: File exceeds size limit → display error
    - EC2: Duplicate uploads → check and warn

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-008-document-upload.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-008 |
| **UXR Requirements** | UXR-401 (Progress appears <200ms), UXR-503 (Network error retry) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #buttons |

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
Create DocumentUploadPage with drag-and-drop zone using HTML5 Drag and Drop API. Upload zone displays dashed border with cloud upload icon and "Drag files here or click to browse" text. File type dropdown above zone (Lab Results, Imaging, Prescription, Insurance Card, Other). On dragover show highlighted overlay "Drop files to upload". On drop or file select, validate client-side: check file types (PDF, PNG, JPG, JPEG, DOCX), file size <10MB per file and <50MB total, display errors if validation fails. Use react-dropzone library for simplified drag-drop handling. Hidden file input triggers on click. Support multiple file selection. Display file list with names, sizes, and document type tags before upload confirmation.

## Dependent Tasks
- TASK_001: Backend File Upload API (provides POST /upload endpoint)
- NONE (can develop UI independently)

## Impacted Components
- **CREATE** app/src/pages/DocumentUploadPage.tsx - Main upload page layout
- **CREATE** app/src/components/documents/DropZone.tsx - Drag-drop upload zone
- **CREATE** app/src/components/documents/FileTypeSelector.tsx - Document type dropdown
- **CREATE** app/src/components/documents/FileList.tsx - Display selected files before upload
- **CREATE** app/src/components/documents/FileValidationError.tsx - Error messages for invalid files
- **CREATE** app/src/hooks/useFileUpload.ts - Custom hook for file handling and validation
- **CREATE** app/src/types/document.types.ts - Frontend document upload types
- **MODIFY** app/src/App.tsx - Add route for /documents/upload

## Implementation Plan
1. **Create document.types.ts (frontend)**: Define FileWithMetadata interface (file: File, document_type: string, upload_id: string, validation_error?: string), DocumentType enum ('Lab Results', 'Imaging', 'Prescription', 'Insurance Card', 'Other'), UploadConfig interface (maxFileSize: 10MB, maxTotalSize: 50MB, allowedTypes: string[])
2. **Create useFileUpload hook**: useState for selectedFiles, documentType, totalSize, dragActive, implement validateFile(file) checks MIME type and size, implement validateTotalSize(files) sums sizes, implement handleDrop(files) validates each file and adds to selectedFiles, implement removeFile(uploadId), return { selectedFiles, addFiles, removeFile, documentType, setDocumentType, validateBeforeUpload }
3. **Create DropZone component**: Use react-dropzone or native HTML5 drag-drop, render dashed border div with cloud icon (CloudUploadIcon), onDragEnter/onDragOver set dragActive=true (show highlight), onDragLeave set dragActive=false, onDrop call handleDrop, onClick trigger hidden input[type="file"], accept attribute="application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document", multiple, display "Drag files here or click to browse" text, show overlay "Drop files to upload" when dragActive
4. **Create FileTypeSelector component**: Dropdown with label "Document Type", options from DocumentType enum, controlled value with onChange handler, required field marked with asterisk, default to first option or "Select type..."
5. **Create FileList component**: Display selected files as list or grid, each item shows file icon (based on type: PDF icon, image thumbnail, doc icon), filename, file size formatted (KB/MB), document type tag, validation error if any in red text, "Remove" button (X icon)
6. **Create FileValidationError component**: Display error messages with error icon, types: "File [name] exceeds 10MB limit", "File type [type] not supported", "Total size exceeds 50MB", "No files selected", styled with red background and white text
7. **Create DocumentUploadPage**: Render FileTypeSelector at top, DropZone in center, note "Accepted: PDF, PNG, JPG, DOCX (max 10MB each)" below zone, FileList shows selected files, "Upload Documents" button at bottom (primary style, disabled if no files or validation errors), on upload click pass to TASK_003 for actual upload
8. **Add Drag Overlay**: Full-page overlay when dragging files anywhere on page, semi-transparent with "Drop files to upload" message centered, prevents accidental drops outside zone

**Focus on how to implement**: react-dropzone setup: `const {getRootProps, getInputProps, isDragActive} = useDropzone({ accept: {'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg']}, maxSize: 10485760, onDrop: handleDrop })`. File validation: `if (!['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) return error`. Size check: `if (file.size > 10 * 1024 * 1024) return error`. Total size: `const total = files.reduce((sum, f) => sum + f.size, 0); if (total > 50 * 1024 * 1024) return error`. File size formatting: `const formatFileSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB``. Thumbnail preview: for images use `URL.createObjectURL(file)`, for PDF show PDF icon.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── (DocumentUploadPage.tsx to be created)
│   ├── components/
│   │   ├── documents/
│   │   │   └── (DropZone.tsx, FileTypeSelector.tsx, FileList.tsx, etc. to be created)
│   │   └── common/
│   │       └── Button.tsx (existing)
│   ├── hooks/
│   │   └── (useFileUpload.ts to be created)
│   ├── types/
│   │   └── (document.types.ts to be created)
│   └── App.tsx (to be modified)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/DocumentUploadPage.tsx | Main upload page with file selector, drop zone, and file list |
| CREATE | app/src/components/documents/DropZone.tsx | Drag-drop zone with dashed border and cloud icon |
| CREATE | app/src/components/documents/FileTypeSelector.tsx | Dropdown for document type selection |
| CREATE | app/src/components/documents/FileList.tsx | List of selected files with metadata and remove buttons |
| CREATE | app/src/components/documents/FileValidationError.tsx | Error message component for validation failures |
| CREATE | app/src/hooks/useFileUpload.ts | Hook for file validation, state management |
| CREATE | app/src/types/document.types.ts | FileWithMetadata, DocumentType, UploadConfig interfaces |
| MODIFY | app/src/App.tsx | Add route /documents/upload for DocumentUploadPage |

## External References
- **react-dropzone**: https://react-dropzone.js.org/ - Simplified drag-drop file handling
- **HTML5 Drag and Drop**: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API - Native drag-drop API
- **File API**: https://developer.mozilla.org/en-US/docs/Web/API/File - Working with File objects
- **FileReader API**: https://developer.mozilla.org/en-US/docs/Web/API/FileReader - Read file contents for preview
- **Drag-Drop UX**: https://www.nngroup.com/articles/drag-drop/ - Best practices for drag-drop interfaces

## Build Commands
- Install dependencies: `npm install react-dropzone@^14.2.3` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for file validation)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Drag files into zone, files appear in list
- [x] Click "Browse Files", file picker opens
- [x] Select 11MB file, error message displays
- [x] Select unsupported file type (.exe), error displays
- [x] Select multiple files totaling >50MB, error displays
- [x] Drag overlay appears when dragging files over page
- [x] File list shows correct file names, sizes, icons
- [x] Remove button removes file from list
- [x] Upload button disabled when no files or errors present

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-008-document-upload.html during implementation
- [ ] Install dependencies: npm install react-dropzone@^14.2.3
- [ ] Create document.types.ts frontend (FileWithMetadata interface with file: File, document_type: string, upload_id: string UUID, validation_error?: string; DocumentType enum with 5 values; UploadConfig with maxFileSize: 10485760, maxTotalSize: 52428800, allowedTypes array)
- [ ] Create useFileUpload.ts hook (useState for selectedFiles, documentType, dragActive, validateFile function checks MIME and size, handleDrop validates and adds files with UUID, removeFile filters by upload_id, validateTotalSize sums file sizes, return all state and functions)
- [ ] Create DropZone.tsx component (use react-dropzone or native drag-drop, render dashed border div 400px height with cloud icon, text "Drag files here or click to browse", onDragEnter show highlight, onDrop call handleDrop, hidden input with accept and multiple attributes, conditional className based on dragActive)
- [ ] Create FileTypeSelector.tsx component (select dropdown with label "Document Type *", map DocumentType enum to options, controlled value and onChange handler, default value or placeholder "Select type...")
- [ ] Create FileList.tsx component (props: files array, onRemove function, map files to list items with file icon based on type, filename, formatFileSize(file.size), document_type tag, validation_error in red if present, Remove button X icon onClick calls onRemove(upload_id))
- [ ] Create FileValidationError.tsx component (props: error string, render div with error icon, message text, red background, white text, border-radius 4px, padding 12px)
- [ ] Create DocumentUploadPage.tsx page (render FileTypeSelector at top, DropZone in center, note text "Accepted: PDF, PNG, JPG, DOCX (max 10MB each)" below, FileList with selected files, Upload Documents button disabled={files.length === 0 || hasErrors}, useFileUpload hook for state management)
- [ ] Modify App.tsx (add <Route path="/documents/upload" element={<DocumentUploadPage />} />, ensure protected route with authentication)
- [ ] Add drag overlay (useEffect listen to window drag events, show full-page overlay when dragging files anywhere, hide when drop or drag leave, z-index 9999, semi-transparent background, centered "Drop files to upload" text)
- [ ] Add file size formatting utility (formatFileSize function: if bytes < 1024*1024 return KB, else return MB with 1 decimal, handle 0 bytes case)
