# Task - TASK_003: Backend Merge Service and Deduplication API Endpoints

## Requirement Reference
- User Story: [us_030]
- Story Location: [.propel/context/tasks/us_030/us_030.md]
- Acceptance Criteria:
    - AC1: Deduplication service runs after each document extraction
    - AC1: Merge duplicate entries by keeping most recent or highest confidence value
    - AC1: Flag conflicting values for staff review
    - AC1: Create merged PatientProfile record
    - AC1: Log all merge decisions to audit log
- Edge Case:
    - EC1: Contradictory information → flag conflicts for manual resolution
    - EC2: Medication dosage changes → keep as timeline entries
    - EC3: Low confidence → skip auto-merge

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
| Backend | TypeScript | 5.3.x |
| Backend | Bull | 4.x |
| Validation | Zod | 3.x |
| Database | PostgreSQL | 15.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | AIR-Q02 (>95% deduplication accuracy) |
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
Create merge service that orchestrates deduplication workflow. Setup deduplication queue triggered after document extraction completes in US_029 extraction worker. Create mergeService.ts that fetches all documents for patient, runs deduplication algorithms comparing new document with existing, applies merge rules: for duplicates with confidence ≥95% auto-merge keeping most recent value (by document_date) or highest confidence value, for conflicts with similarity <85% create field_conflicts record with 'Pending' status. Implement merge logic: for patient_name use most recent, for medications merge into medication_timeline with start/end dates, for lab results keep all within timeline (don't merge if >7 days apart), for allergies merge unique values from all sources, for conditions merge unique with source tracking. Update patient_profiles: merge extracted_data combining all sources, set merged_from_documents array with source document IDs and confidence scores, set merge_status to 'Merged' if no conflicts else 'Has Conflicts', set last_deduplicated_at timestamp. Create data_merge_logs entry documenting: algorithm version, source documents, merge decisions per field with rationale, conflicts detected. Create REST API endpoints: POST /api/patients/:id/deduplicate to manually trigger deduplication, GET /api/patients/:id/merge-history to retrieve merge logs, GET /api/patients/:id/conflicts to list unresolved conflicts. Handle edge cases: contradictory info creates conflict not merge, temporal medications handled correctly, low confidence skips merge and flags for review.

## Dependent Tasks
- TASK_001: Database Migration (merge tracking tables)
- TASK_002: Deduplication Algorithms (similarity functions)

## Impacted Components
- **CREATE** server/src/services/mergeService.ts - Main merge orchestration logic
- **CREATE** server/src/queues/deduplicationQueue.ts - Bull queue for background processing
- **CREATE** server/src/workers/deduplicationWorker.ts - Background worker processing
- **CREATE** server/src/controllers/deduplicationController.ts - API endpoint handlers
- **CREATE** server/src/routes/deduplicationRoutes.ts - Express routes
- **MODIFY** server/src/workers/extractionWorker.ts - Trigger deduplication after extraction
- **CREATE** server/src/utils/mergeStrategies.ts - Field-specific merge logic

## Implementation Plan
1. **Create deduplicationQueue.ts**: Setup Bull queue with Redis connection, export addDeduplicationJob(patientId, newDocumentId) function, configure job options with retry attempts
2. **Create mergeStrategies.ts**: Implement field-specific merge functions: mergePatientName(values): select most recent by document_date, mergeMedications(medications): create timeline entries in medication_timeline table handling start/end dates, mergeLabResults(labs): keep all within timeline grouped by test_name, mergeAllergies(allergies): create unique set from all sources, mergeConditions(conditions): create unique set with source document tracking, each returns {merged_value, merge_rationale, source_documents}
3. **Create mergeService.ts**: Implement performDeduplication(patientId, newDocumentId): fetch all documents for patient, fetch existing patient_profile, call deduplicationService.findDuplicates comparing new document against existing, for each field apply merge strategy based on confidence and conflict status, if duplicate confidence ≥95% call appropriate merge function, if conflict detected create field_conflicts record with 'Pending' status, build merged extracted_data combining all sources, update patient_profiles with merged data, set merged_from_documents array, set merge_status ('Merged' or 'Has Conflicts'), create data_merge_logs entry with all decisions, return {success, conflicts_detected, merge_summary}
4. **Implement conflict handling**: In performDeduplication, for fields with similarity <85%, create field_conflicts record: store patient_id, field_name, all conflicting_values with {value, source_document_id, confidence, extracted_date}, set resolution_status='Pending', skip auto-merge for this field awaiting staff resolution
5. **Implement medication timeline logic**: In mergeMedications, for same medication name check if dates differ >30 days, if yes create separate timeline entries with start_date from first document, end_date from last document or null if ongoing, if dates within 30 days merge as duplicate selecting most recent or highest confidence value
6. **Create deduplicationWorker.ts**: Setup Bull worker processing deduplication jobs: queue.process(async (job) => {const {patientId, newDocumentId} = job.data; await mergeService.performDeduplication(patientId, newDocumentId); }), handle job failures with retry logic, log processing results
7. **Modify extractionWorker.ts**: After successful document extraction and patient_profiles update, trigger deduplication: await deduplicationQueue.addDeduplicationJob(patientId, documentId), ensure extraction completes before deduplication starts
8. **Create deduplicationController.ts**: Implement manualDeduplicate handler: validate patient exists, trigger deduplication job, return 202 Accepted, implement getMergeHistory handler: fetch data_merge_logs for patient ordered by merge_timestamp DESC, paginate if >20 logs, implement getConflicts handler: fetch field_conflicts WHERE patient_id AND resolution_status='Pending', return with conflicting values and metadata
9. **Create deduplicationRoutes.ts**: Setup Express router with routes: POST /api/patients/:id/deduplicate (manualDeduplicate), GET /api/patients/:id/merge-history (getMergeHistory), GET /api/patients/:id/conflicts (getConflicts), apply auth middleware for staff only
10. **Add audit logging**: In mergeService, create detailed data_merge_logs entry: store algorithm_version (e.g., 'v1.0'), source_documents array with document IDs, merge_decisions JSONB with [{field_name, merged_value, source_document_ids, confidence_score, merge_rationale}], conflicts_detected array, performed_by='System', timestamp
11. **Add validation**: Use Zod to validate merge input data structures, ensure patient_profiles extracted_data format matches schema after merge
12. **Testing**: Create test scenarios with multiple documents for same patient: duplicate medications, lab results within 7 days, conflicting allergies, medication dosage changes >30 days, verify correct merge outcomes, verify conflicts flagged properly, verify merge logs created, test manual deduplicate API endpoint

**Focus on how to implement**: Queue trigger: `import { addDeduplicationJob } from '../queues/deduplicationQueue'; await addDeduplicationJob(patientId, documentId);`. Merge logic: `const duplicateResults = await deduplicationService.findDuplicates(newDocument, existingDocuments); for (const result of duplicateResults) { if (result.is_duplicate && result.confidence_score >= 95) { const mergedValue = mergeStrategies.mergeField(result.field_name, values); ... } else if (result.conflict_detected) { await createFieldConflict(patientId, result.field_name, result.conflicting_values); } }`. Update patient profile: `await db.query('UPDATE patient_profiles SET extracted_data=$1, merged_from_documents=$2, merge_status=$3, last_deduplicated_at=NOW() WHERE profile_id=$4', [mergedData, sourceDocsArray, mergeStatus, profileId]);`. Medication timeline: `if (dateDiff > 30) { await db.query('INSERT INTO medication_timeline (patient_id, medication_name, dosage, frequency, start_date, end_date, source_document_id, is_active) VALUES ...'); } else { merged = selectMostRecentOrHighestConfidence(medications); }`. Create merge log: `await db.query('INSERT INTO data_merge_logs (patient_id, algorithm_version, source_documents, merge_decisions, conflicts_detected, performed_by) VALUES ($1, $2, $3, $4, $5, $6)', [patientId, 'v1.0', sourceDocsJSON, decisionsJSON, conflictsJSON, 'System']);`.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── mergeService.ts (to be created)
│   │   ├── deduplicationService.ts (TASK_002)
│   │   └── similarityAlgorithms.ts (TASK_002)
│   ├── queues/
│   │   ├── deduplicationQueue.ts (to be created)
│   │   └── documentExtractionQueue.ts (US_029)
│   ├── workers/
│   │   ├── deduplicationWorker.ts (to be created)
│   │   └── extractionWorker.ts (US_029, to be modified)
│   ├── controllers/
│   │   └── deduplicationController.ts (to be created)
│   ├── routes/
│   │   └── deduplicationRoutes.ts (to be created)
│   └── utils/
│       └── mergeStrategies.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/mergeService.ts | Main merge orchestration and deduplication workflow |
| CREATE | server/src/queues/deduplicationQueue.ts | Bull queue for background deduplication processing |
| CREATE | server/src/workers/deduplicationWorker.ts | Background worker for processing deduplication jobs |
| CREATE | server/src/controllers/deduplicationController.ts | API endpoint handlers for manual deduplication and merge history |
| CREATE | server/src/routes/deduplicationRoutes.ts | Express routes for deduplication endpoints |
| CREATE | server/src/utils/mergeStrategies.ts | Field-specific merge logic (names, medications, labs, allergies) |
| MODIFY | server/src/workers/extractionWorker.ts | Trigger deduplication job after extraction completes |

## External References
- **Bull Queue**: https://github.com/OptimalBits/bull - Background job queue
- **PostgreSQL JSONB Operations**: https://www.postgresql.org/docs/15/functions-json.html - Merge JSONB data
- **PostgreSQL Array Aggregation**: https://www.postgresql.org/docs/15/functions-aggregate.html - Combine arrays
- **Merge Conflict Resolution Patterns**: https://martinfowler.com/articles/patterns-of-distributed-systems/conflict-resolution.html - Design patterns

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Start worker: `npm run worker:deduplication` (or `node dist/workers/deduplicationWorker.js`)
- Run in development: `npm run dev` (start server)
- Run tests: `npm test -- mergeService.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] Deduplication queue configured and connected to Redis
- [x] Extraction worker triggers deduplication job after document processing
- [x] Deduplication worker processes jobs successfully
- [x] Merge service identifies duplicates using deduplication algorithms
- [x] Auto-merge applies for confidence ≥95%
- [x] Conflicts created for similarity <85%
- [x] Patient profile updated with merged data
- [x] merged_from_documents array populated correctly
- [x] merge_status set to 'Merged' or 'Has Conflicts' appropriately
- [x] Medication timeline entries created for temporal changes (>30 days)
- [x] Lab results kept within timeline (not merged if >7 days apart)
- [x] Allergies and conditions merged uniquely
- [x] data_merge_logs created with detailed decisions
- [x] field_conflicts records created for unresolved conflicts
- [x] POST /api/patients/:id/deduplicate triggers manual deduplication
- [x] GET /api/patients/:id/merge-history returns audit trail
- [x] GET /api/patients/:id/conflicts lists pending conflicts

## Implementation Checklist
- [ ] Create server/src/queues/deduplicationQueue.ts (setup Bull queue with Redis config from env, export addDeduplicationJob function with patientId and newDocumentId params, configure job options: attempts=3, backoff exponential)
- [ ] Create server/src/utils/mergeStrategies.ts (implement mergePatientName selecting most recent by document_date, mergeMedications creating timeline entries or merging within 30 days, mergeLabResults keeping all grouped by test_name, mergeAllergies creating unique set, mergeConditions with source tracking, all return {merged_value, merge_rationale, source_documents})
- [ ] Create server/src/services/mergeService.ts (performDeduplication main function: fetch all patient documents, fetch patient_profile, call deduplicationService.findDuplicates, iterate results applying merge strategies if confidence ≥95% or creating conflicts if <85%, build merged extracted_data, update patient_profiles with merge fields, create data_merge_logs entry, return summary)
- [ ] Implement conflict handling in mergeService (for fields with conflict_detected=true: INSERT INTO field_conflicts with patient_id, field_name, conflicting_values JSONB array, resolution_status='Pending', skip auto-merge for field)
- [ ] Implement medication timeline logic (in mergeMedications: check date difference, if >30 days INSERT INTO medication_timeline separate entries with start_date/end_date, if ≤30 days merge selecting most recent or highest confidence)
- [ ] Create server/src/workers/deduplicationWorker.ts (setup Bull worker: queue.process handler calls mergeService.performDeduplication, handle job errors with retry, log processing results and duration)
- [ ] Modify server/src/workers/extractionWorker.ts (after successful extraction and patient_profiles update: import and call addDeduplicationJob(patientId, documentId) to trigger deduplication)
- [ ] Create server/src/controllers/deduplicationController.ts (manualDeduplicate handler: validate patient exists, add job to queue, return 202 Accepted with job_id; getMergeHistory handler: query data_merge_logs WHERE patient_id ORDER BY merge_timestamp DESC, paginate; getConflicts handler: query field_conflicts WHERE patient_id AND resolution_status='Pending', return with metadata)
- [ ] Create server/src/routes/deduplicationRoutes.ts (setup Express Router, define POST /:id/deduplicate, GET /:id/merge-history, GET /:id/conflicts, apply auth middleware staff-only)
- [ ] Add audit logging to mergeService (create data_merge_logs entry: algorithm_version='v1.0', source_documents JSONB array, merge_decisions JSONB with field-by-field decisions and rationale, conflicts_detected array, performed_by='System', merge_timestamp=NOW())
- [ ] Add Zod validation for merge inputs (validate patient_profiles extracted_data structure after merge matches schema, validate source documents have required fields)
- [ ] Write comprehensive tests (test scenarios: duplicate medications merged, lab results within 7 days merged, conflicting allergies create conflicts, medication changes >30 days create timeline, verify merge_status set correctly, verify logs created, test manual deduplicate API, verify >95% accuracy per AIR-Q02)
