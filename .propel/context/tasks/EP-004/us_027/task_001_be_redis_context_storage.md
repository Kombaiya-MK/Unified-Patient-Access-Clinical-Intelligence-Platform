# Task - TASK_001: Backend Redis Context Storage and Token Management

## Requirement Reference
- User Story: [us_027]
- Story Location: [.propel/context/tasks/us_027/us_027.md]
- Acceptance Criteria:
    - AC1: Maintain conversation context in session with last 10 exchanges stored in Redis, <10K tokens total
    - AC1: Use context to avoid re-asking questions
- Edge Case:
    - EC1: When conversation exceeds 10K token limit, summarize older messages, keep critical medical info

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | AIR-R02 (Context <10K tokens) |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.18.x |
| Backend | Redis | 7.x |
| Backend | TypeScript | 5.3.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes (context management for AI conversations) |
| **AIR Requirements** | AIR-006, AIR-R02 |
| **AI Pattern** | Session-based context retention |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | Token limit enforcement, context pruning |
| **Model Provider** | N/A (storage layer) |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create Redis-based conversation context storage service for AI intake sessions. Store last 10 message exchanges per conversation with session key pattern `intake:context:{conversation_id}`. Implement token counting using tiktoken library to enforce <10K token limit per AIR-R02. When token limit exceeded, implement intelligent summarization: keep last 5 exchanges verbatim, summarize older exchanges extracting critical medical info (chief complaint, medications, allergies, medical history), store summarized version. Context includes: message history, extracted data fields (to avoid re-asking), validation flags. Set TTL 24 hours for session expiration. Integrate with existing conversationContextService from US_025 TASK_001.

## Dependent Tasks
- US-004: Redis infrastructure setup
- US-025 TASK_001: Backend OpenAI Integration (conversationContextService to enhance)
- US-025 TASK_002: Backend AI Intake API (conversation management)

## Impacted Components
- **CREATE** server/src/services/redis/redisContextService.ts - Redis context storage and retrieval
- **MODIFY** server/src/services/openai/conversationContextService.ts - Integrate Redis storage
- **CREATE** server/src/services/contextSummarizationService.ts - Summarize old messages when token limit exceeded
- **CREATE** server/src/config/redis.config.ts - Redis connection configuration
- **MODIFY** server/src/types/aiIntake.types.ts - Add RedisConversationContext interface
- **MODIFY** server/package.json - Add redis client dependency

## Implementation Plan
1. **Create redis.config.ts**: Export Redis client config with REDIS_URL from env (default: redis://localhost:6379), connection options (retry strategy, max retries: 3, timeout: 5000ms), handle connection errors gracefully
2. **Create redisContextService.ts**: Implement saveContext(conversationId, context) - serialize ConversationContext to JSON, SET key `intake:context:{conversationId}` with value and EX 86400 (24 hour TTL), returns success boolean; implement getContext(conversationId) - GET key, deserialize JSON to ConversationContext, returns context or null if not found; implement deleteContext(conversationId) - DEL key
3. **Create contextSummarizationService.ts**: Implement summarizeContext(context: ConversationContext) - if tokenCount > 10000, keep last 5 message exchanges verbatim, for older messages extract critical medical info using regex/NLP (medications names, allergies, chief complaint, dates), create summary message "Previous conversation summary: Patient reported [chief complaint], allergies to [list], currently taking [medications], symptoms started [date]", replace old messages with summary, recalculate token count, return summarized context
4. **Modify conversationContextService.ts**: Add saveToRedis after each addMessage call, load context from Redis on first message if exists (getContext), if Redis fails fallback to in-memory context (resilience), integrate summarization check: if tokenCount > 10000 call contextSummarizationService.summarizeContext
5. **Modify aiIntake.types.ts**: Add RedisConversationContext interface (conversation_id, messages, extracted_data, token_count, last_updated, summary_generated: boolean)
6. **Add Context Deduplication**: Before asking question, check extractedData in context - if field already filled (e.g., chief_complaint exists), skip that question and proceed to next section
7. **Add Critical Info Tagging**: Tag messages containing critical medical info (medications, allergies, chronic conditions) with flag `is_critical: true`, ensure critical messages never pruned during summarization
8. **Add Context Metrics**: Track context access patterns (hit rate, average token count, summarization frequency) for monitoring

**Focus on how to implement**: Redis client initialization: `import { createClient } from 'redis'; const client = createClient({ url: process.env.REDIS_URL })`. Key pattern for namespacing: `intake:context:${conversationId}`. Serialization: `JSON.stringify(context)` before storing. TTL in SET command: `await client.set(key, value, { EX: 86400 })`. Token counting uses tiktoken from US_025: `encoding.encode(message).length`. Summarization uses OpenAI API with prompt "Summarize the following medical conversation, extracting key facts: [messages]" or local NLP. Context check in system prompt: "Patient has already mentioned: ${Object.entries(extractedData).map(([k,v]) => `${k}: ${v}`).join(', ')}. Do not ask about these again.". Fallback on Redis failure: catch error, log warning, continue with in-memory context.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── openai/
│   │   │   └── conversationContextService.ts (US_025 TASK_001, to be modified)
│   │   ├── redis/
│   │   │   └── (redisContextService.ts to be created)
│   │   └── (contextSummarizationService.ts to be created)
│   ├── config/
│   │   └── (redis.config.ts to be created)
│   ├── types/
│   │   └── aiIntake.types.ts (US_025, to be modified)
│   └── app.ts
├── .env (needs REDIS_URL)
└── package.json (needs: redis@^4.6.0)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/redis/redisContextService.ts | Redis CRUD operations for conversation context with 24h TTL |
| CREATE | server/src/services/contextSummarizationService.ts | Intelligent summarization when token limit exceeded, preserve critical medical info |
| CREATE | server/src/config/redis.config.ts | Redis client configuration with connection handling |
| MODIFY | server/src/services/openai/conversationContextService.ts | Integrate Redis storage, load/save context, check for duplicate questions |
| MODIFY | server/src/types/aiIntake.types.ts | Add RedisConversationContext interface |
| MODIFY | server/.env | Add REDIS_URL=redis://localhost:6379 environment variable |
| MODIFY | server/package.json | Add dependency: redis@^4.6.0 |

## External References
- **Redis Node Client**: https://github.com/redis/node-redis - Official Redis client v4.x
- **Redis SET with TTL**: https://redis.io/commands/set/ - SET key value EX seconds
- **Tiktoken**: https://github.com/openai/tiktoken - Token counting for GPT models
- **Context Window Management**: https://platform.openai.com/docs/guides/chat - Managing conversation context
- **Redis Best Practices**: https://redis.io/docs/manual/patterns/ - Key naming patterns

## Build Commands
- Install dependencies: `npm install redis@^4.6.0` (in server directory)
- Set Redis URL: Add `REDIS_URL=redis://localhost:6379` to server/.env file
- Start Redis: `docker run -d -p 6379:6379 redis:7-alpine` (if not installed)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (unit tests for context storage and summarization)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for redisContextService (save, get, delete operations)
- [x] Unit tests pass for contextSummarizationService (token counting, summarization)
- [x] Integration test: Save context to Redis, retrieve after 1 minute, verify data intact
- [x] Integration test: Context with >10K tokens triggers summarization, critical info preserved
- [x] Integration test: Duplicate question avoided when field exists in extractedData
- [x] Integration test: Redis connection failure falls back to in-memory context
- [x] Integration test: Context expires after 24 hours (TTL verification)
- [x] Load test: 100 concurrent context saves/retrievals complete within 500ms p95

## Implementation Checklist
- [ ] Add REDIS_URL to server/.env file (redis://localhost:6379)
- [ ] Install dependencies: npm install redis@^4.6.0 (in server directory)
- [ ] Create redis.config.ts (export Redis client: createClient with url from env, socket options: connectTimeout 5000, retry strategy with max 3 retries, handle error events, export connected client)
- [ ] Create redisContextService.ts (saveContext: await redis.set(`intake:context:${conversationId}`, JSON.stringify(context), {EX: 86400}); getContext: const data = await redis.get(key), return data ? JSON.parse(data) : null; deleteContext: await redis.del(key); export {saveContext, getContext, deleteContext})
- [ ] Modify aiIntake.types.ts (add RedisConversationContext interface with conversation_id, messages array, extracted_data object, token_count number, last_updated Date, summary_generated boolean, critical_info_tags string[])
- [ ] Create contextSummarizationService.ts (summarizeContext function: if tokenCount > 10000, keep last 5 exchanges, extract critical info from older messages using regex for medications/allergies/dates, create summary message, replace old messages with summary, recalculate tokens with tiktoken, mark critical messages with is_critical flag so they're never pruned)
- [ ] Modify conversationContextService.ts addMessage method (after adding message: calculate token count, if >10K call summarizeContext, call redisContextService.saveContext, on error log warning and continue with in-memory)
- [ ] Modify conversationContextService.ts to load from Redis (create loadContext method: call redisContextService.getContext, if exists return it, else initialize new context)
- [ ] Add duplicate question detection (in OpenAI system prompt builder: check context.extractedData, if field populated add instruction "Patient already provided: [field]: [value]. Skip this question.", modify AI prompt to respect this)
- [ ] Add critical info tagging (when parsing AI response, if message contains medication/allergy/chronic condition keywords, set message.is_critical = true, filter critical messages during summarization to preserve them)
