# Task - TASK_002: Backend Deduplication Algorithms and Similarity Matching

## Requirement Reference
- User Story: [us_030]
- Story Location: [.propel/context/tasks/us_030/us_030.md]
- Acceptance Criteria:
    - AC1: Compare extracted fields across documents using similarity algorithms
    - AC1: Fuzzy matching for names with 85% threshold
    - AC1: Exact matching for structured data like medication names
    - AC1: Date range overlap for lab results from same test within 7 days
    - AC1: Identify duplicates with >95% accuracy per AIR-Q02
- Edge Case:
    - EC1: Contradictory information → don't auto-merge, flag as conflicts
    - EC2: Medication dosage changes over time → keep as timeline if dates differ >30 days
    - EC3: Low confidence (<85%) → skip auto-merge, present side-by-side

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
| Backend | TypeScript | 5.3.x |
| Backend | fuzzball (fuzzy matching) | 2.x |
| Backend | date-fns | 3.x |
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
Create deduplication algorithms service with similarity matching functions. Implement fuzzy string matching using fuzzball library for patient names, provider names with 85% minimum threshold. Implement exact matching for structured fields: medication names (case-insensitive), allergy names, facility names. Implement date range overlap detection for lab results: if same test_name and dates within 7 days, consider duplicate candidates. Create similarity scoring function that calculates overall confidence score (0-100) combining individual field match scores. Define duplicate detection rules: patient names scored with token_set_ratio for out-of-order names, medications matched exactly on name then fuzzy on dosage/frequency (80% threshold), lab results matched on test_name then check date proximity, allergies matched exactly with normalization (lowercase trim), conditions matched with fuzzy (85% threshold). Implement conflict detection: if same field type from different documents has <85% similarity, mark as conflict not duplicate. Handle temporal changes: medications with same name but dates >30 days apart treated as timeline entries not duplicates. Return structured result: {is_duplicate: boolean, confidence_score: number, match_details: {field_name, similarity_score, values_compared}, conflict_detected: boolean, conflict_reason: string}.

## Dependent Tasks
- TASK_001: Database Migration (tables for storing results)

## Impacted Components
- **CREATE** server/src/services/deduplicationService.ts - Main deduplication orchestration
- **CREATE** server/src/services/similarityAlgorithms.ts - Similarity matching functions
- **CREATE** server/src/utils/fuzzyMatching.ts - Fuzzy string matching utilities
- **CREATE** server/src/utils/dateComparison.ts - Date range overlap logic
- **CREATE** server/src/config/deduplication.config.ts - Thresholds and matching rules
- **CREATE** server/src/types/deduplication.types.ts - TypeScript interfaces for deduplication

## Implementation Plan
1. **Install dependencies**: npm install fuzzball@^2.1.2 date-fns@^3.3.1
2. **Create deduplication.config.ts**: Define FUZZY_MATCH_THRESHOLD = 0.85 (85%), EXACT_MATCH_THRESHOLD = 1.0, LAB_DATE_OVERLAP_DAYS = 7, MEDICATION_TIMELINE_THRESHOLD_DAYS = 30, CONFLICT_SIMILARITY_THRESHOLD = 0.85, DUPLICATE_CONFIDENCE_THRESHOLD = 0.95, field-specific weights for overall scoring
3. **Create deduplication.types.ts**: Define interfaces: SimilarityResult = {is_duplicate: boolean, confidence_score: number, match_details: FieldMatch[], conflict_detected: boolean, conflict_reason: string}, FieldMatch = {field_name: string, similarity_score: number, values_compared: any[], match_type: 'fuzzy' | 'exact' | 'date_overlap'}, DeduplicationJob = {patient_id, source_documents: DocumentData[], target_document: DocumentData}
4. **Create fuzzyMatching.ts**: Implement fuzzyStringMatch(str1: string, str2: string, threshold: number): {is_match: boolean, score: number} using fuzzball.token_set_ratio for name matching (handles word order), normalizeString helper (lowercase, trim, remove extra spaces), fuzzyArrayMatch for comparing arrays of strings (medications, allergies)
5. **Create dateComparison.ts**: Implement isDateWithinRange(date1: Date, date2: Date, daysRange: number): boolean using date-fns differenceInDays, areLabResultsOverlapping(result1, result2, daysRange): boolean checks test_name exact match and date proximity, getMedicationTemporalRelation(med1, med2): 'duplicate' | 'timeline_entry' based on date difference >30 days
6. **Create similarityAlgorithms.ts**: Implement comparePatientNames(name1: string, name2: string): FieldMatch using fuzzy token_set_ratio ≥85%, compareMedications(med1: MedicationData, med2: MedicationData): FieldMatch with exact match on name then fuzzy on dosage/frequency, compareLabResults(lab1: LabData, lab2: LabData): FieldMatch checking test_name exact and date overlap, compareAllergies(allergy1: string, allergy2: string): FieldMatch with normalized exact match, compareConditions(cond1: string, cond2: string): FieldMatch with fuzzy ≥85%, each returns {field_name, similarity_score 0-1, values_compared, match_type}
7. **Create deduplicationService.ts**: Implement findDuplicates(targetDocument: DocumentData, existingDocuments: DocumentData[]): SimilarityResult[] main function, for each existing document compare all fields (patient_name, medications, labs, allergies, conditions) using appropriate algorithm, calculate weighted overall confidence: patient_name 30%, medications 25%, labs 20%, allergies 15%, conditions 10%, if overall confidence ≥95% mark is_duplicate=true, if field similarity <85% mark conflict_detected=true with reason, handle temporal medications: if same med name but dates >30 days mark as timeline not duplicate
8. **Implement conflict detection logic**: In compareFields helper, if similarity score between 0-84% flag as conflict "Values too dissimilar to auto-merge", if exact opposites (e.g., 'No known allergies' vs 'Penicillin allergy') flag as "Contradictory information requires manual review"
9. **Add confidence calculation**: Implement calculateOverallConfidence(fieldMatches: FieldMatch[]): number applying field weights, normalize to 0-100 scale, return with breakdown showing contribution of each field
10. **Add validation**: Use Zod schemas to validate input DocumentData structure matches expected extracted_data format, validate all required fields present before comparison
11. **Add logging**: Log each comparison with patient_id, documents compared, similarity scores, duplicate determination, conflicts flagged for audit trail
12. **Testing**: Create test fixtures with known duplicates and non-duplicates, test fuzzy matching with name variations (John Smith vs Smith John, J. Smith), test exact matching catches case differences, test date overlap correctly identifies lab duplicates within 7 days, test conflict detection for contradictory data, verify >95% accuracy on test dataset per AIR-Q02

**Focus on how to implement**: Fuzzy matching: `import fuzzball from 'fuzzball'; const score = fuzzball.token_set_ratio(str1.toLowerCase().trim(), str2.toLowerCase().trim()); const is_match = score >= threshold * 100;`. Date overlap: `import { differenceInDays } from 'date-fns'; const daysDiff = Math.abs(differenceInDays(date1, date2)); const overlaps = daysDiff <= daysRange;`. Compare medications: `const nameMatch = med1.name.toLowerCase() === med2.name.toLowerCase(); if (!nameMatch) return {similarity_score: 0}; const dosageScore = fuzzball.ratio(med1.dosage, med2.dosage) / 100; const freqScore = fuzzball.ratio(med1.frequency, med2.frequency) / 100; const avgScore = (dosageScore + freqScore) / 2; return {field_name: 'medication', similarity_score: avgScore, match_type: 'fuzzy'};`. Overall confidence: `const weights = {patient_name: 0.3, medications: 0.25, labs: 0.2, allergies: 0.15, conditions: 0.1}; let totalScore = 0; fieldMatches.forEach(match => { totalScore += match.similarity_score * weights[match.field_name]; }); const confidence = totalScore * 100;`. Conflict detection: `if (similarity_score < CONFLICT_SIMILARITY_THRESHOLD) { return {conflict_detected: true, conflict_reason: `${field_name} values too dissimilar (${similarity_score}%) for auto-merge`}; }`.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── deduplicationService.ts (to be created)
│   │   └── similarityAlgorithms.ts (to be created)
│   ├── utils/
│   │   ├── fuzzyMatching.ts (to be created)
│   │   └── dateComparison.ts (to be created)
│   ├── config/
│   │   └── deduplication.config.ts (to be created)
│   └── types/
│       └── deduplication.types.ts (to be created)
└── package.json (to be updated with new dependencies)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/deduplicationService.ts | Main deduplication orchestration and duplicate finding |
| CREATE | server/src/services/similarityAlgorithms.ts | Field-specific similarity comparison functions |
| CREATE | server/src/utils/fuzzyMatching.ts | Fuzzy string matching utilities with fuzzball |
| CREATE | server/src/utils/dateComparison.ts | Date range overlap detection for lab results |
| CREATE | server/src/config/deduplication.config.ts | Thresholds, weights, and matching rules configuration |
| CREATE | server/src/types/deduplication.types.ts | TypeScript interfaces for deduplication data structures |
| MODIFY | server/package.json | Add fuzzball and date-fns dependencies |

## External References
- **Fuzzball.js**: https://www.npmjs.com/package/fuzzball - Fuzzy string matching (Levenshtein distance)
- **Token Set Ratio**: https://github.com/nol13/fuzzball.js#token-set-ratio - Best for names with word order variations
- **date-fns**: https://date-fns.org/docs/differenceInDays - Date comparison utilities
- **Levenshtein Distance**: https://en.wikipedia.org/wiki/Levenshtein_distance - Edit distance algorithm theory
- **AIR-Q02 Requirement**: Deduplication accuracy >95% - Must meet this threshold

## Build Commands
- Install dependencies: `cd server && npm install fuzzball@^2.1.2 date-fns@^3.3.1`
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run tests: `npm test -- deduplicationService.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] Dependencies installed successfully (fuzzball, date-fns)
- [x] Fuzzy match correctly identifies "John Smith" and "Smith, John" as duplicates (score ≥85%)
- [x] Exact match catches medication names regardless of case
- [x] Date overlap detects lab results within 7 days as duplicates
- [x] Medications with same name but dates >30 days apart flagged as timeline entries
- [x] Conflict detection flags contradictory information (similarity <85%)
- [x] Overall confidence calculation applies correct weights
- [x] Duplicate determination threshold at 95% confidence works correctly
- [x] Test dataset achieves >95% accuracy per AIR-Q02
- [x] Low confidence (<85%) comparisons skip auto-merge
- [x] All edge cases handled: contradictions, temporal changes, low confidence
- [x] Logging captures all comparison details for audit

## Implementation Checklist
- [ ] Install dependencies: npm install fuzzball@^2.1.2 date-fns@^3.3.1
- [ ] Create server/src/config/deduplication.config.ts (define FUZZY_MATCH_THRESHOLD=0.85, EXACT_MATCH_THRESHOLD=1.0, LAB_DATE_OVERLAP_DAYS=7, MEDICATION_TIMELINE_THRESHOLD_DAYS=30, CONFLICT_SIMILARITY_THRESHOLD=0.85, DUPLICATE_CONFIDENCE_THRESHOLD=0.95, field weights object for scoring)
- [ ] Create server/src/types/deduplication.types.ts (interfaces: SimilarityResult with is_duplicate/confidence_score/match_details/conflict_detected/conflict_reason, FieldMatch with field_name/similarity_score/values_compared/match_type, DeduplicationJob, DocumentData, MedicationData, LabData)
- [ ] Create server/src/utils/fuzzyMatching.ts (fuzzyStringMatch function using fuzzball.token_set_ratio with threshold, normalizeString helper for lowercase/trim, fuzzyArrayMatch for comparing string arrays, return {is_match: boolean, score: number})
- [ ] Create server/src/utils/dateComparison.ts (isDateWithinRange using date-fns differenceInDays, areLabResultsOverlapping checking test_name exact and date proximity ≤7 days, getMedicationTemporalRelation returning 'duplicate' or 'timeline_entry' based on >30 days difference)
- [ ] Create server/src/services/similarityAlgorithms.ts (implement comparePatientNames using token_set_ratio ≥85%, compareMedications with exact name then fuzzy dosage/frequency ≥80%, compareLabResults with exact test_name and date overlap, compareAllergies with normalized exact match, compareConditions with fuzzy ≥85%, all return FieldMatch)
- [ ] Create server/src/services/deduplicationService.ts (findDuplicates main function: iterate existing documents, compare all fields using similarityAlgorithms, calculate weighted overall confidence with field weights, determine is_duplicate if confidence ≥95%, detect conflicts if similarity <85%, handle temporal medications with >30 days as timeline, return SimilarityResult[])
- [ ] Implement conflict detection logic (in compareFields helper: if similarity 0-84% flag conflict with reason "Values too dissimilar", if contradictory flag "Contradictory information requires manual review")
- [ ] Implement calculateOverallConfidence function (apply field weights: patient_name 30%, medications 25%, labs 20%, allergies 15%, conditions 10%, sum weighted scores, normalize to 0-100, return with breakdown)
- [ ] Add Zod validation for input DocumentData (validate extracted_data structure matches expected format, required fields present, types correct)
- [ ] Add comprehensive logging (use logger to track each comparison: patient_id, documents compared, field similarity scores, duplicate determination, conflicts flagged, confidence breakdown)
- [ ] Write unit tests (test fixtures with known duplicates/non-duplicates, test name variations, test case-insensitive exact matching, test date overlap 7 days, test medication timeline >30 days, test conflict detection contradictions, verify >95% accuracy on test dataset per AIR-Q02)
