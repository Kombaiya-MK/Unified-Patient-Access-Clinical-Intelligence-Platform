# Project Plan - Unified Patient Access & Clinical Intelligence Platform

## Executive Summary
**Project Name**: Unified Patient Access & Clinical Intelligence Platform (UPACI)
**Project Type**: Green-field
**Business Context**: Healthcare providers face disconnected data pipelines between scheduling and clinical preparation, high no-show rates due to complex booking workflows, and manual clinical data extraction from unstructured reports. Existing solutions are fragmented and lack integration between appointment booking and clinical intelligence.
**Solution Overview**: A unified healthcare platform bridging patient appointment booking and clinical data management, providing role-specific interfaces for Patients, Staff, and Admins. The platform integrates AI-assisted conversational intake, document extraction, medical coding (ICD-10/CPT), medication conflict detection, and rule-based no-show risk assessment while maintaining HIPAA compliance and comprehensive audit logging. Deployed on free/open-source infrastructure with Windows Services/IIS backend.
**Key Stakeholders**: Patients, Staff (Front Desk/Call Center), Admin (IT/Operations), IT/Support, Compliance Officer, External Calendar APIs (Google/Outlook)
**AI-Paired Development**: Yes — AI reduction factors applied to estimates (0.75 for simple/medium requirements, 0.85 for complex requirements)

## Project Scope
### In Scope
- Secure login and authentication for Admin, Staff, and Patient — mapped to FR-019
- Role-specific dashboards for Admin, Staff, and Patient — mapped to FR-020
- Appointment booking, rescheduling, and cancellation with waitlist and slot swap — mapped to FR-001, FR-002
- Automated multi-channel reminders (SMS/Email) and calendar sync — mapped to FR-003
- PDF appointment confirmation via email — mapped to FR-011, FR-012
- AI-assisted and manual patient intake (switchable) — mapped to FR-004
- Staff walk-in management, queue operations, arrival and status tracking — mapped to FR-005
- Staff mark no-show — mapped to FR-017
- Staff book on behalf of patients — mapped to FR-021
- Clinical document upload and AI-based data extraction — mapped to FR-006
- Unified, de-duplicated patient profile with conflict detection — mapped to FR-007
- Medical coding (ICD-10, CPT) from aggregated data — mapped to FR-008
- Insurance pre-check against internal dummy records — mapped to FR-009
- Medication conflict detection and highlighting — mapped to FR-016
- Rule-based no-show risk assessment — mapped to FR-014
- Role-based access control and immutable audit logging — mapped to FR-010
- Block patient self-check-in — mapped to FR-013
- Admin user management (create, update, deactivate, assign roles) — mapped to FR-015
- Admin department management (CRUD, patient assignment) — mapped to FR-022
- Patient secure dashboard — mapped to FR-018

### Out of Scope
- Provider logins or provider-facing actions
- Payment gateway integration (future provision only)
- Family member profile features
- Patient self-check-in (mobile, web portal, or QR code)
- Direct, bi-directional EHR integration or full claims submission
- Use of paid cloud infrastructure (e.g., Azure, AWS)
- Mobile native app development

## Objectives and Goals
### Business Objectives
| Objective ID | Objective | Success Metric | Target |
|-------------|-----------|---------------|--------|
| OBJ-001 | Reduce patient no-show rates | No-show rate reduction from baseline | ≥ 5% reduction |
| OBJ-002 | Streamline clinical preparation workflow | Staff time per appointment | ≥ 10 min reduction |
| OBJ-003 | Ensure clinical data accuracy with AI | AI-Human agreement rate | > 98% |
| OBJ-004 | Maintain platform reliability | System uptime | 99.9% |
| OBJ-005 | Ensure compliance and auditability | Action logging coverage | 100% immutable logging |

### Project Goals
- Deliver a fully functional appointment booking system with waitlist, slot swap, and automated reminders within 3 days
- Implement hybrid AI-human clinical intelligence workflows (intake, extraction, coding) with manual fallback within 3 days
- Achieve HIPAA-compliant data handling with end-to-end encryption, RBAC, and immutable audit logging
- Deploy on free/open-source infrastructure with zero ongoing hosting cost (excluding OpenAI API usage)
- Deliver 14 role-specific UI screens with WCAG 2.2 AA accessibility compliance

### Alignment to Requirements
| Objective | Mapped Requirements |
|-----------|-------------------|
| OBJ-001 | FR-001, FR-002, FR-003, FR-014, FR-017, NFR-001 |
| OBJ-002 | FR-005, FR-006, FR-007, FR-008, FR-016, FR-021 |
| OBJ-003 | FR-004, FR-006, FR-007, FR-008, AIR-001 to AIR-003, AIR-Q01 |
| OBJ-004 | NFR-001, NFR-002, NFR-009, NFR-010 |
| OBJ-005 | FR-010, NFR-003, NFR-004, NFR-005, DR-003, DR-009 |

## Project Timeline / Milestones
### High-Level Timeline
| Milestone ID | Milestone Title | Target Date | Deliverables | Dependencies |
|-------------|----------------|-------------|-------------|-------------|
| MS-001 | Project Kickoff & Environment Setup | 2026-03-17 (Day 1 AM) | Project plan approved, environment setup, design system, scaffolding | — |
| MS-002 | Authentication, Booking & Scheduling | 2026-03-17 (Day 1 PM) | Login/Register, RBAC, admin user CRUD, department management, booking, waitlist, slot swap, reminders, PDF email, insurance pre-check | MS-001 |
| MS-003 | Intake, Clinical Intelligence & Staff Ops | 2026-03-18 (Day 2) | AI/manual intake, document upload, extraction pipeline, patient dashboard, unified patient profile, ICD-10/CPT coding, medication conflict detection, RAG pipeline, walk-in management, queue operations, status tracking, no-show marking, risk assessment | MS-002 |
| MS-004 | Dashboards, UI Polish & Testing | 2026-03-19 (Day 3) | Role-specific dashboards (Patient, Staff, Admin), accessibility audit, responsive design, integration testing, security audit, performance testing, bug fixes | MS-003 |
| MS-005 | Final Delivery / Go-Live | 2026-03-20 (Deadline) | Production deployment, monitoring setup, handoff documentation | MS-004 |

### Key Dates
| Event | Date | Notes |
|-------|------|-------|
| Project Kickoff | 2026-03-17 | Day 1 begins |
| MVP Delivery | 2026-03-18 | Core booking + AI clinical pipeline functional (MS-003) |
| Final Delivery | 2026-03-20 | Full platform go-live (MS-005) — hard deadline |

## Team Composition
### Recommended Team Structure
| Role | Count | Allocation % | Justification |
|------|-------|-------------|---------------|
| Full-Stack Developer | 1 | 100% | React 18.x frontend (14 screens) + Node.js Express APIs + PostgreSQL + Redis; owns end-to-end feature delivery |
| Full-Stack Developer | 1 | 100% | Parallel feature development; shared frontend/backend responsibility; WCAG 2.2 AA compliance |
| AI/ML Engineer | 1 | 100% | 17 AIR requirements: RAG pipeline, GPT-4 integration, medical coding, medication conflict detection, no-show risk assessment |
| QA / DevOps Engineer | 1 | 100% | Testing (integration, security, accessibility), Windows Services/IIS deployment, PostgreSQL admin, Prometheus/Grafana, CI/CD pipelines |

**Total Team Size**: 4 members
**Sprint Duration**: Single 3-day sprint (project duration: 3 days, hard deadline 2026-03-20)

### RACI Matrix
| Activity | Project Sponsor | Tech Lead (FS Dev 1) | Full-Stack Dev 2 | AI/ML Engineer | QA / DevOps |
|----------|:-:|:-:|:-:|:-:|:-:|
| Requirements Review | I | A | C | C | C |
| Architecture Design | I | A | R | R | C |
| UI/UX Design | I | A | R | I | I |
| Frontend Development | I | A | R | I | C |
| Backend Development | I | R | A | C | C |
| AI Feature Development | I | C | C | A | C |
| Testing & QA | I | C | C | C | A |
| Deployment & Infra | I | C | I | I | A |
| Sprint Review | C | A | R | R | R |

## Cost Baseline
### Effort Estimate
| Category | Value | Unit |
|---------|-------|------|
| Total Functional Requirements | 22 | requirements |
| Total Non-Functional Requirements | 10 | requirements |
| Total Technical Requirements | 20 | requirements |
| Total Data Requirements | 10 | requirements |
| Total AI Requirements | 17 | requirements |
| Total UX Requirements | 16 | requirements |
| Total Use Cases | 13 | use cases |
| Total Screens | 14 | screens |
| Estimated Complexity | High | — |
| AI Reduction Factor Applied | Yes | 0.75 simple/medium, 0.85 complex |
| Base AI-Adjusted Effort | 239 | person-days |
| Complexity Multiplier | 1.43 | Green-field (×1.3) × Integration (×1.1, >10 sequence diagrams) |
| Effort After Multiplier | 342 | person-days |
| Buffer (20%) | 68 | person-days |
| **Total AI-Adjusted Effort** | **410** | **person-days** |
| Estimated Duration (Optimistic) | 3 | days |
| Estimated Duration (Likely) | 3 | days |
| Estimated Duration (Pessimistic) | 3 | days |
| Projected Story Points | 410 | story points (1 SP = 1 person-day) |

#### Effort Breakdown by Requirement Type
| Requirement Type | Count | Base Effort/Item | Total Base | AI Factor | AI-Adjusted |
|-----------------|-------|-----------------|------------|-----------|-------------|
| FR — Simple (CRUD, basic UI) | 9 | 2 person-days | 18 | ×0.75 | 13.5 |
| FR — Medium (business logic) | 7 | 4 person-days | 28 | ×0.75 | 21.0 |
| FR — Complex (AI, real-time) | 6 | 6 person-days | 36 | ×0.85 | 30.6 |
| NFR | 10 | 1.5 person-days | 15 | N/A | 15.0 |
| TR | 20 | 2 person-days | 40 | N/A | 40.0 |
| DR | 10 | 1 person-day | 10 | N/A | 10.0 |
| UXR | 16 | 1.5 person-days | 24 | N/A | 24.0 |
| AIR | 17 | 5 person-days | 85 | N/A | 85.0 |
| **Subtotal** | | | **256** | | **239.1** |

### Cost Breakdown
| Cost Category | Estimate | Basis |
|-------------|---------|-------|
| AI-Adjusted Development | 12 person-days (4 members × 3 days) | Compressed from 410 person-day estimate; AI-paired development critical path |
| Infrastructure | $0/month | Free hosting: Netlify (frontend CDN), self-hosted PostgreSQL, Upstash Redis free tier (NFR-007) |
| Third-Party / Licensing — OpenAI API | ~$500/month | GPT-4 inference + embeddings: ~100 intake/day + ~50 extractions/day (design.md Assumption 4) |
| Third-Party / Licensing — Auth0 | $0/month | Free tier (7,000 MAU) sufficient for clinic scale |
| Third-Party / Licensing — Calendar APIs | $0/month | Google Calendar API + Outlook API free tiers |
| Third-Party / Licensing — Email | $0/month | SendGrid/Mailgun free tier (~100 emails/day) |
| Third-Party / Licensing — Monitoring | $0/month | Self-hosted Prometheus + Grafana (open-source) |
| Contingency (20%) | Included | Buffer already applied to effort estimate |
| **Total Development Effort** | **12 person-days (4 × 3 days)** | Hard deadline: 2026-03-20 |
| **Total Monthly Infrastructure** | **~$500/month** | Primarily OpenAI API costs |

## Cost Control Plan
### Budget Monitoring
| Control Mechanism | Frequency | Owner |
|------------------|-----------|-------|
| Burn-down tracking | Daily | Scrum Master / Project Manager |
| Cost variance report | Daily | Project Manager |
| Scope change review | Per request (same-day turnaround) | Change Advisory Board |
| OpenAI API usage monitoring | Daily | DevOps Engineer |
| Velocity tracking | Daily | Project Manager |

### Change Control Process
- All scope change requests must be submitted via formal Change Request form with impact assessment
- Impact assessment must cover: effort delta (person-days), schedule impact, risk implications, and cost change
- Change Advisory Board (Project Manager + Tech Lead) reviews and approves/rejects within 2 business days
- Approved changes update the project backlog with re-prioritized sprint assignments
- All changes logged in project change log with traceability to affected requirements

## Risk Management Plan
### Risk Register

#### RK-001: Unclear Disaster Recovery Requirements
**Probability**: Medium
**Impact**: High
**Risk Score**: 6
**Category**: Scope
**Mitigation Strategy**: Schedule stakeholder workshop in Sprint 1 to define RTO/RPO targets; document in design.md TR-020
**Contingency Plan**: Default to industry standard: RTO 4 hours, RPO 1 hour with daily pg_dump backups
**Owner**: Project Manager
**Related Requirements**: TR-020 [UNCLEAR], NFR-001, DR-005
**Status**: Open

#### RK-002: Green-field Technology Stack Maturity
**Probability**: Medium
**Impact**: Medium
**Risk Score**: 4
**Category**: Technical
**Mitigation Strategy**: Sprint 1 dedicated to scaffolding spike — validate React + Node.js + PostgreSQL + pgvector + Redis integration end-to-end
**Contingency Plan**: Simplify architecture; defer pgvector to Sprint 3 if integration issues arise
**Owner**: Tech Lead
**Related Requirements**: TR-001 to TR-006
**Status**: Open

#### RK-003: Integration Complexity (8+ Technologies)
**Probability**: High
**Impact**: Medium
**Risk Score**: 6
**Category**: Technical
**Mitigation Strategy**: API-contract-first development; define OpenAPI 3.0 specs before implementation; mock all external APIs (OpenAI, Calendar, Email) for parallel development
**Contingency Plan**: Reduce integration scope to core APIs only; defer calendar sync to post-MVP
**Owner**: Tech Lead
**Related Requirements**: TR-004, TR-006, TR-018
**Status**: Open

#### RK-004: AI Model Uncertainty (17 AIR Requirements)
**Probability**: Medium
**Impact**: High
**Risk Score**: 6
**Category**: Technical
**Mitigation Strategy**: Manual fallback for all AI features (FR-004 switchable intake, FR-006 manual extraction review); circuit breaker pattern (AIR-S02); monthly quality audits (AIR-Q01)
**Contingency Plan**: Downgrade to GPT-3.5-turbo if GPT-4 latency/cost exceeds thresholds; increase human review percentage
**Owner**: AI/ML Engineer
**Related Requirements**: AIR-001 to AIR-007, AIR-Q01, AIR-S02, FR-004, FR-006, FR-008
**Status**: Open

#### RK-005: External Dependency — OpenAI API Availability
**Probability**: Low
**Impact**: High
**Risk Score**: 3
**Category**: External
**Mitigation Strategy**: Circuit breaker (3 failures in 60s → 5-min cooldown); Redis caching of AI responses (AIR-O02); manual workflow routing within 500ms (NFR-009)
**Contingency Plan**: Feature flag rollback to GPT-3.5-turbo (AIR-O01); disable AI features and operate in manual-only mode
**Owner**: AI/ML Engineer
**Related Requirements**: AIR-S02, AIR-O01, AIR-O02, NFR-009
**Status**: Open

#### RK-006: External Dependency — Calendar APIs (Google/Outlook)
**Probability**: Low
**Impact**: Medium
**Risk Score**: 2
**Category**: External
**Mitigation Strategy**: OAuth2 PKCE implementation with token refresh; hourly polling (not real-time); mock services for development/testing
**Contingency Plan**: Disable calendar sync gracefully; appointments function without external calendar integration
**Owner**: Backend Developer
**Related Requirements**: FR-003, TR-018
**Status**: Open

#### RK-007: Schedule Risk — 3-Day Hard Deadline with 4-Person Team
**Probability**: Very High
**Impact**: Very High
**Risk Score**: 9
**Category**: Schedule
**Mitigation Strategy**: All-hands parallel development; daily milestone checkpoints (AM/PM); strict P0-only scope; AI-paired development for all coding tasks; pre-built wireframes and design system eliminate design phase lag; combined Full-Stack roles maximize parallel throughput
**Contingency Plan**: No schedule extension available — if Day 2 checkpoint missed, de-scope P1 features (calendar sync, slot swap) and ship core booking + clinical pipeline only
**Owner**: Tech Lead
**Related Requirements**: All FR, NFR
**Status**: Open

#### RK-008: Resource — No Dedicated UI/UX Designer or DevOps
**Probability**: High
**Impact**: Medium
**Risk Score**: 6
**Category**: Resource
**Mitigation Strategy**: Pre-built wireframes and figma_spec.md serve as design reference; full-stack developers implement UI using existing design tokens; QA/DevOps combined role handles infrastructure
**Contingency Plan**: Full-stack developers use established component library and design system; defer visual polish to post-launch if behind schedule
**Owner**: Tech Lead
**Related Requirements**: UXR-001 to UXR-503, figma_spec.md
**Status**: Open

### Risk Summary Matrix
| Risk ID | Risk | Probability | Impact | Score | Mitigation | Owner |
|---------|------|:-:|:-:|:-:|-----------|-------|
| RK-001 | Unclear DR requirements (TR-020) | M | H | 6 | Stakeholder workshop Sprint 1 | Project Manager |
| RK-002 | Green-field tech stack maturity | M | M | 4 | Scaffolding spike Sprint 1 | Tech Lead |
| RK-003 | Integration complexity (8+ technologies) | H | M | 6 | API-contract-first, mock services | Tech Lead |
| RK-004 | AI model uncertainty (17 AIRs) | M | H | 6 | Manual fallback, circuit breaker | AI/ML Engineer |
| RK-005 | OpenAI API availability | L | H | 3 | Circuit breaker, Redis caching | AI/ML Engineer |
| RK-006 | Calendar API dependency | L | M | 2 | OAuth2 PKCE, mock services | Backend Developer |
| RK-007 | Schedule risk (3-day deadline, 4-person team) | VH | VH | 9 | Daily checkpoints, P0-only, AI-paired dev | Tech Lead |
| RK-008 | No dedicated UI/UX or DevOps | H | M | 6 | Pre-built wireframes, combined QA/DevOps role | Tech Lead |

## Communication Plan
| Artifact / Ceremony | Frequency | Audience | Owner | Channel |
|--------------------|-----------|----------|-------|---------|
| Morning Standup | Daily (9:00 AM) | All team members | Scrum Master | In-person / Video call |
| Midday Checkpoint | Daily (1:00 PM) | All team members | Project Manager | Slack / Teams |
| End-of-Day Review | Daily (5:00 PM) | All team + stakeholders | Project Manager | Video call |
| Blocker Escalation | Real-time | Affected members + Tech Lead | Any team member | Slack (immediate) |
| Final Go-Live Review | 2026-03-20 morning | All team + stakeholders | Project Manager | Video call |

## Success Metrics
| Criterion | Metric | Target | Measurement Method |
|----------|--------|--------|-------------------|
| On-time delivery | Milestone variance | ≤ 10% schedule deviation | Sprint tracking against milestone dates |
| Scope delivery | Requirement coverage | 100% of 22 FRs delivered | Traceability matrix validation |
| Quality | Defect density | < 1 critical defect per release | Test reports, bug tracking |
| Budget | Cost variance | ≤ 15% of effort estimate | Burn-down tracking |
| AI Accuracy | AI-human agreement rate | > 98% | Monthly auditor review (AIR-Q01) |
| No-show reduction | No-show rate delta | ≥ 5% reduction from baseline | Appointment analytics |
| Performance | API response time | < 3s booking, < 5s AI features | Prometheus/Grafana dashboards |
| Uptime | System availability | 99.9% | Monitoring alerts |

## Sprint Planning Bridge
| Parameter | Value | Basis |
|-----------|-------|-------|
| Projected Story Points | 410 | 1 SP = 1 person-day (agile-methodology-guidelines.md) |
| Recommended Sprint Duration | 3 days | Hard deadline 2026-03-20; single sprint covers entire project |
| Recommended Team Size | 4 | 2 Full-Stack Devs + 1 AI/ML Engineer + 1 QA/DevOps |
| Sprint Count | 1 | 3 days / single sprint |
| Recommended Velocity | ~103 SP/person/sprint | 410 SP / 1 sprint / 4 members ≈ 102.5 (aggressive — AI-paired development required) |

## Traceability
### Requirement Coverage
| Category | Total | In Scope | Coverage % |
|----------|-------|----------|-----------|
| FR-XXX | 22 | 22 | 100% |
| NFR-XXX | 10 | 10 | 100% |
| TR-XXX | 20 | 20 | 100% |
| DR-XXX | 10 | 10 | 100% |
| UXR-XXX | 16 | 16 | 100% |
| AIR-XXX | 17 | 17 | 100% |
| **Total** | **95** | **95** | **100%** |
