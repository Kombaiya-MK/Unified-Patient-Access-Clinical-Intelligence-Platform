# Task - TASK_001: Backend Unified Profile API with Conflict Detection

## Requirement Reference
- User Story: [us_034]
- Story Location: [.propel/context/tasks/us_034/us_034.md]
- Acceptance Criteria:
    - AC1: Retrieve unified profile aggregating data from all uploaded documents
    - AC2: Detect conflicting data across documents with >95% accuracy per AIR-S01
    - AC2: Provide diff view showing source documents for conflicts
    - AC4: Return medication conflicts from US-033
- Edge Case:
    - EC1: Document extraction processing → return partial data with processing status
    - EC3: Low AI confidence (<90%) → mark fields as "Needs Review"
    - EC4: Historical versions tracking → provide audit log timeline

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
| Validation | Zod | 3.x |
| Database | PostgreSQL | 15.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | AIR-S01 (Profile conflict detection >95%) |
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
Create unified profile API endpoint building on US-031. Add GET /api/patients/:id/clinical-profile to aggregate all patient data from multiple sources. Fetch patient_profiles with extracted_data from documents, merge with intake_form_responses, include appointments data, retrieve icd10_codes from US-032, retrieve active medication_conflicts from US-033. Implement conflict detection logic comparing fields across multiple source documents: for each data field (allergies, medications, conditions, demographics), identify discrepancies between sources, calculate confidence scores for each version, flag conflicts with field_name, conflicting_values array [{value, source_document_id, confidence, extracted_date}], resolution_status ('Pending' | 'Resolved'). Return comprehensive profile with: demographics, chief_complaint, medical_history, current_medications, allergies, lab_results, previous_visits, conflicts array, icd10_codes with confidence scores, medication_conflicts, processing_status for incomplete extractions, last_updated timestamp. Support query parameters: include_history for audit trail, include_all_documents for document references. Add PATCH /api/patients/:id/conflicts/:fieldName/resolve to resolve field conflicts accepting {selected_value, resolution_notes, resolved_by_staff_id}. Log all resolutions to data_merge_logs. Return profile synthesis metadata showing source documents and merge timestamps.

## Dependent Tasks
- US-031: Unified profile generation backend (baseline)
- US-032: Medical coding service (icd10_codes)
- US-033: Medication conflict detection (conflicts)

## Impacted Components
- **CREATE** server/src/routes/clinicalProfileRoutes.ts - Express routes for unified profile
- **CREATE** server/src/controllers/clinicalProfileController.ts - Profile aggregation handlers
- **CREATE** server/src/services/profileAggregationService.ts - Data merging and conflict detection
- **CREATE** server/src/types/clinicalProfile.types.ts - TypeScript interfaces
- **MODIFY** server/src/routes/index.ts - Mount clinical profile routes

## Implementation Plan
1. **Create clinicalProfile.types.ts**: Define UnifiedProfile = {patient_id, demographics, chief_complaint, medical_history, current_medications, allergies, lab_results, previous_visits, icd10_codes with confidence, medication_conflicts, conflicts array, processing_status, last_updated, source_documents}, ProfileConflict = {field_name, conflicting_values: [{value, source_document_id, confidence, extracted_date}], resolution_status, resolved_value?, resolution_notes?, resolved_by_staff_id?, resolved_at?}, ProcessingStatus = {total_documents, processed_documents, pending_documents, estimated_completion_time}
2. **Create profileAggregationService.ts**: Implement aggregateProfile(patientId): fetch patient_profiles with extracted_data, fetch all clinical_documents for patient, fetch intake_form_responses, fetch appointments with icd10_codes, fetch active medication_conflicts, merge data from all sources prioritizing by recency and confidence, detect conflicts using deduplication logic from US-030, for each field compare values across sources using similarity threshold 95%, if discrepancy found create ProfileConflict entry, calculate processing_status from document extraction_status, return UnifiedProfile
3. **Implement conflict detection**: In aggregateProfile, for critical fields (allergies, medications, conditions), compare all source values, use fuzzy matching for text fields, exact match for structured data, flag as conflict if similarity <95% or contradictory, store in conflicts array with source document references, mark resolution_status='Pending'
4. **Create clinicalProfileController.ts**: Implement getProfile handler: call profileAggregationService.aggregateProfile, if include_history param fetch data_merge_logs and conflict resolution history, if include_all_documents fetch document metadata with extraction timestamps, enrich with medication_conflicts from US-033 API, enrich with icd10_codes from US-032 API, return 200 with UnifiedProfile, handle processing status for incomplete extractions (show partial data)
5. **Implement resolveConflict handler**: Validate request {selected_value, resolution_notes, resolved_by_staff_id}, update field_conflicts table SET resolution_status='Resolved', resolved_value=selected_value, resolved_by_staff_id, resolved_at=NOW(), INSERT INTO data_merge_logs with resolution action, update patient_profiles with resolved value, return 200 with updated profile
6. **Implement getProfileHistory handler**: Query data_merge_logs WHERE patient_id ORDER BY merge_timestamp DESC, include conflict resolutions, include document extraction events, return timeline of changes with staff actions
7. **Create clinicalProfileRoutes.ts**: Setup Express router, routes: GET /api/patients/:id/clinical-profile (getProfile), PATCH /api/patients/:id/conflicts/:fieldName/resolve (resolveConflict), GET /api/patients/:id/clinical-profile/history (getProfileHistory), apply authMiddleware staff-only
8. **Modify index.ts**: Import and mount clinicalProfileRoutes
9. **Add caching**: Use Redis to cache aggregated profiles with 5-minute TTL, invalidate cache on document extraction completion or conflict resolution
10. **Add pagination**: For large datasets (many lab results, many visits), paginate results with default limit=20
11. **Add filtering**: Support query params: sections (filter which sections to include), date_range for lab results and visits
12. **Testing**: Test profile aggregation with multiple documents, test conflict detection accuracy >95%, test resolution updates profile correctly, test processing status for pending extractions, test caching invalidation

**Focus on how to implement**: Profile aggregation: `const profile = await db.query('SELECT * FROM patient_profiles WHERE profile_id=$1', [patientId]); const documents = await db.query('SELECT * FROM clinical_documents WHERE patient_id=$1', [patientId]); const merged = {demographics: profile.demographics, medications: [], allergies: [], conflicts: []}; for (const doc of documents) { if (doc.extracted_data) { for (const med of doc.extracted_data.prescribed_medications) { const existing = merged.medications.find(m => m.name === med.name); if (existing && existing.dosage !== med.dosage) { merged.conflicts.push({field_name: 'medications', conflicting_values: [{value: existing, source_document_id: existing.source}, {value: med, source_document_id: doc.document_id}]}); } else { merged.medications.push({...med, source_document_id: doc.document_id}); } } } }`. Conflict resolution: `await db.query('UPDATE field_conflicts SET resolution_status=$1, resolved_value=$2, resolved_by_staff_id=$3, resolved_at=NOW() WHERE patient_id=$4 AND field_name=$5', ['Resolved', selected_value, staff_id, patientId, fieldName]); await db.query('INSERT INTO data_merge_logs (patient_id, merge_decisions, performed_by, staff_id) VALUES ($1, $2, $3, $4)', [patientId, JSON.stringify({field: fieldName, action: 'resolve', value: selected_value}), 'Staff Manual', staff_id]);`. Medical codes integration: `const codingResponse = await axios.get(\`/api/appointments/\${appointmentId}/codes\`); profile.icd10_codes = codingResponse.data.icd10_codes;`. Medication conflicts integration: `const conflictsResponse = await axios.get(\`/api/patients/\${patientId}/conflicts\`); profile.medication_conflicts = conflictsResponse.data.conflicts.filter(c => c.conflict_status === 'Active');`.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── index.ts (to be modified)
│   │   └── clinicalProfileRoutes.ts (to be created)
│   ├── controllers/
│   │   └── clinicalProfileController.ts (to be created)
│   ├── services/
│   │   ├── profileAggregationService.ts (to be created)
│   │   ├── medicalCodingService.ts (US-032)
│   │   └── conflictDetectionService.ts (US-033)
│   └── types/
│       └── clinicalProfile.types.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/types/clinicalProfile.types.ts | TypeScript interfaces for unified profile |
| CREATE | server/src/services/profileAggregationService.ts | Data merging and conflict detection logic |
| CREATE | server/src/controllers/clinicalProfileController.ts | Controller handlers for profile endpoints |
| CREATE | server/src/routes/clinicalProfileRoutes.ts | Express routes for clinical profile |
| MODIFY | server/src/routes/index.ts | Mount clinical profile routes |

## External References
- **Express Router**: https://expressjs.com/en/guide/routing.html - Route organization
- **PostgreSQL Aggregation**: https://www.postgresql.org/docs/15/functions-aggregate.html - Data merging queries
- **Redis Caching**: https://redis.io/docs/latest/develop/use/patterns/caching/ - Profile caching
- **AIR-S01 Requirement**: Profile conflict detection >95% accuracy

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start server)
- Run tests: `npm test -- clinicalProfileController.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] GET /api/patients/:id/clinical-profile returns unified profile
- [x] Profile aggregates data from all source documents
- [x] Conflicts detected with >95% accuracy per AIR-S01
- [x] Conflicting values include source document references
- [x] icd10_codes included with confidence scores from US-032
- [x] medication_conflicts included from US-033 (active only)
- [x] Processing status shows pending extractions
- [x] PATCH /api/patients/:id/conflicts/:fieldName/resolve updates profile
- [x] Conflict resolution logs to data_merge_logs
- [x] GET /api/patients/:id/clinical-profile/history returns timeline
- [x] Redis caching reduces query load
- [x] Cache invalidated on document extraction or conflict resolution
- [x] Pagination works for large datasets
- [x] Query parameter filtering works correctly

## Implementation Checklist
- [ ] Create server/src/types/clinicalProfile.types.ts (interfaces: UnifiedProfile with patient_id/demographics/chief_complaint/medical_history/current_medications/allergies/lab_results/previous_visits/icd10_codes/medication_conflicts/conflicts/processing_status/last_updated/source_documents, ProfileConflict with field_name/conflicting_values array/resolution_status/resolved_value/resolution_notes/resolved_by_staff_id/resolved_at, ProcessingStatus with total_documents/processed_documents/pending_documents/estimated_completion_time)
- [ ] Create server/src/services/profileAggregationService.ts (aggregateProfile function: fetch patient_profiles extracted_data, fetch clinical_documents, fetch intake_form_responses, fetch appointments icd10_codes, fetch medication_conflicts active, merge data prioritizing recency and confidence, detect conflicts comparing sources with 95% similarity threshold, flag discrepancies in conflicts array, calculate processing_status from extraction_status, return UnifiedProfile)
- [ ] Implement conflict detection logic (for critical fields allergies/medications/conditions: compare all source values, fuzzy match text fields, exact match structured data, flag conflict if similarity <95% or contradictory, store in conflicts array with source_document_id references, mark resolution_status='Pending')
- [ ] Create server/src/controllers/clinicalProfileController.ts file
- [ ] Implement getProfile handler (call profileAggregationService.aggregateProfile, if include_history query data_merge_logs, if include_all_documents fetch document metadata, enrich with medication_conflicts from GET /api/patients/:id/conflicts, enrich with icd10_codes from appointment data, return 200 UnifiedProfile, handle partial data for processing extractions)
- [ ] Implement resolveConflict handler (validate request selected_value/resolution_notes/resolved_by_staff_id, UPDATE field_conflicts SET resolution_status='Resolved'/resolved_value/resolved_by_staff_id/resolved_at, INSERT data_merge_logs resolution action, update patient_profiles with resolved value, return 200 updated profile)
- [ ] Implement getProfileHistory handler (query data_merge_logs WHERE patient_id ORDER BY merge_timestamp DESC, include conflict resolutions, include document extraction events, return timeline with staff actions)
- [ ] Create server/src/routes/clinicalProfileRoutes.ts (Express Router, routes: GET /patients/:id/clinical-profile with query params include_history/include_all_documents/sections/date_range, PATCH /patients/:id/conflicts/:fieldName/resolve, GET /patients/:id/clinical-profile/history, apply authMiddleware staff-only)
- [ ] Modify server/src/routes/index.ts (import clinicalProfileRoutes, mount app.use('/api', clinicalProfileRoutes))
- [ ] Add Redis caching (cache aggregated profiles with key patient:${id}:profile, TTL 5 minutes, invalidate on document extraction complete or conflict resolution, check cache before aggregation)
- [ ] Add pagination for large datasets (lab_results and previous_visits: default limit=20 offset query params, return total_count and page metadata)
- [ ] Add filtering support (sections query param: comma-separated list to filter which sections include, date_range for lab_results and visits: start_date and end_date query params)
- [ ] Write comprehensive tests (test profile aggregation multiple documents, test conflict detection >95% accuracy, test resolution updates correctly, test processing status pending extractions, test caching and invalidation, test pagination, test filtering)
