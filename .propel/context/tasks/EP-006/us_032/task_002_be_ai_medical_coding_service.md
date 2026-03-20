# Task - TASK_002: Backend AI Medical Coding Service with ICD-10/CPT Suggestion

## Requirement Reference
- User Story: [us_032]
- Story Location: [.propel/context/tasks/us_032/us_032.md]
- Acceptance Criteria:
    - AC1: Analyze diagnoses using OpenAI API with medical coding prompt
    - AC1: Suggest ICD-10 codes for each condition (e.g., "Hypertension, unspecified" → I10)
    - AC1: Display Code + Description + Confidence Score (%)
    - AC1: Achieve >98% mapping accuracy per AIR-S02
    - AC1: Auto-approve if >95% confidence, require review if <95%
- Edge Case:
    - EC1: Vague condition → return multiple possible codes ranked by likelihood
    - EC2: Combination codes → suggest primary + secondary codes
    - EC3: No matching code → suggest closest match with "Best match" indicator

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
| **AIR Requirements** | AIR-004 (Medical coding automation), AIR-S02 (>98% ICD-10/CPT mapping accuracy) |
| **AI Pattern** | Structured data extraction with JSON mode for medical codes |
| **Prompt Template Path** | server/src/prompts/medical-coding-prompt.ts |
| **Guardrails Config** | server/src/config/medicalCoding.config.ts (confidence thresholds, auto-approve limits) |
| **Model Provider** | OpenAI GPT-4 |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create AI-powered medical coding service using OpenAI GPT-4. Build medicalCodingService.ts that accepts patient diagnosis list (from patient_profiles extracted_data or intake), constructs structured prompt requesting ICD-10 code suggestions. Use OpenAI chat completions API with gpt-4 model, response_format: {type: "json_object"} for structured output. Prompt template instructs AI to return JSON: {suggestions: [{diagnosis_text, icd10_code, description, confidence_score 0-100, is_primary: boolean, alternatives: [{code, description, confidence_score}], reasoning}]}. Implement confidence scoring based on match specificity: exact terminology match 95-100%, close match with synonyms 85-95%, vague/multiple interpretations 70-85%. Handle combination diagnoses by suggesting primary code + secondary codes in alternatives array. Integrate ICD-10 reference database (load from CSV or API) for validation and alternative lookups. Auto-approve codes with confidence ≥95%, flag for manual review if <95%. Return enhanced suggestions with "Best match" indicator for low-confidence codes. Implement caching using Redis to avoid re-processing same diagnoses. Add rate limiting and error handling for OpenAI API failures with circuit breaker pattern. Log all AI interactions to medical_coding_audit table for traceability.

## Dependent Tasks
- TASK_001: Database Migration (medical_coding_audit table and JSONB fields)

## Impacted Components
- **CREATE** server/src/services/medicalCodingService.ts - Main AI coding service
- **CREATE** server/src/services/icd10DatabaseService.ts - ICD-10 reference lookup
- **CREATE** server/src/prompts/medical-coding-prompt.ts - Prompt template
- **CREATE** server/src/schemas/medicalCoding.schema.ts - Zod validation schemas
- **CREATE** server/src/config/medicalCoding.config.ts - Configuration (thresholds, limits)
- **CREATE** server/src/types/medicalCoding.types.ts - TypeScript interfaces
- **CREATE** server/src/utils/icd10Validator.ts - Code format validation
- **MODIFY** server/src/utils/circuitBreaker.ts - Reuse or extend for medical coding API

## Implementation Plan
1. **Create medicalCoding.config.ts**: Define AUTO_APPROVE_THRESHOLD = 0.95, MANUAL_REVIEW_THRESHOLD = 0.95, MAX_ALTERNATIVES_PER_CODE = 5, OPENAI_MODEL = 'gpt-4', RESPONSE_TIMEOUT_MS = 30000
2. **Create medicalCoding.types.ts**: Define interfaces: DiagnosisInput = {diagnosis_text, source_document_id}, ICD10Suggestion = {diagnosis_text, icd10_code, description, confidence_score, is_primary, is_auto_approved, alternatives: CodeAlternative[], reasoning, best_match_indicator: boolean}, CodeAlternative = {code, description, confidence_score}, CodingResponse = {suggestions: ICD10Suggestion[], overall_accuracy_estimate, processing_timestamp}
3. **Create medicalCoding.schema.ts**: Define Zod schemas: ICD10SuggestionSchema validating code format (A00-Z99 pattern), confidence 0-100, alternatives array, DiagnosisInputSchema validating diagnosis_text required and non-empty
4. **Create medical-coding-prompt.ts**: Build prompt template function buildMedicalCodingPrompt(diagnoses: string[]): "You are a medical coding expert specializing in ICD-10 classification. For each diagnosis provided, suggest the most accurate ICD-10 code. Return JSON format: {suggestions: [{diagnosis_text, icd10_code, description, confidence_score (0-100), is_primary (boolean), alternatives: [{code, description, confidence_score}], reasoning}]}. Guidelines: 1) Use official ICD-10-CM codes (format: A00-Z99). 2) Confidence >95% for exact terminology matches, 85-95% for close matches, 70-85% for vague descriptions. 3) For conditions requiring multiple codes, set primary code is_primary=true, include secondary in alternatives. 4) If no exact match, provide closest match with reasoning. Diagnoses: ..."
5. **Create icd10DatabaseService.ts**: Implement loadICD10Database() reading from CSV file or external API (e.g., CMS ICD-10 database), cacheDatabase() storing in Redis for fast lookup, searchCode(code: string) returning full description, searchByDescription(text: string) returning matching codes with fuzzy search, getAlternativeCodes(code: string) returning related codes in same category
6. **Create icd10Validator.ts**: Implement validateICD10Format(code: string) checking pattern /^[A-Z]\d{2}(\.\d{1,4})?$/, isValidCode(code: string) checking against ICD-10 database, normalizeCode(code: string) formatting to standard (uppercase, proper dot placement)
7. **Create medicalCodingService.ts**: Implement suggestCodes(diagnoses: DiagnosisInput[]): check Redis cache for existing suggestions, build prompt with medical-coding-prompt template, call OpenAI API with gpt-4 and response_format json_object wrapped in circuit breaker, parse JSON response, validate with Zod schema, enhance with ICD-10 database lookups for alternatives, calculate confidence scores: if exact match in database boost to 98%, validate all codes with icd10Validator, determine is_auto_approved based on AUTO_APPROVE_THRESHOLD ≥95%, add best_match_indicator=true if confidence <85%, cache results in Redis with 24h TTL, return CodingResponse
8. **Implement combination code handling**: In OpenAI response parser, identify diagnoses with is_primary=true, group primary + secondary codes, ensure alternatives include all related codes from ICD-10 database category
9. **Implement vague diagnosis handling**: If confidence <85%, call icd10DatabaseService.searchByDescription to get top 5 fuzzy matches, merge with AI suggestions, rank by combined score (AI confidence * 0.7 + database match * 0.3), return all as alternatives
10. **Add audit logging**: After each coding suggestion, INSERT INTO medical_coding_audit with diagnosis_text, suggested_code, confidence_score, alternatives_considered JSONB, performed_by='AI System', log OpenAI API usage (tokens, latency)
11. **Add error handling**: Try-catch around OpenAI API with retries (max 3 attempts), if OpenAI fails check circuit breaker state, fallback to pure database fuzzy search if AI unavailable, always return suggestions even if low confidence with clear indicators
12. **Testing**: Create test fixtures with known diagnoses (e.g., "Type 2 Diabetes" → E11.9, "Hypertension" → I10), verify >98% accuracy on test dataset per AIR-S02, test vague inputs return multiple alternatives, test combination codes handled correctly, test circuit breaker opens after failures

**Focus on how to implement**: OpenAI call: `const response = await openai.chat.completions.create({model: 'gpt-4', messages: [{role: 'system', content: buildMedicalCodingPrompt(diagnoses)}], response_format: {type: 'json_object'}, temperature: 0.1});  const parsed = JSON.parse(response.choices[0].message.content); const validated = ICD10SuggestionSchema.array().parse(parsed.suggestions);`. Confidence logic: `const is_auto_approved = suggestion.confidence_score >= AUTO_APPROVE_THRESHOLD; if (suggestion.confidence_score < 85) { suggestion.best_match_indicator = true; const alternatives = await icd10DatabaseService.searchByDescription(diagnosis_text); suggestion.alternatives.push(...alternatives); }`. Redis cache: `const cacheKey = `coding:${hash(diagnosis_text)}`; const cached = await redis.get(cacheKey); if (cached) return JSON.parse(cached); ... await redis.setex(cacheKey, 86400, JSON.stringify(result));`. ICD-10 validation: `const isValid = /^[A-Z]\d{2}(\.\d{1,4})?$/.test(code) && await icd10DatabaseService.isValidCode(code);`. Circuit breaker: `const breaker = getCodingCircuitBreaker(); const result = await breaker.fire(() => callOpenAIAPI(prompt));`. Audit: `await db.query('INSERT INTO medical_coding_audit (diagnosis_text, suggested_code, confidence_score, alternatives_considered, performed_by, performed_at) VALUES ($1, $2, $3, $4, $5, NOW())', [diagnosis, code, confidence, JSON.stringify(alternatives), 'AI System']);`.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── medicalCodingService.ts (to be created)
│   │   └── icd10DatabaseService.ts (to be created)
│   ├── prompts/
│   │   └── medical-coding-prompt.ts (to be created)
│   ├── schemas/
│   │   └── medicalCoding.schema.ts (to be created)
│   ├── config/
│   │   └── medicalCoding.config.ts (to be created)
│   ├── types/
│   │   └── medicalCoding.types.ts (to be created)
│   ├── utils/
│   │   ├── icd10Validator.ts (to be created)
│   │   └── circuitBreaker.ts (may exist from US_029, to be reused)
│   └── data/
│       └── icd10_codes.csv (to be added - ICD-10 reference database)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/medicalCodingService.ts | Main AI service for ICD-10 code suggestions |
| CREATE | server/src/services/icd10DatabaseService.ts | ICD-10 reference database lookup and search |
| CREATE | server/src/prompts/medical-coding-prompt.ts | Prompt template for medical coding |
| CREATE | server/src/schemas/medicalCoding.schema.ts | Zod validation schemas for coding data |
| CREATE | server/src/config/medicalCoding.config.ts | Configuration for thresholds and limits |
| CREATE | server/src/types/medicalCoding.types.ts | TypeScript interfaces for coding types |
| CREATE | server/src/utils/icd10Validator.ts | ICD-10 code format validation |
| CREATE | server/src/data/icd10_codes.csv | ICD-10 reference database (CSV format) |

## External References
- **OpenAI JSON Mode**: https://platform.openai.com/docs/guides/text-generation/json-mode - Structured output
- **OpenAI GPT-4**: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4 - Model capabilities
- **ICD-10-CM Official Guidelines**: https://www.cms.gov/medicare/coding-billing/icd-10-codes - Medical coding standards
- **ICD-10 Code Format**: https://www.icd10data.com/ICD10CM/Codes - Code structure (A00-Z99)
- **Zod Validation**: https://zod.dev/ - Schema validation
- **Redis Caching**: https://redis.io/docs/latest/develop/use/patterns/caching/ - Caching patterns

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start server with hot reload)
- Run tests: `npm test -- medicalCodingService.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] OpenAI API integration works with gpt-4 model
- [x] JSON response parsing successful with validation
- [x] ICD-10 database loaded and searchable
- [x] Code format validation recognizes valid ICD-10 patterns
- [x] Auto-approve logic works correctly (≥95% confidence)
- [x] Manual review flagging for <95% confidence
- [x] Combination codes handled with primary + secondary
- [x] Vague diagnoses return multiple alternatives
- [x] Best match indicator added for low-confidence codes
- [x] Alternatives ranked by confidence score
- [x] Circuit breaker opens after OpenAI failures
- [x] Redis caching reduces duplicate API calls
- [x] Audit logging records all suggestions
- [x] Test dataset achieves >98% accuracy per AIR-S02
- [x] Error handling provides fallback suggestions

## Implementation Checklist
- [ ] Create server/src/config/medicalCoding.config.ts (define AUTO_APPROVE_THRESHOLD=0.95, MANUAL_REVIEW_THRESHOLD=0.95, MAX_ALTERNATIVES_PER_CODE=5, OPENAI_MODEL='gpt-4', RESPONSE_TIMEOUT_MS=30000)
- [ ] Create server/src/types/medicalCoding.types.ts (interfaces: DiagnosisInput, ICD10Suggestion with code/description/confidence/is_primary/alternatives, CodeAlternative, CodingResponse with suggestions array and overall_accuracy_estimate)
- [ ] Create server/src/schemas/medicalCoding.schema.ts (Zod schemas: ICD10SuggestionSchema validating code format /^[A-Z]\d{2}(\.\d{1,4})?$/, confidence 0-100, alternatives array; DiagnosisInputSchema validating diagnosis_text required)
- [ ] Create server/src/prompts/medical-coding-prompt.ts (buildMedicalCodingPrompt function: template requesting JSON with diagnosis_text, icd10_code, description, confidence_score, is_primary, alternatives, reasoning; guidelines for confidence scoring and combination codes)
- [ ] Create server/src/data/icd10_codes.csv (download ICD-10-CM codes from CMS or use public dataset, CSV format with columns: code, short_description, long_description, category)
- [ ] Create server/src/services/icd10DatabaseService.ts (loadICD10Database from CSV, cacheDatabase in Redis, searchCode exact lookup, searchByDescription fuzzy search with Levenshtein distance, getAlternativeCodes by category prefix)
- [ ] Create server/src/utils/icd10Validator.ts (validateICD10Format regex check, isValidCode against database, normalizeCode uppercase and dot placement)
- [ ] Create server/src/services/medicalCodingService.ts (suggestCodes main function: check Redis cache, build prompt, call OpenAI gpt-4 with response_format json_object wrapped in circuit breaker, parse and validate with Zod, enhance with database alternatives, calculate confidence and auto-approve, add best_match_indicator, cache results, return CodingResponse)
- [ ] Implement combination code handling (in response parser: identify is_primary=true, group primary+secondary, merge database category alternatives)
- [ ] Implement vague diagnosis handling (if confidence <85%: call icd10DatabaseService.searchByDescription top 5 fuzzy matches, merge with AI suggestions, rank by combined score AI*0.7+database*0.3)
- [ ] Add audit logging (after each suggestion: INSERT INTO medical_coding_audit with diagnosis_text, suggested_code, confidence_score, alternatives_considered JSONB, performed_by='AI System', timestamp, log OpenAI tokens and latency)
- [ ] Add error handling (try-catch around OpenAI with 3 retries, circuit breaker check, fallback to database fuzzy search if AI unavailable, always return suggestions with indicators)
- [ ] Write comprehensive tests (test known diagnoses like "Type 2 Diabetes"→E11.9, "Hypertension"→I10, verify >98% accuracy on test dataset per AIR-S02, test vague inputs return multiple alternatives, test combination codes, test circuit breaker, test Redis caching)
