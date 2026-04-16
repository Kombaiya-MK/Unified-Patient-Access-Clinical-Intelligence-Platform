# Task - task_001_feature_flag_framework

## Requirement Reference
- User Story: US_049 - Feature Flags for AI Model Version Control
- Story Location: .propel/context/tasks/us_049/us_049.md
- Acceptance Criteria:
    - System implements feature flag framework using LaunchDarkly, ConfigCat, or custom Redis-based solution
    - System provides flag categories: AI Feature Toggles (boolean), AI Model Versions (string), AI Prompt Versions (string), User Segmentation (targeting)
    - System implements flag evaluation caching (Redis cache with 60s TTL) to reduce latency (<10ms evaluation time)
    - System logs all flag evaluations to audit log (flag name, user_id, evaluated value, timestamp) for compliance
    - System implements percentage rollouts (e.g., "Enable AI coding for 25% of users")
    - System supports immediate flag updates without app restart (flags polled every 30s or pushed via WebSocket)
- Edge Cases:
    - What happens when flag service is unavailable? (System uses last cached flag values, defaults to safe state - AI disabled if cache miss)
    - How are conflicting flags handled? (Flag hierarchy: User-specific > Department-specific > Global default)

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
| Library | ioredis | 5.x |
| Library | node-cache (in-memory fallback) | 5.x |
| Database | Redis (Upstash) | latest |
| Frontend | N/A | N/A |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement Redis-based feature flag framework for controlling AI features and model versions, with flag evaluation caching (60s TTL, <10ms latency), percentage rollouts, user/department/global targeting, audit logging, automatic fallbacks, and real-time flag updates without app restarts.

**Purpose**: Establish centralized feature flag infrastructure for progressive AI rollouts, A/B testing, and zero-downtime configuration changes.

**Capabilities**:
- Redis-based flag storage with hierarchical keys (user:*, department:*, global:*)
- Flag types: Boolean toggles, string model versions, percentage rollouts
- Flag evaluation with 3-tier caching: in-memory (60s) → Redis → default fallback
- User targeting: all users, specific roles, departments, beta testers, percentage (0-100%)
- Audit logging: all flag evaluations logged with flag_name, user_id, evaluated_value, timestamp
- Real-time updates: flags polled from Redis every 30 seconds
- Graceful degradation: cached values on Redis failure, safe defaults (AI disabled) on cache miss

## Dependent Tasks
- None (foundational infrastructure)

## Impacted Components
- **CREATE**: server/src/services/featureFlagService.ts (core flag evaluation service)
- **CREATE**: server/src/config/featureFlags.ts (flag definitions and default values)
- **CREATE**: server/src/middleware/featureFlagMiddleware.ts (Express middleware to inject flags into req.features)
- **CREATE**: server/src/routes/featureFlags.routes.ts (Admin API routes: GET/PUT flags, GET analytics)
- **CREATE**: server/src/controllers/featureFlagController.ts (Admin flag management controller)
- **MODIFY**: server/src/config/redis.ts (add flag-specific Redis client methods)
- **CREATE**: server/src/utils/flagEvaluator.ts (flag evaluation logic with targeting rules)
- **CREATE**: server/src/utils/percentageRollout.ts (deterministic user-to-percentage hash function)

## Implementation Plan

### Phase 1: Core Feature Flag Service (2.5 hours)
1. **Create featureFlagService.ts**:
   - Service class: `FeatureFlagService`
   - Methods:
     - `evaluateFlag(flagName, userId, context): Promise<any>` - Evaluate flag for user
     - `getAllFlags(): Promise<FlagConfig[]>` - Get all flag configurations
     - `updateFlag(flagName, config): Promise<void>` - Update flag configuration
     - `invalidateCache(flagName?): Promise<void>` - Clear cache for flag(s)
   - 3-tier caching: node-cache (60s in-memory) → Redis (persistent) → default fallback
   - Redis keys: `flag:global:{flagName}`, `flag:department:{deptId}:{flagName}`, `flag:user:{userId}:{flagName}`

2. **Create featureFlags.ts config**:
   - Flag definitions with defaults:
     ```typescript
     export const FLAG_DEFINITIONS = {
       ai_intake_enabled: { type: 'boolean', default: false, description: 'AI Conversational Intake' },
       ai_extraction_enabled: { type: 'boolean', default: false, description: 'AI Document Extraction' },
       ai_coding_enabled: { type: 'boolean', default: false, description: 'AI Medical Coding' },
       ai_conflicts_enabled: { type: 'boolean', default: false, description: 'AI Conflict Detection' },
       gpt_intake_model: { type: 'string', default: 'gpt-4-turbo', description: 'GPT Model for Intake' },
       gpt_vision_model: { type: 'string', default: 'gpt-4-vision-preview', description: 'GPT Vision Model' },
       medical_coding_prompt_version: { type: 'string', default: 'v1', description: 'Medical Coding Prompt Version' }
     };
     ```

### Phase 2: Flag Evaluation Logic with Targeting (2 hours)
3. **Create flagEvaluator.ts**:
   - Hierarchy evaluation: Check user-specific → department-specific → global flag
   - Targeting rules:
     - `target: "all"` - Return global flag value
     - `target: "beta_testers"` - Check if user.isBetaTester === true
     - `target: "department:cardiology"` - Check if user.department === "cardiology"
     - `target: "role:staff"` - Check if user.role === "staff"
     - `target: "percentage:25"` - Use percentage rollout (deterministic hash)
   - Return first match in hierarchy, otherwise return default from FLAG_DEFINITIONS

4. **Create percentageRollout.ts**:
   - Function: `isUserInPercentage(userId, percentage): boolean`
   - Hash user ID (MD5 or FNV-1a), convert to 0-100 range
   - Return true if hash < percentage (deterministic: same user always same result)
   - Example: User "abc123" hashes to 42, included if percentage >= 42

### Phase 3: Redis Integration & Caching (1.5 hours)
5. **Modify redis.ts config**:
   - Add methods:
     - `getFlagConfig(flagKey): Promise<FlagConfig | null>`
     - `setFlagConfig(flagKey, config, ttl?): Promise<void>`
     - `deleteFlagConfig(flagKey): Promise<void>`
     - `getFlagKeys(pattern): Promise<string[]>` - Get all flags matching pattern
   - TTL: Redis stores flags persistently, in-memory cache has 60s TTL

6. **Implement caching strategy**:
   - node-cache: 60-second in-memory cache per flag evaluation
   - Cache key: `flagEval:{flagName}:{userId}`
   - Cache miss → Query Redis hierarchy (user → department → global)
   - Redis miss → Return default from FLAG_DEFINITIONS
   - Cache invalidation: Clear on flag update via updateFlag()

### Phase 4: Audit Logging & Admin Routes (1.5 hours)
7. **Add flag evaluation audit logging**:
   - Log to audit_logs table (or separate feature_flag_audit table):
     - Columns: id, flag_name, user_id, evaluated_value, target_matched (which targeting rule matched), timestamp
   - Log on every flag evaluation (async, non-blocking)
   - Example: `{ flag_name: 'ai_intake_enabled', user_id: '123', evaluated_value: true, target_matched: 'department:cardiology', timestamp: '2026-03-19T10:00:00Z' }`

8. **Create featureFlags.routes.ts**:
   - Admin routes:
     - `GET /api/admin/feature-flags` - List all flags
     - `GET /api/admin/feature-flags/:flagName` - Get flag config
     - `PUT /api/admin/feature-flags/:flagName` - Update flag config
     - `POST /api/admin/feature-flags/:flagName/invalidate-cache` - Clear cache
     - `GET /api/admin/feature-flags/:flagName/analytics` - Get flag usage stats
   - Auth: Only admin users can access (middleware: `requireRole('admin')`)

### Phase 5: Real-time Flag Updates & Middleware (0.5 hours)
9. **Implement flag polling**:
   - Background job: Poll Redis every 30 seconds for flag updates
   - Compare Redis timestamp with local cache timestamp
   - Invalidate local cache if Redis version is newer
   - Alternative: Pub/Sub (Redis PUBLISH on flag update, backend SUBSCRIBEs and invalidates cache)

10. **Create featureFlagMiddleware.ts**:
    - Express middleware: Inject flags into `req.features`
    - Example usage in route: `if (req.features.ai_intake_enabled) { ... }`
    - Middleware evaluates flags lazily (only evaluate when accessed)
    - Attach `req.evaluateFlag(flagName)` helper function

## Current Project State
```
server/
  src/
    config/
      redis.ts (MODIFY - add flag-specific methods)
      featureFlags.ts (CREATE - flag definitions)
    services/
      featureFlagService.ts (CREATE - core service)
    utils/
      flagEvaluator.ts (CREATE - evaluation logic)
      percentageRollout.ts (CREATE - percentage hash)
    middleware/
      featureFlagMiddleware.ts (CREATE - Express middleware)
    routes/
      featureFlags.routes.ts (CREATE - Admin API routes)
    controllers/
      featureFlagController.ts (CREATE - Admin controller)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/featureFlagService.ts | Core flag service with evaluateFlag, updateFlag, getAllFlags, invalidateCache methods, 3-tier caching (memory → Redis → defaults) |
| CREATE | server/src/config/featureFlags.ts | Flag definitions with types (boolean, string), default values, descriptions for 7 AI flags |
| CREATE | server/src/utils/flagEvaluator.ts | Flag evaluation logic with targeting rules (all, beta_testers, department, role, percentage), hierarchy (user > dept > global) |
| CREATE | server/src/utils/percentageRollout.ts | Deterministic user-to-percentage hash function (MD5/FNV-1a) for percentage rollouts (0-100%) |
| MODIFY | server/src/config/redis.ts | Add Redis methods for flag storage (getFlagConfig, setFlagConfig, deleteFlagConfig, getFlagKeys with pattern matching) |
| CREATE | server/src/middleware/featureFlagMiddleware.ts | Express middleware to inject req.features and req.evaluateFlag helper for accessing flags in routes |
| CREATE | server/src/routes/featureFlags.routes.ts | Admin API routes (GET/PUT flags, POST invalidate-cache, GET analytics) with admin-only auth |
| CREATE | server/src/controllers/featureFlagController.ts | Admin controller with listFlags, getFlag, updateFlag, invalidateCache, getFlagAnalytics methods |

## External References
- **LaunchDarkly Architecture**: https://docs.launchdarkly.com/home/architecture (Feature flag best practices - use as reference for custom solution)
- **Redis Caching**: https://redis.io/docs/manual/patterns/cache/ (Cache-aside pattern implementation)
- **Feature Flag Patterns**: https://martinfowler.com/articles/feature-toggles.html (Martin Fowler's feature toggle guide)
- **Percentage Rollout**: https://github.com/facebook/flipper/blob/main/docs/features/percentage-rollout.md (Deterministic percentage allocation)
- **ioredis Documentation**: https://github.com/redis/ioredis (Redis client for Node.js)
- **node-cache**: https://www.npmjs.com/package/node-cache (In-memory caching with TTL)

## Build Commands
```bash
# Install dependencies
cd server
npm install ioredis node-cache

# Run TypeScript build
npm run build

# Test flag service
npm run test -- --testPathPattern=featureFlagService

# Start server with flags
npm run dev
```

## Implementation Validation Strategy
- [x] Unit tests pass (test flag evaluation with various targeting rules)
- [x] Integration tests pass (test Redis flag storage and cache invalidation)
- [x] Cache performance test: Measure flag evaluation latency (<10ms with cache, <50ms without cache)
- [x] Percentage rollout test: Verify deterministic hash (same user always gets same result)
- [x] Hierarchy test: Verify user-specific flag overrides department-specific, which overrides global
- [x] Fallback test: Stop Redis, verify system uses cached values, then defaults when cache expires
- [x] Audit logging test: Verify all flag evaluations logged to database with correct fields
- [x] Real-time update test: Update flag in Redis, verify backend picks up change within 30 seconds

## Implementation Checklist
- [x] Create featureFlagService with evaluateFlag (3-tier caching: memory 60s → Redis → defaults), updateFlag, getAllFlags, invalidateCache methods
- [x] Create featureFlags.ts with 7 AI flag definitions (ai_intake_enabled, ai_extraction_enabled, ai_coding_enabled, ai_conflicts_enabled, gpt_intake_model, gpt_vision_model, medical_coding_prompt_version) with types and defaults
- [x] Create flagEvaluator.ts with targeting rule evaluation (all, beta_testers, department, role, percentage) and hierarchy logic (user > department > global)
- [x] Create percentageRollout.ts with deterministic user hash function (MD5/FNV-1a) for percentage rollouts (0-100% allocation)
- [x] Modify redis.ts to add flag-specific methods (getFlagConfig, setFlagConfig, deleteFlagConfig, getFlagKeys pattern matching) with persistent storage
- [x] Create featureFlagMiddleware.ts to inject req.features and req.evaluateFlag() helper into Express routes for easy flag access
- [x] Create featureFlags.routes.ts with admin API routes (GET/PUT flags, POST invalidate-cache, GET analytics) protected by requireRole('admin') middleware
- [x] Implement flag evaluation audit logging (log flag_name, user_id, evaluated_value, target_matched, timestamp to audit table), real-time flag polling (Redis check every 30s, invalidate cache on change), and write unit/integration tests
