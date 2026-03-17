# Task - TASK_001_BE_DOCUMENT_EXTRACTION_SERVICE

## Requirement Reference
- User Story: US_029
- Story Location: `.propel/context/tasks/us_029/us_029.md`
- Acceptance Criteria:
    - AC1: Background job processes uploaded documents, calls OpenAI Vision/Text API, extracts structured data (patient_name, dob, diagnoses, medications, lab_results, allergies, provider), stores in PatientProfiles, updates status="Processed", flags low confidence (<90%) for review
- Edge Cases:
    - Illegible document: AI error → status="Extraction Failed", notify staff
    - Handwritten notes: Use OCR preprocessing, flag low confidence fields
    - OpenAI API down: Circuit breaker, retry with exponential backoff (5 min, 15 min, 1 hour)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Status badges + review UI) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-010 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | SCR-010 (Clinical Data Review - shows extracted data) |
| **UXR Requirements** | AIR-Q01 (Extraction >95% accuracy), UXR-401 (Processing status updates) |
| **Design Tokens** | Status badges: Processing=#007BFF (spinner), Processed=#28A745 (check), Needs Review=#FFC107 (warning), Failed=#DC3545 (X). Confidence: green >90%, yellow 80-90%, red <80% |

> **Wireframe Details:**
> - Extraction status badge on document thumbnail
> - Extracted data preview side panel with confidence indicators per field
> - Review mode for low-confidence fields (inline editing)
> - Approve button commits to PatientProfiles

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | Bull | 4.x (Job queue) |
| Backend | OpenAI SDK | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | OpenAI GPT-4 Vision | gpt-4-vision-preview |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-002 (Document extraction), AIR-Q01 (>95% accuracy), AIR-Q03 (Format agnostic), AIR-005 (PII handling) |
| **AI Pattern** | Document OCR + structured data extraction |
| **Prompt Template Path** | .propel/context/prompts/document-extraction-prompt.md, document-extraction-schema.json |
| **Guardrails Config** | .propel/context/prompts/extraction-guardrails.json (medical terms only, confidence thresholds) |
| **Model Provider** | OpenAI GPT-4 Vision (images), GPT-4 Turbo (PDFs) |

> **AI Integration Details:**
> - Images: gpt-4-vision-preview with image URL
> - PDFs: Extract text with pdf-parse, send to gpt-4-turbo
> - Extraction schema: JSON with fields {patient_name, dob, document_date, conditions[], medications[], lab_results[], allergies[], provider_name, facility_name}
> - Confidence scoring: Each field has confidence 0.0-1.0, flag <0.9 for review
> - Retry: 3 attempts with circuit breaker

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement document extraction system: (1) Bull job queue for background processing, (2) ExtractionWorker listens to 'document-extraction' queue, (3) For images: OpenAI Vision API with extraction prompt, (4) For PDFs: pdf-parse extracts text → OpenAI GPT-4 with structured extraction, (5) Parse JSON response with extraction schema (patient_name, dob, conditions, medications, labs, allergies), (6) Calculate confidence scores per field, (7) Store extracted data in PatientProfiles with document_id reference, (8) Update document status: "Processed" if all confidence >90%, "Needs Review" if any <90%, "Extraction Failed" on error, (9) Frontend: ExtractionStatusBadge, ExtractedDataPreview with confidence indicators, ManualReviewPanel for editing low-confidence fields, (10) Circuit breaker on OpenAI failures.

## Dependent Tasks
- US_028 Task 002: Document upload API (publishes extraction job)
- US_025 Task 003: AI prompt templates (reuse patterns)
- US_041: Circuit breaker (fallback on AI failure)

## Impacted Components
**New:**
- server/src/jobs/extraction-worker.ts (Bull worker)
- server/src/services/extraction.service.ts (OpenAI extraction logic)
- server/src/utils/pdf-parser.ts (PDF text extraction)
- .propel/context/prompts/document-extraction-prompt.md (Extraction prompt)
- .propel/context/prompts/document-extraction-schema.json (JSON schema)
- app/src/components/ExtractionStatusBadge.tsx (Status badge)
- app/src/components/ExtractedDataPreview.tsx (Data preview panel)
- app/src/components/ManualReviewPanel.tsx (Low-confidence field editor)

**Modified:**
- server/db/schema.sql (Ensure PatientProfiles has extracted_data JSONB column)

## Implementation Plan
1. Install Bull + pdf-parse: npm install bull pdf-parse
2. Create Bull queue: const extractionQueue = new Bull('document-extraction', redisConfig)
3. Create extraction-worker.ts: Process jobs, load document from storage, determine type (image vs PDF)
4. For images: Call OpenAI Vision API with prompt "Extract medical data from this document. Return JSON with: patient_name, dob, conditions, medications, labs, allergies, provider, facility."
5. For PDFs: pdf-parse extracts text → send to GPT-4 Turbo with extraction prompt → parse JSON
6. Extraction schema: Zod schema validates response structure, calculates confidence per field (based on AI response structure completeness)
7. Store extracted data: INSERT PatientProfiles (patient_id, document_id, extracted_data JSONB, extraction_confidence, extraction_completed_at)
8. Update document status: If avg confidence ≥ 0.9 → "Processed", else → "Needs Review"
9. Error handling: Try-catch around OpenAI call, retry 3 times, set status="Extraction Failed" if all fail
10. Frontend components: ExtractionStatusBadge (blue spinner, green check, yellow warning, red X), ExtractedDataPreview (shows JSON fields with confidence %), ManualReviewPanel (editable form for <90% fields)

## Current Project State
```
ASSIGNMENT/
├── server/src/services/ (appointments, notifications exist)
└── (extraction service + Bull worker to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/jobs/extraction-worker.ts | Bull worker for extraction |
| CREATE | server/src/services/extraction.service.ts | OpenAI extraction logic |
| CREATE | server/src/utils/pdf-parser.ts | PDF text extraction |
| CREATE | .propel/context/prompts/document-extraction-prompt.md | Extraction prompt |
| CREATE | .propel/context/prompts/document-extraction-schema.json | JSON schema |
| CREATE | app/src/components/ExtractionStatusBadge.tsx | Status badge |
| CREATE | app/src/components/ExtractedDataPreview.tsx | Data preview |
| CREATE | app/src/components/ManualReviewPanel.tsx | Low-confidence editor |
| UPDATE | server/package.json | Add bull, pdf-parse |
| UPDATE | server/db/schema.sql | Ensure extracted_data JSONB in PatientProfiles |

## External References
- [Bull Documentation](https://optimalbits.github.io/bull/)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [pdf-parse Library](https://www.npmjs.com/package/pdf-parse)
- [AIR-002 Document Extraction](../../../.propel/context/docs/spec.md#AIR-002)
- [AIR-Q01 Extraction Accuracy >95%](../../../.propel/context/docs/spec.md#AIR-Q01)

## Build Commands
```bash
cd server
npm install bull pdf-parse
npm run dev  # Bull worker starts automatically

# Add document to extraction queue (from upload API)
# Queue processes automatically in background
```

## Implementation Validation Strategy
- [ ] Unit tests: extractionService parses lab results correctly
- [ ] Integration tests: Upload document → extraction job completes → data in PatientProfiles
- [ ] bull installed: package.json shows bull@4.x
- [ ] Bull queue created: Server logs "Extraction queue initialized"
- [ ] Job added: Upload document → Bull queue shows 1 job
- [ ] Image extraction: Upload image → OpenAI Vision API called, extracted data returned
- [ ] PDF extraction: Upload PDF → pdf-parse runs, GPT-4 Turbo extracts data
- [ ] Confidence scoring: Extracted data has confidence per field (e.g., patient_name: 0.98)
- [ ] High confidence processed: All fields >90% → status="Processed"
- [ ] Low confidence review: Any field <90% → status="Needs Review", flagged
- [ ] Data stored: Query PatientProfiles → extracted_data JSONB has {conditions, medications, labs}
- [ ] Extraction failed: Upload corrupted PDF → status="Extraction Failed"
- [ ] Retry logic: Simulate OpenAI timeout → 3 retry attempts logged
- [ ] Circuit breaker: 3 consecutive failures → circuit opens, jobs paused
- [ ] Frontend status badge: Document shows "Processing" spinner during extraction
- [ ] Extracted data preview: Click "View Extracted Data" → side panel with confidence indicators

## Implementation Checklist
- [ ] Install Bull + pdf-parse: `npm install bull pdf-parse`
- [ ] Create Bull extraction queue
- [ ] Implement extraction.service.ts with OpenAI Vision + GPT-4
- [ ] Create extraction-worker.ts Bull worker
- [ ] Create pdf-parser.ts utility
- [ ] Create extraction prompt + schema files
- [ ] Create frontend status/preview components
- [ ] Update PatientProfiles table schema if needed
- [ ] Test extraction flow end-to-end
- [ ] Validate extraction accuracy >95%
- [ ] Document extraction system in server/README.md
