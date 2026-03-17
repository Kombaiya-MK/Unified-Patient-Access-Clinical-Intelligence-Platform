# Task - TASK_001_BE_MEDICAL_CODING_AI

## Requirement Reference
- User Story: US_032
- Story Location: `.propel/context/tasks/us_032/us_032.md`
- Acceptance Criteria:
    - AC1: Analyze diagnoses using OpenAI, suggest ICD-10 codes with confidence scores, achieve >98% mapping accuracy (AIR-S02), auto-approve if >95% confidence, allow edit/approve/reject, save to appointments.icd10_codes JSON, log coding decisions to audit
- Edge Cases:
    - Vague condition: Return multiple possible codes ranked by likelihood
    - Combination codes: Suggest primary + secondary codes
    - No matching code: Suggest closest match with "Best match" indicator

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Medical Coding tab in clinical review) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-010 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | SCR-010 (Clinical Data Review - Medical Coding tab) |
| **UXR Requirements** | AIR-S02 (>98% accuracy), AIR-O02 (Human override), UXR-502 (Clear confidence indicators) |
| **Design Tokens** | Confidence: green ≥95%, yellow <95%, Code editor dropdown: white card with shadow, Batch actions: primary blue buttons |

> **Wireframe Components:**
> - Diagnosis-Code table: Diagnosis, Suggested ICD-10, Description, Confidence %, Status, Actions
> - Confidence badges: Green (≥95% auto-approve), yellow (<95% needs review)
> - Code editor: Dropdown with ICD-10 alternatives, search box for manual lookup
> - Batch actions: "Approve All" (enabled if all >95%), "Bulk Edit"
> - Code details panel: Full ICD-10 definition, billing guidelines, related codes

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
| **AIR Requirements** | AIR-004 (Medical coding automation), AIR-S02 (ICD-10/CPT >98% accuracy), AIR-O02 (Human override) |
| **AI Pattern** | Medical coding with structured output |
| **Prompt Template Path** | .propel/context/prompts/medical-coding-icd10.md, medical-coding-cpt.md |
| **Guardrails Config** | .propel/context/prompts/medical-coding-guardrails.json (ICD-10 database validation, confidence thresholds) |
| **Model Provider** | OpenAI GPT-4 Turbo (gpt-4-turbo) |

> **AI Integration Details:**
> - Model: gpt-4-turbo for medical coding knowledge
> - Prompt: "Map the following diagnosis to ICD-10 code(s): [diagnosis]. Return JSON: {code, description, confidence, alternatives:[]}"
> - Validation: Cross-reference with ICD-10 database, flag if code doesn't exist
> - Confidence: >98% accuracy required (AIR-S02), auto-approve if >95%
> - Function calling schema: codeDiagnosis({diagnosis, primaryCode, secondaryCodes[], confidence})

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement medical coding AI system: (1) POST /api/clinical/medical-coding accepts {patientId, diagnoses[]}, (2) OpenAI GPT-4 with medical coding prompt maps each diagnosis to ICD-10 code(s), (3) Returns {primaryCode, description, confidence, alternatives[]} with >98% accuracy (AIR-S02), (4) Store in appointments.icd10_codes JSONB column, (5) Frontend MedicalCodingTab component shows table with diagnoses + suggested codes, (6) Auto-approve if confidence >95%, otherwise "Needs Review" status, (7) Code editor dropdown allows staff to select alternatives or search ICD-10 database, (8) Batch actions: "Approve All" updates all codes, (9) Audit log: Log all coding approvals/rejections with staff_id, (10) ICD-10 database validation: Verify code exists, flag if not found.

## Dependent Tasks
- US_031 Task 002: Profile aggregation API (provides diagnoses list)
- US_025 Task 003: AI prompt templates (reuse patterns)

## Impacted Components
**New:**
- server/src/services/medical-coding.service.ts (OpenAI coding logic)
- server/src/controllers/medical-coding.controller.ts (Coding endpoints)
- server/src/routes/medical-coding.routes.ts (POST /medical-coding)
- server/db/icd10-codes.sql (ICD-10 database table for validation)
- .propel/context/prompts/medical-coding-icd10.md (Coding prompt)
- .propel/context/prompts/medical-coding-guardrails.json (Validation rules)
- app/src/components/MedicalCodingTab.tsx (Coding UI tab)
- app/src/components/CodeEditorDropdown.tsx (ICD-10 alternatives)
- app/src/hooks/useMedicalCoding.ts (Coding mutation)

## Implementation Plan
1. Install ICD-10 reference database: Load ICD10CM codes CSV into PostgreSQL table (code, description, category)
2. Create medical-coding prompt: "You are a medical coding specialist. Map this diagnosis to ICD-10-CM codes. Diagnosis: [text]. Return JSON: {primaryCode, description, confidence: 0.0-1.0, alternatives: [{code, description, confidence}]}"
3. Implement medicalCodingService.codeDiagnosis: Call OpenAI GPT-4, parse JSON, validate code exists in ICD-10 database, flag if not found
4. Accuracy validation: Confidence threshold >98% (AIR-S02), mark "Needs Review" if <95%
5. POST /api/clinical/medical-coding: verifyToken, requireRole('staff'), accepts {patientId, diagnoses[]}, returns coded results
6. Frontend MedicalCodingTab: Table with columns (Diagnosis, ICD-10 Code, Description, Confidence%, Status, Actions)
7. Code editor: Click Edit → dropdown shows alternatives from OpenAI response, search box queries ICD-10 database
8. Batch actions: "Approve All" button (enabled if all confidence >95%), updates appointments.icd10_codes JSONB
9. Audit logging: Log action_type='medical_coding_approved', includes staff_id, codes selected
10. Test: Submit "Hypertension" → verify returns I10 code with >98% confidence

## Current Project State
```
ASSIGNMENT/
├── server/src/services/ (appointment, extraction services exist)
├── app/src/pages/ClinicalDataReview.tsx (from US_031, add tab)
└── (medical coding service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/medical-coding.service.ts | OpenAI coding logic |
| CREATE | server/src/controllers/medical-coding.controller.ts | Coding handlers |
| CREATE | server/src/routes/medical-coding.routes.ts | POST route |
| CREATE | server/db/icd10-codes.sql | ICD-10 reference table |
| CREATE | .propel/context/prompts/medical-coding-icd10.md | Coding prompt |
| CREATE | .propel/context/prompts/medical-coding-guardrails.json | Validation rules |
| CREATE | app/src/components/MedicalCodingTab.tsx | Coding UI |
| CREATE | app/src/components/CodeEditorDropdown.tsx | Alternatives dropdown |
| CREATE | app/src/hooks/useMedicalCoding.ts | Coding mutation |
| UPDATE | server/db/schema.sql | Add icd10_codes JSONB to appointments |

## External References
- [ICD-10-CM Official Guidelines](https://www.cms.gov/medicare/coding-billing/icd-10-codes)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [AIR-004 Medical Coding](../../../.propel/context/docs/spec.md#AIR-004)
- [AIR-S02 ICD-10 Accuracy >98%](../../../.propel/context/docs/spec.md#AIR-S02)

## Build Commands
```bash
cd server
npm run dev

# Test medical coding
curl -X POST http://localhost:3001/api/clinical/medical-coding \
  -H "Authorization: Bearer <staff-token>" \
  -d '{
    "patientId": "patient-uuid",
    "diagnoses": ["Hypertension, unspecified", "Type 2 diabetes mellitus"]
  }' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: medicalCodingService returns I10 for "Hypertension"
- [ ] Integration tests: POST /medical-coding returns codes with >98% confidence
- [ ] ICD-10 table populated: Query icd10_codes → 70,000+ rows
- [ ] Medical coding endpoint protected: Try POST without staff token → 403
- [ ] Coding accuracy: Submit "Hypertension" → returns I10 with confidence >0.98
- [ ] Multiple codes: "Type 2 diabetes with neuropathy" → returns E11.9 + E11.40
- [ ] Confidence scoring: All results have confidence field 0.0-1.0
- [ ] Auto-approve: Confidence >95% → status="Approved"
- [ ] Needs review: Confidence <95% → status="Needs Review"
- [ ] Code validation: OpenAI returns invalid code → flagged "Code not in ICD-10 database"
- [ ] Alternatives: Response includes 2-3 alternative codes ranked by confidence
- [ ] Frontend tab: MedicalCodingTab renders table with diagnoses + codes
- [ ] Code editor: Click Edit → dropdown shows alternatives
- [ ] Batch approve: Click "Approve All" → all codes saved to appointments.icd10_codes
- [ ] Audit logged: Query audit_logs → action_type='medical_coding_approved'

## Implementation Checklist
- [ ] Download ICD-10-CM codes CSV, load into PostgreSQL
- [ ] Create medical-coding-icd10.md prompt template
- [ ] Create medical-coding-guardrails.json validation rules
- [ ] Implement medical-coding.service.ts with OpenAI + validation
- [ ] Create medical-coding.controller.ts + routes.ts
- [ ] Add icd10_codes JSONB column to appointments table
- [ ] Create MedicalCodingTab.tsx frontend component
- [ ] Create CodeEditorDropdown.tsx with ICD-10 search
- [ ] Implement useMedicalCoding.ts hook
- [ ] Test coding accuracy >98%
- [ ] Document medical coding in server/README.md
