# Wireframe Deliverables — Version History & Change Log

**Project:** Unified Patient Access & Clinical Intelligence Platform (UPACI)
**Artifact:** High-Fidelity HTML Wireframes & Supporting Documentation
**Base Version:** 1.0.0 (March 17, 2026)

---

## Change History & Revision Log

| Date | Version | Author | Description/Change Summary |
|------|---------|--------|----------------------------|
| 2026-03-17 | 1.0.0 | User/AI | **Initial wireframe generation.** Created 13 high-fidelity HTML wireframes (SCR-001 through SCR-013) plus 4 supporting documents (information-architecture.md, component-inventory.md, navigation-map.md, design-tokens-applied.md). All screens derived from figma_spec.md and designsystem.md with full design token application. 4-tier evaluation completed: 98.75% overall score — PASS. |
| 2026-03-17 | 1.1.0 | User/AI | **Added Notification Popup wireframe.** Created `wireframe-notification-popup.html` — a dropdown popup anchored to the header bell icon, featuring: All/Unread filter tabs, 8 notification items across 6 categories (Appointment, Reminder, Intake, Document, Alert, System), unread/read visual states, "Mark all read" action, mobile bottom-sheet variant (≤767px), full ARIA accessibility. |
| 2026-03-17 | 1.2.0 | User/AI | **Fixed Profile & Settings cross-role navigation bug.** SCR-005 was hardcoded with the Patient sidebar/breadcrumb — clicking "Profile & Settings" from Admin or Staff dashboards incorrectly showed Patient role context. **Fix:** Created `wireframe-SCR-005-admin-profile-settings.html` (Admin sidebar, Admin role badge, breadcrumb → SCR-004) and `wireframe-SCR-005-staff-profile-settings.html` (Staff sidebar, Staff role badge, breadcrumb → SCR-003). Updated sidebar links in 7 files: SCR-004, SCR-012, SCR-013 → admin variant; SCR-003, SCR-009, SCR-010, SCR-011 → staff variant. Patient screens remain linked to the original `wireframe-SCR-005-profile-settings.html`. |
| 2026-03-17 | 1.3.0 | User/AI | **Added Reschedule & Cancel actions to Patient Dashboard appointments.** Each upcoming appointment in SCR-002 now has "Reschedule" and "Cancel" buttons. Reschedule navigates to SCR-006 (booking screen). Cancel opens a confirmation modal showing appointment details (doctor, date, time, type) with "Keep Appointment" and "Yes, Cancel Appointment" actions. Mobile responsive: buttons wrap below appointment row, modal actions stack vertically. Derived from FR-001 (reschedule/cancel). |
| 2026-03-17 | 1.4.0 | User/AI | **Fixed cancel modal showing on page load & added click-to-reveal appointment actions.** Removed `modal-overlay--open` class from the cancel confirmation modal so it is hidden by default. Changed Reschedule/Cancel buttons to be hidden by default — they now appear when the user clicks (focuses) an appointment row. Appointment rows are now focusable (`tabindex="0"`, `role="button"`), with hover highlight and focus-visible ring. First appointment shown in pre-selected state (`appointment-item--selected`) as a wireframe demo of the expanded interaction. |

---

## File Inventory

### Supporting Documents

| File | Version Introduced | Last Modified | Description |
|------|--------------------|---------------|-------------|
| information-architecture.md | 1.0.0 | 1.0.0 | 11-section IA document: screen hierarchy, personas, flows, modals, navigation architecture, interaction patterns, error handling, responsive strategy, accessibility, content strategy |
| component-inventory.md | 1.0.0 | 1.0.0 | 22+ component specs with states matrix, reusability, responsive breakpoints, React framework notes |
| navigation-map.md | 1.0.0 | 1.0.0 | Cross-screen navigation index for all screens and modals, sidebar menu structure for 3 roles |
| design-tokens-applied.md | 1.0.0 | 1.0.0 | Full token mapping: colors, typography, spacing, radius, elevation, focus, animation, layout grid, responsive breakpoints across all screens |
| wireframe-evaluation-report.md | 1.0.0 | 1.0.0 | 4-tier evaluation: T1 100%, T2 100%, T3 100%, T4 95%. Overall 98.75% — PASS |
| version-history.md | 1.2.0 | 1.2.0 | This file — change log and revision history |

### HTML Wireframes

| File | Role | Version Introduced | Last Modified | Notes |
|------|------|--------------------|---------------|-------|
| wireframe-SCR-001-login.html | All | 1.0.0 | 1.0.0 | Split-panel login with Sign In/Register tabs |
| wireframe-SCR-002-patient-dashboard.html | Patient | 1.0.0 | 1.4.0 | Modal hidden by default; click-to-reveal appointment actions |
| wireframe-SCR-003-staff-dashboard.html | Staff | 1.0.0 | 1.2.0 | Sidebar Profile link updated → staff variant |
| wireframe-SCR-004-admin-dashboard.html | Admin | 1.0.0 | 1.2.0 | Sidebar Profile link updated → admin variant |
| wireframe-SCR-005-profile-settings.html | Patient | 1.0.0 | 1.0.0 | Patient profile with patient sidebar/breadcrumb |
| wireframe-SCR-005-admin-profile-settings.html | Admin | 1.2.0 | 1.2.0 | Admin profile with admin sidebar, breadcrumb → SCR-004 |
| wireframe-SCR-005-staff-profile-settings.html | Staff | 1.2.0 | 1.2.0 | Staff profile with staff sidebar, breadcrumb → SCR-003 |
| wireframe-SCR-006-appointment-booking.html | Patient | 1.0.0 | 1.0.0 | Calendar + time slot selection |
| wireframe-SCR-007-patient-intake.html | Patient | 1.0.0 | 1.0.0 | AI chat / manual toggle with progress stepper |
| wireframe-SCR-008-document-upload.html | Patient | 1.0.0 | 1.0.0 | Drag-drop upload with progress bars |
| wireframe-SCR-009-queue-management.html | Staff | 1.0.0 | 1.2.0 | Sidebar Profile link updated → staff variant |
| wireframe-SCR-010-clinical-data-review.html | Staff | 1.0.0 | 1.2.0 | Sidebar Profile link updated → staff variant |
| wireframe-SCR-011-appointment-management.html | Staff | 1.0.0 | 1.2.0 | Sidebar Profile link updated → staff variant |
| wireframe-SCR-012-audit-logs.html | Admin | 1.0.0 | 1.2.0 | Sidebar Profile link updated → admin variant |
| wireframe-SCR-013-user-management.html | Admin | 1.0.0 | 1.2.0 | Sidebar Profile link updated → admin variant |
| wireframe-notification-popup.html | All | 1.1.0 | 1.1.0 | Notification dropdown popup with filter tabs, 6 notification categories, mobile bottom-sheet |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total HTML wireframes | 16 |
| Total supporting documents | 6 |
| Versions released | 5 (1.0.0, 1.1.0, 1.2.0, 1.3.0, 1.4.0) |
| Bug fixes | 2 (cross-role Profile navigation, modal default visibility) |
| New features added | 2 (Notification Popup, Reschedule/Cancel actions) |
| Files created | 21 |
| Files modified (post-1.0.0) | 8 |
