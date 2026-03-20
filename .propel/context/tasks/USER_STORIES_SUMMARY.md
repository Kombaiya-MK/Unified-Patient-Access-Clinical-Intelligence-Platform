# User Stories Summary - UPACI Platform
**Generated:** March 17, 2026  
**Last Updated:** March 19, 2026  
**Total User Stories:** 50 (ALL CREATED ✅)  
**Total Epics:** 12  
**Total Requirements Covered:** 110 (23 FR, 14 UC, 10 NFR, 20 TR, 10 DR, 17 AIR, 16 UXR)  
**Wireframes Covered:** 17/17 (100%)

## Executive Summary
This document provides a complete inventory of all 50 INVEST-compliant user stories generated for the Unified Patient Access & Clinical Intelligence Platform (UPACI). All user stories have been created as detailed markdown files with full wireframe references, requirements traceability, and INVEST compliance verification. Stories are organized by parent epic and include comprehensive acceptance criteria, edge cases, and visual design context.

---

## User Stories by Epic

### EP-TECH: Project Foundation & Technical Infrastructure (6 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-001 | Project Structure and React Frontend Setup | 3 | N/A (Infrastructure) | ✅ Created |
| US-002 | Node.js Backend API Setup with Express | 3 | N/A (Infrastructure) | ✅ Created |
| US-003 | PostgreSQL Database Setup with pgvector Extension | 4 | N/A (Infrastructure) | ✅ Created |
| US-004 | Redis Caching Infrastructure Setup | 2 | N/A (Infrastructure) | ✅ Created |
| US-005 | Prometheus/Grafana Monitoring Stack Deployment | 3 | N/A (Infrastructure) | ✅ Created |
| US-006 | CI/CD Pipeline Configuration (GitHub Actions/Azure Pipelines) | 4 | N/A (Infrastructure) | ✅ Created |

**Requirements Covered:** TR-001, TR-002, TR-003, TR-004, TR-005, TR-012, TR-013, TR-014, TR-019, NFR-007

---

### EP-DATA: Core Data & Persistence Layer (2 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-007 | Core Database Schema Implementation (All Tables) | 5 | N/A (Database) | ✅ Created |
| US-008 | Database Indexes and Query Optimization | 3 | N/A (Database) | ✅ Created |

**Requirements Covered:** DR-001 through DR-010 (All data requirements)

---

### EP-001: Authentication & Access Control (4 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-009 | User Authentication with OAuth2/JWT | 5 | SCR-001 (Login) | ✅ Created |
| US-010 | Role-Based Access Control (RBAC) Middleware | 4 | N/A (Backend) | ✅ Created |
| US-011 | Immutable Audit Logging System | 4 | SCR-012 (Audit Logs) | ✅ Created |
| US-012 | Login Page and Authentication Flow UI | 3 | SCR-001 (Login) | ✅ Created |

**Requirements Covered:** FR-010, FR-019, NFR-003, NFR-004, NFR-005, NFR-008, TR-007, TR-008, UC-008  
**Wireframes:** wireframe-SCR-001-login.html, wireframe-SCR-012-audit-logs.html

---

### EP-002: Patient Appointment Management (7 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-013 | Patient Appointment Booking Interface | 5 | SCR-006 (Booking) | ✅ Created |
| US-014 | Appointment Rescheduling and Cancellation | 3 | SCR-002, SCR-006 | ✅ Created |
| US-015 | Waitlist Management and Dynamic Slot Swapping | 4 | SCR-002, SCR-006 | ✅ Created |
| US-016 | Automated Appointment Reminders (SMS/Email) | 4 | N/A (Backend + Notification) | ✅ Created |
| US-017 | Calendar Sync (Google/Outlook API Integration) | 5 | SCR-002 (Dashboard) | ✅ Created |
| US-018 | PDF Appointment Confirmation Generation | 3 | N/A (Backend) | ✅ Created |
| US-019 | Patient Dashboard with Appointments View | 4 | SCR-002 (Patient Dashboard) | ✅ Created |

**Requirements Covered:** FR-001, FR-002, FR-003, FR-011, FR-012, FR-018, TR-018, UC-001, UC-004, UXR-001, UXR-002, UXR-402
**Wireframes:** wireframe-SCR-002-patient-dashboard.html, wireframe-SCR-006-appointment-booking.html

---

### EP-003: Staff Queue & Workflow Management (5 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-020 | Staff Queue Management Interface | 5 | SCR-009 (Queue Mgmt) | ✅ Created |
| US-021 | Walk-in Appointment Registration | 3 | SCR-003, SCR-009 | ✅ Created |
| US-022 | Arrival Marking and Status Update Functions | 3 | SCR-009, SCR-011 | ✅ Created |
| US-023 | Staff Appointment Booking on Behalf of Patients | 3 | SCR-003, SCR-006 | ✅ Created |
| US-024 | Mark No-Show Functionality | 2 | SCR-009, SCR-011 | ✅ Created |

**Requirements Covered:** FR-005, FR-017, FR-021, UC-007, UC-011, UXR-403  
**Wireframes:** wireframe-SCR-003-staff-dashboard.html, wireframe-SCR-009-queue-management.html, wireframe-SCR-011-appointment-management.html

---

### EP-004: AI-Assisted Patient Intake (3 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-025 | AI Conversational Intake Interface | 5 | SCR-007 (AI Mode) | ✅ Created |
| US-026 | Manual Intake Form with AI Switch | 4 | SCR-007 (Manual Mode) | ✅ Created |
| US-027 | Real-time Intake Validation and Context Retention | 4 | SCR-007 | ✅ Created |

**Requirements Covered:** FR-004, AIR-001, AIR-005, AIR-006, AIR-007, AIR-R01, AIR-R02, AIR-R03, TR-006, UC-002, UXR-003  
**Wireframes:** wireframe-SCR-007-patient-intake.html

---

### EP-005: Clinical Document Extraction & Processing (3 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-028 | Clinical Document Upload Interface | 3 | SCR-008 (Document Upload) | ✅ Created |
| US-029 | AI Document Data Extraction Service | 5 | N/A (Backend AI) | ✅ Created |
| US-030 | Multi-Document Deduplication Logic | 4 | N/A (Backend) | ✅ Created |

**Requirements Covered:** FR-006, AIR-002, AIR-Q01, AIR-Q02, AIR-Q03, TR-011, TR-016  
**Wireframes:** wireframe-SCR-008-document-upload.html, wireframe-SCR-010-clinical-data-review.html

---

### EP-006: Clinical Intelligence & Data Aggregation (4 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-031 | Unified Patient Profile Generation | 5 | SCR-010 (Clinical Review) | ✅ Created |
| US-032 | Medical Coding (ICD-10/CPT) Automation | 5 | SCR-010 | ✅ Created |
| US-033 | Medication Conflict Detection and Alerts | 4 | SCR-010, Notification Popup | ✅ Created |
| US-034 | Clinical Data Review Interface | 4 | SCR-010 | ✅ Created |

**Requirements Covered:** FR-007, FR-008, FR-016, AIR-003, AIR-004, AIR-S01, AIR-S02, AIR-S03, AIR-O01, AIR-O02, UC-003, UC-010  
**Wireframes:** wireframe-SCR-010-clinical-data-review.html, wireframe-notification-popup.html

---

### EP-007: Admin Operations & Management (5 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-035 | Admin User Management Interface | 4 | SCR-013 (User Mgmt) | ✅ Created |
| US-036 | Admin Department Management | 3 | SCR-014 (Dept Mgmt) | ✅ Created |
| US-037 | Insurance Pre-check Service | 3 | SCR-011 | ✅ Created |
| US-038 | No-Show Risk Assessment Algorithm | 4 | SCR-009, SCR-011 | ✅ Created |
| US-039 | Admin Dashboard with System Metrics | 4 | SCR-004 (Admin Dashboard) | ✅ Created |

**Requirements Covered:** FR-009, FR-014, FR-015, FR-020, FR-022, UC-005, UC-006, UC-013  
**Wireframes:** wireframe-SCR-004-admin-dashboard.html, wireframe-SCR-011-appointment-management.html, wireframe-SCR-013-user-management.html, wireframe-SCR-014-department-management.html

---

### EP-008: Performance & Reliability Infrastructure (3 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-040 | Load Testing and Performance Optimization | 4 | N/A (Infrastructure) | ✅ Created |
| US-041 | Circuit Breaker for AI Service Resilience | 3 | N/A (Backend) | ✅ Created |
| US-042 | Disaster Recovery and Backup Automation (RTO/RPO=1h) | 5 | N/A (Infrastructure) | ✅ Created |

**Requirements Covered:** NFR-001, NFR-002, NFR-009, NFR-010, TR-015, TR-020

---

### EP-009: UI/UX & Accessibility Foundation (5 stories)

| US-ID | Title | Story Points | Wireframe | Status |
|-------|-------|-------------|-----------|---------|
| US-043 | WCAG 2.2 AA Accessibility Compliance | 5 | All Screens | ✅ Created |
| US-044 | Responsive Design Implementation (Mobile/Tablet/Desktop) | 4 | All Screens | ✅ Created |
| US-045 | Design Token System and Medical-Grade Contrast | 3 | All Screens | ✅ Created |
| US-046 | Real-Time Dashboard Notifications System | 5 | Notification Popup, All Dashboards | ✅ Created |
| US-047 | Inline Form Validation and Error Handling | 3 | All Forms | ✅ Created |

**Requirements Covered:** FR-013, FR-023, UXR-101, UXR-102, UXR-103, UXR-201, UXR-202, UXR-301, UXR-302, UXR-401, UXR-501, UXR-502, UXR-503, TR-009, TR-010, UC-009, UC-012, UC-014  
**Wireframes:** wireframe-notification-popup.html, wireframe-SCR-005-profile-settings.html (3 variants), All 14 screen wireframes

---

### EP-010: Deployment & DevOps Configuration (3 stories)

| US-ID | Title | Story Points | Wireframe | Status | Tasks |
|-------|-------|-------------|-----------|---------|-------|
| US-048 | Windows Services/IIS Deployment Configuration | 4 | N/A (Infrastructure) | ✅ Created | 3 tasks |
| US-049 | Feature Flags for AI Model Version Control | 3 | N/A (Backend) | ✅ Created | 3 tasks |
| US-050 | Zero-Downtime Deployment with PM2 Cluster Mode | 3 | N/A (Infrastructure) | ✅ Created | 3 tasks |

**Requirements Covered:** NFR-REL05, TR-009, NFR-PERF04, NFR-006, TR-017, TR-008

#### US-050 Task Breakdown (15 hours total)
**task_001_pm2_cluster_configuration.md** (5 hours)
- PM2 cluster mode with instances = CPU cores
- Graceful shutdown handler (30s timeout, SIGINT/SIGTERM)
- PM2 ecosystem.config.js configuration
- Automatic restart policies (max_restarts: 10, min_uptime: 60s)
- PM2 startup scripts (Linux/Windows)
- Impacted: ecosystem.config.js (CREATE), server.ts (MODIFY), package.json (MODIFY)

**task_002_health_check_enhancement.md** (4 hours)
- Enhanced /api/health endpoint (200/503 status codes)
- Database + Redis + AI service checks
- Health check execution time tracking
- PM2 readiness validation integration
- Impacted: app.ts (MODIFY), aiServiceHealthCheck.ts (CREATE)

**task_003_deployment_pipeline_automation.md** (6 hours)
- Zero-downtime deployment scripts (staging + production)
- pm2 reload with rolling restart implementation
- Rollback procedures (git revert + redeploy)
- PM2 Prometheus exporter (metrics on port 9209)
- Grafana deployment dashboard
- Deployment documentation with runbook
- Impacted: deploy-staging.sh, deploy-production.sh, rollback.sh (CREATE), pm2-exporter.js (CREATE), zero-downtime-deployment.md (CREATE)

**Traceability Matrix:** .propel/context/tasks/us_050/TRACEABILITY_MATRIX.md

---

## Wireframe Coverage Matrix

| Wireframe File | Screen ID | Related User Stories | Epic |
|----------------|-----------|---------------------|------|
| wireframe-SCR-001-login.html | SCR-001 | US-009, US-012 | EP-001 |
| wireframe-SCR-002-patient-dashboard.html | SCR-002 | US-013, US-014, US-015, US-017, US-019 | EP-002, EP-007 |
| wireframe-SCR-003-staff-dashboard.html | SCR-003 | US-020, US-021, US-023 | EP-003 |
| wireframe-SCR-004-admin-dashboard.html | SCR-004 | US-039 | EP-007 |
| wireframe-SCR-005-profile-settings.html | SCR-005 | US-043, US-044, US-045 | EP-009 |
| wireframe-SCR-005-staff-profile-settings.html | SCR-005 | US-043, US-044 | EP-009 |
| wireframe-SCR-005-admin-profile-settings.html | SCR-005 | US-043, US-044 | EP-009 |
| wireframe-SCR-006-appointment-booking.html | SCR-006 | US-013, US-014, US-015, US-023 | EP-002, EP-003 |
| wireframe-SCR-007-patient-intake.html | SCR-007 | US-025, US-026, US-027 | EP-004 |
| wireframe-SCR-008-document-upload.html | SCR-008 | US-028 | EP-005 |
| wireframe-SCR-009-queue-management.html | SCR-009 | US-020, US-021, US-022, US-024, US-038 | EP-003, EP-007 |
| wireframe-SCR-010-clinical-data-review.html | SCR-010 | US-031, US-032, US-033, US-034 | EP-006 |
| wireframe-SCR-011-appointment-management.html | SCR-011 | US-022, US-024, US-037, US-038 | EP-003, EP-007 |
| wireframe-SCR-012-audit-logs.html | SCR-012 | US-011 | EP-001 |
| wireframe-SCR-013-user-management.html | SCR-013 | US-035 | EP-007 |
| wireframe-SCR-014-department-management.html | SCR-014 | US-036 | EP-007 |
| wireframe-notification-popup.html | Notification | US-016, US-033, US-046 | EP-002, EP-006, EP-009 |

**Total Wireframes:** 17  
**Total UI-Impacting Stories:** 32 of 50 (64%)  
**Infrastructure/Backend Stories:** 18 of 50 (36%)

---

## Requirements Traceability

### Functional Requirements Coverage (23/23 = 100%)
- **FR-001**: US-013, US-014  
- **FR-002**: US-015  
- **FR-003**: US-016, US-017  
- **FR-004**: US-025, US-026, US-027  
- **FR-005**: US-020, US-021, US-022  
- **FR-006**: US-028, US-029, US-030  
- **FR-007**: US-031, US-034  
- **FR-008**: US-032, US-034  
- **FR-009**: US-037  
- **FR-010**: US-009, US-010, US-011  
- **FR-011**: US-018  
- **FR-012**: US-018  
- **FR-013**: US-043 (prohibit self-check-in in design)  
- **FR-014**: US-037, US-038  
- **FR-015**: US-035  
- **FR-016**: US-033  
- **FR-017**: US-024  
- **FR-018**: US-019  
- **FR-019**: US-009, US-012  
- **FR-020**: US-012, US-039  
- **FR-021**: US-023  
- **FR-022**: US-036  
- **FR-023**: US-046

### Use Case Coverage (14/14 = 100%)
- **UC-001**: US-013, US-023  
- **UC-002**: US-025, US-026, US-027  
- **UC-003**: US-031, US-034  
- **UC-004**: US-018  
- **UC-005**: US-035  
- **UC-006**: US-037  
- **UC-007**: US-020, US-021, US-022  
- **UC-008**: US-009, US-012  
- **UC-009**: US-012, US-039  
- **UC-010**: US-034  
- **UC-011**: US-024  
- **UC-012**: US-019  
- **UC-013**: US-036  
- **UC-014**: US-046

### Technical Requirements Coverage (20/20 = 100%)
- **TR-001** through **TR-020**: All covered across US-001 to US-050

### AI Requirements Coverage (17/17 = 100%)
- **AIR-001** through **AIR-O02**: All covered in US-025 to US-034

### UX Requirements Coverage (16/16 = 100%)
- **UXR-001** through **UXR-503**: All covered across US-013, US-020, US-025, US-043-US-047

---

## Story Point Summary

| Epic | Story Count | Total Points | Avg Points/Story |
|------|-------------|--------------|------------------|
| EP-TECH | 6 | 19 | 3.2 |
| EP-DATA | 2 | 8 | 4.0 |
| EP-001 | 4 | 16 | 4.0 |
| EP-002 | 7 | 28 | 4.0 |
| EP-003 | 5 | 16 | 3.2 |
| EP-004 | 3 | 13 | 4.3 |
| EP-005 | 3 | 12 | 4.0 |
| EP-006 | 4 | 18 | 4.5 |
| EP-007 | 5 | 18 | 3.6 |
| EP-008 | 3 | 12 | 4.0 |
| EP-009 | 5 | 20 | 4.0 |
| EP-010 | 3 | 10 | 3.3 |
| **TOTAL** | **50** | **190 points** | **3.8 avg** |

**Estimated Effort:** 190 story points × 8 hours = 1,520 developer hours = ~9.5 months for 1 developer or ~2.4 months for 4-person team

---

## INVEST Compliance Verification

All 50 user stories comply with INVEST principles:

✅ **Independent**: Each story can be developed independently (dependencies documented)  
✅ **Negotiable**: Stories include edge cases and alternatives that can be discussed  
✅ **Valuable**: Each story delivers clear business value to specific user roles  
✅ **Estimable**: All stories sized ≤5 points with clear acceptance criteria  
✅ **Small**: No story exceeds 5 points (40 hours), complex features decomposed  
✅ **Testable**: Given/When/Then format enables clear test case definition

---

## Final Status Summary

✅ **ALL 50 USER STORIES CREATED** - 100% Complete

### Generation Completion Details
- **Total Stories:** 50/50 (100%)
- **Detailed Markdown Files:** 50/50 created in `.propel/context/tasks/us_XXX/` directories
- **Wireframe Coverage:** 17/17 wireframes (100%) mapped to 32 UI-impacting stories
- **Requirements Coverage:** 110/110 requirements (100%) - 23 FR, 14 UC, 10 NFR, 20 TR, 10 DR, 17 AIR, 16 UXR
- **INVEST Compliance:** 50/50 stories (100%) - all verified for Independence, Negotiability, Value, Estimability, Small size, Testability

### Coverage Verification Results

| Category | Targeted | Achieved | Coverage % |
|----------|----------|----------|------------|
| **Functional Requirements (FR)** | 23 | 23 | 100% ✅ |
| **Use Cases (UC)** | 14 | 14 | 100% ✅ |
| **Non-Functional Requirements (NFR)** | 10 | 10 | 100% ✅ |
| **Technical Requirements (TR)** | 20 | 20 | 100% ✅ |
| **Data Requirements (DR)** | 10 | 10 | 100% ✅ |
| **AI Requirements (AIR)** | 17 | 17 | 100% ✅ |
| **UX Requirements (UXR)** | 16 | 16 | 100% ✅ |
| **Wireframe Components** | 17 | 17 | 100% ✅ |
| **User Stories** | 50 | 50 | 100% ✅ |

### Story Granularity Approach
All user stories follow the granular approach requested:
- **One acceptance criterion per story** (no multi-criterion stories)
- Story points: 1-5 points each (average 3.8 points)
- Each Given/When/Then is focused and atomic
- Complex features decomposed into multiple stories

### Key Achievements
1. ✅ **Zero orphaned requirements** - Every requirement mapped to at least one user story
2. ✅ **Complete wireframe integration** - All 17 HTML wireframes referenced with exact file paths
3. ✅ **Comprehensive edge case coverage** - 2-3 edge cases per story with handling strategies
4. ✅ **Full requirements traceability** - Each story links to parent epic, requirement IDs, and dependencies
5. ✅ **Visual design context** - 32 UI stories include screen IDs, wireframe details, and UX requirement mappings
6. ✅ **HIPAA compliance alignment** - Security, audit logging, and data protection requirements embedded

---

## Next Steps for Implementation

1. **Sprint Planning**: Organize stories into sprints following dependency order:
   - Sprint 0: EP-TECH (Foundation) - US-001 to US-006
   - Sprint 1: EP-DATA (Database) - US-007 to US-008
   - Sprint 2-3: EP-001 (Authentication) - US-009 to US-012
   - Sprint 4-6: EP-002 (Appointments) - US-013 to US-019
   - Sprint 7-8: EP-003 (Staff Queue) - US-020 to US-024
   - Sprint 9-10: EP-004 (AI Intake) - US-025 to US-027
   - Sprint 11-12: EP-005 (Document Extraction) - US-028 to US-030
   - Sprint 13-15: EP-006 (Clinical Intelligence) - US-031 to US-034
   - Sprint 16-18: EP-007 (Admin Operations) - US-036 to US-039
   - Sprint 19: EP-008 (Performance) - US-040 to US-042
   - Sprint 20-21: EP-009 (UI/UX) - US-043 to US-047
   - Sprint 22: EP-010 (Deployment) - US-048 to US-050

2. **Estimation Validation**: Conduct planning poker sessions with development team to validate story point estimates

3. **Technical Design**: Create technical design documents for complex stories (AI features, medical coding, circuit breaker)

4. **Wireframe Walkthrough**: Review all 17 wireframes with UX/UI team to validate design specifications

5. **Acceptance Criteria Review**: Conduct Product Owner review sessions for each epic to refine acceptance criteria

6. **Test Case Generation**: Derive test cases from Given/When/Then acceptance criteria for QA planning

---

**Document Status:** ✅ COMPLETE | Detailed Files: 50/50 Created | Wireframes: 17/17 Mapped | Requirements: 110/110 Covered
