# Task - TASK_002_BE_PROFILE_AGGREGATION_API

## Requirement Reference
- User Story: US_031
- Story Location: `.propel/context/tasks/us_031/us_031.md`
- Acceptance Criteria:
    - AC1: GET /api/patients/:id/profile aggregates data from all ClicalDocuments + intake forms + manual entries, merges deduplicated data, prioritizes most recent for changeable fields, preserves historical timeline for labs/diagnoses, organizes into sections, highlights conflicts, displays confidence scores, provides "Last Updated" per section
- Edge Cases:
    - No documents: Return intake data only with notice="no_documents"
    - Outdated records: Flag medications >1 year with outdated=true
    - Critical mismatch: Multiple DOBs → flag critical_conflict=true, don't auto-merge

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
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (Aggregates AI-extracted data, doesn't process with AI) |
| **AIR Requirements** | AIR-003 (Profile synthesis), AIR-S01 (Conflict detection >95%) |
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
Implement profile aggregation API: (1) GET /api/patients/:id/profile endpoint, (2) Load data sources: merged_patient_profiles (from US_030), ClinicalDocuments.extracted_data, Intake forms from clinical_documents WHERE document_type='Intake', manual entries from patient_notes, (3) Merge logic: Demographics (most recent by document_date), Medical History (all entries with dates preserved), Current Medications (most recent, flag if >1 year old), Allergies (union of all, deduplicated), Lab Results (all as timeline, sorted by date), (4) Detect conflicts: Query data_conflicts table for this patient_id, include conflict details in response, (5) Organize response: {demographics, medicalHistory, currentMedications[], allergies[], labResults[], visits[], documents[], conflicts[], lastUpdated: {demographics, medications, allergies, labs}}, (6) Confidence scores: Include extraction_confidence for AI-extracted fields, (7) Data source references: Each field includes source_document_id + extraction_date, (8) Cache in Redis (5-min TTL), invalidate on document upload/extraction.

## Dependent Tasks
- US_030 Task 001: Deduplication (provides merged_patient_profiles)
- US_029 Task 001: Document extraction (provides extracted_data)

## Impacted Components
**New:**
- server/src/controllers/profile.controller.ts (Profile aggregation handler)
- server/src/routes/profile.routes.ts (GET /api/patients/:id/profile)
- server/src/services/profile-aggregation.service.ts (Aggregation logic)

**Modified:**
- None (uses existing tables)

## Implementation Plan
1. Implement profileAggregationService.getUnifiedProfile(patientId): Aggregate from multiple sources
2. Load merged profile: SELECT FROM merged_patient_profiles WHERE patient_id=$1
3. Load intake data: SELECT FROM clinical_documents WHERE patient_id=$1 AND document_type='Intake'
4. Load extracted documents: SELECT FROM patient_profiles WHERE patient_id=$1 AND extraction_completed_at IS NOT NULL
5. Load conflicts: SELECT FROM data_conflicts WHERE patient_id=$1 AND status='Unresolved'
6. Merge demographics: Use merged_patient_profiles.merged_data.demographics as base, overlay with most recent extracted if confidence >95%
7. Medical history: Union all conditions from documents, sort by diagnosis_date
8. Current medications: Filter medications WHERE start_date IS NOT NULL AND (end_date IS NULL OR end_date > NOW()), flag outdated if last_updated < NOW() - INTERVAL '1 year'
9. Allergies: Union all allergens, deduplicate by allergen name (case-insensitive)
10. Lab results: All lab_test_results from documents, sort by test_date DESC, group by test_name for trend data
11. Visits: Query appointments WHERE patient_id=$1 AND status='Completed', include appointment_datetime, provider_name
12. Documents: List all clinical_documents with status, extraction_status, uploaded_at
13. Conflicts: Map data_conflicts to {field, conflictingValues[], conflictType, status}
14. Last updated: Calculate per section: MAX(document_date) for each data type
15. Confidence scores: Include extraction_confidence for each AI-extracted field
16. Data sources: Each field includes {sourceDocumentId, extractionDate, confidence}
17. Cache: Store in Redis with key profile:{patientId}, TTL 5 minutes
18. Add GET /api/patients/:id/profile route: verifyToken, requireRole('staff', 'admin'), call profileAggregationService

## Current Project State
```
ASSIGNMENT/server/src/
├── services/deduplication.service.ts (from US_030)
├── services/extraction.service.ts (from US_029)
└── (profile aggregation to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/profile.controller.ts | Profile handler |
| CREATE | server/src/routes/profile.routes.ts | GET /profile route |
| CREATE | server/src/services/profile-aggregation.service.ts | Aggregation logic |

## External References
- [PostgreSQL JSON Aggregation](https://www.postgresql.org/docs/current/functions-aggregate.html)
- [AIR-003 Profile Synthesis](../../../.propel/context/docs/spec.md#AIR-003)
- [AIR-S01 Conflict Detection >95%](../../../.propel/context/docs/spec.md#AIR-S01)
- [UC-003 Clinical Data Aggregation](../../../.propel/context/docs/spec.md#UC-003)

## Build Commands
```bash
cd server
npm run dev

# Test profile fetch
curl -X GET http://localhost:3001/api/patients/<patient-id>/profile \
  -H "Authorization: Bearer <staff-token>"
```

## Implementation Validation Strategy
- [ ] Unit tests: profileAggregationService merges demographics correctly
- [ ] Integration tests: GET /profile returns unified data structure
- [ ] Profile endpoint protected: Try GET without staff token → 403
- [ ] Demographics aggregated: Response has {demographics: {name, dob, phone, address}}
- [ ] Most recent prioritized: Multiple documents with name → most recent document_date value returned
- [ ] Medical history timeline: All conditions listed with diagnosis_date, sorted chronologically
- [ ] Current medications: Only medications with end_date NULL or future, includes last_updated
- [ ] Outdated flag: Medication from 2022 → outdated=true in response
- [ ] Allergies deduplicated: "Penicillin" in 2 documents → appears once in response
- [ ] Lab results timeline: All HbA1c results sorted by test_date, includes trend data
- [ ] Visits listed: Past appointments with provider names
- [ ] Documents listed: All uploaded documents with extraction status
- [ ] Conflicts included: Response has conflicts[] array with field names + conflicting values
- [ ] Confidence scores: AI-extracted fields include confidence (e.g., 0.92)
- [ ] Data sources: Each field includes {sourceDocumentId, extractionDate}
- [ ] Last updated: Each section has lastUpdated timestamp (e.g., medications: "2025-01-10T14:30:00Z")
- [ ] Cache works: First request hits database, second request served from Redis <50ms
- [ ] Cache invalidation: Upload new document → GET /profile refreshes cache

## Implementation Checklist
- [ ] Implement profile-aggregation.service.ts with merge logic
- [ ] Create profile.controller.ts handler
- [ ] Create profile.routes.ts with GET route
- [ ] Add Redis caching with 5-min TTL
- [ ] Mount /api/patients/:id/profile route in app.ts
- [ ] Test profile aggregation with multiple data sources
- [ ] Validate conflict detection
- [ ] Document profile API in server/README.md
