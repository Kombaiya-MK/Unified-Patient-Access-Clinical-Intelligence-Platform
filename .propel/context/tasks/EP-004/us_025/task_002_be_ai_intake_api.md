# Task - TASK_002: Backend AI Intake API Endpoints with Conversation Management

## Requirement Reference
- User Story: [us_025]
- Story Location: [.propel/context/tasks/us_025/us_025.md]
- Acceptance Criteria:
    - AC1: AI greets patient by name, asks for chief complaint as first question
    - AC2: Patient types response, AI validates and asks follow-ups, <3s latency
    - AC4: Submit intake validates required fields, saves to ClinicalDocuments table, notifies staff
- Edge Case:
    - EC1: AI asks clarifying questions for ambiguous responses
    - EC2: AI handles inappropriate input professionally, logs incident

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | AIR-R01 (Response <3s), AIR-R06 (Context retention) |
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
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-001, AIR-005, AIR-006, AIR-007 |
| **AI Pattern** | REST API for conversational intake |
| **Prompt Template Path** | .propel/context/prompts/ai-intake-conversation.md (from TASK_001) |
| **Guardrails Config** | Input sanitization, inappropriate content logging |
| **Model Provider** | OpenAI GPT-4 |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create REST API endpoints for AI-assisted patient intake conversation. POST /api/intake/ai/start initializes conversation with patient context (appointment_id, patient_name) and returns greeting message with first question (chief complaint). POST /api/intake/ai/message accepts user message, calls OpenAI service, returns AI response with updated conversation context and real-time data summary. POST /api/intake/ai/submit validates extracted data (>98% accuracy check), inserts into ClinicalDocuments table with conversation_history JSON column, sends notification to assigned staff, returns confirmation. GET /api/intake/ai/conversation/:id retrieves conversation history for context retention across sessions (AIR-006).

## Dependent Tasks
- TASK_001: Backend OpenAI Integration Service (provides openAiService for AI calls)
- US_003: Database with ClinicalDocuments table
- US_026: Manual intake form schema (for data structure compatibility)

## Impacted Components
- **CREATE** database/migrations/V017__add_conversation_history.sql - Add conversation_history JSONB column to clinical_documents table
- **CREATE** server/src/routes/aiIntakeRoutes.ts - AI intake REST endpoints
- **CREATE** server/src/controllers/aiIntakeController.ts - startConversation(), sendMessage(), submitIntake(), getConversation() controllers
- **CREATE** server/src/services/aiIntakeService.ts - Business logic for conversation management and data validation
- **MODIFY** server/src/services/notificationService.ts - Add notifyStaffIntakeComplete() method (or create if doesn't exist)
- **MODIFY** server/src/types/aiIntake.types.ts - Add API request/response types
- **MODIFY** server/src/app.ts - Register aiIntakeRoutes

## Implementation Plan
1. **Create V017__add_conversation_history.sql**: ALTER TABLE clinical_documents ADD COLUMN conversation_history JSONB NULL, ADD COLUMN intake_mode VARCHAR(20) DEFAULT 'manual' CHECK (intake_mode IN ('manual', 'ai', 'hybrid')), ADD COLUMN ai_validation_score DECIMAL(5,2) CHECK (ai_validation_score >= 0 AND ai_validation_score <= 100), CREATE INDEX idx_clinical_docs_intake_mode ON clinical_documents(intake_mode)
2. **Modify aiIntake.types.ts**: Add StartConversationRequest (appointment_id, patient_id), StartConversationResponse (conversation_id, greeting_message, first_question), SendMessageRequest (conversation_id, user_message), SendMessageResponse (ai_response, conversation_context, extracted_data_summary), SubmitIntakeRequest (conversation_id, final_data), SubmitIntakeResponse (document_id, validation_score, message)
3. **Create aiIntakeService.ts**: Implement startConversation(patientId, appointmentId) - fetch patient name from DB, initialize conversation context with system prompt greeting "Hello [FirstName], I'm here to help with your intake. What brings you in today?", save conversation to conversations table (temp storage), return greeting + first question
4. **Create aiIntakeService.ts message handling**: Implement processMessage(conversationId, userMessage) - load conversation context from DB, sanitize input (check for inappropriate content), call openAiService.sendMessage(context, userMessage), update conversation in DB with new messages, extract structured data from AI response, return AI response + data summary
5. **Create aiIntakeService.ts submission**: Implement submitIntake(conversationId, finalData?) - load conversation, validate extracted data completeness (check all required fields: chief_complaint, symptoms, medical_history present), calculate validation score based on field completeness and format accuracy, INSERT INTO clinical_documents with conversation_history JSON, intake_mode='ai', ai_validation_score, call notificationService.notifyStaffIntakeComplete(assignedStaffId), return document_id + score
6. **Create aiIntakeController.ts**: Implement startConversation(req, res) - extract patientId from req.user or req.params, call aiIntakeService.startConversation, return 201 with StartConversationResponse; sendMessage(req, res) - validate body with express-validator, call aiIntakeService.processMessage, return 200 with SendMessageResponse, handle 400 (inappropriate input), 503 (circuit breaker open); submitIntake(req, res) - call aiIntakeService.submitIntake, return 201, handle 422 (validation failed)
7. **Create aiIntakeRoutes.ts**: Define POST /start with authenticate middleware, POST /message with authenticate, POST /submit with authenticate, GET /conversation/:id with authenticate, map to controller methods
8. **Modify notificationService.ts**: Add notifyStaffIntakeComplete(staffId, patientName, documentId) - send in-app notification or email to assigned staff member about completed intake

**Focus on how to implement**: Conversation storage: temporary table `conversations` with columns (id, patient_id, appointment_id, messages JSONB, extracted_data JSONB, created_at, updated_at). Greeting personalization: `SELECT first_name FROM patients WHERE id = ?`. Data validation scoring: count filled required fields / total required fields * 100. Inappropriate content detection: simple keyword filter or use OpenAI moderation endpoint before processing. Context retention: load conversation from DB on each /message call. Data summary: extract fields from conversation context.extractedData and format as human-readable JSON. Circuit breaker fallback: if OpenAI service throws, return 503 with fallback message. Token limit enforcement: if context > 10K tokens, return 422 "Please switch to manual form, conversation is too long".

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   └── (aiIntakeRoutes.ts to be created)
│   ├── controllers/
│   │   └── (aiIntakeController.ts to be created)
│   ├── services/
│   │   ├── openai/
│   │   │   └── openAiService.ts (TASK_001)
│   │   ├── (aiIntakeService.ts to be created)
│   │   └── (notificationService.ts to be created or modified)
│   ├── types/
│   │   └── aiIntake.types.ts (TASK_001, to be modified)
│   └── app.ts (to be modified)
database/
└── migrations/
    ├── V001__create_core_tables.sql
    ├── V003__create_clinical_tables.sql (has clinical_documents table)
    └── (V017__add_conversation_history.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V017__add_conversation_history.sql | Add conversation_history JSONB, intake_mode, ai_validation_score columns to clinical_documents |
| CREATE | server/src/routes/aiIntakeRoutes.ts | POST /start, POST /message, POST /submit, GET /conversation/:id routes |
| CREATE | server/src/controllers/aiIntakeController.ts | startConversation(), sendMessage(), submitIntake(), getConversation() handlers |
| CREATE | server/src/services/aiIntakeService.ts | Conversation management, data extraction validation, submission logic |
| MODIFY | server/src/services/notificationService.ts | Add notifyStaffIntakeComplete() for staff alerts |
| MODIFY | server/src/types/aiIntake.types.ts | Add API request/response interfaces |
| MODIFY | server/src/app.ts | Register /api/intake/ai routes |
| CREATE | database/migrations/V018__create_conversations_table.sql | Temporary conversation storage table (optional, for persistence) |

## External References
- **Express Validation**: https://express-validator.github.io/docs/ - Input sanitization and validation
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/15/datatype-json.html - JSON storage and querying
- **OpenAI Moderation**: https://platform.openai.com/docs/guides/moderation - Content filtering API
- **REST API Best Practices**: https://restfulapi.net/ - RESTful endpoint design
- **HIPAA Audit Logging**: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html - Compliance requirements

## Build Commands
- Run migration: `.\database\scripts\run_migrations.ps1` (applies V017, V018)
- Install dependencies: `npm install` (in server directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (integration tests for AI intake API)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Migration V017 runs successfully, clinical_documents has new columns
- [x] Integration test: POST /api/intake/ai/start returns greeting with patient name
- [x] Integration test: POST /api/intake/ai/message processes user input, returns AI response within 3s
- [x] Integration test: Data summary updates in real-time as conversation progresses
- [x] Integration test: POST /api/intake/ai/submit saves to clinical_documents with conversation_history
- [x] Integration test: Inappropriate input logged but handled professionally by AI
- [x] Integration test: Circuit breaker open returns 503 with fallback message
- [x] Integration test: Validation score >98% for complete conversations
- [x] Load test: 20 concurrent conversations maintain <3s response time p95

## Implementation Checklist
- [ ] Create V017__add_conversation_history.sql migration (ALTER TABLE clinical_documents ADD conversation_history JSONB, intake_mode VARCHAR(20) DEFAULT 'manual' CHECK IN ('manual', 'ai', 'hybrid'), ai_validation_score DECIMAL(5,2) CHECK 0-100, index on intake_mode)
- [ ] Create V018__create_conversations_table.sql (optional: CREATE TABLE conversations with id UUID PRIMARY KEY, patient_id UUID FK, appointment_id UUID FK, messages JSONB, extracted_data JSONB, token_count INT, created_at, updated_at with indexes)
- [ ] Run migrations using .\database\scripts\run_migrations.ps1
- [ ] Modify aiIntake.types.ts (add StartConversationRequest/Response, SendMessageRequest/Response, SubmitIntakeRequest/Response interfaces)
- [ ] Create aiIntakeService.ts startConversation method (SELECT patient.first_name, initialize conversation context with greeting, INSERT into conversations table, return {conversation_id, greeting_message: `Hello ${firstName}, I'm here to help...`, first_question: `What brings you in today?`})
- [ ] Create aiIntakeService.ts processMessage method (SELECT conversation FROM conversations WHERE id=?, append user message, call openAiService.sendMessage with context, UPDATE conversation with AI response, extract structured data to extracted_data JSONB, return {ai_response, conversation_context, extracted_data_summary})
- [ ] Create aiIntakeService.ts submitIntake method (SELECT conversation, validate extracted_data has required fields, calculate validation_score = (filled_fields / required_fields) * 100, INSERT INTO clinical_documents with conversation_history=messages, intake_mode='ai', ai_validation_score, call notificationService, return {document_id, validation_score, message})
- [ ] Create aiIntakeController.ts with 4 handlers (startConversation: get patientId from req.user, call service, res.status(201).json; sendMessage: validate body, call service, handle 503 circuit breaker; submitIntake: call service, handle 422 validation; getConversation: SELECT from conversations, return messages)
- [ ] Create aiIntakeRoutes.ts (express.Router(), POST /start, POST /message, POST /submit, GET /conversation/:id, all with authenticate middleware, map to controller methods)
- [ ] Modify or create notificationService.ts (notifyStaffIntakeComplete function: get assigned_staff_id from appointment, send email/push notification "Patient intake completed by AI")
- [ ] Modify app.ts (import aiIntakeRoutes, app.use('/api/intake/ai', aiIntakeRoutes))
