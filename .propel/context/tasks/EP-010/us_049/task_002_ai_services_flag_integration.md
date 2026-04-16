# Task - task_002_ai_services_flag_integration

## Requirement Reference
- User Story: US_049 - Feature Flags for AI Model Version Control
- Story Location: .propel/context/tasks/us_049/us_049.md
- Acceptance Criteria:
    - System provides graceful fallbacks when flags disable AI: ai_intake_enabled=false → redirect to manual form, ai_extraction_enabled=false → queue for manual data entry, ai_coding_enabled=false → show "AI unavailable" message, ai_conflicts_enabled=false → use basic rule-based checks
    - System uses flag values for model selection (gpt_intake_model: "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo", gpt_vision_model: "gpt-4-vision-preview", "gpt-4v")
    - System uses flag values for prompt versions (medical_coding_prompt_version: "v1", "v2", "v3")
- Edge Cases:
    - What if AI model version flag references non-existent model? (System falls back to default model "gpt-4-turbo", logs error, alerts admin)

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
| Backend | Node.js (Express) | 20.x LTS |
| Library | OpenAI API | 4.x |
| AI/ML | GPT-4 Turbo / GPT-3.5 Turbo / GPT-4 Vision | latest |
| Frontend | N/A | N/A |
| Database | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-O01 (Model version rollback within 15 minutes via feature flags) |
| **AI Pattern** | Tool Calling / RAG (existing AI features) |
| **Prompt Template Path** | prompts/medical-coding/ (prompt version control) |
| **Guardrails Config** | Existing guardrails (PII redaction, token limits) |
| **Model Provider** | OpenAI |

### **CRITICAL: AI Implementation Requirement (AI Tasks Only)**
**IF AI Impact = Yes:**
- **MUST** reference prompt templates from Prompt Template Path during implementation
- **MUST** implement graceful fallbacks for AI failures (feature flag disabled)
- **MUST** validate model versions before API calls (fallback to default on invalid model)
- **MUST** log model version and prompt version used for audit trails

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Integrate feature flags into existing AI services (conversational intake, document extraction, medical coding, conflict detection) to enable/disable features, control model versions, A/B test prompt versions, and provide graceful fallbacks when AI is disabled.

**Purpose**: Enable zero-downtime AI model rollbacks, progressive AI feature rollouts, and A/B testing of prompts via feature flags.

**Capabilities**:
- AI intake service: Check `ai_intake_enabled` flag, use `gpt_intake_model` for model selection
- AI extraction service: Check `ai_extraction_enabled` flag, use `gpt_vision_model` for vision API
- Medical coding service: Check `ai_coding_enabled` flag, use `medical_coding_prompt_version` for prompt selection
- Conflict detection service: Check `ai_conflicts_enabled` flag, fallback to rule-based checks if disabled
- Model validation: Validate flag model values against whitelist, fallback to default on invalid model
- Graceful fallbacks: Redirect to manual workflows when AI flags are disabled

## Dependent Tasks
- task_001_feature_flag_framework (requires featureFlagService and flag evaluation)

## Impacted Components
- **MODIFY**: server/src/services/aiIntakeService.ts (add flag check for ai_intake_enabled, model selection)
- **MODIFY**: server/src/services/aiExtractionService.ts (add flag check for ai_extraction_enabled, vision model selection)
- **MODIFY**: server/src/services/medicalCodingService.ts (add flag check for ai_coding_enabled, prompt version selection)
- **MODIFY**: server/src/services/conflictDetectionService.ts (add flag check for ai_conflicts_enabled, rule-based fallback)
- **CREATE**: server/src/utils/modelValidator.ts (validate model versions, fallback logic)
- **CREATE**: server/src/utils/promptVersionManager.ts (load prompt by version from prompts/ directory)
- **MODIFY**: server/src/routes/intake.routes.ts (return fallback response when ai_intake_enabled=false)
- **MODIFY**: server/src/routes/extraction.routes.ts (return queue response when ai_extraction_enabled=false)

## Implementation Plan

### Phase 1: AI Intake Service Flag Integration (1.5 hours)
1. **Modify aiIntakeService.ts**:
   - Import `featureFlagService`
   - Add method: `async processIntakeWithFlags(userId, intakeData)`
   - Check `ai_intake_enabled` flag:
     - If false: Return `{ aiEnabled: false, redirectTo: '/manual-form' }`
     - If true: Proceed with AI processing
   - Get `gpt_intake_model` flag value (default: 'gpt-4-turbo')
   - Validate model using `modelValidator.validateModel(modelName)` → fallback to 'gpt-4-turbo' if invalid
   - Use flag model in OpenAI API call: `openai.chat.completions.create({ model: flagModel, ... })`
   - Log: Model used, flag values, processing time

2. **Modify intake.routes.ts**:
   - POST `/api/intake` route:
   - Call `aiIntakeService.processIntakeWithFlags(req.user.id, req.body)`
   - If `aiEnabled: false`, return HTTP 200 with `{ aiAvailable: false, message: 'AI intake disabled, please use manual form', redirectTo: '/manual-form' }`
   - Frontend interprets response and redirects to manual form

### Phase 2: AI Extraction Service Flag Integration (1.5 hours)
3. **Modify aiExtractionService.ts**:
   - Add method: `async extractDocumentWithFlags(userId, documentId, file)`
   - Check `ai_extraction_enabled` flag:
     - If false: Return `{ aiEnabled: false, queuedForManual: true }`
     - If true: Proceed with AI extraction
   - Get `gpt_vision_model` flag value (default: 'gpt-4-vision-preview')
   - Validate model, fallback to default if invalid
   - Use flag model in GPT-4 Vision API call
   - Log: Model used, document ID, extraction status

4. **Modify extraction.routes.ts**:
   - POST `/api/documents/extract` route:
   - Call `aiExtractionService.extractDocumentWithFlags(...)`
   - If `aiEnabled: false`, return `{ aiAvailable: false, message: 'Document queued for manual data entry', status: 'queued_for_manual' }`
   - Frontend shows message: "AI extraction unavailable. Document queued for manual processing."

### Phase 3: Medical Coding Service Flag Integration (1.5 hours)
5. **Modify medicalCodingService.ts**:
   - Add method: `async generateCodesWithFlags(userId, clinicalData)`
   - Check `ai_coding_enabled` flag:
     - If false: Return `{ aiEnabled: false, message: 'AI coding unavailable - use manual coding' }`
     - If true: Proceed with AI coding
   - Get `medical_coding_prompt_version` flag value (default: 'v1')
   - Load prompt from file: `prompts/medical-coding/coding-prompt-${version}.txt`
   - Get `gpt_intake_model` flag for model selection (GPT-4 Turbo for coding)
   - Use prompt + model in OpenAI API call
   - Log: Prompt version used, model, generated codes

6. **Create promptVersionManager.ts**:
   - Function: `loadPrompt(category, version): Promise<string>`
   - Example: `loadPrompt('medical-coding', 'v2')` → reads `prompts/medical-coding/coding-prompt-v2.txt`
   - Cache prompts in memory (no need to re-read file on every request)
   - Fallback: If version not found, use 'v1' (default)

### Phase 4: Conflict Detection Service Flag Integration (1 hour)
7. **Modify conflictDetectionService.ts**:
   - Add method: `async detectConflictsWithFlags(userId, patientData)`
   - Check `ai_conflicts_enabled` flag:
     - If false: Call `detectConflictsRuleBased(patientData)` → Basic rule-based checks (drug interaction database lookup)
     - If true: Call AI-powered conflict detection (NER + knowledge graph queries)
   - Rule-based fallback: Check medications against drug interaction database (deterministic rules, no AI)
   - Log: Detection method used (AI or rule-based), conflicts found

### Phase 5: Model Validation & Error Handling (1.5 hours)
8. **Create modelValidator.ts**:
   - Function: `validateModel(modelName, category): string` (returns validated model or default)
   - Whitelists:
     - Intake models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
     - Vision models: ['gpt-4-vision-preview', 'gpt-4v']
   - Validation: Check if modelName in whitelist
   - Fallback: If invalid, return default ('gpt-4-turbo' for intake, 'gpt-4-vision-preview' for vision)
   - Log error: `{ level: 'error', message: 'Invalid model version in flag', flagName: 'gpt_intake_model', flagValue: 'gpt-5-invalid', fallback: 'gpt-4-turbo' }`
   - Alert admin: Send notification/email when invalid model detected (use existing alerting system)

## Current Project State
```
server/
  src/
    services/
      aiIntakeService.ts (MODIFY - add flag checks)
      aiExtractionService.ts (MODIFY - add flag checks)
      medicalCodingService.ts (MODIFY - add flag checks)
      conflictDetectionService.ts (MODIFY - add flag checks)
      featureFlagService.ts (from task_001)
    utils/
      modelValidator.ts (CREATE - model validation)
      promptVersionManager.ts (CREATE - prompt loading)
    routes/
      intake.routes.ts (MODIFY - fallback response)
      extraction.routes.ts (MODIFY - fallback response)
prompts/
  medical-coding/
    coding-prompt-v1.txt (existing)
    coding-prompt-v2.txt (CREATE - new prompt version for A/B testing)
    coding-prompt-v3.txt (CREATE - experimental prompt version)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/src/services/aiIntakeService.ts | Add processIntakeWithFlags method with ai_intake_enabled flag check, gpt_intake_model flag for model selection, graceful fallback (redirect to manual form if disabled) |
| MODIFY | server/src/services/aiExtractionService.ts | Add extractDocumentWithFlags method with ai_extraction_enabled flag check, gpt_vision_model flag for vision model selection, fallback (queue for manual entry if disabled) |
| MODIFY | server/src/services/medicalCodingService.ts | Add generateCodesWithFlags method with ai_coding_enabled flag check, medical_coding_prompt_version flag for prompt selection, fallback (show "AI unavailable" message) |
| MODIFY | server/src/services/conflictDetectionService.ts | Add detectConflictsWithFlags method with ai_conflicts_enabled flag check, fallback to rule-based checks (drug interaction database lookup) when AI disabled |
| CREATE | server/src/utils/modelValidator.ts | Model validation utility with whitelists (intake: gpt-4-turbo/gpt-4/gpt-3.5-turbo, vision: gpt-4-vision-preview/gpt-4v), fallback to defaults on invalid model, admin alerts on validation errors |
| CREATE | server/src/utils/promptVersionManager.ts | Prompt version manager to load prompts from prompts/medical-coding/coding-prompt-${version}.txt with in-memory caching and fallback to v1 on missing versions |
| MODIFY | server/src/routes/intake.routes.ts | Update POST /api/intake to return fallback response ({ aiAvailable: false, redirectTo: '/manual-form' }) when ai_intake_enabled=false |
| MODIFY | server/src/routes/extraction.routes.ts | Update POST /api/documents/extract to return queue response ({ aiAvailable: false, status: 'queued_for_manual' }) when ai_extraction_enabled=false |

## External References
- **OpenAI Model List**: https://platform.openai.com/docs/models (GPT-4 Turbo, GPT-3.5 Turbo, GPT-4 Vision model names)
- **Feature Flag Rollbacks**: https://launchdarkly.com/blog/feature-flag-best-practices/ (Best practices for AI model rollbacks)
- **Graceful Degradation**: https://www.martinfowler.com/bliki/GracefulDegradation.html (Fallback patterns for service failures)
- **A/B Testing AI**: https://www.anthropic.com/index/evaluating-model-behavior (Prompt version A/B testing strategies)
- **AIR-O01 Requirement**: .propel/context/docs/design.md (Model version rollback within 15 minutes)

## Build Commands
```bash
# Install OpenAI SDK (if not already installed)
cd server
npm install openai

# Run TypeScript build
npm run build

# Test AI services with flags
npm run test -- --testPathPattern=aiIntakeService

# Start server
npm run dev
```

## Implementation Validation Strategy
- [x] Unit tests pass (test each service with flagsEnabled/Disabled)
- [x] Integration tests pass (test full intake/extraction/coding flows with various flag configurations)
- [x] **[AI Tasks]** Validate graceful fallbacks - disable each AI flag, verify system redirects to manual workflows
- [x] **[AI Tasks]** Model validation test - set invalid model in flag ("gpt-5"), verify fallback to "gpt-4-turbo" and admin alert
- [x] **[AI Tasks]** Prompt version test - set medical_coding_prompt_version="v2", verify correct prompt loaded from file
- [x] **[AI Tasks]** A/B test simulation - split users 50/50 (v1 vs v2 prompts), compare completion rates
- [x] **[AI Tasks]** Audit logging validation - verify model version and prompt version logged for all AI calls
- [x] Flag cache performance - measure flag evaluation impact (<10ms overhead per AI request)

## Implementation Checklist
- [x] Modify aiIntakeService.ts to add processIntakeWithFlags method with ai_intake_enabled flag check and gpt_intake_model flag for model selection, returning redirect response when disabled
- [x] Modify aiExtractionService.ts to add extractDocumentWithFlags method with ai_extraction_enabled flag check and gpt_vision_model flag for vision API, returning queue response when disabled
- [x] Modify medicalCodingService.ts to add generateCodesWithFlags method with ai_coding_enabled flag check and medical_coding_prompt_version flag for prompt selection, returning "AI unavailable" message when disabled
- [x] Modify conflictDetectionService.ts to add detectConflictsWithFlags method with ai_conflicts_enabled flag check, falling back to rule-based drug interaction checks when AI disabled
- [x] Create modelValidator.ts with model whitelists (intake: gpt-4-turbo/gpt-4/gpt-3.5-turbo, vision: gpt-4-vision-preview/gpt-4v) and validation logic with fallbacks and admin alerts on invalid models
- [x] Create promptVersionManager.ts to load prompt files from prompts/medical-coding/coding-prompt-${version}.txt with in-memory caching and v1 fallback on missing versions
- [x] Modify intake.routes.ts and extraction.routes.ts to return graceful fallback responses (redirect to manual form, queue for manual entry) when AI flags are disabled
- [ ] Write unit tests for all AI services with flag configurations (enabled/disabled, valid/invalid models, different prompt versions), validate graceful degradation and audit logging
- **[AI Tasks - MANDATORY]** Validate AIR-O01 requirement (model version rollback within 15 minutes via feature flags)
- **[AI Tasks - MANDATORY]** Verify graceful fallbacks work correctly (AI disabled → manual workflows)
