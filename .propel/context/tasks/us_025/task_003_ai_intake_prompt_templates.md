# Task - TASK_003_AI_INTAKE_PROMPT_TEMPLATES

## Requirement Reference
- User Story: US_025
- Story Location: `.propel/context/tasks/us_025/us_025.md`
- Acceptance Criteria:
    - AC2: AI asks relevant follow-up questions based on medical context, validates patient responses, maintains >98% validation accuracy (AIR-R03)
    - AC1: AI greeting personalized by patient name, starts with chief complaint
- Edge Cases:
    - Ambiguous response: AI asks clarifying question "I want to make sure I understand - you meant [interpretation]?"
    - Offensive input: Professional response "I'm here to help with medical information. Let's focus on your health concerns."

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No (Backend prompts) |
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
| Database | N/A | N/A |
| AI/ML | OpenAI GPT-4 Turbo | gpt-4-turbo-preview |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-001 (Conversation design), AIR-R03 (>98% validation accuracy) |
| **AI Pattern** | Multi-turn medical intake conversation with structured extraction |
| **Prompt Template Path** | .propel/context/prompts/intake-conversation-starter.md, intake-followup-generator.md, intake-data-extractor.md, intake-guardrails.json |
| **Guardrails Config** | intake-guardrails.json (medical scope only, profanity filter, redaction rules, clarification triggers) |
| **Model Provider** | OpenAI GPT-4 Turbo (gpt-4-turbo-preview) |

> **Prompt Template Specifications:**
>
> **1. intake-conversation-starter.md** (System prompt - initial greeting)
> ```
> Role: Compassionate medical intake assistant at [Clinic Name]
> Task: Gather patient medical information conversationally, one question at a time
> Tone: Empathetic, professional, non-judgmental
> First question: "Hi [firstName], I'll help gather your medical information today. What brings you in?"
> Structure: Ask chief complaint first, then follow-up based on response
> Constraints: Medical scope only, no diagnosis/advice, ask clarifying questions for ambiguity
> ```
>
> **2. intake-followup-generator.md** (Dynamic follow-up questions)
> ```
> Input: {chiefComplaint, currentSection, extractedData}
> Output: Next question based on context
> Logic:
> - Chief complaint section → ask duration, severity, associated symptoms
> - Medical history → ask chronic conditions, hospitalizations
> - Medications → ask name, dosage, frequency
> - Allergies → ask allergen, reaction type
> Examples:
> - User: "I have chest pain" → "How long have you been experiencing chest pain?"
> - User: "3 days" → "Can you describe the pain? Is it sharp, dull, or pressure-like?"
> ```
>
> **3. intake-data-extractor.md** (Function calling schema)
> ```
> Function: extractIntakeData
> Description: Extract structured medical information from conversation
> Parameters:
> - demographics: {firstName, lastName, dob, phone, email, address}
> - chiefComplaint: {symptom, duration, severity (1-10), associatedSymptoms[]}
> - medicalHistory: {chronicConditions[], hospitalizations[], previousDiagnoses[]}
> - medications: [{name, dosage, frequency, startDate}]
> - allergies: [{allergen, reactionType, severity}]
> - surgeries: [{procedure, date, hospital}]
> - familyHistory: {conditions: {condition, relative}[]}
> Returns: {extractedData, confidence: 0.0-1.0, missingFields[]}
> ```
>
> **4. intake-guardrails.json** (Safety rules)
> ```json
> {
>   "scope": "medical_intake_only",
>   "blockedTopics": ["diagnosis", "treatment_advice", "prescriptions", "emergency_triage"],
>   "profanityFilter": true,
>   "piiRedactionPatterns": ["ssn", "insurance_id", "credit_card"],
>   "clarificationTriggers": ["ambiguous_duration", "unclear_symptoms", "contradictory_info"],
>   "fallbackResponses": {
>     "offensive": "I'm here to help with medical information. Let's focus on your health concerns.",
>     "out_of_scope": "I can only assist with gathering your medical information. Please share your health concerns.",
>     "emergency": "If this is a medical emergency, please call 911 immediately."
>   },
>   "validationRules": {
>     "minConfidence": 0.98,
>     "requiredFields": ["chiefComplaint", "firstName", "lastName", "dob", "phone"]
>   }
> }
> ```

## Task Overview
Create AI prompt templates for medical intake conversation: (1) intake-conversation-starter.md with system prompt (role, tone, first question), (2) intake-followup-generator.md with dynamic question logic based on current section, (3) intake-data-extractor.md with function calling schema for structured extraction, (4) intake-guardrails.json with safety rules (medical scope only, profanity filter, PII detection, clarification triggers, fallback responses), (5) Validation rules for >98% accuracy (AIR-R03), (6) Example conversations with expected extractions, (7) Integration with IntakeAIService for loading prompts at runtime.

## Dependent Tasks
- US_025 Task 002: OpenAI conversation API (loads these prompts)

## Impacted Components
**New:**
- .propel/context/prompts/intake-conversation-starter.md (System prompt)
- .propel/context/prompts/intake-followup-generator.md (Follow-up question logic)
- .propel/context/prompts/intake-data-extractor.md (Function calling schema)
- .propel/context/prompts/intake-guardrails.json (Safety rules + validation)
- .propel/context/prompts/intake-examples.md (Sample conversations)

## Implementation Plan
1. Create intake-conversation-starter.md: Define AI role, tone, first question template with [firstName] placeholder
2. Create intake-followup-generator.md: Logic for next question based on {chiefComplaint, currentSection, extractedData}, examples for each section
3. Create intake-data-extractor.md: Function calling schema with all intake fields, confidence scoring, missing field detection
4. Create intake-guardrails.json: Blocked topics, profanity filter enabled, PII patterns, clarification triggers (ambiguous/unclear/contradictory), fallback responses (offensive/out_of_scope/emergency)
5. Define validation rules: minConfidence 0.98, requiredFields array, field format validators (phone, DOB, email)
6. Create intake-examples.md: 3 sample conversations (simple, complex, edge case with clarification)
7. Integration: IntakeAIService loads prompts from files, replaces placeholders [firstName], [clinicName]
8. Test: Load prompts → verify placeholders replaced → OpenAI conversation follows templates

## Current Project State
```
ASSIGNMENT/.propel/context/prompts/
├── (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | .propel/context/prompts/intake-conversation-starter.md | System prompt with role definition |
| CREATE | .propel/context/prompts/intake-followup-generator.md | Follow-up question logic |
| CREATE | .propel/context/prompts/intake-data-extractor.md | Function calling schema |
| CREATE | .propel/context/prompts/intake-guardrails.json | Safety rules + validation |
| CREATE | .propel/context/prompts/intake-examples.md | Sample conversations |

## External References
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [Medical Interview Techniques](https://www.ncbi.nlm.nih.gov/books/NBK553/)
- [AIR-R03 Validation Accuracy >98%](../../../.propel/context/docs/spec.md#AIR-R03)
- [HIPAA PHI Guidelines](https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html)

## Build Commands
```bash
# No build required, but validate JSON
cd .propel/context/prompts
cat intake-guardrails.json | jq .  # Validate JSON syntax
```

## Implementation Validation Strategy
- [ ] Unit tests: Prompt loader replaces [firstName] placeholder correctly
- [ ] Integration tests: OpenAI conversation follows prompt structure
- [ ] All prompt files exist: ls .propel/context/prompts/intake-*
- [ ] JSON valid: intake-guardrails.json passes jq validation
- [ ] System prompt loaded: IntakeAIService logs "System prompt loaded"
- [ ] Placeholders replaced: [firstName] → actual patient name, [clinicName] → UPACI
- [ ] Greeting correct: First AI message "Hi John, I'll help gather your medical information today. What brings you in?"
- [ ] Follow-up logic: Chief complaint "fever" → asks duration "How long have you had the fever?"
- [ ] Data extraction: After conversation → extractedData has {chiefComplaint, medicalHistory, ...}
- [ ] Confidence scoring: Verify extractedData.confidence >= 0.98 (AIR-R03)
- [ ] Profanity filter: Send offensive message → AI responds professionally per guardrails
- [ ] Out-of-scope: Ask "What medication should I take?" → AI responds "I can only gather information, not provide medical advice"
- [ ] Emergency detection: Say "chest pain" + "severe" → AI responds "If this is an emergency, call 911 immediately"
- [ ] PII patterns: Guardrails JSON has SSN/insurance regex

## Implementation Checklist
- [ ] Create .propel/context/prompts/ directory if missing
- [ ] Write intake-conversation-starter.md with system prompt
- [ ] Write intake-followup-generator.md with question logic + examples
- [ ] Write intake-data-extractor.md with function calling schema
- [ ] Write intake-guardrails.json with safety rules
- [ ] Write intake-examples.md with sample conversations
- [ ] Test JSON validity: `cat intake-guardrails.json | jq .`
- [ ] Document prompt structure in .propel/README.md
