# Task - TASK_002: Backend Real-Time Validation Service with Inconsistency Detection

## Requirement Reference
- User Story: [us_027]
- Story Location: [.propel/context/tasks/us_027/us_027.md]
- Acceptance Criteria:
    - AC1: Validate response format in real-time (date format, medication names, inconsistencies)
    - AC1: If validation fails, AI asks clarifying question within same response
    - AC1: >98% field validation accuracy per AIR-R03
- Edge Case:
    - EC2: Ambiguous medical terms handled with clarification ("By 'sugar problems' do you mean diabetes, hyperglycemia, or hypoglycemia?")

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | AIR-R03 (Validation accuracy >98%) |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.18.x |
| Backend | PostgreSQL | 15.x |
| Backend | TypeScript | 5.3.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes (validation integrated with AI responses) |
| **AIR Requirements** | AIR-005, AIR-R03 |
| **AI Pattern** | Real-time validation with AI-generated clarifications |
| **Prompt Template Path** | .propel/context/prompts/ai-intake-conversation.md (enhanced with validation rules) |
| **Guardrails Config** | Validation thresholds, clarification triggers |
| **Model Provider** | OpenAI GPT-4 |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create real-time validation service that validates patient responses during AI intake conversations. Implement validators for: date formats (MM/DD/YYYY, relative dates "3 days ago"), medication names (check against FDA drug database or RxNorm API), numeric ranges (pain level 1-10, age 0-120), inconsistency detection (cross-validate age with medical history duration, symptom onset vs appointment date). On validation failure, generate clarifying question appended to AI response ("I want to make sure I have this right - did you mean [interpretation]?"). Track validation accuracy metrics to ensure >98% accuracy. Integrate with OpenAI service to include validation results in AI prompt context.

## Dependent Tasks
- US_025 TASK_001: Backend OpenAI Integration (openAiService to enhance)
- TASK_001: Redis Context Storage (context includes validation flags)

## Impacted Components
- **CREATE** server/src/services/validation/responseValidationService.ts - Main validation orchestrator
- **CREATE** server/src/services/validation/dateValidator.ts - Date format and logic validation
- **CREATE** server/src/services/validation/medicationValidator.ts - Medication name validation against drug database
- **CREATE** server/src/services/validation/inconsistencyDetector.ts - Cross-field inconsistency detection
- **CREATE** server/src/services/validation/medicalTermsService.ts - Ambiguous medical term detection
- **MODIFY** server/src/services/openai/openAiService.ts - Integrate validation before/after AI response
- **CREATE** server/src/types/validation.types.ts - ValidationResult, ValidationRule interfaces
- **CREATE** database/seed_data/medication_database.sql - Seed common medications for validation

## Implementation Plan
1. **Create validation.types.ts**: Define ValidationResult interface (isValid: boolean, field: string, originalValue: string, suggestedValue?: string, confidence: number 0-1, clarification_question?: string), ValidationRule interface (field: string, validator: function, errorMessage: string)
2. **Create dateValidator.ts**: Implement validateDate(input: string) - parse formats: MM/DD/YYYY, YYYY-MM-DD, relative "3 days ago", "last week", validate date is not in future for symptom onset (unless appointment scheduled in future), validate date is reasonable (not before patient birth date if known), return ValidationResult with confidence score based on format match
3. **Create medicationValidator.ts**: Implement validateMedication(input: string) - normalize input (lowercase, remove spaces), check against medication database (SELECT name FROM medications WHERE name LIKE '%input%' LIMIT 5), use Levenshtein distance for fuzzy matching (typo tolerance), if no match return suggestedValue with closest matches, confidence = matchScore / 100
4. **Create inconsistencyDetector.ts**: Implement detectInconsistencies(context: ConversationContext) - check age vs medical history duration (if age 25 but "40 years of diabetes" flag inconsistency), check symptom onset vs current date (if "symptoms started tomorrow" flag error), check medication compatibility (if multiple blood thinners flag potential issue), return array of ValidationResult for each inconsistency found
5. **Create medicalTermsService.ts**: Implement detectAmbiguousTerms(input: string) - check for colloquial terms mapping: "sugar problems" → ["diabetes", "hyperglycemia", "hypoglycemia"], "heart trouble" → ["heart disease", "arrhythmia", "heart failure"], "breathing problems" → ["asthma", "COPD", "shortness of breath"], return clarification_question asking patient to specify
6. **Create responseValidationService.ts**: Orchestrate all validators - extractFieldValue from user message, determine field type (date, medication, numeric, text), call appropriate validator, if isValid=false generate clarification_question, merge validation results, calculate overall accuracy metric (track total validations and failures), return consolidated ValidationResult array
7. **Modify openAiService.ts**: Before sending to OpenAI, call responseValidationService.validate(userMessage, context), if validation fails add clarification to AI prompt "User may have meant [suggested], please confirm", after AI response append clarification_question if needed, track validation metrics for AIR-R03 compliance
8. **Add Validation Metrics**: Track successful validations, failed validations, user corrections, calculate accuracy = (successful + corrected) / total, log to metrics table, alert if accuracy drops below 98%

**Focus on how to implement**: Date parsing uses library like `date-fns` or `chrono-node` for natural language dates. Medication validation queries: `SELECT name, generic_name FROM medications WHERE LOWER(name) LIKE LOWER($1) ORDER BY similarity(name, $2) DESC LIMIT 5` (uses pg_trgm extension for fuzzy matching). Levenshtein distance: `SELECT levenshtein(lower($1), lower(name)) as distance FROM medications ORDER BY distance LIMIT 1`. Inconsistency detection checks extracted_data from context: `if (context.extractedData.age < context.extractedData.medical_history_years) return inconsistency`. Clarification question template: "I want to make sure I understand correctly. When you said '[original input]', did you mean [option A], [option B], or something else?". Validation confidence threshold: if confidence < 0.7, trigger clarification. Metrics stored in validation_log table with columns: timestamp, field, input, isValid, confidence, correction_made.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── openai/
│   │   │   └── openAiService.ts (US_025 TASK_001, to be modified)
│   │   └── validation/
│   │       └── (responseValidationService.ts, dateValidator.ts, etc. to be created)
│   ├── types/
│   │   └── (validation.types.ts to be created)
│   └── app.ts
database/
└── seed_data/
    └── (medication_database.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/validation/responseValidationService.ts | Orchestrates all validators, generates clarification questions, tracks accuracy |
| CREATE | server/src/services/validation/dateValidator.ts | Validates date formats (absolute and relative), checks date logic |
| CREATE | server/src/services/validation/medicationValidator.ts | Fuzzy match medications against database using Levenshtein distance |
| CREATE | server/src/services/validation/inconsistencyDetector.ts | Cross-validates fields (age vs history duration, date logic) |
| CREATE | server/src/services/validation/medicalTermsService.ts | Detects ambiguous colloquial terms, suggests clarifications |
| CREATE | server/src/types/validation.types.ts | ValidationResult, ValidationRule interfaces |
| MODIFY | server/src/services/openai/openAiService.ts | Integrate validation before/after AI processing |
| CREATE | database/seed_data/medication_database.sql | Seed 500+ common medications for validation |

## External References
- **Date Parsing - chrono-node**: https://github.com/wanasit/chrono - Natural language date parser
- **Levenshtein Distance**: https://github.com/gustf/js-levenshtein - String similarity for typo tolerance
- **RxNorm API**: https://rxnav.nlm.nih.gov/RxNormAPIs.html - FDA medication database API
- **PostgreSQL pg_trgm**: https://www.postgresql.org/docs/15/pgtrgm.html - Trigram similarity for fuzzy matching
- **Validation Patterns**: https://en.wikipedia.org/wiki/Data_validation - Data validation best practices

## Build Commands
- Install dependencies: `npm install chrono-node@^2.7.0 js-levenshtein@^1.1.6 date-fns@^2.30.0` (in server directory)
- Seed medications: `psql -U postgres -d appointment_db -f database/seed_data/medication_database.sql`
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (unit tests for each validator, >98% accuracy test suite)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for dateValidator (various formats, relative dates, future date detection)
- [x] Unit tests pass for medicationValidator (exact match, fuzzy match, typo tolerance)
- [x] Unit tests pass for inconsistencyDetector (age-history mismatch detection)
- [x] Unit tests pass for medicalTermsService (ambiguous term detection)
- [x] Integration test: User response validated, clarification question generated if low confidence
- [x] Integration test: Validation accuracy tracked, >98% threshold maintained over 1000 validations
- [x] Integration test: AI response includes clarification when validation fails
- [x] Load test: 100 concurrent validations complete within 500ms p95

## Implementation Checklist
- [ ] Install dependencies: npm install chrono-node@^2.7.0 js-levenshtein@^1.1.6 date-fns@^2.30.0
- [ ] Create validation.types.ts (export ValidationResult interface with isValid boolean, field string, originalValue string, suggestedValue optional string, confidence 0-1, clarification_question optional string; ValidationRule interface with field, validator function, errorMessage)
- [ ] Create dateValidator.ts (validateDate function: use chrono-node to parse natural language dates, validate with date-fns that date not in future for symptom onset unless appointment future, check date > patient DOB if known, return ValidationResult with confidence based on parse success and logic checks)
- [ ] Create medication_database.sql seed file (INSERT INTO medications (name, generic_name, category) VALUES with 500+ common drugs: aspirin, ibuprofen, metformin, lisinopril, etc., enable pg_trgm extension: CREATE EXTENSION IF NOT EXISTS pg_trgm)
- [ ] Create medicationValidator.ts (validateMedication function: normalize input toLowerCase trim, SELECT from medications with ILIKE and similarity score, calculate Levenshtein distance for top 5 matches, if distance < 3 return suggestedValue, confidence = (1 - distance/length), if no match confidence=0 trigger clarification)
- [ ] Create inconsistencyDetector.ts (detectInconsistencies function: check context.extractedData for age vs medical_history_years mismatch, symptom_onset_date > today, appointment_date < symptom_onset_date, multiple contraindicated medications, return ValidationResult array with each inconsistency flagged)
- [ ] Create medicalTermsService.ts (detectAmbiguousTerms function: map colloquial terms using object: {"sugar problems": ["diabetes", "hyperglycemia", "hypoglycemia"], "heart trouble": [...], etc.}, if input matches key return clarification_question: "By '{term}' do you mean {options.join(', or ')}?")
- [ ] Create responseValidationService.ts (validate function: use NLP to extract field type from message, call appropriate validator (date/medication/numeric), call inconsistencyDetector with context, call medicalTermsService, merge results, calculate accuracy metric stored in Redis, return ValidationResult array, if any isValid=false aggregate clarification_questions)
- [ ] Modify openAiService.ts sendMessage (before calling OpenAI: validationResults = await responseValidationService.validate(userMessage, context), if validation fails add to AI prompt: "VALIDATION: User input may need clarification - {clarification_question}", after AI response: if clarification needed append to response: "\n\n{clarification_question}", include validation results in conversation context)
- [ ] Add validation metrics tracking (CREATE TABLE validation_log with timestamp, conversation_id, field, input, isValid, confidence, correction_made, store on each validation, query for accuracy: SELECT SUM(CASE WHEN isValid THEN 1 ELSE 0 END) / COUNT(*) FROM validation_log WHERE timestamp > NOW() - INTERVAL '7 days', alert if < 0.98)
