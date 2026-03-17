# Task - TASK_001_BE_DOCUMENT_DEDUPLICATION

## Requirement Reference
- User Story: US_030
- Story Location: `.propel/context/tasks/us_030/us_030.md`
- Acceptance Criteria:
    - AC1: Deduplication service compares extracted data across documents, uses fuzzy matching (85% threshold for names), exact matching for medications, identifies duplicates with >95% accuracy (AIR-Q02), merges by keeping most recent or highest confidence value, flags conflicts for staff review
- Edge Cases:
    - Contradictory information: Don't merge, flag as conflicts with status="Conflict"
    - Medication timeline: Keep all entries if dates differ by >30 days (timeline, not duplicates)
    - Low confidence match (<85%): Skip auto-merge, present side-by-side comparison to staff

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Merge status + conflict indicators) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-010 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | SCR-010 (Clinical Data Review - merge status) |
| **UXR Requirements** | AIR-Q02 (Deduplication >95% accuracy), UXR-502 (Clear conflict indicators) |
| **Design Tokens** | Merge badge: #4CAF50 green "Merged from X documents", Conflict indicator: #FFC107 yellow highlight with "Resolve Conflict" button, Timeline: horizontal axis with document dates |

> **Wireframe Components:**
> - Merge status badge on PatientProfile: "Merged from 3 documents" with info icon
> - Source documents panel: List of contributing documents with extraction dates
> - Conflict highlight: Yellow background on conflicting fields, "Resolve Conflict" button
> - Merge timeline: Visual timeline showing data entry dates

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | node-nlp | 4.x (fuzzy matching) |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (Rule-based deduplication, not ML) |
| **AIR Requirements** | AIR-Q02 (Multi-document deduplication >95%) |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | .propel/context/prompts/deduplication-rules.json (matching thresholds, conflict rules) |
| **Model Provider** | N/A |

> **Deduplication Rules (deduplication-rules.json):**
> ```json
> {
>   "fuzzyMatchThreshold": 0.85,
>   "exactMatchFields": ["medications", "allergies"],
>   "dateRangeOverlap": 7,
>   "medicationTimelineThreshold": 30,
>   "conflictRules": {
>     "dob_mismatch": "critical_conflict",
>     "allergy_list_differs": "needs_review",
>     "medication_dosage_change": "timeline_entry"
>   },
>   "mergeStrategy": {
>     "default": "most_recent",
>     "high_confidence": "highest_confidence",
>     "lab_results": "all_as_timeline"
>   }
> }
> ```

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Conflict resolution UI responsive) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement deduplication system: (1) DeduplicationService runs after each document extraction (triggered by Bull job), (2) Load all extracted_data for patient_id from PatientProfiles, (3) Fuzzy match names with Levenshtein distance (85% threshold), (4) Exact match medications/allergies, (5) Date range overlap for lab results (same test within 7 days = duplicate), (6) Merge logic: most recent value for demographics, highest confidence for uncertain fields, all as timeline for lab results, (7) Detect conflicts: DOB mismatch = critical, differing allergy lists = needs review, medication dosage change >30 days apart = timeline entry, (8) Create merged_patient_profiles table with deduplicated data, (9) Flag conflicts with status="Conflict", store conflict details JSON, (10) Frontend: MergeStatusBadge, SourceDocumentsPanel, ConflictResolutionPanel.

## Dependent Tasks
- US_029 Task 001: Document extraction (deduplication runs after extraction)
- US_031: Unified profile generation (uses deduplicated data)

## Impacted Components
**New:**
- server/src/services/deduplication.service.ts (Deduplication logic)
- server/src/jobs/deduplication-worker.ts (Bull worker)
- server/db/merged-patient-profiles.sql (Merged data table)
- server/db/data-conflicts.sql (Conflicts table)
- .propel/context/prompts/deduplication-rules.json (Matching rules)
- app/src/components/MergeStatusBadge.tsx (Merge indicator)
- app/src/components/ConflictResolutionPanel.tsx (Resolve conflicts)

**Modified:**
- server/db/schema.sql (Add conflict_status to PatientProfiles)

## Implementation Plan
1. Install node-nlp: npm install node-nlp
2. Create merged_patient_profiles table: patient_id, merged_data JSONB, source_document_ids[], merge_completed_at
3. Create data_conflicts table: conflict_id, patient_id, field_name, conflicting_values JSONB, conflict_type, status="Unresolved"
4. Implement deduplicationService.deduplicatePatient: Load all PatientProfiles for patient, fuzzy match names (Levenshtein), exact match medications, date range overlap labs
5. Merge logic: 
   - Demographics: most recent (by document_date)
   - Uncertain fields: highest extraction_confidence
   - Lab results: all preserved as timeline entries
   - Medications: if dates differ >30 days, keep both as timeline
6. Conflict detection:
   - DOB differs → critical_conflict, don't merge
   - Allergy lists differ → needs_review
   - Medication dosage differs <30 days → conflict
7. Store merged data: INSERT merged_patient_profiles with deduplicated JSONB
8. Store conflicts: INSERT data_conflicts for each detected conflict
9. Audit log: Log merge decisions (source_documents, merge_rationale)
10. Frontend: MergeStatusBadge "Merged from 3 documents", SourceDocumentsPanel lists docs, ConflictResolutionPanel shows side-by-side comparison with resolve buttons

## Current Project State
```
ASSIGNMENT/server/src/
├── services/extraction.service.ts (from US_029)
└── (deduplication service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/deduplication.service.ts | Deduplication logic |
| CREATE | server/src/jobs/deduplication-worker.ts | Bull worker |
| CREATE | server/db/merged-patient-profiles.sql | Merged data table |
| CREATE | server/db/data-conflicts.sql | Conflicts table |
| CREATE | .propel/context/prompts/deduplication-rules.json | Matching rules |
| CREATE | app/src/components/MergeStatusBadge.tsx | Merge status indicator |
| CREATE | app/src/components/ConflictResolutionPanel.tsx | Conflict UI |

## External References
- [Levenshtein Distance](https://www.npmjs.com/package/fast-levenshtein)
- [AIR-Q02 Deduplication >95%](../../../.propel/context/docs/spec.md#AIR-Q02)
- [FR-007 Unified Profile](../../../.propel/context/docs/spec.md#FR-007)

## Build Commands
```bash
cd server
npm install node-nlp fast-levenshtein
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: fuzzyMatch returns 0.87 for "John Doe" vs "Jon Doe"
- [ ] Integration tests: Extract 2 documents → deduplication creates merged profile
- [ ] node-nlp installed: package.json shows node-nlp@4.x
- [ ] Merged table exists: \d merged_patient_profiles
- [ ] Conflicts table exists: \d data_conflicts
- [ ] Fuzzy matching: "John Smith" vs "Jon Smith" → 88% match, merged
- [ ] Exact matching: Same medication in 2 docs → deduplicated to 1 entry
- [ ] Date range overlap: Lab result "HbA1c 7.2 on 2025-01-10" + "HbA1c 7.1 on 2025-01-12" → merged (within 7 days)
- [ ] Medication timeline: "Aspirin 81mg on 2024-12-01" + "Aspirin 325mg on 2025-01-15" → both kept (>30 days)
- [ ] Most recent merge: DOB "1990-01-15" in doc1 (2024-12-01) vs "1990-01-15" in doc2 (2025-01-10) → doc2 value used
- [ ] Highest confidence: Name confidence 0.92 vs 0.88 → 0.92 value used
- [ ] DOB conflict: "1990-01-15" vs "1989-01-15" → critical_conflict, not merged
- [ ] Allergy conflict: "Penicillin" in doc1, "Penicillin, Sulfa" in doc2 → needs_review conflict
- [ ] Audit logged: Query audit_logs → merge_rationale includes source_document_ids
- [ ] Frontend merge badge: PatientProfile shows "Merged from 3 documents"
- [ ] Conflict indicator: Yellow highlight on conflicting field, "Resolve Conflict" button

## Implementation Checklist
- [ ] Install node-nlp + fast-levenshtein
- [ ] Create merged_patient_profiles + data_conflicts tables
- [ ] Create deduplication-rules.json config
- [ ] Implement deduplication.service.ts with fuzzy/exact matching
- [ ] Create deduplication-worker.ts Bull worker
- [ ] Integrate with extraction workflow (trigger after extraction)
- [ ] Create frontend conflict resolution components
- [ ] Test deduplication scenarios (exact, fuzzy, conflict)
- [ ] Validate >95% deduplication accuracy
- [ ] Document deduplication logic in server/README.md
