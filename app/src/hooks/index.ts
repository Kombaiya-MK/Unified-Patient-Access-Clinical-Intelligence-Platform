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

// Appointment Booking Hooks (US_013 TASK_001)
export { useSlots, useAvailableDates } from './useSlots';
export { useBooking, useWaitlist } from './useBooking';

// Queue Management Hooks (US_020 TASK_001)
export { useQueueData } from './useQueueData';

// This file will be populated as hooks are added
export {};
