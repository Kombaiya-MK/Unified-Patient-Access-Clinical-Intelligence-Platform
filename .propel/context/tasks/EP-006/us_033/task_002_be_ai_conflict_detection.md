# Task - TASK_002: Backend AI Medication Conflict Detection Service

## Requirement Reference
- User Story: [us_033]
- Story Location: [.propel/context/tasks/us_033/us_033.md]
- Acceptance Criteria:
    - AC1: Analyze medications using OpenAI API with medical safety prompt
    - AC1: Detect drug-drug interactions
    - AC1: Check medications against allergy list (drug-allergy conflicts)
    - AC1: Validate medications against conditions (contraindications)
    - AC1: Achieve >99% conflict detection accuracy per AIR-S03
    - AC1: Display severity level 1-5 with clinical guidance
- Edge Case:
    - EC1: Unrecognized medication → search drug database by partial match
    - EC2: Dosage-dependent interactions → check dosage thresholds
    - EC3: No allergy data → return warning about missing verification

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
| AI | OpenAI SDK | 4.x |
| Validation | Zod | 3.x |
| Database | PostgreSQL | 15.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-005 (Medication safety checks), AIR-S03 (>99% drug conflict detection accuracy) |
| **AI Pattern** | Structured safety analysis with JSON mode for conflict detection |
| **Prompt Template Path** | server/src/prompts/medication-conflict-prompt.ts |
| **Guardrails Config** | server/src/config/medicationSafety.config.ts (severity thresholds, safety rules) |
| **Model Provider** | OpenAI GPT-4 |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create AI-powered medication conflict detection service. Build conflictDetectionService.ts that accepts patient medication list, allergy list, and conditions. Use OpenAI GPT-4 with medical safety prompt requesting conflict analysis. Prompt instructs AI to return JSON: {conflicts: [{conflict_type: 'Drug-Drug'|'Drug-Allergy'|'Drug-Condition', medications_involved: [], severity_level: 1-5, interaction_mechanism, clinical_guidance, dosage_dependent: boolean, dosage_threshold?}], overall_safety_assessment, no_conflicts_detected: boolean}. Implement drug database integration for medication normalization (fuzzy matching for unrecognized names). Check drug-drug interactions: analyze all medication pairs for known interactions, classify severity (1=Minor monitoring, 2=Moderate caution, 3=Major avoid combination, 4=Severe contraindicated, 5=Critical life-threatening). Check drug-allergy conflicts: cross-reference medications against patient allergies, detect cross-sensitivity (e.g., penicillin allergy → avoid cephalosporins). Check drug-condition contraindications: validate medications against conditions (e.g., NSAIDs + CKD, Beta-blockers + Asthma). Handle dosage-dependent interactions: check current dosages against thresholds, provide "Safe at current dose" or "Unsafe above X mg/day" guidance. Implement caching with Redis for common medication combinations. Add confidence scoring and fallback to drug database queries if AI confidence <95%. Log all checks to conflict_check_audit table. Return enhanced results with action_required flags for UI.

## Dependent Tasks
- TASK_001: Database Migration (medication_conflicts, conflict_check_audit tables)

## Impacted Components
- **CREATE** server/src/services/conflictDetectionService.ts - Main conflict detection service
- **CREATE** server/src/services/drugDatabaseService.ts - Drug reference lookup and normalization
- **CREATE** server/src/prompts/medication-conflict-prompt.ts - Safety analysis prompt template
- **CREATE** server/src/schemas/conflictDetection.schema.ts - Zod validation schemas
- **CREATE** server/src/config/medicationSafety.config.ts - Safety thresholds and severity rules
- **CREATE** server/src/types/conflictDetection.types.ts - TypeScript interfaces
- **CREATE** server/src/utils/drugNameNormalizer.ts - Medication name standardization
- **MODIFY** server/src/utils/circuitBreaker.ts - Reuse for OpenAI safety checks

## Implementation Plan
1. **Create medicationSafety.config.ts**: Define CRITICAL_SEVERITY_THRESHOLD = 4, REQUIRES_OVERRIDE_THRESHOLD = 4, ACCURACY_TARGET = 0.99 per AIR-S03, CACHE_TTL_HOURS = 24, severity scale definitions: 1='Minor - monitor', 2='Moderate - caution advised', 3='Major - avoid if possible', 4='Severe - contraindicated', 5='Critical - life-threatening risk'
2. **Create conflictDetection.types.ts**: Define interfaces: MedicationInput = {name, dosage, frequency, generic_name?, source}, AllergyInput = {allergen_name, severity, reaction_type}, ConditionInput = {condition_name, icd10_code?}, ConflictResult = {conflict_type, medications_involved, severity_level, interaction_mechanism, clinical_guidance, dosage_dependent, dosage_threshold?, action_required}, ConflictCheckResponse = {conflicts: ConflictResult[], overall_safety_status: 'Safe' | 'Warning' | 'Critical', no_allergy_data_warning, patient_id, checked_at}
3. **Create conflictDetection.schema.ts**: Define Zod schemas: ConflictResultSchema validating severity 1-5, conflict_type enum, medications_involved array, MedicationInputSchema validating required fields, ConflictCheckResponseSchema for API responses
4. **Create medication-conflict-prompt.ts**: Build prompt template buildConflictPrompt(medications, allergies, conditions): "You are a clinical pharmacology expert specializing in medication safety. Analyze the following patient data for drug interactions, drug-allergy conflicts, and drug-condition contraindications. Return JSON format: {conflicts: [{conflict_type, medications_involved: [names], severity_level (1-5), interaction_mechanism (explanation of how drugs interact), clinical_guidance (recommended actions), dosage_dependent (boolean), dosage_threshold (if applicable)}], overall_safety_assessment, no_conflicts_detected (boolean)}. Severity scale: 1=Minor (monitor), 2=Moderate (caution), 3=Major (avoid), 4=Severe (contraindicated), 5=Critical (life-threatening). Check: 1) Drug-Drug interactions between all medication pairs, 2) Drug-Allergy cross-sensitivities, 3) Drug-Condition contraindications (e.g., NSAIDs+CKD, Warfarin+bleeding disorders). Include dosage considerations when interactions are dose-dependent. Medications: ..., Allergies: ..., Conditions: ..."
5. **Create drugDatabaseService.ts**: Implement loadDrugDatabase() reading from drug reference file or API (FDA Drug Database, RxNorm), normalizeMedicationName(name) using fuzzy matching for typos/variations, searchDrugByPartial(partial) returning top 5 matches, getDrugClass(medication) returning therapeutic class, getKnownInteractions(drug1, drug2) querying interaction database, getDosageThreshold(drug, interaction_type) returning threshold mg/day, cache results in Redis
6. **Create drugNameNormalizer.ts**: Implement normalizeName(input: string) converting to lowercase, removing spaces/hyphens, expandAbbreviations(name) converting common abbreviations (ASA → Aspirin, APAP → Acetaminophen), findGenericName(brandName) mapping brand to generic, calculateSimilarity(name1, name2) using Levenshtein distance for fuzzy matching
7. **Create conflictDetectionService.ts**: Implement checkConflicts(medications: MedicationInput[], allergies: AllergyInput[], conditions: ConditionInput[], patientId): normalize all medication names with drugNameNormalizer, check Redis cache for common combination cacheKey=hash(medications+allergies+conditions), if not cached build prompt with medication-conflict-prompt, call OpenAI GPT-4 with response_format json_object wrapped in circuit breaker, parse JSON response and validate with Zod schema, enhance with drug database queries if AI confidence low, classify severity and set action_required=true for severity ≥4, handle dosage-dependent: call getDosageThreshold and compare current dosages, check for missing allergy data and add warning, INSERT INTO conflict_check_audit with all parameters and AI response, if conflicts detected INSERT INTO medication_conflicts for each conflict, update patient_profiles.has_active_conflicts=true if severity ≥4, cache results in Redis with 24h TTL, return ConflictCheckResponse
8. **Implement unrecognized medication handling**: In checkConflicts, for each medication call drugDatabaseService.normalizeMedicationName, if no match found call searchDrugByPartial and return suggestions array in response with {unrecognized_medications: [{input_name, suggestions: [{name, confidence}]}]}, prompt staff for clarification
9. **Implement dosage-dependent logic**: For each detected interaction, check if dosage_dependent=true, call getDosageThreshold(med1, med2), compare current dosage, if current < threshold set severity -= 1 and add guidance "Safe at current dose (X mg), avoid exceeding Y mg", if current >= threshold set action_required=true
10. **Implement cross-sensitivity detection**: For drug-allergy conflicts, check drug class relationships (e.g., patient allergic to Penicillin → flag Cephalosporin as "Possible cross-reactivity 10% risk"), use drugDatabaseService.getDrugClass and compare against allergy list
11. **Add audit logging**: After each check, INSERT INTO conflict_check_audit (patient_id, medications_checked, allergies_checked, conditions_checked, conflicts_detected_count, highest_severity, no_allergy_warning, checked_by='System', ai_response_raw)
12. **Testing**: Create test dataset with known interactions (Warfarin+Aspirin=critical bleeding risk, Ibuprofen+CKD=contraindicated, Penicillin allergy+Amoxicillin=allergic reaction), verify >99% accuracy per AIR-S03, test dosage-dependent thresholds, test unrecognized medication fallback, test missing allergy warning

**Focus on how to implement**: OpenAI call: `const response = await openai.chat.completions.create({model: 'gpt-4', messages: [{role: 'system', content: buildConflictPrompt(medications, allergies, conditions)}], response_format: {type: 'json_object'}, temperature: 0.1}); const parsed = JSON.parse(response.choices[0].message.content); const validated = ConflictCheckResponseSchema.parse(parsed);`. Drug normalization: `const normalized = await drugDatabaseService.normalizeMedicationName(med.name); if (!normalized) { const suggestions = await drugDatabaseService.searchDrugByPartial(med.name); return {unrecognized: true, suggestions}; }`. Severity classification: `const action_required = conflict.severity_level >= REQUIRES_OVERRIDE_THRESHOLD; const status = conflict.severity_level >= 4 ? 'Critical' : conflict.severity_level >= 2 ? 'Warning' : 'Safe';`. Redis cache: `const cacheKey = hash(JSON.stringify({medications: medications.sort(), allergies, conditions})); const cached = await redis.get(cacheKey); if (cached) return JSON.parse(cached); ... await redis.setex(cacheKey, CACHE_TTL_HOURS * 3600, JSON.stringify(result));`. Audit log: `await db.query('INSERT INTO conflict_check_audit (patient_id, medications_checked, allergies_checked, conditions_checked, conflicts_detected_count, highest_severity, checked_by, ai_response_raw) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [patientId, JSON.stringify(medications), JSON.stringify(allergies), JSON.stringify(conditions), conflicts.length, Math.max(...conflicts.map(c => c.severity_level)), 'System', JSON.stringify(response)]);`. Dosage check: `if (conflict.dosage_dependent) { const threshold = await drugDatabaseService.getDosageThreshold(conflict.medications_involved[0], 'interaction'); if (currentDosage < threshold) { conflict.clinical_guidance += ` Safe at current dose (${currentDosage}mg), avoid exceeding ${threshold}mg/day.`; conflict.severity_level = Math.max(1, conflict.severity_level - 1); } }`.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── conflictDetectionService.ts (to be created)
│   │   └── drugDatabaseService.ts (to be created)
│   ├── prompts/
│   │   └── medication-conflict-prompt.ts (to be created)
│   ├── schemas/
│   │   └── conflictDetection.schema.ts (to be created)
│   ├── config/
│   │   └── medicationSafety.config.ts (to be created)
│   ├── types/
│   │   └── conflictDetection.types.ts (to be created)
│   ├── utils/
│   │   ├── drugNameNormalizer.ts (to be created)
│   │   └── circuitBreaker.ts (may exist, to be reused)
│   └── data/
│       └── drug_reference.json (to be added - drug interaction database)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/conflictDetectionService.ts | Main AI service for medication conflict detection |
| CREATE | server/src/services/drugDatabaseService.ts | Drug reference database lookup and normalization |
| CREATE | server/src/prompts/medication-conflict-prompt.ts | Medical safety analysis prompt template |
| CREATE | server/src/schemas/conflictDetection.schema.ts | Zod validation schemas for conflict data |
| CREATE | server/src/config/medicationSafety.config.ts | Safety thresholds and severity rules |
| CREATE | server/src/types/conflictDetection.types.ts | TypeScript interfaces for conflict types |
| CREATE | server/src/utils/drugNameNormalizer.ts | Medication name standardization utilities |
| CREATE | server/src/data/drug_reference.json | Drug interaction reference database |

## External References
- **OpenAI JSON Mode**: https://platform.openai.com/docs/guides/text-generation/json-mode - Structured output
- **OpenAI GPT-4**: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4 - Model capabilities
- **FDA Drug Interaction Database**: https://www.fda.gov/drugs/drug-interactions-labeling - Official interaction data
- **RxNorm API**: https://rxnav.nlm.nih.gov/RxNormAPIs.html - Drug normalization and lookup
- **Levenshtein Distance**: https://en.wikipedia.org/wiki/Levenshtein_distance - Fuzzy matching algorithm
- **AIR-S03 Requirement**: >99% conflict detection accuracy standard

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start server with hot reload)
- Run tests: `npm test -- conflictDetectionService.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] OpenAI API integration works with gpt-4 model
- [x] JSON response parsing successful with validation
- [x] Drug database loaded and searchable
- [x] Medication name normalization handles typos and variations
- [x] Drug-drug interaction detection works correctly
- [x] Drug-allergy conflict detection with cross-sensitivity
- [x] Drug-condition contraindication validation
- [x] Severity classification accurate (1-5 scale)
- [x] Dosage-dependent thresholds checked correctly
- [x] Unrecognized medications return suggestions
- [x] Missing allergy data warning displayed
- [x] Circuit breaker opens after OpenAI failures
- [x] Redis caching reduces duplicate API calls
- [x] Audit logging records all checks
- [x] Test dataset achieves >99% accuracy per AIR-S03
- [x] action_required flag set correctly for critical conflicts

## Implementation Checklist
- [ ] Create server/src/config/medicationSafety.config.ts (define CRITICAL_SEVERITY_THRESHOLD=4, REQUIRES_OVERRIDE_THRESHOLD=4, ACCURACY_TARGET=0.99, CACHE_TTL_HOURS=24, severity scale definitions: 1='Minor-monitor', 2='Moderate-caution', 3='Major-avoid', 4='Severe-contraindicated', 5='Critical-life-threatening')
- [ ] Create server/src/types/conflictDetection.types.ts (interfaces: MedicationInput with name/dosage/frequency/generic_name/source, AllergyInput with allergen_name/severity/reaction_type, ConditionInput with condition_name/icd10_code, ConflictResult with conflict_type/medications_involved/severity_level/interaction_mechanism/clinical_guidance/dosage_dependent/dosage_threshold/action_required, ConflictCheckResponse with conflicts array/overall_safety_status/no_allergy_data_warning/patient_id/checked_at)
- [ ] Create server/src/schemas/conflictDetection.schema.ts (Zod schemas: ConflictResultSchema validating severity 1-5 and conflict_type enum Drug-Drug/Drug-Allergy/Drug-Condition, MedicationInputSchema, ConflictCheckResponseSchema)
- [ ] Create server/src/prompts/medication-conflict-prompt.ts (buildConflictPrompt function: template requesting JSON with conflicts array, severity scale 1-5, check drug-drug/drug-allergy/drug-condition, include dosage considerations, return overall_safety_assessment and no_conflicts_detected boolean)
- [ ] Create server/src/data/drug_reference.json (load FDA Drug Interaction Database or RxNorm reference data, JSON format with drug names, classes, known interactions, dosage thresholds)
- [ ] Create server/src/services/drugDatabaseService.ts (loadDrugDatabase from JSON, normalizeMedicationName with fuzzy matching 85% threshold, searchDrugByPartial returning top 5 matches, getDrugClass for therapeutic classification, getKnownInteractions query, getDosageThreshold, cache in Redis)
- [ ] Create server/src/utils/drugNameNormalizer.ts (normalizeName lowercase/remove spaces, expandAbbreviations ASA→Aspirin APAP→Acetaminophen, findGenericName brand to generic mapping, calculateSimilarity Levenshtein distance for fuzzy matching)
- [ ] Create server/src/services/conflictDetectionService.ts (checkConflicts main function: normalize medication names, check Redis cache, build prompt, call OpenAI gpt-4 json_object mode wrapped in circuit breaker, parse and validate with Zod, enhance with drug database if low confidence, classify severity and set action_required for ≥4, handle dosage-dependent thresholds, check missing allergies, INSERT conflict_check_audit, INSERT medication_conflicts if detected, update patient_profiles.has_active_conflicts, cache results, return ConflictCheckResponse)
- [ ] Implement unrecognized medication handling (call normalizeMedicationName, if no match call searchDrugByPartial, return unrecognized_medications array with suggestions, prompt staff clarification)
- [ ] Implement dosage-dependent logic (for each interaction check dosage_dependent flag, call getDosageThreshold, compare current vs threshold, adjust severity and guidance "Safe at Xmg / Unsafe above Ymg", set action_required if exceeded)
- [ ] Implement cross-sensitivity detection (for drug-allergy: get drug class, check against allergy list, flag cross-reactivity e.g., Penicillin→Cephalosporin 10% risk, add to clinical_guidance)
- [ ] Add comprehensive audit logging (INSERT INTO conflict_check_audit with patient_id, medications_checked JSONB, allergies_checked, conditions_checked, conflicts_detected_count, highest_severity, no_allergy_warning boolean, checked_by='System', ai_response_raw JSONB)
- [ ] Write unit tests (test known interactions: Warfarin+Aspirin=critical, Ibuprofen+CKD=contraindicated, Penicillin allergy+Amoxicillin=allergic, verify >99% accuracy AIR-S03, test dosage thresholds, test unrecognized fallback, test missing allergy warning, test Redis caching, test circuit breaker)
