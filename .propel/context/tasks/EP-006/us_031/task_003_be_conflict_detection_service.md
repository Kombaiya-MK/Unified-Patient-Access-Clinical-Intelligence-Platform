# Task - task_003_be_conflict_detection_service

## Requirement Reference
- User Story: us_031
- Story Location: .propel/context/tasks/us_031/us_031.md
- Acceptance Criteria:
    - **AC-1 Conflict Detection**: System detects data conflicts when multiple sources provide different values for same field (e.g., different DOB in intake form vs uploaded document)
    - **AC-1 Conflict Highlighting**: Conflicts displayed with yellow background for non-critical, red alert for critical mismatches (DOB, allergies)
    - **AC-1 Source Tracking**: Each conflicting data point links to source documents for staff review
    - **AC-1 Confidence-Based Resolution**: Higher confidence scores (>90%) prioritized in conflict scenarios

- Edge Case:
    - **Critical Mismatch**: Different DOB across documents triggers red alert "Critical: Date of birth mismatch across documents"

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Backend service task) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Wireframe Status Legend:**
> - **N/A**: Backend service task, no UI impact

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Backend task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Framework | Express | latest |
| Database Client | pg (PostgreSQL) | latest |
| Utilities | lodash / date-fns | latest |

**Note**: All code, and libraries, MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes (indirectly - processes AI-extracted data with confidence scores) |
| **AIR Requirements** | AIR-S01 (Profile conflict detection >95% accuracy) |
| **AI Pattern** | N/A (processes AI outputs, no direct model calls) |
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
Implement conflict detection service that identifies data mismatches across multiple sources (ClinicalDocuments, intake forms, manual entries) when generating unified patient profiles. The service compares field values across sources, flags conflicts with severity levels (critical vs non-critical), and attaches source metadata for staff review. Critical conflicts (DOB, allergies, medications) trigger red alerts requiring mandatory staff resolution. Non-critical conflicts (address, phone number) show yellow indicators. The service implements confidence-based resolution logic: highest confidence score (>90%) automatically selected as primary value in profile, lower confidence values flagged as conflicts. Conflict detection accuracy target: >95% per AIR-S01 requirement.

## Dependent Tasks
- US-029 (Document extraction - provides extracted data with confidence scores)
- US-030 (Deduplication - provides deduplicated records)
- task_002_be_patient_profile_generation_api (calls this service during profile generation)
- task_004_db_patient_profiles_schema (stores conflict metadata)

## Impacted Components
- **NEW**: `server/src/services/conflictDetectionService.ts` - Core service implementing conflict detection logic
- **NEW**: `server/src/services/conflictResolutionEngine.ts` - Service handling confidence-based automated resolution
- **NEW**: `server/src/config/conflictRules.ts` - Configuration defining critical vs non-critical fields, conflict detection rules
- **NEW**: `server/src/models/Conflict.ts` - TypeScript interfaces for conflict metadata structure
- **NEW**: `server/src/utils/fieldComparator.ts` - Utility for comparing field values (dates, strings, numbers) with fuzzy matching
- **NEW**: `server/src/utils/confidenceEvaluator.ts` - Utility evaluating confidence scores and selecting primary values
- **MODIFY**: `server/src/services/profileGenerationService.ts` - Integrate conflictDetectionService during profile generation

## Implementation Plan
1. **Create conflict detection service**: Main service with `detectConflicts(patientData)` method accepting aggregated data from multiple sources (documents, intake, manual entries)
2. **Define conflict rules configuration**: Classify fields as critical (DOB, allergies, medications) or non-critical (address, phone), define comparison methods per field type (exact match, fuzzy match, date tolerance)
3. **Implement field comparison logic**: Compare same field across sources using fieldComparator utility (string matching with edit distance for names, exact match for DOB, case-insensitive for emails)
4. **Build conflict metadata structure**: For each conflict, capture: fieldName, conflictingSources [{sourceId, value, confidence, timestamp}], severity (critical/non-critical), resolutionStrategy (manual/auto)
5. **Implement confidence-based resolution**: If one source has confidence >90% and others <80%, auto-select high-confidence value as primary, mark others as conflicts
6. **Add conflict severity classification**: Critical fields (DOB mismatch) return severity: "critical" triggering red alert frontend display; non-critical fields return severity: "warning" for yellow highlighting
7. **Create conflict resolution engine**: Implement automated resolution rules (e.g., most recent value for address, highest confidence for medications, manual review for DOB)
8. **Store conflict history**: Log all detected conflicts to database with timestamps, source documents, resolution actions for audit trail
9. **Integrate with profile generation**: Call `conflictDetectionService.detectConflicts()` in task_002 profileGenerationService, attach conflict metadata to profile response
10. **Implement AIR-S01 validation**: Add unit tests validating conflict detection accuracy >95% on sample dataset with known conflicts

**Focus on how to implement**:
- Service interface: `detectConflicts(patientData: AggregatedData): ConflictMetadata[]`
- Conflict detection: `for each field { const values = sources.map(s => s[field]); if (new Set(values).size > 1) { createConflict(field, values) } }`
- Fuzzy matching: `import { distance } from 'fastest-levenshtein'; if (distance(value1, value2) <= 2) { considerMatch() }`
- Confidence comparison: `const confidences = sources.map(s => s.confidence).sort(); if (confidences[0] < 80 && confidences.at(-1) > 90) { autoResolve(highestConfidenceValue) }`
- Critical field detection: `const criticalFields = ['dob', 'allergies', 'medications']; if (criticalFields.includes(fieldName)) { severity = 'critical' }`
- Conflict metadata: `{ fieldName: 'dob', conflictingSources: [{ sourceId: 'doc-123', value: '1990-01-15', confidence: 0.95 }, { sourceId: 'intake-456', value: '1990-01-16', confidence: 0.88 }], severity: 'critical', requiresManualReview: true }`
- Audit logging: `await db.query('INSERT INTO conflict_logs (patient_id, field, sources, detected_at) VALUES ($1, $2, $3, NOW())', [patientId, fieldName, JSON.stringify(sources)])`

## Current Project State
```
server/src/
├── services/
│   ├── profileGenerationService.ts (to modify: integrate conflict detection)
│   └── (to create: conflictDetectionService.ts, conflictResolutionEngine.ts)
├── config/
│   └── (to create: conflictRules.ts)
├── models/
│   └── (to create: Conflict.ts)
└── utils/
    └── (to create: fieldComparator.ts, confidenceEvaluator.ts)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/conflictDetectionService.ts | Main service: detectConflicts(patientData) method, iterate fields, compare values across sources, classify severity, return conflict metadata array |
| CREATE | server/src/services/conflictResolutionEngine.ts | Resolution logic: confidence-based auto-resolution (select highest confidence >90%), conflict tiebreaker rules (most recent for address, manual for DOB) |
| CREATE | server/src/config/conflictRules.ts | Configuration: critical fields array ['dob', 'allergies', 'medications'], non-critical fields, comparison methods (exact/fuzzy/dateRange), tolerance thresholds |
| CREATE | server/src/models/Conflict.ts | TypeScript interfaces: ConflictMetadata { fieldName, conflictingSources, severity, requiresManualReview }, ConflictSource { sourceId, value, confidence, timestamp } |
| CREATE | server/src/utils/fieldComparator.ts | Utility: compareStrings(a, b, fuzzy=true), compareDates(a, b, tolerance=1day), compareNumbers(a, b, tolerance=0.01), return match boolean |
| CREATE | server/src/utils/confidenceEvaluator.ts | Utility: selectPrimaryValue(sources), evaluate confidence scores, return primary value + conflict flag, implement >90% threshold logic |
| MODIFY | server/src/services/profileGenerationService.ts | Integrate: `const conflicts = await conflictDetectionService.detectConflicts(aggregatedData); profile.conflicts = conflicts;` after data aggregation |

## External References
- **Levenshtein Distance (fastest-levenshtein)**: https://www.npmjs.com/package/fastest-levenshtein (Fuzzy string matching for names, addresses)
- **date-fns**: https://date-fns.org/docs/differenceInDays (Date comparison with tolerance for DOB matching)
- **lodash**: https://lodash.com/docs (Utility functions: groupBy, isEqual, uniqBy for data comparison)
- **AIR-S01 Requirement**: .propel/context/docs/design.md#AIR-S01 (Conflict detection >95% accuracy target)
- **UC-010 Sequence Diagram**: .propel/context/docs/models.md#UC-010 (Medication conflict detection workflow)
- **FR-007 Spec**: .propel/context/docs/spec.md#FR-007 (Unified profile with conflict highlighting requirements)

## Build Commands
```bash
# Development server
cd server
npm run dev

# Run unit tests (conflict detection accuracy validation)
npm run test -- conflictDetectionService.test.ts

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Implementation Checklist
- [ ] Create conflictDetectionService with detectConflicts(patientData) method accepting aggregated data from multiple sources (ClinicalDocuments, intake, manual entries)
- [ ] Define conflictRules configuration: classify critical fields (DOB, allergies, medications) vs non-critical (address, phone), specify comparison methods (exact/fuzzy/dateRange)
- [ ] Implement fieldComparator utility: compareStrings with Levenshtein distance fuzzy matching (threshold ≤2 edits), compareDates with 1-day tolerance, exact match for DOB
- [ ] Build conflict metadata structure: capture fieldName, conflictingSources array with {sourceId, value, confidence, timestamp}, severity (critical/warning), requiresManualReview flag
- [ ] Implement confidence-based resolution in conflictResolutionEngine: auto-select value with confidence >90%, flag others as conflicts, manual review required for critical fields with close confidence scores
- [ ] Add severity classification: critical fields (DOB, allergies, medications) return severity "critical" (red alert frontend), non-critical return "warning" (yellow highlight)
- [ ] Integrate with profileGenerationService: call conflictDetectionService.detectConflicts() after data aggregation, attach conflict metadata to profile response JSON
- [ ] Validate AIR-S01 requirement: write unit tests with sample dataset (20+ known conflicts), assert detection accuracy >95%, test edge cases (identical values, empty fields, null handling)
