# Navigation Map - Unified Patient Access & Clinical Intelligence Platform

## Overview

This document defines the cross-screen navigation index for all 13 screens and 7 modals/overlays. Each entry specifies the source screen, trigger element, action, and target destination with corresponding wireframe file references.

## Navigation Index

### SCR-001 Login/Register
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Login Button | Submit credentials | SCR-002 (Patient) / SCR-003 (Staff) / SCR-004 (Admin) | wireframe-SCR-002/003/004 |
| Register Link | Toggle to register form | SCR-001 (Register state) | wireframe-SCR-001 |
| Forgot Password Link | Navigate to reset | SCR-001 (Reset state) | wireframe-SCR-001 |

### SCR-002 Patient Dashboard
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Sidebar: Dashboard | Active item | SCR-002 | wireframe-SCR-002 |
| Sidebar: Book Appointment | Navigate | SCR-006 | wireframe-SCR-006 |
| Sidebar: Patient Intake | Navigate | SCR-007 | wireframe-SCR-007 |
| Sidebar: Documents | Navigate | SCR-008 | wireframe-SCR-008 |
| Sidebar: Profile | Navigate | SCR-005 | wireframe-SCR-005 |
| "Book Appointment" CTA | FL-001 entry | SCR-006 | wireframe-SCR-006 |
| "Complete Intake" CTA | FL-002 entry | SCR-007 | wireframe-SCR-007 |
| "Upload Document" CTA | Navigate | SCR-008 | wireframe-SCR-008 |
| Notification Bell | Open drawer | Notification Center Drawer | wireframe-SCR-002 |
| User Menu > Profile | Navigate | SCR-005 | wireframe-SCR-005 |
| User Menu > Logout | Redirect | SCR-001 | wireframe-SCR-001 |

### SCR-003 Staff Dashboard
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Sidebar: Dashboard | Active item | SCR-003 | wireframe-SCR-003 |
| Sidebar: Queue | Navigate | SCR-009 | wireframe-SCR-009 |
| Sidebar: Clinical Review | Navigate | SCR-010 | wireframe-SCR-010 |
| Sidebar: Appointments | Navigate | SCR-011 | wireframe-SCR-011 |
| Sidebar: Profile | Navigate | SCR-005 | wireframe-SCR-005 |
| "Queue Management" link | FL-003 entry | SCR-009 | wireframe-SCR-009 |
| Patient Name (row click) | FL-004 entry | SCR-010 | wireframe-SCR-010 |
| "Appointment Management" link | FL-006 entry | SCR-011 | wireframe-SCR-011 |
| Notification Bell | Open drawer | Notification Center Drawer | wireframe-SCR-003 |
| User Menu > Profile | Navigate | SCR-005 | wireframe-SCR-005 |
| User Menu > Logout | Redirect | SCR-001 | wireframe-SCR-001 |

### SCR-004 Admin Dashboard
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Sidebar: Dashboard | Active item | SCR-004 | wireframe-SCR-004 |
| Sidebar: User Management | Navigate | SCR-013 | wireframe-SCR-013 |
| Sidebar: Audit Logs | Navigate | SCR-012 | wireframe-SCR-012 |
| Sidebar: Profile | Navigate | SCR-005 | wireframe-SCR-005 |
| "User Management" link | FL-005 entry | SCR-013 | wireframe-SCR-013 |
| "View Audit Logs" link | Navigate | SCR-012 | wireframe-SCR-012 |
| Notification Bell | Open drawer | Notification Center Drawer | wireframe-SCR-004 |
| User Menu > Profile | Navigate | SCR-005 | wireframe-SCR-005 |
| User Menu > Logout | Redirect | SCR-001 | wireframe-SCR-001 |

### SCR-005 Profile & Settings
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-002/003/004 (role-based) | wireframe-SCR-002/003/004 |
| Save Button | Stay on page | SCR-005 (success toast) | wireframe-SCR-005 |
| Cancel Button | Navigate back | Previous screen | — |
| Sidebar items | Standard nav | Role-specific screens | — |

### SCR-006 Appointment Booking
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-002 | wireframe-SCR-002 |
| Calendar Date | Select date | SCR-006 (slot list updates) | wireframe-SCR-006 |
| Time Slot RadioGroup | Select slot | SCR-006 (slot selected) | wireframe-SCR-006 |
| "Confirm Booking" Button | Submit booking | SCR-002 (success toast) | wireframe-SCR-002 |
| "Join Waitlist" Button | Waitlist action | SCR-002 (waitlist toast) | wireframe-SCR-002 |
| Slot Details | Open drawer | Slot Details Drawer | wireframe-SCR-006 |
| Back Button (mobile) | Navigate back | SCR-002 | wireframe-SCR-002 |

### SCR-007 Patient Intake
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-002 | wireframe-SCR-002 |
| AI/Manual Toggle | Switch mode | SCR-007 (mode switch) | wireframe-SCR-007 |
| "Submit Intake" Button | Submit form | SCR-002 (success toast) | wireframe-SCR-002 |
| Back Button (mobile) | Navigate back | SCR-002 | wireframe-SCR-002 |

### SCR-008 Document Upload
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-002 | wireframe-SCR-002 |
| File Upload Zone | Upload action | SCR-008 (progress state) | wireframe-SCR-008 |
| "Done" Button | Navigate back | SCR-002 | wireframe-SCR-002 |
| Back Button (mobile) | Navigate back | SCR-002 | wireframe-SCR-002 |

### SCR-009 Queue Management
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-003 | wireframe-SCR-003 |
| "Add Walk-in" Button | Open modal | Add Walk-in Modal | wireframe-SCR-009 |
| Patient Name (row click) | Open drawer | Patient Details Drawer | wireframe-SCR-009 |
| "Mark Arrived" Button | Row action | SCR-009 (badge update) | wireframe-SCR-009 |
| Back Button (mobile) | Navigate back | SCR-003 | wireframe-SCR-003 |

### SCR-010 Clinical Data Review
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-003 | wireframe-SCR-003 |
| Conflict Badge (click) | Open modal | Conflict Details Modal | wireframe-SCR-010 |
| "Approve Profile" Button | Navigate back | SCR-003 (success toast) | wireframe-SCR-003 |
| Back Button (mobile) | Navigate back | SCR-003 | wireframe-SCR-003 |

### SCR-011 Appointment Management
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-003 | wireframe-SCR-003 |
| "Mark No Show" Button | Open modal | Confirmation Dialog | wireframe-SCR-011 |
| "Reschedule" Button | Open modal | Reschedule Modal | wireframe-SCR-011 |
| Back Button (mobile) | Navigate back | SCR-003 | wireframe-SCR-003 |

### SCR-012 Audit Logs
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-004 | wireframe-SCR-004 |
| Search TextField | Filter in-page | SCR-012 (filtered) | wireframe-SCR-012 |
| Filter Select | Filter in-page | SCR-012 (filtered) | wireframe-SCR-012 |
| Pagination | Page navigation | SCR-012 (page change) | wireframe-SCR-012 |
| Back Button (mobile) | Navigate back | SCR-004 | wireframe-SCR-004 |

### SCR-013 User Management
| Element | Action | Target Screen | Wireframe |
|---------|--------|---------------|-----------|
| Breadcrumb: Dashboard | Navigate back | SCR-004 | wireframe-SCR-004 |
| "Add User" Button | Open drawer | User Form Drawer | wireframe-SCR-013 |
| Edit icon (row) | Open drawer | User Form Drawer (prefilled) | wireframe-SCR-013 |
| Deactivate icon (row) | Open modal | Confirmation Dialog | wireframe-SCR-013 |
| Back Button (mobile) | Navigate back | SCR-004 | wireframe-SCR-004 |

## Flow Navigation Summary

| Flow ID | Name | Screen Sequence | Trigger |
|---------|------|----------------|---------|
| FL-001 | Patient Booking | SCR-002 → SCR-006 → SCR-002 | "Book Appointment" CTA |
| FL-002 | Patient Intake | SCR-002 → SCR-007 → SCR-002 | "Complete Intake" CTA |
| FL-003 | Staff Queue | SCR-003 → SCR-009 → Modal/Queue update | "Queue Management" nav |
| FL-004 | Staff Clinical Review | SCR-003 → SCR-010 → Modal/SCR-003 | Patient name click |
| FL-005 | Admin User Mgmt | SCR-004 → SCR-013 → Drawer/SCR-013 | "User Management" nav |
| FL-006 | Staff No Show | SCR-003 → SCR-011 → Modal/SCR-011 | "Appointment Management" nav |

## Sidebar Menu Structure

### Patient Sidebar
1. Dashboard (SCR-002) — icon: home
2. Book Appointment (SCR-006) — icon: calendar
3. Patient Intake (SCR-007) — icon: clipboard
4. Documents (SCR-008) — icon: file-upload
5. Profile & Settings (SCR-005) — icon: user

### Staff Sidebar
1. Dashboard (SCR-003) — icon: home
2. Queue Management (SCR-009) — icon: queue
3. Clinical Review (SCR-010) — icon: stethoscope
4. Appointments (SCR-011) — icon: calendar-check
5. Profile & Settings (SCR-005) — icon: user

### Admin Sidebar
1. Dashboard (SCR-004) — icon: home
2. User Management (SCR-013) — icon: users
3. Audit Logs (SCR-012) — icon: shield
4. Profile & Settings (SCR-005) — icon: user
