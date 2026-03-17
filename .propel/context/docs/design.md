# Architecture Design

## Project Overview
The Unified Patient Access & Clinical Intelligence Platform is a healthcare solution that bridges patient appointment booking and clinical data management. It provides role-specific interfaces for Patients, Staff (front desk/call center), and Admins to manage appointments, intake processes, document uploads, and clinical data extraction. The platform integrates AI-assisted capabilities for conversational intake, document extraction, and medical coding while maintaining HIPAA compliance and comprehensive audit logging. Target users include healthcare providers (clinics/hospitals) aiming to reduce no-show rates, streamline clinical preparation, and improve operational efficiency through unified booking and clinical intelligence workflows.

## Architecture Goals
- **Goal 1**: Ensure HIPAA-compliant, secure, and auditable healthcare data processing with role-based access control and immutable logging
- **Goal 2**: Achieve 99.9% uptime with reliable session management and automated failover capabilities
- **Goal 3**: Enable zero-cost infrastructure leveraging open-source and free hosting platforms (Netlify/Vercel/GitHub Codespaces)
- **Goal 4**: Support hybrid AI-human workflows for intake, document extraction, and medical coding with transparency and fallback mechanisms
- **Goal 5**: Provide seamless integration with free calendar APIs (Google/Outlook) and maintain sub-3-second response times for core booking flows

## Non-Functional Requirements
- NFR-001: System MUST maintain 99.9% uptime with automated monitoring via Prometheus/Grafana and sub-15-minute incident response
- NFR-002: System MUST support concurrent access for 500+ users with response times <3 seconds for booking workflows and <5 seconds for AI-assisted features
- NFR-003: System MUST be 100% HIPAA-compliant with end-to-end encryption (HTTPS, at-rest encryption for PostgreSQL), OAuth2/JWT authentication, and PII redaction in logs
- NFR-004: System MUST enforce role-based access control (RBAC) with Patient, Staff, and Admin roles, blocking unauthorized feature access and logging all access attempts
- NFR-005: System MUST log all user actions immutably to audit tables with minimum 7-year retention for compliance audits
- NFR-006: System MUST deploy on Windows Services/IIS with native .NET interoperability and support zero-downtime deployments
- NFR-007: System MUST use only free/open-source hosting (Netlify, Vercel, GitHub Codespaces) with no AWS/Azure paid services
- NFR-008: System MUST implement 15-minute automatic session timeout with secure session token invalidation
- NFR-009: System MUST support graceful degradation when AI services are unavailable, routing users to manual workflows within 500ms
- NFR-010: System MUST handle peak load of 10,000 appointments/day with PostgreSQL query optimization and Redis caching (cache hit ratio >80%)

**Note**: All requirements trace to spec.md functional and non-functional requirements.

## Data Requirements
- DR-001: System MUST store patient records with unique patient_id (UUID), email (unique), phone, demographics, and medical_history fields
- DR-002: System MUST enforce referential integrity between Appointments, Patients, Staff, and TimeSlots tables with cascade delete policies
- DR-003: System MUST maintain appointment history with immutable audit fields (created_at, created_by, updated_at, updated_by, status_change_log)
- DR-004: System MUST store uploaded documents with metadata (file_type, upload_timestamp, extracted_data_json, extraction_status) and link to patient_id
- DR-005: System MUST implement daily incremental backups with 7-day retention and point-in-time recovery (PITR) capability via PostgreSQL WAL archiving
- DR-006: System MUST version database schemas using migration tools (e.g., Flyway, Liquibase) with rollback support for zero-downtime upgrades
- DR-007: System MUST separate PII data (patient names, emails, SSN) into encrypted tables with field-level encryption keys rotated quarterly
- DR-008: System MUST store AI-generated content (intake responses, extracted fields, ICD-10/CPT codes) with confidence scores, source citations, and human_reviewed flags
- DR-009: System MUST enforce data retention policies: audit logs (7 years), appointment history (5 years), temporary AI prompts (90 days post-review)
- DR-010: System MUST deduplicate patient profiles using fuzzy matching on name+DOB+phone with manual review queue for conflicts

**Note**: All data requirements align with HIPAA, audit compliance, and AI traceability needs.

### Domain Entities
- **Patient**: Represents a patient with demographics (name, DOB, contact), medical history, insurance info, and linked appointment/document records. Unique identifier: patient_id (UUID). Relationships: 1-to-many Appointments, 1-to-many Documents, 1-to-1 InsuranceRecord.
- **Appointment**: Represents a scheduled or past appointment with fields: appointment_id, patient_id (FK), staff_id (FK), timeslot_id (FK), status (scheduled/completed/cancelled/no-show), booking_channel (patient_web/staff_desk/phone), risk_score (0-100 from no-show assessment), reminder_sent_at, pdf_sent_at. Relationships: many-to-1 Patient, many-to-1 Staff, many-to-1 TimeSlot.
- **User**: Represents system users (Patient, Staff, Admin) with fields: user_id, email (unique), password_hash, role (enum: patient/staff/admin), active_status, last_login_at, session_token. Relationships: 1-to-1 Patient (if role=patient), audit log entries.
- **Document**: Represents uploaded clinical documents with fields: document_id, patient_id (FK), file_path, file_type (PDF/JPEG/PNG), upload_timestamp, extraction_status (pending/in_progress/completed/failed), extracted_data (JSONB with structured fields from AI extraction). Relationships: many-to-1 Patient.
- **AuditLog**: Immutable audit trail with fields: log_id, user_id (FK), action (login/book_appointment/cancel/mark_no_show/etc), timestamp, ip_address, request_payload, response_status. No delete operations allowed. Indexed on user_id and timestamp for compliance queries.
- **TimeSlot**: Represents available appointment slots with fields: timeslot_id, staff_id (FK), start_time, end_time, status (available/booked/blocked), max_concurrent_appointments. Relationships: many-to-1 Staff, 1-to-many Appointments.
- **WaitlistEntry**: Represents patients waiting for preferred slots with fields: waitlist_id, patient_id (FK), preferred_date, preferred_time_range, priority (1-5), auto_swap_enabled (boolean). Relationships: many-to-1 Patient.
- **MedicalCode**: Stores ICD-10 and CPT codes extracted from clinical data with fields: code_id, patient_id (FK), code_type (ICD10/CPT), code_value, description, confidence_score (0-1), source_document_id (FK nullable), ai_generated (boolean), staff_reviewed (boolean). Relationships: many-to-1 Patient, many-to-1 Document (optional).

## AI Consideration

**Status:** Applicable

**Rationale:** Spec.md contains 5 AI-tagged requirements (3 `[AI-CANDIDATE]`, 2 `[HYBRID]`). Features include AI-assisted conversational intake (FR-004), document data extraction (FR-006), unified patient profile with conflict detection (FR-007), medical coding (FR-008), and medication conflict highlighting (FR-016). AI components are integral to clinical intelligence workflows.

## AI Requirements
- AIR-001: System MUST generate conversational intake responses using GPT-4 with retrieval-augmented generation (RAG) over patient intake templates, achieving >= 95% response relevance and providing source citations for each suggested field
- AIR-002: System MUST extract structured patient data (demographics, medications, allergies, lab results, medical history) from uploaded PDF/image clinical documents using OpenAI GPT-4 Vision or Azure Document Intelligence with >= 90% field-level accuracy
- AIR-003: System MUST map aggregated patient clinical data to ICD-10 (diagnosis) and CPT (procedure) codes using fine-tuned classification models or GPT-4 with few-shot prompting, achieving >= 85% code accuracy and attaching confidence scores (0-1) to each code
- AIR-004: System MUST detect medication conflicts by combining AI entity recognition (extract drug names from unstructured text) with deterministic rule-based validation against DrugBank/FDA databases, flagging interactions with severity scores (low/medium/high/critical)
- AIR-005: System MUST fallback to manual intake forms when AI conversational service returns HTTP 5xx errors or response latency exceeds 10 seconds, logging the fallback event for monitoring
- AIR-006: System MUST redact PII (names, SSNs, phone numbers, emails) from all prompts sent to external AI models using regex + NER preprocessing, logging original and redacted versions separately
- AIR-007: System MUST log all AI prompts and responses (including model version, timestamp, user_id) to audit tables with 90-day retention for quality review and compliance investigations
- AIR-Q01: System MUST maintain hallucination rate below 5% on clinical data extraction tasks, validated via monthly auditor reviews of 100 randomly sampled extractions
- AIR-Q02: System MUST achieve p95 latency <7 seconds for AI-assisted intake responses and <15 seconds for document extraction workflows (full document processing)
- AIR-Q03: System MUST enforce output schema validity >= 95% for extracted structured data (JSON schema validation) with automatic retry on malformed responses
- AIR-S01: System MUST enforce document ACL filtering in RAG retrieval pipelines, ensuring patients see only their own documents and staff see documents within their assigned scope
- AIR-S02: System MUST implement circuit breaker pattern for AI model provider failures (3 failures in 60 seconds triggers 5-minute cooldown, routes to manual workflows)
- AIR-S03: System MUST limit token budget to 4096 tokens per conversational intake session and 8192 tokens per document extraction request, with warnings at 80% usage
- AIR-O01: System MUST support model version rollback within 15 minutes via feature flags (e.g., GPT-4 → GPT-3.5-turbo) when quality degradation is detected
- AIR-O02: System MUST cache frequently asked intake questions and responses in Redis with 24-hour TTL to reduce AI API costs by >= 30%
- AIR-R01: System MUST chunk uploaded clinical documents into 512-token segments with 20% overlap for embedding and RAG retrieval workflows
- AIR-R02: System MUST retrieve top-5 document chunks with cosine similarity >= 0.75 for conversational intake context augmentation
- AIR-R03: System MUST re-rank retrieved chunks using semantic similarity or maximal marginal relevance (MMR) to reduce redundancy in RAG context

**Note:** Each AIR traces to spec.md functional requirements (FR-004, FR-006, FR-007, FR-008, FR-016) and NFR-003 (HIPAA compliance).

### AI Architecture Pattern
**Selected Pattern:** Hybrid (RAG + Tool Calling)

**Rationale:** 
- **RAG Pattern**: Conversational intake (AIR-001) requires retrieval from patient intake templates and clinical document context. Document extraction workflows benefit from RAG over historical extraction examples to improve field identification accuracy.
- **Tool Calling Pattern**: Medical coding (AIR-003) requires structured API calls to code databases (ICD-10/CPT lookup). Medication conflict detection (AIR-004) uses tool-based queries to DrugBank/FDA APIs for interaction validation.
- **Hybrid Justification**: Complex clinical workflows require both context augmentation (RAG for document understanding) and system integration (tool calling for code validation, drug interaction checks). Separation of concerns: RAG for unstructured clinical text understanding, tools for deterministic validation against authoritative databases.

**Pattern Components:**
1. **RAG Pipeline**: Ingest clinical documents → chunk with 512 tokens + 20% overlap → embed with text-embedding-ada-002 → store in pgvector → retrieve top-5 chunks (similarity >= 0.75) → augment GPT-4 prompts for extraction/intake
2. **Tool Calling**: Define tools for `lookup_icd10_code(description)`, `lookup_cpt_code(procedure)`, `check_drug_interaction(drug_list)` → GPT-4 invokes tools during medical coding and conflict detection → deterministic validation via external APIs → return results to model for final response generation

## Architecture and Design Decisions
- **Decision 1: Hybrid AI-Human Workflow Architecture**: All AI features (intake, extraction, coding) include manual fallback options. Patients can switch between AI conversational intake and manual forms mid-session (FR-004). Staff review and approve all AI-extracted data before clinic visits (FR-006, FR-007). Rationale: HIPAA compliance requires human oversight for clinical decisions; AI augments but does not replace clinical judgment.
- **Decision 2: Separation of PII and Clinical Data Storage**: Patient PII (names, emails, SSN) stored in encrypted `patients_pii` table with field-level encryption. Clinical data (medical history, medications) stored in separate `clinical_records` table with patient_id FK. Audit logs store only patient_id, not PII. Rationale: Minimize blast radius of data breaches; simplify HIPAA audit scope; enable selective data export for patient data requests (GDPR-style).
- **Decision 3: Immutable Audit Logging with Event Sourcing**: All state-changing operations (book_appointment, cancel, mark_no_show, update_profile) append events to immutable `audit_log` table with no UPDATE/DELETE operations. Current state derived from event replay. Rationale: HIPAA requires complete audit trails (7-year retention); event sourcing enables point-in-time reconstruction for compliance investigations and dispute resolution.
- **Decision 4: Redis Caching Layer for Slot Availability**: Cache available time slots per staff member with 5-minute TTL in Redis. Booking requests check cache → PostgreSQL on cache miss. Invalidate cache on slot status change (book/cancel). Rationale: Reduce database load for high-frequency slot availability queries (NFR-010); enable sub-second response times for booking UI (NFR-002).
- **Decision 5: Circuit Breaker Pattern for AI Service Resilience**: Implement circuit breaker (3 failures in 60s → 5-min cooldown) for OpenAI API calls. On circuit open, route users to manual workflows with notification banner. Rationale: Prevent cascading failures when AI provider is degraded (NFR-009); maintain platform availability even when AI features fail.
- **Decision 6: Windows Services/IIS Deployment with Node.js Backend**: Deploy Node.js Express backend as Windows Service using tools like node-windows or PM2. IIS reverse proxy handles SSL termination and load balancing. Rationale: Meets Windows Services/IIS deployment constraint (NFR-006) while preserving Node.js ecosystem benefits (spec.md Technology Stack).
- **Decision 7: Feature Flags for AI Model Version Control**: Use feature flag service (e.g., LaunchDarkly free tier, Unleash self-hosted) to control AI model versions (GPT-4 vs GPT-3.5-turbo) and RAG pipeline configurations. Enable instant rollback without code deployment. Rationale: Support AIR-O01 requirement for 15-minute rollback; enable A/B testing of model performance; reduce risk of quality regressions.
- **Decision 8: pgvector for Vector Storage**: Use PostgreSQL pgvector extension for storing document embeddings (768-dim vectors from text-embedding-ada-002). Enables unified database for structured data + vector search. Rationale: Eliminates external vector database cost (NFR-007 free hosting constraint); simplifies deployment; sufficient for document collection size (<10K documents projected).
- **Decision 9: Queue-Based Document Processing**: Upload documents → push to Redis queue (Bull/BullMQ) → background worker processes extraction (GPT-4 Vision) → update document status. UI polls status endpoint every 5 seconds. Rationale: Document extraction is async (10-30 seconds per document); decouples upload from processing; prevents UI blocking; enables horizontal scaling of workers.
- **Decision 10: Calendar Sync via Free APIs with OAuth2**: Integrate Google Calendar API and Microsoft Outlook API using OAuth2 device flow (PKCE) for patient authorization. Store refresh tokens encrypted in database. Poll calendar events hourly for availability updates. Rationale: Meets free API constraint (spec.md); PKCE flow avoids client secrets in frontend; hourly polling sufficient for calendar sync use case (not real-time critical).

## Technology Stack
| Layer | Technology | Version | Justification (NFR/DR/AIR) |
|-------|------------|---------|----------------------------|
| Frontend | React (or Vue/Angular) | 18.x (latest) | NFR-002 (responsive UI for <3s booking), NFR-004 (role-based dashboards), spec.md confirmed |
| Mobile | N/A | - | Out of scope per spec.md |
| Backend | Node.js (Express) | 20.x LTS | NFR-002 (async I/O for high concurrency), NFR-006 (Windows Service deployment via node-windows), spec.md confirmed |
| Database | PostgreSQL + pgvector | 15.x + 0.5.x | DR-001 to DR-010 (relational data integrity), AIR-R01 (vector storage for RAG), NFR-007 (free/open-source) |
| Caching | Upstash Redis | latest | NFR-002 (sub-second slot availability), NFR-010 (cache hit ratio >80%), spec.md confirmed |
| AI/ML | OpenAI API (GPT-4, text-embedding-ada-002) | latest | AIR-001 to AIR-003 (conversational intake, document extraction, medical coding), spec.md confirmed |
| Vector Store | pgvector (PostgreSQL extension) | 0.5.x | AIR-R01 to AIR-R03 (RAG document chunk retrieval), NFR-007 (no external paid vector DB) |
| AI Gateway | Custom Node.js middleware | - | AIR-006 (PII redaction), AIR-S02 (circuit breaker), AIR-O02 (Redis caching), AIR-007 (audit logging) |
| Testing | Jest (backend), React Testing Library (frontend) | latest | NFR-004 (RBAC test coverage), AIR-Q03 (schema validation tests), spec.md confirmed |
| Infrastructure | Netlify (frontend), GitHub Codespaces (dev), Windows Services/IIS (backend prod) | latest | NFR-007 (free hosting), NFR-006 (Windows deployment), spec.md confirmed |
| Security | OAuth2 (Auth0 free tier), JWT, bcrypt, HTTPS (Let's Encrypt) | latest | NFR-003 (HIPAA OAuth2 auth), NFR-004 (role-based access), NFR-008 (session management) |
| Deployment | PM2 or node-windows (Windows Service), IIS reverse proxy | latest | NFR-006 (Windows Services/IIS), NFR-001 (zero-downtime with PM2 cluster mode) |
| Monitoring | Prometheus + Grafana (self-hosted) | latest | NFR-001 (99.9% uptime monitoring), AIR-Q02 (AI latency dashboards), spec.md confirmed |
| Documentation | Markdown, PlantUML (diagrams) | latest | NFR-004 (RBAC documentation), spec.md confirmed |

**Note:** All technology choices trace to NFR/DR/AIR requirements. Free/open-source constraint (NFR-007) eliminates AWS/Azure paid services. Windows Services/IIS deployment (NFR-006) requires Node.js Windows Service wrappers.

### Alternative Technology Options
- **Database Alternative: MySQL 8.x** - Considered for relational data. **Not selected** because pgvector extension for PostgreSQL enables unified vector + relational storage (AIR-R01), eliminating need for separate vector database and reducing operational complexity. PostgreSQL also better HIPAA compliance tooling (audit extensions).
- **Backend Alternative: .NET Core 8** - Native Windows Services integration, strong Azure ecosystem. **Not selected** because spec.md explicitly lists Node.js as preferred (Technology Stack section), and team expertise assumption favors Node.js. However, .NET Core remains viable alternative if Windows-native performance is critical.
- **AI Provider Alternative: Azure OpenAI** - HIPAA Business Associate Agreement (BAA) available, data residency options. **Not selected** because Azure OpenAI requires paid Azure subscription (conflicts with NFR-007 free hosting constraint). OpenAI API with custom PII redaction layer (AIR-006) achieves HIPAA compliance without paid infrastructure.
- **Vector Store Alternative: Pinecone Free Tier** - Managed vector database with 1M vectors free. **Not selected** because pgvector collocated with PostgreSQL reduces network hops (lower latency), simplifies deployment (one DB vs two services), and avoids vendor lock-in. Document collection size (<10K documents, ~50K chunks) well within pgvector scale limits.
- **Caching Alternative: Memcached** - Simpler than Redis, lower memory footprint. **Not selected** because Redis data structures (sorted sets for waitlist priority, pub/sub for real-time notifications) enable richer features. Redis also supports persistence for cache recovery after restarts. Upstash Redis free tier (10K commands/day) sufficient for project scale.

### AI Component Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| Model Provider | OpenAI API (GPT-4, GPT-3.5-turbo) | LLM inference for conversational intake, document extraction, medical coding |
| Embedding Model | text-embedding-ada-002 (OpenAI) | Convert document chunks to 1536-dim vectors for RAG retrieval |
| Vector Store | pgvector (PostgreSQL extension) | Store and query document embeddings (cosine similarity search) |
| AI Gateway | Custom Node.js middleware | PII redaction (AIR-006), circuit breaker (AIR-S02), token budget enforcement (AIR-S03), audit logging (AIR-007) |
| Document Processing | GPT-4 Vision (OpenAI) | Extract structured data from PDF/image clinical documents (AIR-002) |
| Schema Validation | Zod + JSON Schema | Enforce output structure for AI-extracted data (AIR-Q03 >= 95% validity) |
| Guardrails | Custom NER + regex | PII detection and redaction before model invocation (AIR-S01) |
| Tool Integration | OpenAI Function Calling | Invoke `lookup_icd10_code`, `lookup_cpt_code`, `check_drug_interaction` tools during medical coding (AIR-003, AIR-004) |

### Technology Decision
| Metric (from NFR/DR/AIR) | PostgreSQL + pgvector | MySQL 8.x + Separate Vector DB | Rationale |
|--------------------------|----------------------|--------------------------------|-----------|
| NFR-007 (Free hosting) | 10/10 (fully open-source, no paid services) | 8/10 (MySQL free, but Pinecone free tier limits) | PostgreSQL + pgvector eliminates external vector DB cost |
| DR-002 (Referential integrity) | 10/10 (mature FK constraints, triggers) | 10/10 (equivalent FK support) | Tie |
| AIR-R01 to AIR-R03 (Vector operations) | 9/10 (pgvector cosine search, <50ms for 10K vectors) | 10/10 (Pinecone optimized for vectors, <20ms) | pgvector sufficient for project scale (<10K documents) |
| NFR-001 (Operational complexity) | 10/10 (single DB deployment, fewer network hops) | 7/10 (manage two services: MySQL + Pinecone) | Simpler ops with unified storage |
| **Total Weighted Score** | **39/40** | **35/40** | PostgreSQL + pgvector wins on cost, simplicity, and adequate performance |

| Metric (from NFR/DR/AIR) | Node.js (Express) | .NET Core 8 | Rationale |
|--------------------------|------------------|-------------|-----------|
| NFR-006 (Windows deployment) | 8/10 (requires node-windows wrapper) | 10/10 (native Windows Service) | .NET has native edge, but Node.js viable with tooling |
| NFR-002 (Async concurrency) | 10/10 (event loop optimized for I/O) | 9/10 (async/await support, but heavier threads) | Node.js excels at high-concurrency I/O |
| Spec.md Technology Stack | 10/10 (explicitly listed as preferred) | 5/10 (not mentioned in spec.md) | Spec alignment favors Node.js |
| Team expertise assumption | 9/10 (JavaScript ecosystem ubiquity) | 7/10 (requires C# proficiency) | Node.js more accessible |
| **Total Weighted Score** | **37/40** | **31/40** | Node.js wins on spec alignment and async performance |

## Technical Requirements
- TR-001: System MUST use PostgreSQL 15+ as the primary relational database with pgvector extension for vector storage (justification: DR-001 to DR-010 for data integrity + AIR-R01 for RAG retrieval + NFR-007 for free hosting)
- TR-002: System MUST use Node.js 20.x LTS with Express framework for backend API services (justification: NFR-002 for async I/O concurrency + NFR-006 for Windows Service deployment via node-windows + spec.md Technology Stack)
- TR-003: System MUST deploy backend as Windows Service using PM2 or node-windows with IIS reverse proxy for SSL termination (justification: NFR-006 Windows Services/IIS constraint + NFR-001 for zero-downtime with PM2 cluster mode)
- TR-004: System MUST implement RESTful API architecture with JSON responses, versioned endpoints (/api/v1/...), and OpenAPI 3.0 documentation (justification: NFR-002 for <3s response times + maintainability + spec.md best practices)
- TR-005: System MUST use Upstash Redis for caching time slot availability, session tokens, and AI response caching (justification: NFR-002 for sub-second queries + NFR-010 for >80% cache hit ratio + AIR-O02 for cost reduction)
- TR-006: System MUST integrate OpenAI API (GPT-4, text-embedding-ada-002) via HTTPS with API key authentication and custom AI Gateway middleware (justification: AIR-001 to AIR-003 for AI features + AIR-006 for PII redaction + AIR-007 for audit logging)
- TR-007: System MUST implement OAuth2 authentication using Auth0 free tier or self-hosted OAuth server (e.g., Keycloak) with JWT token-based session management (justification: NFR-003 for HIPAA-compliant auth + NFR-004 for RBAC + NFR-008 for 15-minute session timeout)
- TR-008: System MUST enforce HTTPS for all client-server communication using Let's Encrypt SSL certificates (justification: NFR-003 for HIPAA in-transit encryption)
- TR-009: System MUST use React 18.x (or Vue 3/Angular 15+) for frontend with role-based routing and lazy-loaded modules (justification: NFR-002 for responsive UI + NFR-004 for dashboard personalization + spec.md Technology Stack)
- TR-010: System MUST deploy frontend as static site on Netlify or Vercel with CDN for global low-latency access (justification: NFR-007 for free hosting + NFR-002 for <3s page loads)
- TR-011: System MUST implement background job queue using Bull/BullMQ on Redis for asynchronous document processing (justification: AIR-002 for document extraction + NFR-010 for high throughput without blocking)
- TR-012: System MUST use Jest for backend unit tests (>80% coverage) and React Testing Library for frontend component tests (justification: NFR-004 for RBAC test validation + AIR-Q03 for schema validation tests)
- TR-013: System MUST implement Prometheus metrics exporters (Node.js prom-client) and visualize in self-hosted Grafana dashboards (justification: NFR-001 for 99.9% uptime monitoring + AIR-Q02 for AI latency tracking + spec.md)
- TR-014: System MUST containerize backend services using Docker with docker-compose for local development and Windows Services for production (justification: NFR-006 for Windows deployment + developer environment consistency)
- TR-015: System MUST implement circuit breaker pattern (e.g., opossum library) for OpenAI API calls with 3-failure threshold and 5-minute cooldown (justification: AIR-S02 for AI resilience + NFR-009 for graceful degradation)
- TR-016: System MUST use Zod or JSON Schema for runtime validation of AI-extracted data structures (justification: AIR-Q03 for >= 95% schema validity + data integrity)
- TR-017: System MUST implement feature flags using LaunchDarkly free tier or self-hosted Unleash for AI model version control (justification: AIR-O01 for 15-minute rollback + A/B testing capability)
- TR-018: System MUST integrate Google Calendar API and Microsoft Outlook API using OAuth2 device flow (PKCE) for secure calendar sync (justification: spec.md In-Scope calendar integration + NFR-007 for free APIs)
- TR-019: System MUST use PlantUML or Mermaid for architecture diagrams embedded in Markdown documentation (justification: spec.md Documentation layer + maintainability)
- TR-020: System MUST implement disaster recovery with RTO (Recovery Time Objective) = 1 hour and RPO (Recovery Point Objective) = 1 hour for database backups, requiring automated hourly PostgreSQL backups with validated restore procedures (justification: NFR-001 for 99.9% uptime + business continuity requirements)

**Note**: Each TR traces to NFR/DR/AIR requirements. TR-020 disaster recovery targets set to 1-hour RTO/RPO to balance data protection with operational feasibility.

## Technical Constraints & Assumptions
- **Constraint 1**: No paid cloud infrastructure (AWS, Azure, GCP) allowed. All hosting must use free tiers of Netlify, Vercel, GitHub Codespaces, or self-hosted open-source solutions (per spec.md Out-of-Scope and NFR-007).
- **Constraint 2**: Backend must deploy on Windows Services/IIS. This requires Node.js to run as Windows Service using wrappers like PM2, node-windows, or nssm (per spec.md Constraints and NFR-006).
- **Constraint 3**: Database must be PostgreSQL with no paid managed services. Deployment options: self-hosted on Windows Server, free-tier Heroku Postgres (deprecated), or Supabase free tier (10GB limit). Assumption: self-hosted PostgreSQL on same VM as backend.
- **Constraint 4**: AI features must use OpenAI API (GPT-4, embeddings) but cannot use Azure OpenAI due to paid subscription requirement. Custom PII redaction layer required for HIPAA compliance since OpenAI standard API does not sign BAA (per spec.md Technology Stack and AIR-006).
- **Constraint 5**: No patient self-check-in via mobile app, web portal, or QR code. All check-ins must be staff-controlled (per spec.md Out-of-Scope and FR-013). This simplifies frontend by removing patient-facing check-in UI.
- **Constraint 6**: Calendar sync limited to free Google Calendar API and Microsoft Outlook API. No paid calendar middleware (e.g., Nylas, Cronofy). OAuth2 device flow (PKCE) required for secure patient authorization without client secrets in frontend.
- **Constraint 7**: Insurance pre-check uses internal dummy records only (no real-time insurance provider API integration). Assumption: pre-loaded CSV/JSON of sample insurance plans for validation logic (per spec.md In-Scope).
- **Assumption 1**: Team has JavaScript/TypeScript proficiency. Node.js backend and React frontend align with spec.md Technology Stack, implying existing team expertise.
- **Assumption 2**: Concurrent user target: 500 users (not explicitly stated in spec.md). Derived from "high volume" mention in NFR and typical clinic size (10-20 staff, 100-200 daily appointments → 500 peak concurrent users reasonable).
- **Assumption 3**: Document storage volume: <10,000 clinical documents over 5 years (~2,000/year, ~5/day). Justifies pgvector over external vector DB (scale limit ~100K vectors for sub-50ms queries).
- **Assumption 4**: AI model budget: $500/month for OpenAI API calls. Based on projected usage: 100 intake sessions/day × $0.03/session + 50 document extractions/day × $0.10/extraction = ~$200/month, with 2.5x buffer for spikes.
- **Assumption 5**: No provider-facing features. Providers are assumed external to the system; staff act as intermediaries for provider schedules. This simplifies role hierarchy to Patient-Staff-Admin (per spec.md Out-of-Scope).
- **Assumption 6**: Uptime measurement excludes planned maintenance windows. 99.9% uptime = max 43.2 minutes unplanned downtime/month. Planned maintenance communicated 48 hours in advance (per NFR-001 interpretation).

## Development Workflow

1. **Environment Setup & Initialization**
   - Clone repository and install dependencies (`npm install` for backend/frontend)
   - Configure environment variables: `.env` files for PostgreSQL connection strings, Redis URL, OpenAI API key, Auth0 client secrets
   - Run database migrations: `npx prisma migrate dev` or Flyway scripts to initialize schema (patients, appointments, users, audit_log, documents tables)
   - Seed database with test data: sample patients, time slots, staff users, admin account
   - Start local development servers: backend on `localhost:3000` (Node.js Express), frontend on `localhost:3001` (React dev server with Vite/CRA)
   - Verify pgvector extension installed: `CREATE EXTENSION vector;` in PostgreSQL

2. **Backend API Development (Node.js + Express)**
   - Implement RESTful endpoints following spec.md functional requirements:
     - `/api/v1/auth/login` (POST) - OAuth2 authentication, return JWT token (NFR-004, NFR-008, TR-007)
     - `/api/v1/appointments` (GET/POST) - List/create appointments with RBAC checks (FR-001, NFR-004)
     - `/api/v1/appointments/:id/cancel` (PUT) - Cancel appointment with no-show risk update (FR-001, FR-017)
     - `/api/v1/documents` (POST) - Upload document, push to Bull queue for async extraction (FR-006, TR-011)
     - `/api/v1/intake/ai` (POST) - AI-assisted conversational intake via OpenAI GPT-4 (FR-004, AIR-001)
     - `/api/v1/intake/manual` (POST) - Manual form submission (FR-004)
     - `/api/v1/medical-codes` (GET) - Retrieve ICD-10/CPT codes for patient (FR-008, AIR-003)
   - Implement AI Gateway middleware:
     - PII redaction layer: regex + NER to strip sensitive data before OpenAI API calls (AIR-006)
     - Circuit breaker: track failures, open circuit after 3 errors in 60s (AIR-S02, TR-015)
     - Token budget enforcement: count tokens in prompts, reject if exceeds 4096 (AIR-S03)
     - Audit logging: log all prompts/responses to `ai_audit_log` table (AIR-007)
   - Integrate Redis caching:
     - Cache time slot availability (5-minute TTL) in `slots:staff:<staff_id>` keys (TR-005)
     - Cache AI responses for frequent intake questions (24-hour TTL) (AIR-O02)
     - Store session tokens with 15-minute TTL (NFR-008)
   - Implement background workers (Bull/BullMQ):
     - Document extraction worker: fetch from queue → call GPT-4 Vision → validate with Zod → save to `documents.extracted_data` (AIR-002, AIR-Q03)
     - No-show risk assessment worker: nightly batch job to compute risk scores using rule-based model (FR-014)
   - Write unit tests with Jest: >80% coverage for API routes, middleware, and business logic (TR-012)

3. **Frontend Development (React + Role-Based Dashboards)**
   - Implement role-based routing:
     - `/admin/*` routes: User management, audit log viewer (FR-015, UC-006)
     - `/staff/*` routes: Queue management, walk-in booking, appointment list (FR-005, UC-007)
     - `/patient/*` routes: Book appointment, upload documents, AI/manual intake, dashboard (FR-001, FR-004, FR-018, UC-012)
   - Build reusable components:
     - `<AppointmentCalendar>`: Time slot grid with availability indicators (FR-001)
     - `<AIIntakeChat>`: Conversational UI for AI-assisted intake with fallback toggle (FR-004)
     - `<DocumentUploadZone>`: Drag-and-drop with progress tracking and status polling (FR-006)
     - `<RoleBasedNav>`: Sidebar navigation that adapts to user role (NFR-004)
   - Integrate authentication:
     - OAuth2 login flow (redirect to Auth0 or custom OAuth server) (TR-007)
     - Store JWT token in httpOnly cookie or localStorage (NFR-008 session management)
     - Implement route guards to block unauthorized role access (NFR-004 RBAC)
   - Implement responsive design: mobile-first CSS with breakpoints (desktop 1440px, tablet 768px, mobile 375px) (NFR-002)
   - Write component tests with React Testing Library: test role-based rendering, form submissions, API error handling (TR-012)

4. **Database Schema & Migrations**
   - Design normalized schema following domain entities in DR section:
     - `users` table: user_id (PK), email (unique), password_hash, role (enum), active_status
     - `patients` table: patient_id (PK, UUID), user_id (FK), name, dob, phone, medical_history (JSONB)
     - `appointments` table: appointment_id (PK), patient_id (FK), staff_id (FK), timeslot_id (FK), status (enum), risk_score, created_at
     - `audit_log` table: log_id (PK), user_id (FK), action (enum), timestamp, request_payload (JSONB), ip_address (no UPDATE/DELETE triggers)
     - `documents` table: document_id (PK), patient_id (FK), file_path, extraction_status (enum), extracted_data (JSONB), embeddings (vector(1536))
     - `medical_codes` table: code_id (PK), patient_id (FK), code_type (enum), code_value, confidence_score, ai_generated (boolean)
   - Create pgvector index: `CREATE INDEX idx_document_embeddings ON documents USING ivfflat (embeddings vector_cosine_ops);` (AIR-R02)
   - Implement foreign key constraints with cascade policies: e.g., `ON DELETE CASCADE` for appointments when patient deleted (DR-002)
   - Write migration scripts with Prisma/Flyway: version control all schema changes (DR-006)
   - Configure daily backups with pg_dump: scheduled cron job, 7-day retention (DR-005)

5. **AI Pipeline Integration**
   - Implement RAG pipeline for conversational intake:
     - Ingest intake templates: chunk into 512-token segments with 20% overlap (AIR-R01)
     - Generate embeddings: call `text-embedding-ada-002` API → store 1536-dim vectors in pgvector (AIR-R01)
     - Retrieval: on intake query, embed question → cosine similarity search → retrieve top-5 chunks with similarity >= 0.75 (AIR-R02)
     - Augmented generation: append retrieved chunks to GPT-4 prompt → generate response with citations (AIR-001)
   - Implement document extraction workflow:
     - Patient uploads PDF/image → save to `/uploads` folder → push `{document_id, file_path}` to Bull queue (TR-011)
     - Worker: fetch document → encode to base64 → call GPT-4 Vision with extraction prompt → parse JSON response → validate with Zod schema (AIR-Q03)
     - On validation failure: retry once with clarifying prompt, then mark `extraction_status = 'failed'` (AIR-002)
     - Save extracted data: `UPDATE documents SET extracted_data = ? WHERE document_id = ?` (AIR-002)
   - Implement medical coding tool:
     - Define OpenAI function calling tool: `lookup_icd10_code(description: string) -> {code: string, description: string}`
     - Tool implementation: query ICD-10 CSV or API → return top match
     - GPT-4 invokes tool during medical coding workflow: "Patient has hypertension" → tool returns {"code": "I10", "description": "Essential hypertension"} → GPT-4 confirms code (AIR-003)
   - Implement medication conflict detection:
     - Extract drug names from clinical notes using NER (spaCy or GPT-4)
     - Call DrugBank API or FDA interaction database with drug list
     - Combine AI-extracted drugs + deterministic interaction rules → flag conflicts with severity (AIR-004)
   - Add fallback logic: catch OpenAI API errors (HTTP 5xx, timeouts >10s) → log fallback event → redirect user to manual form (AIR-005)

6. **Security & Compliance Hardening**
   - Implement HIPAA-compliant encryption:
     - Enable TLS 1.3 for PostgreSQL connections (`sslmode=require` in connection string) (NFR-003)
     - Encrypt documents at rest using filesystem-level encryption (BitLocker on Windows) (NFR-003)
     - Encrypt PII columns in database using `pg_crypto` extension (DR-007)
   - Implement RBAC middleware:
     - Check JWT `role` claim on every API request (NFR-004)
     - Endpoint permissions: e.g., `/api/v1/admin/*` requires `role=admin`, return 403 for unauthorized roles (NFR-004)
     - Log all access attempts (authorized + denied) to `audit_log` (NFR-005)
   - Configure session management:
     - JWT expiration: 15 minutes (NFR-008)
     - Refresh token pattern: store refresh token in httpOnly cookie (30-day expiration), rotate on every refresh (NFR-008)
     - Session revocation: maintain Redis set of revoked tokens (add on logout)
   - Implement input validation:
     - Validate all API inputs with express-validator or Joi (prevent SQL injection, XSS) (NFR-003)
     - Sanitize file uploads: check MIME type, scan for viruses with ClamAV (optional), limit size to 10MB (NFR-003)
   - Audit table immutability:
     - Create database trigger to block UPDATE/DELETE on `audit_log` table (NFR-005)
     - Partition audit_log by year for query performance and archival (DR-009)

7. **Deployment & Infrastructure Setup**
   - **Backend Deployment (Windows Services + IIS)**:
     - Install Node.js 20 LTS on Windows Server
     - Use PM2 or node-windows to create Windows Service: `pm2 start app.js --name "patient-platform-api"` → `pm2 save` → `pm2 startup` (TR-003)
     - Configure IIS as reverse proxy: install URL Rewrite module → create inbound rule to forward `https://api.example.com/*` to `http://localhost:3000/*` (NFR-006)
     - Configure SSL certificate: obtain Let's Encrypt cert via Certbot → bind to IIS site (TR-008)
     - Enable PM2 cluster mode for zero-downtime: `pm2 start app.js -i max` (uses all CPU cores) (NFR-001)
   - **Frontend Deployment (Netlify)**:
     - Build production bundle: `npm run build` (optimizes React with Vite/CRA)
     - Deploy to Netlify: connect GitHub repo → configure build command (`npm run build`) → publish directory (`dist` or `build`) (TR-010)
     - Configure custom domain and HTTPS (Netlify auto-provisisons SSL) (NFR-003)
   - **Database Deployment**:
     - Install PostgreSQL 15 on Windows Server (or use Supabase free tier with 10GB limit)
     - Install pgvector extension: `CREATE EXTENSION vector;` (TR-001)
     - Configure pg_hba.conf for TLS-only connections: `hostssl all all 0.0.0.0/0 md5` (NFR-003)
     - Set up automated backups: daily pg_dump cron job → upload to S3-compatible storage (Backblaze B2 free tier) (DR-005)
   - **Redis Deployment**:
     - Use Upstash Redis free tier (10K commands/day): sign up → copy connection URL → configure in backend `.env` (TR-005)
     - Alternatively: self-host Redis on Windows Server with persistence enabled (`appendonly yes`) (TR-005)
   - **Monitoring Deployment**:
     - Install Prometheus on Windows: download binary → configure scraping targets (backend metrics endpoint) (TR-013)
     - Install Grafana: connect to Prometheus data source → import dashboards for API latency, error rates, AI usage (NFR-001, AIR-Q02)
     - Set up alerts: notify on 99.9% uptime breach, high AI error rates, database connection failures (NFR-001)

8. **Testing & Quality Assurance**
   - **Unit Testing**:
     - Backend: Jest tests for API routes, middleware (RBAC), AI Gateway logic (PII redaction, circuit breaker) (TR-012)
     - Frontend: React Testing Library tests for components (role-based rendering, form validation) (TR-012)
     - Target: >80% code coverage for backend and frontend (TR-012)
   - **Integration Testing**:
     - Test end-to-end flows: patient books appointment → AI intake → document upload → extraction → medical coding
     - Mock OpenAI API responses with nock or MSW to avoid real API calls in tests
     - Test database transactions: verify audit_log entries created on state changes
   - **AI Quality Testing**:
     - Hallucination rate validation: manually review 100 AI extractions/month → measure accuracy (AIR-Q01 <5% target)
     - Latency benchmarking: load test AI endpoints with k6 or Artillery → verify p95 latency <7s for intake, <15s for document extraction (AIR-Q02)
     - Schema validation testing: send 100 malformed AI responses → verify Zod catches >= 95% (AIR-Q03)
   - **Security Testing**:
     - Penetration testing: run OWASP ZAP or Burp Suite against API endpoints → fix vulnerabilities (NFR-003)
     - RBAC validation: test unauthorized access attempts (Staff accessing Admin routes) → verify 403 responses (NFR-004)
     - Audit log verification: trigger state changes → query audit_log → confirm all actions logged (NFR-005)
   - **Performance Testing**:
     - Load testing: simulate 500 concurrent users with k6 or JMeter → verify <3s response times for booking (NFR-002)
     - Cache hit ratio testing: measure Redis cache effectiveness → target >80% hit ratio for slot availability (NFR-010)
     - Database query optimization: use `EXPLAIN ANALYZE` on slow queries → add indexes (NFR-002)

9. **Rollout & Post-Deployment Monitoring**
   - **Feature Flag Rollout**:
     - Enable AI features gradually: start with 10% user traffic (TR-017)
     - Monitor AI error rates and hallucination reports in Grafana
     - Rollback via feature flag if quality degrades (AIR-O01 15-minute rollback target)
   - **User Training & Documentation**:
     - Create user guides for Staff: how to use walk-in queue, review AI-extracted data, mark no-shows
     - Create video tutorials for Patients: booking appointments, AI vs manual intake, document upload
     - Document API endpoints with OpenAPI/Swagger for future integrations (TR-004)
   - **KPI Tracking**:
     - Monitor no-show rate reduction: compare baseline vs post-launch (spec.md Success Criteria: >=5% reduction)
     - Track staff time savings: survey staff on time per appointment (target: >=10 minutes saved)
     - Measure AI accuracy: monthly reviews to maintain 98% AI-Human agreement (spec.md Success Criteria)
   - **Incident Response**:
     - Set up on-call rotation with PagerDuty or AlertManager
     - Define SLAs: critical issues (platform down) = 15-minute response time (NFR-001)
     - Maintain runbook for common issues: database connection failures, OpenAI API outages, Redis cache misses
   - **Continuous Improvement**:
     - Collect user feedback via in-app surveys or support tickets
     - Prioritize feature requests and bug fixes in monthly sprint planning
     - Refine AI prompts based on hallucination reports and user corrections (AIR-Q01)
     - Optimize database queries based on slow query logs (NFR-002)
