# Task - TASK_001: Backend OpenAI Integration Service with PII Redaction

## Requirement Reference
- User Story: [us_025]
- Story Location: [.propel/context/tasks/us_025/us_025.md]
- Acceptance Criteria:
    - AC2: AI validates response format, asks follow-up questions, <3s response latency
    - AC4: Validates required fields with >98% accuracy (AIR-R03)
- Edge Case:
    - EC3: Circuit breaker when OpenAI API fails
    - EC4: PII redaction before sending to OpenAI (HIPAA compliance NFR-003)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | AIR-R01 (Response latency <3s), AIR-R02 (Context <10K tokens) |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.18.x |
| Backend | TypeScript | 5.3.x |
| AI | OpenAI SDK | 4.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-001, AIR-005, AIR-006, AIR-R01, AIR-R02, AIR-R03 |
| **AI Pattern** | Conversational intake with context retention |
| **Prompt Template Path** | .propel/context/prompts/ai-intake-conversation.md (to be created) |
| **Guardrails Config** | PII redaction, inappropriate input filtering, medical context focus |
| **Model Provider** | OpenAI GPT-4 |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create OpenAI integration service with GPT-4 for conversational patient intake. Implement system prompt template for medical intake questions (chief complaint, symptoms, medical history, medications, allergies). Add PII redaction layer using regex patterns to mask SSN, credit cards, explicit patient identifiers before sending to OpenAI API (HIPAA compliance). Implement circuit breaker pattern with 3 failure threshold, 30-second timeout, fallback to manual form. Track conversation context with token counting (limit 10K tokens per AIR-R02). Extract structured data from conversations using JSON response format. Optimize for <3s response latency with streaming responses and caching.

## Dependent Tasks
- US-002: Backend API infrastructure
- US-041: Circuit breaker implementation (may create in this task if US-041 doesn't exist)
- NONE (first task for US_025, establishes AI foundation)

## Impacted Components
- **CREATE** server/src/services/openai/openAiService.ts - OpenAI API integration with streaming
- **CREATE** server/src/services/openai/piiRedactionService.ts - PII masking before API calls
- **CREATE** server/src/services/openai/conversationContextService.ts - Context management and token counting
- **CREATE** server/src/services/openai/circuitBreakerService.ts - Circuit breaker for API resilience
- **CREATE** server/src/config/openai.config.ts - OpenAI configuration (API key, model, temperature)
- **CREATE** server/src/types/aiIntake.types.ts - Conversation, Message, ExtractedData interfaces
- **CREATE** .propel/context/prompts/ai-intake-conversation.md - System prompt template

## Implementation Plan
1. **Create openai.config.ts**: Export config with OPENAI_API_KEY from env, model: 'gpt-4-turbo', temperature: 0.7, maxTokens: 1000, timeout: 3000ms (for <3s latency)
2. **Create aiIntake.types.ts**: Define ConversationMessage interface (role: 'system' | 'user' | 'assistant', content: string, timestamp: Date), ConversationContext interface (messages: ConversationMessage[], tokenCount: number, extractedData: Partial<IntakeData>), IntakeData interface with fields (chief_complaint, symptoms, medical_history, current_medications, allergies, etc.)
3. **Create piiRedactionService.ts**: Implement redactPII(text) function with regex patterns - SSN: \d{3}-\d{2}-\d{4}, credit card: \d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}, replace with [REDACTED_SSN], [REDACTED_CC], also redact explicit patient identifiers "my name is X" → "my name is [REDACTED]", use NLP library like compromise for name entity recognition
4. **Create conversationContextService.ts**: Implement addMessage(context, message), countTokens(messages) using tiktoken library for GPT-4 token counting, pruneContext(context) to trim old messages if >10K tokens, extractStructuredData(conversation) using OpenAI function calling to extract IntakeData fields
5. **Create circuitBreakerService.ts**: Implement CircuitBreaker class with states (CLOSED, OPEN, HALF_OPEN), track failureCount, lastFailureTime, threshold: 3 failures triggers OPEN, timeout: 30s before HALF_OPEN, wrap OpenAI API calls with breaker.execute(fn)
6. **Create openAiService.ts**: Implement sendMessage(conversationContext, userMessage) - add userMessage to context, call piiRedactionService.redactPII, build messages array with system prompt + conversation history, call OpenAI Chat Completions API with streaming (stream: true), handle streaming response chunks, extract structured data using function calling, return assistant response + updated context
7. **Create ai-intake-conversation.md prompt**: System prompt defining AI as medical intake assistant, instructions for asking follow-up questions, validation rules (e.g., numeric for age, date format for DOB), JSON schema for structured data extraction, guardrails (refuse non-medical questions, handle inappropriate input professionally)
8. **Add Error Handling**: Catch OpenAI API errors (rate limit, timeout, auth), increment circuit breaker failure count, return fallback message "AI temporarily unavailable", log errors with correlation ID for debugging

**Focus on how to implement**: OpenAI SDK: `import OpenAI from 'openai'`. Stream responses: `const stream = await openai.chat.completions.create({ messages, stream: true })`. Token counting: `import { encoding_for_model } from 'tiktoken'`. PII redaction runs BEFORE API call to prevent PHI exposure. Circuit breaker wraps all OpenAI calls: `await circuitBreaker.execute(() => openai.chat.completions.create(...))`. Function calling for data extraction: include `functions` parameter with JSON schema for IntakeData. Response format: `{ response_format: { type: 'json_object' } }` for structured extraction. Context pruning: keep last 20 messages or 10K tokens, whichever is less. System prompt emphasizes medical context focus and professional tone.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   └── openai/
│   │       └── (openAiService.ts, piiRedactionService.ts, etc. to be created)
│   ├── config/
│   │   └── (openai.config.ts to be created)
│   ├── types/
│   │   └── (aiIntake.types.ts to be created)
│   └── app.ts
├── .env (needs OPENAI_API_KEY)
└── package.json (needs: openai@^4.0.0, tiktoken@^1.0.0)
.propel/
└── context/
    └── prompts/
        └── (ai-intake-conversation.md to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/openai/openAiService.ts | Main OpenAI integration with streaming, message handling, response parsing |
| CREATE | server/src/services/openai/piiRedactionService.ts | PII redaction with regex patterns and NLP entity recognition |
| CREATE | server/src/services/openai/conversationContextService.ts | Context management, token counting with tiktoken, data extraction |
| CREATE | server/src/services/openai/circuitBreakerService.ts | Circuit breaker pattern for API resilience |
| CREATE | server/src/config/openai.config.ts | OpenAI configuration with API key, model settings, timeout |
| CREATE | server/src/types/aiIntake.types.ts | TypeScript interfaces for conversations and extracted data |
| CREATE | .propel/context/prompts/ai-intake-conversation.md | System prompt template for medical intake conversation |
| MODIFY | server/.env | Add OPENAI_API_KEY=sk-... environment variable |
| MODIFY | server/package.json | Add dependencies: openai@^4.0.0, tiktoken@^1.0.0 |

## External References
- **OpenAI Node SDK**: https://github.com/openai/openai-node - Official SDK v4.x
- **OpenAI Streaming**: https://platform.openai.com/docs/api-reference/streaming - Stream completions API
- **OpenAI Function Calling**: https://platform.openai.com/docs/guides/function-calling - Structured data extraction
- **Tiktoken**: https://github.com/openai/tiktoken - Token counting for GPT models
- **Circuit Breaker Pattern**: https://martinfowler.com/bliki/CircuitBreaker.html - Resilience pattern
- **HIPAA PHI De-identification**: https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html - Safe Harbor method
- **PII Redaction Regex**: https://regex101.com/ - Test regex patterns for SSN, CC, etc.

## Build Commands
- Install dependencies: `npm install openai@^4.0.0 tiktoken@^1.0.0` (in server directory)
- Set API key: Add `OPENAI_API_KEY=sk-...` to server/.env file
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (unit tests for OpenAI service, PII redaction)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for piiRedactionService (SSN, credit card, name redaction)
- [x] Unit tests pass for conversationContextService (token counting, context pruning)
- [x] Unit tests pass for circuitBreakerService (state transitions, failure threshold)
- [x] Integration test: Send message to OpenAI, receive response within 3s
- [x] Integration test: PII redacted before API call (check logs for [REDACTED] markers)
- [x] Integration test: Circuit breaker opens after 3 consecutive failures
- [x] Integration test: Token count stays under 10K limit with pruning
- [x] Load test: 50 concurrent conversations maintain <3s response latency p95
- [x] Security test: Verify no PHI sent to OpenAI (log all API calls in test mode)

## Implementation Checklist
- [ ] Add OPENAI_API_KEY to server/.env file
- [ ] Install dependencies: npm install openai@^4.0.0 tiktoken@^1.0.0 (in server directory)
- [ ] Create openai.config.ts (export config object with apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4-turbo', temperature: 0.7, maxTokens: 1000, timeout: 3000, organizationId if needed)
- [ ] Create aiIntake.types.ts (export interfaces: ConversationMessage with role/content/timestamp, ConversationContext with messages/tokenCount/extractedData, IntakeData with chief_complaint/symptoms/medical_history/current_medications/allergies/pain_level/duration/previous_treatments)
- [ ] Create piiRedactionService.ts (redactPII function with regex: SSN \d{3}-\d{2}-\d{4}, credit card \d{16}, phone \d{10}, replace with [REDACTED_TYPE], use compromise library for name entity extraction and redaction, export redactPII(text: string): string)
- [ ] Create conversationContextService.ts (addMessage to append to context.messages, countTokens using encoding_for_model('gpt-4').encode(text).length, pruneContext to keep last 20 messages or <10K tokens, extractStructuredData parses IntakeData from AI responses)
- [ ] Create circuitBreakerService.ts (CircuitBreaker class with state: 'CLOSED' | 'OPEN' | 'HALF_OPEN', failureThreshold: 3, timeout: 30000ms, execute<T>(fn: () => Promise<T>) method wraps async calls, increment failures on error, open circuit on threshold, reset on success in HALF_OPEN)
- [ ] Create openAiService.ts (OpenAI client initialization, sendMessage function: accepts context and userMessage, calls piiRedactionService.redactPII(userMessage), builds messages array with system prompt + context.messages, calls openai.chat.completions.create with stream:true wrapped in circuitBreaker.execute, processes stream chunks, updates context, returns {response: string, updatedContext: ConversationContext})
- [ ] Create .propel/context/prompts/ai-intake-conversation.md (system prompt: "You are a medical intake assistant...ask one question at a time...validate responses...extract structured data in JSON format...respond professionally to inappropriate input...focus on: chief complaint, symptoms onset/duration, severity 1-10, medical history, current medications, allergies")
- [ ] Add function calling schema for IntakeData extraction (define functions parameter with JSON schema matching IntakeData interface for structured extraction)
