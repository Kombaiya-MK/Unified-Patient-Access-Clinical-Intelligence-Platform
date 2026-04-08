/**
 * Navigation Configuration
 *
 * Role-based navigation items for Patient, Staff, and Admin users.
 * Each item defines a route path, label, and inline SVG icon.
 *
 * @task US_044 TASK_002
 */

import React from 'react';
import type { UserRole } from '../../types/auth.types';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Show in bottom nav on mobile */
  bottomNav?: boolean;
}

/* ── Inline SVG icons (20×20) ──────────────────── */

const DashboardIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="2" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="12" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="9" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const CalendarIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2.5 7.5H17.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6.5 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13.5 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ProfileIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3.5 17.5C3.5 14.186 6.186 11.5 9.5 11.5H10.5C13.814 11.5 16.5 14.186 16.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const QueueIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IntakeIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 10.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DocumentsIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 3C4 2.448 4.448 2 5 2H11L16 7V17C16 17.552 15.552 18 15 18H5C4.448 18 4 17.552 4 17V3Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 2V7H16" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const UsersIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1.5 17C1.5 14.239 3.739 12 6.5 12H8.5C11.261 12 13.5 14.239 13.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="14" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 12C17.209 12 19 13.791 19 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const AuditIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 6H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 9.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="14" cy="14" r="3.5" fill="white" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M13 14L14 15L16 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MetricsIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="12" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="8" y="7" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="14" y="2" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const DeptIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 8V5C7 3.343 8.343 2 10 2V2C11.657 2 13 3.343 13 5V8" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="13" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const MoreIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
    <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
    <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
  </svg>
);

const ClinicalIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 6V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ── Role-based navigation configs ─────────────── */

const patientNavItems: NavItemConfig[] = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: DashboardIcon, bottomNav: true },
  { to: '/appointments/book', label: 'Book Appointment', icon: CalendarIcon, bottomNav: true },
  { to: '/intake/ai', label: 'Patient Intake', icon: IntakeIcon, bottomNav: true },
  { to: '/intake/manual', label: 'Manual Intake', icon: IntakeIcon },
];

const staffNavItems: NavItemConfig[] = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: DashboardIcon, bottomNav: true },
  { to: '/staff/queue', label: 'Queue', icon: QueueIcon, bottomNav: true },
  { to: '/staff/appointments/book', label: 'Book for Patient', icon: CalendarIcon, bottomNav: true },
  { to: '/intake/ai', label: 'AI Intake', icon: IntakeIcon },
  { to: '/intake/manual', label: 'Manual Intake', icon: IntakeIcon },
];

const doctorNavItems: NavItemConfig[] = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: DashboardIcon, bottomNav: true },
  { to: '/staff/queue', label: 'Queue', icon: QueueIcon, bottomNav: true },
  { to: '/intake/ai', label: 'AI Intake', icon: IntakeIcon },
];

const adminNavItems: NavItemConfig[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon, bottomNav: true },
  { to: '/admin/users', label: 'Users', icon: UsersIcon, bottomNav: true },
  { to: '/admin/departments', label: 'Departments', icon: DeptIcon, bottomNav: true },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: AuditIcon },
  { to: '/admin/metrics', label: 'Metrics', icon: MetricsIcon },
  { to: '/staff/queue', label: 'Queue', icon: QueueIcon },
];

export function getNavItems(role: UserRole | undefined): NavItemConfig[] {
  switch (role) {
    case 'patient': return patientNavItems;
    case 'staff':   return staffNavItems;
    case 'doctor':  return doctorNavItems;
    case 'admin':   return adminNavItems;
    default:        return [];
  }
}

export { MoreIcon, ProfileIcon, DocumentsIcon, ClinicalIcon, DashboardIcon };
