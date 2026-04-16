// Export custom React hooks
// Example:
// export { default as useAuth } from './useAuth';
// export { default as useForm } from './useForm';

// Audit Log Hooks (US_011 TASK_004)
export { useAuditLogs } from './useAuditLogs';

// Authentication Hooks (US_012 TASK_001)
export { useAuth } from './useAuth';

// Form Validation Hooks (US_012 TASK_002)
export { useFormValidation, useDebouncedValidation } from './useFormValidation';

// Async Validation Hook (US_047 TASK_002)
export { useAsyncValidation } from './useAsyncValidation';

// Form Error Tracking Hook (US_047 TASK_002)
export { useFormErrorTracking } from './useFormErrorTracking';

// Appointment Booking Hooks (US_013 TASK_001)
export { useSlots, useAvailableDates } from './useSlots';
export { useBooking, useWaitlist } from './useBooking';

// Queue Management Hooks (US_020 TASK_001)
export { useQueueData } from './useQueueData';

// User Management Hooks (US_035 TASK_002)
export { useUsers } from './useUsers';
export { useDepartments } from './useDepartments';

// Department & Provider Management Hooks (US_036 TASK_004)
export { useDepartmentManagement } from './useDepartmentManagement';
export { useProviders, useProviderSchedule, useProviderAppointments } from './useProviders';

// Insurance Verification Hooks (US_037 TASK_003)
export { useInsuranceVerification } from './useInsuranceVerification';

// Admin Metrics Hooks (US_039 TASK_002)
export { useAdminMetrics } from './useAdminMetrics';
