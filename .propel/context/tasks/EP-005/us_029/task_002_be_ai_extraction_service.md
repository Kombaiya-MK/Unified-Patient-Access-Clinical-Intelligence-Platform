# Task - TASK_002: Backend AI Document Extraction Service with Queue Processing

## Requirement Reference
- User Story: [us_029]
- Story Location: [.propel/context/tasks/us_029/us_029.md]
- Acceptance Criteria:
    - AC1: Background job queue picks up uploaded documents for processing
    - AC1: Calls OpenAI Vision API for images, text extraction for PDFs/DOCX
    - AC1: Sends structured extraction prompt requesting JSON output
    - AC1: Parses JSON response with >95% extraction accuracy per AIR-Q01
    - AC1: Stores extracted data in PatientProfiles table
    - AC1: Updates document status to Processed/Needs Review/Failed
    - AC1: Flags for manual review if confidence <90%
- Edge Case:
    - EC1: Document illegible/corrupted → AI returns error, set status="Extraction Failed"
    - EC2: Handwritten notes → OCR preprocessing, flag low confidence fields
    - EC3: OpenAI API down → Circuit breaker after 3 failures, exponential backoff (5min, 15min, 1hr)

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
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.18.x |
| Backend | Bull | 4.x |
| Backend | BullMQ | 4.x |
| AI | OpenAI SDK | 4.x |
| Backend | pdf-parse | 1.x |
| Backend | mammoth | 1.x |
| Backend | opossum (circuit breaker) | 8.x |
| Validation | Zod | 3.x |
| Database | PostgreSQL | 15.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-002 (Document data extraction), AIR-Q01 (>95% accuracy), AIR-Q03 (Format agnostic) |
| **AI Pattern** | Structured data extraction with JSON mode |
| **Prompt Template Path** | server/src/prompts/document-extraction-prompt.ts |
| **Guardrails Config** | server/src/config/extraction.config.ts (confidence thresholds, retry limits) |
| **Model Provider** | OpenAI GPT-4 Vision (images), GPT-4 (text) |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Setup Bull/BullMQ queue for document extraction processing. Create documentExtractionQueue with Redis connection, add job on document upload with document_id. Create extractionWorker.ts to process jobs: fetch document from database, read file from storage, determine file type (PDF/DOCX/image), extract text (pdf-parse for PDF, mammoth for DOCX, OpenAI Vision API for images with OCR). Build structured extraction prompt template requesting JSON output with fields: patient_name, date_of_birth, document_date, diagnosed_conditions[], prescribed_medications[{name, dosage, frequency}], lab_test_results[{test_name, value, unit, reference_range}], allergies[], provider_name, facility_name. Call OpenAI API with gpt-4-vision-preview or gpt-4 depending on file type, use response_format: {type: "json_object"} for structured output. Parse JSON response with Zod schema validation for type safety. Calculate confidence scores: overall confidence from OpenAI metadata, per-field confidence from response. If overall confidence <90%, set needs_manual_review=true and status="Needs Review", else status="Processed". Store extracted_data in patient_profiles.extracted_data JSONB. Update clinical_documents extraction_status, extraction_completed_at, extraction_confidence. Log attempt to extraction_logs with api_response_raw. Implement circuit breaker with opossum: track OpenAI API failures, after 3 consecutive failures open circuit and delay job retry with exponential backoff (5min, 15min, 1hr). Handle errors: set status="Extraction Failed" with extraction_error message, retry up to 3 times before giving up.

## Dependent Tasks
- TASK_001: Database Migration (extraction fields must exist)

## Impacted Components
- **CREATE** server/src/queues/documentExtractionQueue.ts - Bull queue configuration
- **CREATE** server/src/workers/extractionWorker.ts - Background job processor
- **CREATE** server/src/services/aiExtractionService.ts - OpenAI integration for extraction
- **CREATE** server/src/services/textExtractionService.ts - PDF/DOCX text extraction
- **CREATE** server/src/prompts/document-extraction-prompt.ts - Prompt template
- **CREATE** server/src/schemas/extractedData.schema.ts - Zod validation schema
- **CREATE** server/src/config/extraction.config.ts - Extraction configuration (thresholds, retry limits)
- **CREATE** server/src/utils/circuitBreaker.ts - Circuit breaker instance for OpenAI
- **MODIFY** server/src/controllers/documentController.ts - Add job to queue on upload

## Implementation Plan
1. **Install dependencies**: npm install bull@^4.12.0 bullmq@^4.17.0 pdf-parse@^1.1.1 mammoth@^1.7.0 opossum@^8.1.3, ensure openai@^4.28.0 and zod@^3.22.4 installed
2. **Create extraction.config.ts**: Define CONFIDENCE_THRESHOLD = 0.90, MIN_FIELD_CONFIDENCE = 0.80, MAX_RETRY_ATTEMPTS = 3, CIRCUIT_BREAKER_THRESHOLD = 3, BACKOFF_DELAYS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000] for exponential backoff in ms
3. **Create documentExtractionQueue.ts**: Setup Bull queue with Redis connection from config, export addExtractionJob(documentId) function, configure job options: attempts: 3, backoff: {type: 'exponential', delay: 5000}, removeOnComplete: false for audit trail
4. **Create extractedData.schema.ts**: Define Zod schemas: ExtractedMedicationSchema = z.object({name: z.string(), dosage: z.string(), frequency: z.string()}), ExtractedLabResultSchema = z.object({test_name: z.string(), value: z.string(), unit: z.string(), reference_range: z.string().optional()}), ExtractedDataSchema = z.object({patient_name: z.string(), date_of_birth: z.string(), document_date: z.string(), diagnosed_conditions: z.array(z.string()), prescribed_medications: z.array(ExtractedMedicationSchema), lab_test_results: z.array(ExtractedLabResultSchema), allergies: z.array(z.string()), provider_name: z.string().optional(), facility_name: z.string().optional()})
5. **Create document-extraction-prompt.ts**: Build prompt template function buildExtractionPrompt(documentType: string): "You are a medical document extraction assistant. Extract structured data from the following ${documentType}. Return ONLY a JSON object with these fields: patient_name (string), date_of_birth (string YYYY-MM-DD), document_date (string YYYY-MM-DD), diagnosed_conditions (array of strings), prescribed_medications (array of {name, dosage, frequency}), lab_test_results (array of {test_name, value, unit, reference_range}), allergies (array of strings), provider_name (string or null), facility_name (string or null). If a field is not present in the document, use null. Be precise and extract only factual information visible in the document."
6. **Create textExtractionService.ts**: Implement extractTextFromFile(filePath: string, mimeType: string): if PDF use pdf-parse to extract text from buffer, if DOCX use mammoth.extractRawText, else throw UnsupportedFileTypeError, return extracted text string
7. **Create circuitBreaker.ts**: Setup opossum circuit breaker for OpenAI API calls: const breaker = new CircuitBreaker(openAIFunction, {timeout: 30000, errorThresholdPercentage: 50, resetTimeout: 5 * 60 * 1000}), export breaker, add event listeners: breaker.on('open', () => log 'Circuit breaker opened'), breaker.on('halfOpen', () => log 'Circuit breaker half-open')
8. **Create aiExtractionService.ts**: Implement extractDataFromDocument(document: Document): if image (PNG/JPG) call OpenAI Vision API with gpt-4-vision-preview: messages = [{role: 'user', content: [{type: 'text', text: extractionPrompt}, {type: 'image_url', image_url: {url: base64ImageUrl}}]}], response_format: {type: 'json_object'}, else extract text with textExtractionService then call OpenAI with gpt-4: messages = [{role: 'system', content: extractionPrompt}, {role: 'user', content: extractedText}], response_format: {type: 'json_object'}, wrap OpenAI call in circuit breaker, parse JSON response, validate with Zod schema, calculate confidence: overall confidence from response metadata or default 0.95 if >95% fields extracted, per-field confidence from response or estimate based on field completeness, determine needs_manual_review = overallConfidence < CONFIDENCE_THRESHOLD, return {extractedData, confidence, needsReview}
9. **Create extractionWorker.ts**: Setup Bull worker: queue.process(async (job) => {const {documentId} = job.data; fetch document from DB; read file from storage; call aiExtractionService.extractDataFromDocument; update clinical_documents: set extraction_status='Processing' at start, 'Processed' or 'Needs Review' on success, 'Extraction Failed' on error, set extraction_completed_at=NOW(), extraction_confidence=confidence, needs_manual_review=needsReview; upsert patient_profiles.extracted_data with document reference; log to extraction_logs with attempt number, status, confidence_scores, processing_duration_ms, api_response_raw}), handle job failures: on error log extraction_error, increment extraction_attempt, if attempts >= MAX_RETRY_ATTEMPTS set final status='Extraction Failed'
10. **Modify documentController.ts upload endpoint**: After successful file upload, call documentExtractionQueue.addExtractionJob(documentId) to enqueue extraction job
11. **Add exponential backoff**: In extractionWorker job options, implement custom backoff: backoff: {type: 'custom', fn: (attemptNumber) => BACKOFF_DELAYS[attemptNumber - 1] || BACKOFF_DELAYS[2]}
12. **Testing**: Create test document fixtures (PDF lab report, DOCX prescription, PNG insurance card), test extraction service with mock OpenAI responses, test circuit breaker opens after 3 failures, verify extracted data stored correctly in database, test confidence scoring and manual review flagging

**Focus on how to implement**: Bull queue setup: `import Bull from 'bull'; const queue = new Bull('document-extraction', {redis: {host: 'localhost', port: 6379}}); export const addExtractionJob = (documentId: number) => queue.add({documentId}, {attempts: 3, backoff: {type: 'exponential', delay: 5000}});`. Worker: `queue.process(async (job) => { ... });`. OpenAI Vision for images: `const response = await openai.chat.completions.create({model: 'gpt-4-vision-preview', messages: [{role: 'user', content: [{type: 'text', text: prompt}, {type: 'image_url', image_url: {url: `data:image/jpeg;base64,${base64Image}`}}]}], response_format: {type: 'json_object'}, max_tokens: 4096}); const extractedData = JSON.parse(response.choices[0].message.content);`. OpenAI text: `const response = await openai.chat.completions.create({model: 'gpt-4', messages: [{role: 'system', content: prompt}, {role: 'user', content: text}], response_format: {type: 'json_object'}}); const extractedData = JSON.parse(response.choices[0].message.content);`. Zod validation: `const validated = ExtractedDataSchema.parse(extractedData);`. Circuit breaker: `const breaker = new CircuitBreaker(openAICall, {timeout: 30000, errorThresholdPercentage: 50, resetTimeout: 300000}); const result = await breaker.fire(params);`. Confidence calculation: `const overallConfidence = response.metadata?.confidence || (Object.values(extractedData).filter(v => v !== null).length / totalFields);`.

## Current Project State
```
server/
├── src/
│   ├── queues/ (to be created)
│   ├── workers/ (to be created)
│   ├── services/
│   │   ├── aiExtractionService.ts (to be created)
│   │   └── textExtractionService.ts (to be created)
│   ├── prompts/ (to be created)
│   ├── schemas/
│   │   └── extractedData.schema.ts (to be created)
│   ├── config/
│   │   └── extraction.config.ts (to be created)
│   ├── utils/
│   │   └── circuitBreaker.ts (to be created)
│   └── controllers/
│       └── documentController.ts (to be modified)
└── package.json (to be updated with new dependencies)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/queues/documentExtractionQueue.ts | Bull queue configuration with Redis, addExtractionJob function |
| CREATE | server/src/workers/extractionWorker.ts | Background job processor for document extraction |
| CREATE | server/src/services/aiExtractionService.ts | OpenAI Vision/GPT-4 integration with structured extraction |
| CREATE | server/src/services/textExtractionService.ts | PDF/DOCX text extraction utilities |
| CREATE | server/src/prompts/document-extraction-prompt.ts | Medical document extraction prompt template |
| CREATE | server/src/schemas/extractedData.schema.ts | Zod schemas for extracted data validation |
| CREATE | server/src/config/extraction.config.ts | Confidence thresholds, retry limits, backoff delays |
| CREATE | server/src/utils/circuitBreaker.ts | Opossum circuit breaker for OpenAI API |
| MODIFY | server/src/controllers/documentController.ts | Add job to queue on document upload |
| MODIFY | server/package.json | Add bull, bullmq, pdf-parse, mammoth, opossum dependencies |

## External References
- **Bull Queue**: https://github.com/OptimalBits/bull - Background job queue for Node.js
- **BullMQ**: https://docs.bullmq.io/ - Modern Bull alternative with better TypeScript support
- **OpenAI Vision API**: https://platform.openai.com/docs/guides/vision - Process images with GPT-4 Vision
- **OpenAI JSON Mode**: https://platform.openai.com/docs/guides/text-generation/json-mode - Structured output
- **pdf-parse**: https://www.npmjs.com/package/pdf-parse - Extract text from PDF files
- **mammoth**: https://www.npmjs.com/package/mammoth - Extract text from DOCX files
- **Opossum Circuit Breaker**: https://nodeshift.dev/opossum/ - Circuit breaker for Node.js
- **Zod**: https://zod.dev/ - TypeScript-first schema validation

## Build Commands
- Install dependencies: `cd server && npm install bull@^4.12.0 bullmq@^4.17.0 pdf-parse@^1.1.1 mammoth@^1.7.0 opossum@^8.1.3`
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Start worker: `npm run worker` (or `node dist/workers/extractionWorker.js`)
- Run tests: `npm test -- extractionWorker.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] Dependencies installed successfully (bull, pdf-parse, mammoth, opossum)
- [x] Redis connection established for Bull queue
- [x] Upload test PDF, job added to queue successfully
- [x] Worker processes job and calls aiExtractionService
- [x] PDF text extracted correctly with pdf-parse
- [x] DOCX text extracted correctly with mammoth
- [x] OpenAI API called with correct prompt and response_format
- [x] JSON response parsed and validated with Zod schema
- [x] Extracted data stored in patient_profiles.extracted_data
- [x] Document status updated to "Processed" for high confidence
- [x] Document status updated to "Needs Review" for low confidence (<90%)
- [x] extraction_logs entry created with attempt details
- [x] Circuit breaker opens after 3 consecutive OpenAI failures
- [x] Exponential backoff applied on retries (5min, 15min, 1hr)
- [x] Error handling sets status to "Extraction Failed" on max retries

## Implementation Checklist
- [ ] Install dependencies: npm install bull@^4.12.0 pdf-parse@^1.1.1 mammoth@^1.7.0 opossum@^8.1.3 (verify openai@^4.28.0 and zod@^3.22.4 already installed)
- [ ] Create server/src/config/extraction.config.ts with constants (CONFIDENCE_THRESHOLD=0.90, MIN_FIELD_CONFIDENCE=0.80, MAX_RETRY_ATTEMPTS=3, CIRCUIT_BREAKER_THRESHOLD=3, BACKOFF_DELAYS=[300000, 900000, 3600000])
- [ ] Create server/src/schemas/extractedData.schema.ts with Zod schemas (ExtractedMedicationSchema, ExtractedLabResultSchema, ExtractedDataSchema with all medical fields)
- [ ] Create server/src/prompts/document-extraction-prompt.ts with buildExtractionPrompt function (template requesting JSON with patient_name, date_of_birth, document_date, conditions, medications, labs, allergies, provider, facility)
- [ ] Create server/src/services/textExtractionService.ts (extractTextFromFile function: check mimeType, if PDF use pdf-parse, if DOCX use mammoth.extractRawText, return string, handle errors)
- [ ] Create server/src/utils/circuitBreaker.ts (setup opossum CircuitBreaker with timeout=30000, errorThresholdPercentage=50, resetTimeout=300000, add event listeners for 'open' and 'halfOpen')
- [ ] Create server/src/services/aiExtractionService.ts (extractDataFromDocument function: check if image use OpenAI Vision gpt-4-vision-preview with base64 image, else extract text then use gpt-4, wrap in circuit breaker, parse JSON, validate with Zod, calculate confidence scores, return {extractedData, confidence, needsReview})
- [ ] Create server/src/queues/documentExtractionQueue.ts (setup Bull queue with Redis config, export addExtractionJob function, configure job options with attempts=3 and exponential backoff)
- [ ] Create server/src/workers/extractionWorker.ts (queue.process handler: fetch document from DB, read file from storage, update status to 'Processing', call aiExtractionService, update patient_profiles extracted_data, update clinical_documents status/confidence/completed_at, log to extraction_logs, handle errors and retries)
- [ ] Modify server/src/controllers/documentController.ts upload endpoint (after successful upload call documentExtractionQueue.addExtractionJob(document.document_id) to enqueue extraction job)
- [ ] Implement exponential backoff in queue configuration (custom backoff function using BACKOFF_DELAYS array based on attempt number)
- [ ] Add logging for extraction attempts (use logger to track extraction start, success, failure, circuit breaker events)
