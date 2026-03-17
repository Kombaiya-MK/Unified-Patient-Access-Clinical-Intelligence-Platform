# Task - TASK_002_BE_OPENAI_CONVERSATION_API

## Requirement Reference
- User Story: US_025
- Story Location: `.propel/context/tasks/us_025/us_025.md`
- Acceptance Criteria:
    - AC2: AI validates patient response format, asks relevant follow-up questions, maintains context, <3s response latency (AIR-R01)
    - AC4: AI intake complete → validates all required fields (>98% accuracy AIR-R03) → saves to ClinicalDocuments
- Edge Cases:
    - PII handling: Redact SSN/insurance numbers before OpenAI (HIPAA NFR-003)
    - OpenAI API failure: Circuit breaker triggers → return error for frontend auto-switch
    - Context window overflow: Truncate old messages if >10K tokens (AIR-R02)

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
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | OpenAI SDK | 4.x |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 5.x (conversation history) |
| AI/ML | OpenAI GPT-4 Turbo | gpt-4-turbo-preview |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-001 (OpenAI integration), AIR-005 (PII redaction), AIR-006 (Data residency), AIR-007 (Human review), AIR-R01 (<3s latency), AIR-R02 (<10K tokens), AIR-R03 (>98% accuracy) |
| **AI Pattern** | Conversational intake with structured data extraction |
| **Prompt Template Path** | .propel/context/prompts/intake-conversation-starter.md, intake-followup-generator.md, intake-data-extractor.md |
| **Guardrails Config** | .propel/context/prompts/intake-guardrails.json (scope: medical only, profanity filter, PII detection) |
| **Model Provider** | OpenAI GPT-4 Turbo (gpt-4-turbo-preview) |

> **AI Integration Details:**
> - Model: gpt-4-turbo-preview (16K context, function calling support)
> - Temperature: 0.7 (balanced creativity + consistency)
> - Max tokens: 500 per response (prevents runaway generation)
> - Streaming: enabled for <3s first token latency
> - System prompt: Medical intake specialist, ask one question at a time, extract structured data
> - Function calling: extractIntakeData({ demographics, chiefComplaint, medicalHistory, ... })
> - PII redaction: Regex patterns before OpenAI (SSN: \d{3}-\d{2}-\d{4}, Insurance: \d{10,12})

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No (Backend API) |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement OpenAI-powered conversation API: (1) POST /api/intake/chat accepts {message, conversationId, patientId}, (2) Load conversation history from Redis (key: intake:{conversationId}), (3) Apply PII redaction middleware: replace SSN/insurance patterns with [REDACTED], (4) Call OpenAI GPT-4 Turbo with system prompt + conversation history + user message, (5) Stream response for <3s latency (AIR-R01), (6) Extract structured data using function calling: { category, field, value }, (7) Update IntakeSummary in Redis, (8) Return {aiResponse, extractedData, progress, conversationId}, (9) Store conversation in PostgreSQL after completion, (10) Handle circuit breaker on OpenAI failure (US_041).

## Dependent Tasks
- US_025 Task 003: AI prompt templates (conversation starter, follow-up, extraction)
- US_041: Circuit breaker pattern (fallback on OpenAI failure)

## Impacted Components
**New:**
- server/src/controllers/intake.controller.ts (Chat endpoint handler)
- server/src/routes/intake.routes.ts (POST /api/intake/chat)
- server/src/services/intake-ai.service.ts (OpenAI conversation logic)
- server/src/middleware/pii-redaction.middleware.ts (Redact SSN/insurance before OpenAI)
- server/src/utils/conversation-manager.ts (Redis conversation history)
- server/db/intake-conversations.sql (Store completed conversations)

## Implementation Plan
1. Install OpenAI SDK: npm install openai
2. Create PII redaction middleware: Regex patterns for SSN (\d{3}-\d{2}-\d{4}), insurance ID (\d{10,12}), credit card (\d{4}-\d{4}-\d{4}-\d{4})
3. Implement ConversationManager: Load/save history from Redis (TTL 24 hours), truncate if >10K tokens (AIR-R02)
4. Implement IntakeAIService.chat: Load history, apply redaction, call OpenAI with streaming, extract structured data via function calling
5. System prompt: "You are a medical intake specialist. Ask one question at a time. Be empathetic and professional. Extract structured data as you go."
6. Function calling schema: extractIntakeData with fields { demographics: {firstName, lastName, dob, phone, email}, chiefComplaint, medicalHistory, medications, allergies, surgeries, familyHistory }
7. POST /api/intake/chat route: verifyToken, requireRole('patient'), validate conversationId format
8. Response streaming: Use OpenAI streaming API, emit chunks via Server-Sent Events (SSE)
9. Error handling: Wrap OpenAI call in try-catch, return 503 on failure for circuit breaker
10. Test: Send "I have a fever" → AI asks follow-up "How long have you had the fever?" → extracts { chiefComplaint: "Fever" }

## Current Project State
```
ASSIGNMENT/server/src/
├── services/ (appointments, notifications exist)
└── (intake AI service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/intake.controller.ts | Chat endpoint handler |
| CREATE | server/src/routes/intake.routes.ts | POST /api/intake/chat |
| CREATE | server/src/services/intake-ai.service.ts | OpenAI conversation logic |
| CREATE | server/src/middleware/pii-redaction.middleware.ts | PII redaction before OpenAI |
| CREATE | server/src/utils/conversation-manager.ts | Redis conversation storage |
| CREATE | server/db/intake-conversations.sql | Conversation persistence table |
| UPDATE | server/package.json | Add openai SDK |
| UPDATE | server/.env.example | Add OPENAI_API_KEY |

## External References
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Streaming](https://platform.openai.com/docs/api-reference/streaming)
- [AIR-001 OpenAI Integration Requirements](../../../.propel/context/docs/spec.md#AIR-001)
- [AIR-005 PII Redaction](../../../.propel/context/docs/spec.md#AIR-005)

## Build Commands
```bash
cd server
npm install openai
npm run dev

# Test chat
curl -X POST http://localhost:3001/api/intake/chat \
  -H "Authorization: Bearer <token>" \
  -d '{
    "message": "I have a fever and cough",
    "conversationId": "conv-123"
  }' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: pii-redaction middleware redacts SSN patterns
- [ ] Integration tests: POST /intake/chat returns AI response <3s
- [ ] openai installed: package.json shows openai@4.x
- [ ] Chat endpoint protected: Try POST without auth → 401 Unauthorized
- [ ] AI responds: POST "I have a fever" → response "How long have you had the fever?"
- [ ] Response latency: Measure time to first token → verify <3s (AIR-R01)
- [ ] PII redacted: Include SSN in message → verify [REDACTED] before OpenAI call, log shows redaction
- [ ] Data extraction: Chat completes → extractedData has { chiefComplaint: "Fever and cough", duration: "3 days" }
- [ ] Conversation history: Send 5 messages → verify stored in Redis with key intake:{conversationId}
- [ ] Context window limit: Send 50 messages → verify old messages truncated to stay <10K tokens (AIR-R02)
- [ ] Function calling: AI uses extractIntakeData function → structure validated
- [ ] Circuit breaker: Simulate OpenAI failure → returns 503 for frontend fallback
- [ ] Audit logged: Query audit_logs → action_type='ai_chat', includes conversation_id

## Implementation Checklist
- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Add OPENAI_API_KEY to .env
- [ ] Create pii-redaction.middleware.ts with regex patterns
- [ ] Create conversation-manager.ts for Redis storage
- [ ] Implement intake-ai.service.ts with OpenAI streaming + function calling
- [ ] Create intake.controller.ts + intake.routes.ts
- [ ] Create intake-conversations.sql table
- [ ] Test chat conversation flow
- [ ] Validate PII redaction
- [ ] Measure response latency (<3s)
- [ ] Document AI intake API in server/README.md
