# Task - TASK_001_BE_MEDICATION_CONFLICT_DETECTION

## Requirement Reference
- User Story: US_033
- Story Location: `.propel/context/tasks/us_033/us_033.md`
- Acceptance Criteria:
    - AC1: Analyze medications using OpenAI, detect drug-drug interactions, drug-allergy conflicts, drug-condition contraindications, achieve >99% conflict detection accuracy (AIR-S03), display CRITICAL red alerts for high-severity, WARNING yellow for moderate, NO CONFLICT green for safe, include conflict details (mechanism, severity 1-5, guidance), block "Save" for critical conflicts until acknowledged with override reason
- Edge Cases:
    - Unrecognized medication: Search drug database by partial match
    - Dosage-dependent interactions: Check dosage thresholds
    - No allergies recorded: Show "No allergy data" warning

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Conflict alerts + banners) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-010 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | SCR-010 (Medications section with conflict alerts) |
| **UXR Requirements** | AIR-S03 (>99% accuracy), AIR-O02 (Override required), UXR-503 (Critical alerts with severity), NFR-SEC01 (Patient safety) |
| **Design Tokens** | Critical banner: #DC3545 red bg, Warning: #FFC107 yellow bg, Safe: #28A745 green badge, Severity icons: 1-5 scale (⚠1️⃣ to⚠5️⃣) |

> **Wireframe Components:**
> - Medications table: Name, Dosage, Frequency, Conflict Status (Safe/Warning/Critical), Actions
> - Conflict banner: Top of screen, red for critical, yellow for warning, "View Details" link
> - Conflict details modal: Interacting Medications, Interaction Type, Severity (1-5), Mechanism, Clinical Guidance, Override button with required reason field
> - Add medication form: Autocomplete, real-time conflict check on blur/change
> - Alert persistence: Critical alerts persist until override acknowledged

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | OpenAI SDK | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | OpenAI GPT-4 | gpt-4-turbo |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-005 (Medication safety checks), AIR-S03 (Conflict detection >99% accuracy), AIR-O02 (Human override) |
| **AI Pattern** | Drug interaction detection with severity scoring |
| **Prompt Template Path** | .propel/context/prompts/medication-conflict-detection.md |
| **Guardrails Config** | .propel/context/prompts/medication-safety-guardrails.json (severity thresholds, critical interactions) |
| **Model Provider** | OpenAI GPT-4 Turbo (gpt-4-turbo) |

> **AI Integration Details:**
> - Model: gpt-4-turbo with medical knowledge
> - Prompt: "Analyze medication interactions: Current: [medications], New: [medication], Allergies: [allergies], Conditions: [conditions]. Return JSON: {conflicts: [{type, severity, mechanism, guidance, drugNames[]}]}"
> - Severity scale: 1=Minor, 2=Moderate, 3=Significant, 4=Severe, 5=Contraindicated
> - Critical threshold: Severity ≥4 blocks save
> - Accuracy target: >99% (AIR-S03)

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive alerts) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement medication conflict detection: (1) POST /api/clinical/check-medication-conflicts accepts {patientId, newMedication, currentMedications[], allergies[], conditions[]}, (2) OpenAI GPT-4 analyzes drug-drug, drug-allergy, drug-condition interactions, (3) Returns conflicts array: {type, severity: 1-5, mechanism, guidance, drugNames[], dosageDependency}, (4) Frontend displays real-time conflict alerts when adding medications, (5) Critical conflicts (severity ≥4): Red banner, blocks "Save" until staff enters override reason, (6) Moderate conflicts (severity 2-3): Yellow warning, allows save with acknowledgment, (7) No conflicts (severity 0-1): Green "Safe" badge, (8) Store conflict checks in medication_conflicts table with audit trail, (9) Include dosage threshold warnings (e.g., "Safe at current dose, unsafe >500mg/day"), (10) >99% detection accuracy (AIR-S03).

## Dependent Tasks
- US_031 Task 002: Profile aggregation (provides current medications/allergies/conditions)
- US_046: Notification system (critical conflict alerts)

## Impacted Components
**New:**
- server/src/services/medication-safety.service.ts (Conflict detection logic)
- server/src/controllers/medication-safety.controller.ts (Conflict check endpoints)
- server/src/routes/medication-safety.routes.ts (POST /check-medication-conflicts)
- server/db/medication-conflicts.sql (Conflict audit table)
- .propel/context/prompts/medication-conflict-detection.md (Safety prompt)
- .propel/context/prompts/medication-safety-guardrails.json (Severity rules)
- app/src/components/MedicationConflictBanner.tsx (Alert banner)
- app/src/components/ConflictDetailsModal.tsx (Conflict details + override)
- app/src/hooks/useMedicationConflict.ts (Conflict check mutation)

## Implementation Plan
1. Create medication-conflict-detection prompt: "You are a clinical pharmacist. Analyze medication safety. Current: [list], New: [med], Allergies: [list], Conditions: [list]. Return JSON: {conflicts: [{type: 'drug-drug'|'drug-allergy'|'drug-condition', severity: 1-5, mechanism, guidance, affectedDrugs[], dosageWarning}]}"
2. Implement medicationSafetyService.checkConflicts: Call OpenAI GPT-4, parse JSON, validate severity 1-5, categorize by critical/warning/safe
3. POST /api/clinical/check-medication-conflicts: verifyToken, requireRole('staff'), accepts medication details + patient context
4. Store checks: INSERT medication_conflicts (patient_id, new_medication, conflicting_medications[], conflict_type, severity, checked_at, checked_by_staff_id)
5. Frontend: Add medication form with real-time conflict check on medication name blur/change
6. MedicationConflictBanner: Red banner for severity ≥4, yellow for 2-3, green badge for 0-1
7. ConflictDetailsModal: Shows interacting drugs, interaction mechanism, severity indicator (⚠1️⃣ to ⚠5️⃣), clinical guidance, "Override" button with required reason textarea
8. Block save: If severity ≥4, disable "Save Medication" button until override acknowledged
9. Audit logging: Log all conflict checks + override decisions with staff_id and reason
10. Test: Add "Warfarin" + "Aspirin" → critical conflict detected with guidance

## Current Project State
```
ASSIGNMENT/server/src/
├── services/ (extraction, coding services exist)
└── (medication safety service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/medication-safety.service.ts | Conflict detection logic |
| CREATE | server/src/controllers/medication-safety.controller.ts | Conflict handlers |
| CREATE | server/src/routes/medication-safety.routes.ts | POST route |
| CREATE | server/db/medication-conflicts.sql | Conflict audit table |
| CREATE | .propel/context/prompts/medication-conflict-detection.md | Safety prompt |
| CREATE | .propel/context/prompts/medication-safety-guardrails.json | Severity rules |
| CREATE | app/src/components/MedicationConflictBanner.tsx | Alert banner |
| CREATE | app/src/components/ConflictDetailsModal.tsx | Conflict details |
| CREATE | app/src/hooks/useMedicationConflict.ts | Conflict check hook |

## External References
- [Drug Interaction Database](https://www.drugs.com/drug_interactions.html)
- [FDA Drug Safety](https://www.fda.gov/drugs/drug-safety-and-availability)
- [AIR-005 Medication Safety](../../../.propel/context/docs/spec.md#AIR-005)
- [AIR-S03 Conflict Detection >99%](../../../.propel/context/docs/spec.md#AIR-S03)
- [NFR-SEC01 Patient Safety](../../../.propel/context/docs/spec.md#NFR-SEC01)

## Build Commands
```bash
cd server
npm run dev

# Test conflict check
curl -X POST http://localhost:3001/api/clinical/check-medication-conflicts \
  -H "Authorization: Bearer <staff-token>" \
  -d '{
    "patientId": "patient-uuid",
    "newMedication": {"name": "Aspirin", "dosage": "325mg", "frequency": "daily"},
    "currentMedications": [{"name": "Warfarin", "dosage": "5mg", "frequency": "daily"}],
    "allergies": ["Penicillin"],
    "conditions": ["Chronic Kidney Disease"]
  }' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: checkConflicts detects Warfarin+Aspirin interaction
- [ ] Integration tests: POST /check-medication-conflicts returns conflicts with severity
- [ ] Conflict endpoint protected: Try POST without staff token → 403
- [ ] Drug-drug interaction: Warfarin + Aspirin → severity=5, mechanism="Increased bleeding risk"
- [ ] Drug-allergy conflict: Amoxicillin + Penicillin allergy → severity=5, type='drug-allergy'
- [ ] Drug-condition conflict: Ibuprofen + CKD → severity=4, guidance="Avoid NSAIDs in renal impairment"
- [ ] No conflict: Lisinopril + Metformin → severity=0, status="Safe"
- [ ] Dosage dependency: Returns "Safe at current dose, unsafe >X mg/day"
- [ ] Severity scoring: All conflicts have severity 1-5
- [ ] Detection accuracy: Test suite of 100 known interactions → >99% detected (AIR-S03)
- [ ] Frontend banner: Add conflicting medication → red banner appears at top
- [ ] Modal details: Click "View Details" → shows interaction mechanism + guidance
- [ ] Save blocked: Critical conflict (severity ≥4) → "Save" button disabled
- [ ] Override flow: Click "Override" → required reason field → submit → saves with override logged
- [ ] Audit logged: Query medication_conflicts → checked_by_staff_id, override_reason

## Implementation Checklist
- [ ] Create medication-conflict-detection.md prompt template
- [ ] Create medication-safety-guardrails.json severity rules
- [ ] Implement medication-safety.service.ts with OpenAI detection
- [ ] Create medication-safety.controller.ts + routes.ts
- [ ] Create medication-conflicts.sql audit table
- [ ] Create MedicationConflictBanner.tsx frontend component
- [ ] Create ConflictDetailsModal.tsx with override form
- [ ] Implement useMedicationConflict.ts hook
- [ ] Integrate real-time conflict check on medication add form
- [ ] Test detection accuracy >99%
- [ ] Document medication safety in server/README.md
