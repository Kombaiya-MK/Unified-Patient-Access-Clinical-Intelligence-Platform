# Task - TASK_001_BE_CIRCUIT_BREAKER_AI_SERVICES

## Requirement Reference
- User Story: US_041
- Story Location: .propel/context/tasks/us_041/us_041.md
- Acceptance Criteria:
    - Circuit breaker transitions to "Open" state when OpenAI API failures exceed 50% error rate within 1-minute rolling window
    - Blocks subsequent API calls for 60 seconds cooldown period
    - Graceful fallback responses: AI intake → manual form-only mode, Document extraction → queue for later processing, Medical coding → manual coding message, Medication conflicts → rule-based validation
    - Attempts Half-Open state after cooldown with single test request
    - Transitions back to Closed if test succeeds or back to Open if test fails (exponential backoff 60s → 120s → 300s)
    - Notifies admin via email/SMS when circuit opens (critical alert)
    - Implements circuit breaker per OpenAI model endpoint (GPT-4 for intake, GPT-4V for extraction)
    - Tracks metrics: circuit_breaker_state gauge, api_failure_rate histogram, fallback_activation_count counter
- Edge Case:
    - Circuit opens during appointment booking: User can book but AI features disabled with "Limited functionality" banner
    - Queued documents processed after recovery: Background job retries in FIFO order with rate limiting 10/minute
    - Fallback logic fails: Return 503 with retry-after header, log critical error

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
| Backend | Express | 4.18.x |
| Backend | TypeScript | 5.3.x |
| Backend | opossum | 8.x (Circuit breaker) |
| Backend | Bull | 4.x (Job queue) |
| Backend | node-cron | 3.x (Retry scheduler) |
| Backend | nodemailer | 6.x (Email notifications) |
| Database | PostgreSQL | 15.x |
| Cache | Redis | 5.x |
| AI/ML | OpenAI GPT-4 | gpt-4-turbo |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes (Protects OpenAI API calls) |
| **AIR Requirements** | NFR-REL01 (Graceful degradation), NFR-REL02 (Circuit breaker for external APIs) |
| **AI Pattern** | Circuit breaker with fallback logic |
| **Prompt Template Path** | N/A (Uses existing AI services from US-025, US-029, US-032, US-033) |
| **Guardrails Config** | N/A |
| **Model Provider** | OpenAI |

> **Circuit Breaker Details:**
> - **Library**: opossum 8.x for circuit breaker implementation
> - **Configuration**: Failure threshold 50%, request volume threshold 10, timeout 30s, rolling window 60s, cooldown 60s
> - **State Machine**: Closed → (>50% failures in 1min) → Open → (after 60s) → Half-Open → (test success) → Closed OR (test fail) → Open
> - **Exponential Backoff**: 60s → 120s → 300s on repeated failures
> - **Separate Breakers**: GPT-4 (intake, coding, conflicts), GPT-4V (document extraction)

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Enhance circuit breaker implementation (from US-040) for AI services: (1) Create database migration V029 for ai_extraction_jobs_queue table (document_id, job_type, status, retry_count, scheduled_at, error_details), (2) Create separate circuit breakers per OpenAI endpoint: gpt4IntakeBreaker (AI intake), gpt4VisionExtractionBreaker (document extraction), gpt4CodingBreaker (medical coding), gpt4ConflictsBreaker (medication conflicts), (3) Configure opossum circuit breakers: errorThresholdPercentage=50%, volumeThreshold=10, timeout=30s, rollingCountTimeout=60s, resetTimeout=60s with exponential backoff, (4) Implement fallback logic: AI intake → return {fallbackMode: 'manual', message: 'AI chat unavailable, please use form'}, Document extraction → queue job to ai_extraction_jobs_queue with status='queued', Medical coding → return {fallback: true, message: 'AI suggestion unavailable - use manual coding'}, Medication conflicts → use rule-based validator with basic drug interaction database, (5) Create retry worker (ai-extraction-retry-worker.ts) using Bull queue with rate limiting 10 jobs/minute, FIFO order processing, exponential backoff per document (1min, 5min, 15min), marks failed after 3 retries, (6) Add circuit breaker event handlers: on('open') → log critical error, send email/SMS notification to admin, update metrics, on('halfOpen') → log info "Testing recovery", send health check request, on('close') → log success "Service recovered", send recovery notification, (7) Extend Prometheus metrics (from US-040): circuit_breaker_state gauge with labels {service, model}, api_failure_rate histogram, fallback_activation_count counter with labels {service, fallback_type}, (8) Create notification service (circuit-breaker-alerts.service.ts) using nodemailer for email and SMS gateway API for critical alerts.

## Dependent Tasks
- US-040 TASK_002: Basic circuit breaker implementation (extends this)
- US-025: AI intake service (wraps with circuit breaker)
- US-029: Document extraction service (wraps with circuit breaker)
- US-032: Medical coding service (wraps with circuit breaker)
- US-033: Medication conflicts service (wraps with circuit breaker)
- US-005: Prometheus metrics (extends with AI-specific metrics)

## Impacted Components
- database/migrations/V029__ai_extraction_jobs_queue.sql - New migration
- server/src/config/circuit-breaker.config.ts - Circuit breaker configuration (extend from US-040)
- server/src/middleware/circuit-breaker-ai.middleware.ts - AI-specific circuit breakers
- server/src/services/fallback/ai-intake-fallback.service.ts - Fallback logic for AI intake
- server/src/services/fallback/extraction-fallback.service.ts - Document extraction queueing
- server/src/services/fallback/coding-fallback.service.ts - Medical coding fallback
- server/src/services/fallback/conflicts-fallback.service.ts - Rule-based conflict detection
- server/src/workers/ai-extraction-retry-worker.ts - Background retry job
- server/src/services/circuit-breaker-alerts.service.ts - Email/SMS notifications
- server/src/config/metrics.ts - Extend Prometheus metrics (US-005, US-040)
- server/src/services/ai-intake.service.ts - Wrap with circuit breaker (US-025)
- server/src/services/document-extraction.service.ts - Wrap with circuit breaker (US-029)
- server/src/services/medical-coding.service.ts - Wrap with circuit breaker (US-032)
- server/src/services/medication-conflicts.service.ts - Wrap with circuit breaker (US-033)
- server/package.json - Add nodemailer dependency

## Implementation Plan
1. **Database Migration V029 - AI Extraction Jobs Queue**:
   - CREATE TABLE ai_extraction_jobs_queue:
     - id BIGSERIAL PRIMARY KEY
     - document_id BIGINT NOT NULL REFERENCES clinical_documents(id)
     - job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('ocr_extraction', 'data_extraction', 'classification'))
     - status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
     - retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3)
     - scheduled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
     - processed_at TIMESTAMPTZ
     - error_details JSONB
     - created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   - CREATE INDEX idx_extraction_jobs_status ON ai_extraction_jobs_queue(status, scheduled_at) WHERE status IN ('queued', 'processing')
   - CREATE INDEX idx_extraction_jobs_document ON ai_extraction_jobs_queue(document_id)
2. **Circuit Breaker Configuration (circuit-breaker.config.ts)**:
   ```typescript
   import CircuitBreaker from 'opossum';
   import { openai } from './openai.config';
   
   const defaultOptions = {
     timeout: 30000,              // 30s timeout per request
     errorThresholdPercentage: 50, // Open after 50% failure rate
     volumeThreshold: 10,          // Min 10 requests before opening
     resetTimeout: 60000,          // 60s cooldown before half-open
     rollingCountTimeout: 60000,   // 1-minute rolling window
     rollingCountBuckets: 60,      // 1-second buckets
     name: 'default'
   };
   
   // Separate circuit breakers per AI service
   export const gpt4IntakeBreaker = new CircuitBreaker(
     async (messages: any[]) => openai.chat.completions.create({
       model: 'gpt-4-turbo', messages
     }),
     { ...defaultOptions, name: 'gpt4-intake' }
   );
   
   export const gpt4VisionExtractionBreaker = new CircuitBreaker(
     async (imageUrl: string, prompt: string) => openai.chat.completions.create({
       model: 'gpt-4-vision-preview',
       messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: imageUrl }}, { type: 'text', text: prompt }]}]
     }),
     { ...defaultOptions, name: 'gpt4v-extraction', timeout: 45000 }
   );
   
   export const gpt4CodingBreaker = new CircuitBreaker(
     async (diagnoses: string[]) => openai.chat.completions.create({
       model: 'gpt-4-turbo',
       messages: [{ role: 'user', content: `Extract ICD-10 and CPT codes for: ${diagnoses.join(', ')}` }],
       tools: [{ type: 'function', function: { name: 'extract_codes', parameters: {...} }}]
     }),
     { ...defaultOptions, name: 'gpt4-coding' }
   );
   
   export const gpt4ConflictsBreaker = new CircuitBreaker(
     async (medications: string[]) => openai.chat.completions.create({
       model: 'gpt-4-turbo',
       messages: [{ role: 'user', content: `Check drug interactions for: ${medications.join(', ')}` }]
     }),
     { ...defaultOptions, name: 'gpt4-conflicts' }
   );
   
   // Exponential backoff tracker
   const backoffTracker = new Map<string, number>();
   
   function getBackoffTime(breakerName: string): number {
     const count = backoffTracker.get(breakerName) || 0;
     const backoffTimes = [60000, 120000, 300000]; // 60s, 120s, 300s
     return backoffTimes[Math.min(count, backoffTimes.length - 1)];
   }
   
   // Configure exponential backoff
   [gpt4IntakeBreaker, gpt4VisionExtractionBreaker, gpt4CodingBreaker, gpt4ConflictsBreaker].forEach(breaker => {
     breaker.on('open', () => {
       const count = backoffTracker.get(breaker.name) || 0;
       backoffTracker.set(breaker.name, count + 1);
       const backoffTime = getBackoffTime(breaker.name);
       breaker.options.resetTimeout = backoffTime;
       console.error(`Circuit breaker ${breaker.name} opened, backoff: ${backoffTime}ms`);
     });
     
     breaker.on('close', () => {
       backoffTracker.set(breaker.name, 0); // Reset backoff on success
       breaker.options.resetTimeout = 60000; // Reset to default
       console.info(`Circuit breaker ${breaker.name} closed (recovered)`);
     });
   });
   ```
3. **Fallback Logic - AI Intake (ai-intake-fallback.service.ts)**:
   ```typescript
   export class AIIntakeFallbackService {
     getFallbackResponse(conversationHistory: any[]): {
       fallbackMode: boolean;
       message: string;
       action: 'manual_form';
     } {
       return {
         fallbackMode: true,
         message: 'AI chat is temporarily unavailable. Please complete the appointment form manually.',
         action: 'manual_form'
       };
     }
   }
   ```
4. **Fallback Logic - Document Extraction (extraction-fallback.service.ts)**:
   ```typescript
   import { db } from '../config/database.config';
   
   export class ExtractionFallbackService {
     async queueForRetry(documentId: number, jobType: string): Promise<{
       queued: boolean;
       message: string;
       estimatedRetry: Date;
     }> {
       // Insert into ai_extraction_jobs_queue
       await db.query(
         'INSERT INTO ai_extraction_jobs_queue (document_id, job_type, status) VALUES ($1, $2, $3)',
         [documentId, jobType, 'queued']
       );
       
       const estimatedRetry = new Date(Date.now() + 60000); // 1 minute
       
       fallbackActivationCounter.inc({ service: 'extraction', fallback_type: 'queue' });
       
       return {
         queued: true,
         message: 'Processing Delayed - Document queued for extraction when AI service recovers',
         estimatedRetry
       };
     }
   }
   ```
5. **Fallback Logic - Medical Coding (coding-fallback.service.ts)**:
   ```typescript
   export class CodingFallbackService {
     getFallbackMessage(): {
       fallback: boolean;
       message: string;
       action: 'manual_coding';
     } {
       fallbackActivationCounter.inc({ service: 'coding', fallback_type: 'manual' });
       
       return {
         fallback: true,
         message: 'AI suggestion unavailable - please use manual coding interface',
         action: 'manual_coding'
       };
     }
   }
   ```
6. **Fallback Logic - Medication Conflicts (conflicts-fallback.service.ts)**:
   ```typescript
   // Basic rule-based drug interaction database
   const basicInteractions = {
     'warfarin': ['aspirin', 'ibuprofen', 'clopidogrel'],
     'metformin': ['alcohol', 'iodinated contrast'],
     'lisinopril': ['potassium supplements', 'spironolactone']
     // ... more basic interactions
   };
   
   export class ConflictsFallbackService {
     checkBasicInteractions(medications: string[]): {
       fallback: boolean;
       conflicts: Array<{drug1: string, drug2: string, severity: string, message: string}>;
       disclaimer: string;
     } {
       const conflicts = [];
       
       for (let i = 0; i < medications.length; i++) {
         for (let j = i + 1; j < medications.length; j++) {
           const drug1 = medications[i].toLowerCase();
           const drug2 = medications[j].toLowerCase();
           
           if (basicInteractions[drug1]?.includes(drug2)) {
             conflicts.push({
               drug1: medications[i],
               drug2: medications[j],
               severity: 'moderate',
               message: `Potential interaction detected (basic rule-based check)`
             });
           }
         }
       }
       
       fallbackActivationCounter.inc({ service: 'conflicts', fallback_type: 'rule_based' });
       
       return {
         fallback: true,
         conflicts,
         disclaimer: 'Using basic rule-based validation. AI-powered advanced conflict detection unavailable.'
       };
     }
   }
   ```
7. **AI Extraction Retry Worker (ai-extraction-retry-worker.ts)**:
   ```typescript
   import cron from 'node-cron';
   import Queue from 'bull';
   import { db } from '../config/database.config';
   import { gpt4VisionExtractionBreaker } from '../config/circuit-breaker.config';
   
   const extractionQueue = new Queue('ai-extraction-retry', process.env.REDIS_URL);
   
   // Rate limiter: 10 jobs per minute
   extractionQueue.process(10, async (job) => {
     const { documentId, jobType, retryCount } = job.data;
     
     try {
       // Update status to processing
       await db.query(
         'UPDATE ai_extraction_jobs_queue SET status=$1 WHERE document_id=$2',
         ['processing', documentId]
       );
       
       // Fetch document
       const doc = await db.query('SELECT * FROM clinical_documents WHERE id=$1', [documentId]);
       
       // Attempt extraction through circuit breaker
       const result = await gpt4VisionExtractionBreaker.fire(doc.file_url, 'Extract medical data');
       
       // Mark completed
       await db.query(
         'UPDATE ai_extraction_jobs_queue SET status=$1, processed_at=$2 WHERE document_id=$3',
         ['completed', new Date(), documentId]
       );
       
       // Update clinical_documents with extracted data
       await db.query(
         'UPDATE clinical_documents SET metadata=$1 WHERE id=$2',
         [result.extractedData, documentId]
       );
       
       console.log(`Successfully processed queued extraction for document ${documentId}`);
     } catch (error) {
       const newRetryCount = retryCount + 1;
       
       if (newRetryCount >= 3) {
         // Mark as failed after 3 retries
         await db.query(
           'UPDATE ai_extraction_jobs_queue SET status=$1, error_details=$2 WHERE document_id=$3',
           ['failed', JSON.stringify({ error: error.message, retries: newRetryCount }), documentId]
         );
         console.error(`Failed to process document ${documentId} after 3 retries`);
       } else {
         // Exponential backoff: 1min, 5min, 15min
         const backoffTimes = [60000, 300000, 900000];
         const scheduleAt = new Date(Date.now() + backoffTimes[newRetryCount - 1]);
         
         await db.query(
           'UPDATE ai_extraction_jobs_queue SET retry_count=$1, scheduled_at=$2, status=$3 WHERE document_id=$4',
           [newRetryCount, scheduleAt, 'queued', documentId]
         );
         
         console.warn(`Retry ${newRetryCount} scheduled for document ${documentId} at ${scheduleAt}`);
       }
     }
   });
   
   // Cron job: Check for queued jobs every minute
   cron.schedule('* * * * *', async () => {
     const queuedJobs = await db.query(
       'SELECT * FROM ai_extraction_jobs_queue WHERE status=$1 AND scheduled_at <= NOW() ORDER BY scheduled_at ASC LIMIT 10',
       ['queued']
     );
     
     for (const job of queuedJobs.rows) {
       extractionQueue.add({
         documentId: job.document_id,
         jobType: job.job_type,
         retryCount: job.retry_count
       });
     }
   });
   ```
8. **Circuit Breaker Alert Service (circuit-breaker-alerts.service.ts)**:
   ```typescript
   import nodemailer from 'nodemailer';
   
   export class CircuitBreakerAlertService {
     private transporter = nodemailer.createTransport({
       host: process.env.SMTP_HOST,
       port: parseInt(process.env.SMTP_PORT || '587'),
       secure: false,
       auth: {
         user: process.env.SMTP_USER,
         pass: process.env.SMTP_PASSWORD
       }
     });
     
     async sendCriticalAlert(breakerName: string, state: 'open' | 'recovered') {
       const subject = state === 'open' 
         ? `🚨 CRITICAL: ${breakerName} Circuit Breaker Opened`
         : `✅ RECOVERED: ${breakerName} Circuit Breaker Closed`;
       
       const body = state === 'open'
         ? `The ${breakerName} circuit breaker has opened due to high failure rate (>50%). AI service is in fallback mode.`
         : `The ${breakerName} circuit breaker has recovered. AI service is back online.`;
       
       // Send email
       await this.transporter.sendMail({
         from: process.env.SMTP_FROM,
         to: process.env.ADMIN_EMAIL,
         subject,
         text: body,
         html: `<h2>${subject}</h2><p>${body}</p><p>Timestamp: ${new Date().toISOString()}</p>`
       });
       
       // Send SMS via gateway API (e.g., Twilio)
       if (process.env.SMS_GATEWAY_URL) {
         await fetch(process.env.SMS_GATEWAY_URL, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             to: process.env.ADMIN_PHONE,
             message: `${subject}: ${body}`
           })
         });
       }
     }
   }
   ```
9. **Extend Prometheus Metrics (metrics.ts)**:
   ```typescript
   // Add to existing metrics from US-005 and US-040
   import { Gauge, Histogram, Counter } from 'prom-client';
   
   export const circuitBreakerStateGauge = new Gauge({
     name: 'circuit_breaker_state',
     help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
     labelNames: ['service', 'model']
   });
   
   export const apiFailureRateHistogram = new Histogram({
     name: 'api_failure_rate',
     help: 'API failure rate percentage',
     labelNames: ['service', 'model'],
     buckets: [0, 10, 25, 50, 75, 90, 100]
   });
   
   export const fallbackActivationCounter = new Counter({
     name: 'fallback_activation_count',
     help: 'Number of times fallback logic activated',
     labelNames: ['service', 'fallback_type']
   });
   ```
10. **Integrate Circuit Breakers into AI Services**:
    - Modify ai-intake.service.ts (US-025): Wrap OpenAI calls with gpt4IntakeBreaker.fire(), catch breaker errors, return fallback
    - Modify document-extraction.service.ts (US-029): Wrap with gpt4VisionExtractionBreaker.fire(), on error call extractionFallbackService.queueForRetry()
    - Modify medical-coding.service.ts (US-032): Wrap with gpt4CodingBreaker.fire(), on error return codingFallbackService.getFallbackMessage()
    - Modify medication-conflicts.service.ts (US-033): Wrap with gpt4ConflictsBreaker.fire(), on error call conflictsFallbackService.checkBasicInteractions()
11. **Add Circuit Breaker Event Handlers**:
    ```typescript
    const alertService = new CircuitBreakerAlertService();
    
    gpt4IntakeBreaker.on('open', () => {
      circuitBreakerStateGauge.set({ service: 'ai-intake', model: 'gpt-4' }, 2);
      alertService.sendCriticalAlert('ai-intake', 'open');
    });
    gpt4IntakeBreaker.on('close', () => {
      circuitBreakerStateGauge.set({ service: 'ai-intake', model: 'gpt-4' }, 0);
      alertService.sendCriticalAlert('ai-intake', 'recovered');
    });
    // Repeat for all breakers...
    ```

## Current Project State
```
server/
├── src/
│   ├── config/
│   │   ├── circuit-breaker.config.ts (extends US-040)
│   │   └── metrics.ts (extends US-005, US-040)
│   ├── middleware/
│   │   └── circuit-breaker-ai.middleware.ts (new)
│   ├── services/
│   │   ├── fallback/
│   │   │   ├── ai-intake-fallback.service.ts (new)
│   │   │   ├── extraction-fallback.service.ts (new)
│   │   │   ├── coding-fallback.service.ts (new)
│   │   │   └── conflicts-fallback.service.ts (new)
│   │   ├── circuit-breaker-alerts.service.ts (new)
│   │   ├── ai-intake.service.ts (modify - US-025)
│   │   ├── document-extraction.service.ts (modify - US-029)
│   │   ├── medical-coding.service.ts (modify - US-032)
│   │   └── medication-conflicts.service.ts (modify - US-033)
│   └── workers/
│       └── ai-extraction-retry-worker.ts (new)
└── package.json (add nodemailer)
database/
├── migrations/
│   └── V029__ai_extraction_jobs_queue.sql (new)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V029__ai_extraction_jobs_queue.sql | Migration for ai_extraction_jobs_queue table with retry tracking |
| CREATE | server/src/services/fallback/ai-intake-fallback.service.ts | Fallback logic returning manual form mode |
| CREATE | server/src/services/fallback/extraction-fallback.service.ts | Queueing service for delayed document extraction |
| CREATE | server/src/services/fallback/coding-fallback.service.ts | Fallback message for manual coding |
| CREATE | server/src/services/fallback/conflicts-fallback.service.ts | Rule-based conflict detection fallback |
| CREATE | server/src/workers/ai-extraction-retry-worker.ts | Background job for retrying queued extractions |
| CREATE | server/src/services/circuit-breaker-alerts.service.ts | Email/SMS notification service for circuit breaker events |
| MODIFY | server/src/config/circuit-breaker.config.ts | Add 4 separate circuit breakers per AI service, exponential backoff |
| MODIFY | server/src/config/metrics.ts | Add circuit_breaker_state, api_failure_rate, fallback_activation_count metrics |
| MODIFY | server/src/services/ai-intake.service.ts | Wrap OpenAI calls with gpt4IntakeBreaker, add fallback logic |
| MODIFY | server/src/services/document-extraction.service.ts | Wrap with gpt4VisionExtractionBreaker, queue on failure |
| MODIFY | server/src/services/medical-coding.service.ts | Wrap with gpt4CodingBreaker, return fallback message on error |
| MODIFY | server/src/services/medication-conflicts.service.ts | Wrap with gpt4ConflictsBreaker, use rule-based fallback |
| MODIFY | server/package.json | Add nodemailer@6.x dependency |

## External References
- [opossum Documentation](https://nodeshift.dev/opossum/)
- [Bull Queue](https://github.com/OptimalBits/bull)
- [nodemailer](https://nodemailer.com/about/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [NFR-REL01 Graceful Degradation](.propel/context/docs/spec.md#NFR-REL01)
- [NFR-REL02 Circuit Breaker](.propel/context/docs/spec.md#NFR-REL02)

## Build Commands
```bash
# Run migration
psql -U postgres -d appointment_db -f database/migrations/V029__ai_extraction_jobs_queue.sql

# Install dependencies
cd server
npm install nodemailer @types/nodemailer

# Start server with workers
npm run dev

# Test circuit breaker manually (simulate failures)
curl -X POST http://localhost:3001/test/simulate-openai-failure

# Check Prometheus metrics
curl http://localhost:3001/metrics | grep circuit_breaker_state
curl http://localhost:3001/metrics | grep fallback_activation_count

# Test fallback response
curl -X POST http://localhost:3001/api/ai/intake \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a headache"}'
```

## Implementation Validation Strategy
- [x] Migration V029 runs successfully, ai_extraction_jobs_queue table created
- [x] 4 circuit breakers configured: gpt4IntakeBreaker, gpt4VisionExtractionBreaker, gpt4CodingBreaker, gpt4ConflictsBreaker
- [x] Circuit breaker opens: Simulate 10 requests with >50% failure rate, verify breaker opens after threshold
- [x] Circuit breaker cooldown: After 60s, verify breaker attemps half-open state with test request
- [x] Exponential backoff: After repeated failures, verify cooldown increases: 60s → 120s → 300s
- [x] AI intake fallback: When breaker open, verify response: {fallbackMode: true, action: 'manual_form'}
- [x] Document extraction queueing: When breaker open, verify job inserted into ai_extraction_jobs_queue
- [x] Medical coding fallback: When breaker open, verify message: 'AI suggestion unavailable - use manual coding'
- [x] Medication conflicts fallback: When breaker open, verify rule-based conflicts returned with disclaimer
- [x] Retry worker processes queue: After circuit closes, verify queued jobs processed in FIFO order
- [x] Rate limiting: Verify retry worker processes max 10 jobs/minute
- [x] Retry exponential backoff: Verify failed jobs retry at 1min, 5min, 15min intervals
- [x] Max retries: Verify job marked failed after 3 unsuccessful retries
- [x] Email notification sent: On circuit open, verify admin receives email alert
- [x] SMS notification sent: On circuit open, verify admin receives SMS alert (if configured)
- [x] Prometheus metrics exported: Verify circuit_breaker_state gauge shows correct state (0/1/2)
- [x] Fallback counter incremented: Verify fallback_activation_count increases when fallback triggered
- [x] Circuit breaker recovery: After successful test request in half-open, verify transitions to closed

## Implementation Checklist
- [x] Create database/migrations/V029__ai_extraction_jobs_queue.sql with ai_extraction_jobs_queue table
- [x] Add columns: document_id, job_type, status, retry_count, scheduled_at, processed_at, error_details
- [x] Create indexes: idx_extraction_jobs_status, idx_extraction_jobs_document
- [x] Test migration: psql -f V029__ai_extraction_jobs_queue.sql
- [x] Install nodemailer: npm install nodemailer @types/nodemailer
- [x] Create server/src/config/circuit-breaker.config.ts (or extend from US-040)
- [x] Configure gpt4IntakeBreaker with opossum: errorThresholdPercentage=50%, volumeThreshold=10, timeout=30s
- [x] Configure gpt4VisionExtractionBreaker: Same config but timeout=45s
- [x] Configure gpt4CodingBreaker: Same config
- [x] Configure gpt4ConflictsBreaker: Same config
- [x] Implement exponential backoff logic: 60s → 120s → 300s on repeated failures
- [x] Add event handlers: on('open'), on('halfOpen'), on('close') for all breakers
- [x] Create server/src/services/fallback/ai-intake-fallback.service.ts
- [x] Implement getFallbackResponse() returning manual form mode
- [x] Create server/src/services/fallback/extraction-fallback.service.ts
- [x] Implement queueForRetry() inserting job into ai_extraction_jobs_queue
- [x] Create server/src/services/fallback/coding-fallback.service.ts
- [x] Implement getFallbackMessage() returning manual coding message
- [x] Create server/src/services/fallback/conflicts-fallback.service.ts
- [x] Implement checkBasicInteractions() with rule-based drug interaction database
- [x] Add basic_interactions map with common drug pairs
- [x] Create server/src/workers/ai-extraction-retry-worker.ts
- [x] Set up Bull queue with Redis connection
- [x] Implement queue processor with rate limiting (10 jobs/minute)
- [x] Add retry logic with exponential backoff (1min, 5min, 15min)
- [x] Mark job as failed after 3 retries
- [x] Add cron job checking for queued jobs every minute
- [x] Create server/src/services/circuit-breaker-alerts.service.ts
- [x] Configure nodemailer with SMTP settings
- [x] Implement sendCriticalAlert() for email notifications
- [x] Add SMS notification via gateway API (Twilio or similar)
- [x] Extend server/src/config/metrics.ts: Add 3 new Prometheus metrics
- [x] Add circuit_breaker_state gauge with labels {service, model}
- [x] Add api_failure_rate histogram
- [x] Add fallback_activation_count counter with labels {service, fallback_type}
- [x] Modify server/src/services/ai-intake.service.ts (US-025)
- [x] Wrap OpenAI API calls with gpt4IntakeBreaker.fire()
- [x] Add try/catch: On error, call aiIntakeFallbackService.getFallbackResponse()
- [x] Modify server/src/services/document-extraction.service.ts (US-029)
- [x] Wrap OpenAI Vision calls with gpt4VisionExtractionBreaker.fire()
- [x] On error, call extractionFallbackService.queueForRetry()
- [x] Modify server/src/services/medical-coding.service.ts (US-032)
- [x] Wrap OpenAI calls with gpt4CodingBreaker.fire()
- [x] On error, return codingFallbackService.getFallbackMessage()
- [x] Modify server/src/services/medication-conflicts.service.ts (US-033)
- [x] Wrap OpenAI calls with gpt4ConflictsBreaker.fire()
- [x] On error, call conflictsFallbackService.checkBasicInteractions()
- [x] Test circuit breaker opening: Simulate 10 failed OpenAI requests
- [x] Verify breaker state transitions: Closed → Open
- [x] Verify cooldown: After 60s, breaker attempts half-open
- [x] Verify recovery: Successful test request transitions to Closed
- [x] Test AI intake fallback: With circuit open, verify manual form mode returned
- [x] Test document extraction queueing: With circuit open, verify job queued
- [x] Test medical coding fallback: With circuit open, verify fallback message
- [x] Test medication conflicts fallback: With circuit open, verify rule-based conflicts
- [x] Test retry worker: Add job to queue, verify processing
- [x] Test rate limiting: Add 20 jobs, verify max 10 processed per minute
- [x] Test exponential backoff: Fail job twice, verify retry times (1min, 5min)
- [x] Test max retries: Fail job 3 times, verify marked as failed
- [x] Test email notification: Trigger circuit open, verify admin email received
- [x] Test SMS notification: Verify SMS sent (if configured)
- [x] Verify Prometheus metrics: curl /metrics, check circuit_breaker_state, fallback_activation_count
- [x] Load test with circuit breaker: Run k6 tests from US-040 with simulated AI failures
- [x] Document circuit breaker configuration in server/README.md
- [x] Commit all files to version control
