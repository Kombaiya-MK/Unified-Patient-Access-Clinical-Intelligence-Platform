# Task - TASK_001_FE_RESCHEDULE_MODAL_UI

## Requirement Reference
- User Story: US_014  
- Story Location: `.propel/context/tasks/us_014/us_014.md`
- Acceptance Criteria:
    - AC1: Click "Reschedule" on dashboard → select new slot → system updates appointment, sends email/PDF, triggers calendar sync, logs change, shows success message
- Edge Cases:
    - Cannot reschedule within 2 hours of appointment: Display error message
    - Max 3 reschedules per appointment: Show warning if limit reached
    - Slot becomes unavailable during reschedule: Show error, reload slots

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-002 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | SCR-002 (Patient Dashboard) |
| **UXR Requirements** | UXR-001 (Max 3 clicks), UXR-402 (Optimistic UI), UXR-501 (Inline validation) |
| **Design Tokens** | Modal overlay, calendar picker, slot grid (reuse from US_013) |

> **Wireframe Components:**
> - Reschedule button on appointment card (hover state)
> - Reschedule modal: Current details, calendar picker, slot selector, Confirm/Cancel
> - Loading state: "Updating appointment..." spinner
> - Success: Green toast notification + updated card

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | react-calendar | 4.x |
| Frontend | Axios | 1.x |
| Backend | N/A | N/A |
| Database | N/A | N/A |

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

> **Note**: UI component only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive web) |
| **Platform Target** | Web (Mobile-first) |
| **Min OS Version** | N/A |
| **Mobile Framework** | Responsive CSS |

> **Note**: Mobile-first responsive modal

## Task Overview
Implement reschedule functionality on patient dashboard (SCR-002). Add "Reschedule" button to AppointmentCard component (from US_013 TASK_006). Create RescheduleModal component displaying current appointment details, calendar picker for new date, and time slot selector (reuse components from US_013). Implement validation: disable dates within 2 hours, show warning if reschedule_count >= 3. Handle optimistic UI updates - immediately update appointment card, then sync with backend. Display success toast notification on completion. Handle errors gracefully (slot unavailable, time limit, API failures) with retry options.

## Dependent Tasks
- US_013 TASK_001: Calendar and time slot components must exist
- US_013 TASK_006: AppointmentCard component must exist
- US_014 TASK_002: Reschedule API must be implemented

## Impacted Components
**Modified:**
- app/src/components/dashboard/AppointmentCard.tsx (Add Reschedule button)
- app/src/context/AppointmentContext.tsx (Add updateAppointment method)

**New:**
- app/src/components/dashboard/RescheduleModal.tsx (Modal for rescheduling)
- app/src/hooks/useReschedule.ts (Custom hook for reschedule logic)
- app/src/components/common/Toast.tsx (Success/error toast notifications)
- app/src/utils/dateValidation.ts (Validate 2-hour restriction)
- app/src/styles/RescheduleModal.module.css (Modal styling)

## Implementation Plan
1. **Reschedule Button**: Add to AppointmentCard with conditional rendering (hide if appointment < 2 hours away)
2. **Reschedule Modal**: Create modal with current appointment summary
3. **Calendar Picker**: Reuse Calendar component from US_013, disable invalid dates
4. **Time Slot Selector**: Reuse TimeSlotGrid from US_013
5. **Validation**: Client-side check for 2-hour restriction, reschedule count limit
6. **API Call**: PUT /api/appointments/:id with new date/time
7. **Optimistic Update**: Update appointment in context immediately
8. **Success Toast**: Show "Appointment rescheduled successfully for [new date/time]"
9. **Error Handling**: Show error toast, revert optimistic update on failure
10. **Loading State**: Disable form during API call, show spinner
11. **Accessibility**: Modal focus trap, keyboard navigation, ARIA labels

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
│   ├── src/
│   │   ├── pages/
│   │   │   └── PatientDashboard.tsx (US_013 TASK_006)
│   │   ├── components/
│   │   │   ├── booking/ (US_013 TASK_001)
│   │   │   │   ├── Calendar.tsx
│   │   │   │   └── TimeSlotGrid.tsx
│   │   │   └── dashboard/
│   │   │       └── AppointmentCard.tsx (US_013 TASK_006)
│   │   └── context/
│   │       └── AppointmentContext.tsx (US_013 TASK_006)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/dashboard/RescheduleModal.tsx | Modal with calendar, slot picker, validation |
| CREATE | app/src/hooks/useReschedule.ts | Reschedule logic and API integration |
| CREATE | app/src/components/common/Toast.tsx | Toast notification component |
| CREATE | app/src/utils/dateValidation.ts | Validate 2-hour restriction, reschedule limits |
| CREATE | app/src/styles/RescheduleModal.module.css | Modal styles |
| MODIFY | app/src/components/dashboard/AppointmentCard.tsx | Add Reschedule button, trigger modal |
| MODIFY | app/src/context/AppointmentContext.tsx | Add updateAppointment method |

> 2 modified files, 5 new files created

## External References
- [React Modal Best Practices](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Optimistic UI Updates](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- [Toast Notifications](https://www.npmjs.com/package/react-toastify)
- [Date Validation with date-fns](https://date-fns.org/docs/Getting-Started)

## Build Commands
```bash
# Start development servers
cd server
npm run dev

cd app
npm start

# Test reschedule flow
# 1. Login as patient, navigate to /patient/dashboard
# 2. Hover over appointment card → "Reschedule" button appears
# 3. Click "Reschedule" → Modal opens with current details
# 4. Select new date and time slot
# 5. Click "Confirm Reschedule"
# Expected: Loading spinner → Success toast → Updated appointment card

# Test 2-hour restriction
# Try to reschedule appointment that's <2 hours away
# Expected: Reschedule button disabled or shows error message

# Test reschedule limit
# Reschedule same appointment 3 times
# Expected: After 3rd reschedule, button disabled with message "Maximum reschedules reached"

# Test slot unavailable
# Simulate concurrent booking: User A selects slot, User B books it first, User A confirms
# Expected: Error toast "Slot no longer available", slots refresh

# Test error handling
# Mock API failure
# Expected: Error toast "Failed to reschedule", appointment reverts to original

# Test accessibility
# Tab through modal, Esc to close, screen reader announces changes

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Reschedule button displays on appointment card
- [ ] Button hidden if appointment < 2 hours away
- [ ] Button disabled if reschedule_count >= 3
- [ ] Click button → Modal opens with current appointment details
- [ ] Modal displays calendar with available dates
- [ ] Calendar disables dates < 2 hours from now
- [ ] Select date → Time slots load for selected date
- [ ] Select slot → Confirm button enabled
- [ ] Click Confirm → Loading spinner, API call
- [ ] Optimistic update: Card updates immediately
- [ ] Success toast: "Appointment rescheduled successfully for [new date/time]"
- [ ] Slot unavailable error: Toast + slots refresh
- [ ] API failure: Error toast + revert to original
- [ ] Modal accessibility: Focus trap, Esc closes, ARIA labels
- [ ] Reschedule count increments in UI

## Implementation Checklist

### Date Validation Utility (app/src/utils/dateValidation.ts)
- [ ] Import date-fns: isAfter, addHours, parseISO, isBefore
- [ ] export const isTwoHoursAway = (appointmentDateTime: string): boolean => {
- [ ]   const appointmentTime = parseISO(appointmentDateTime);
- [ ]   const twoHoursFromNow = addHours(new Date(), 2);
- [ ]   return isAfter(appointmentTime, twoHoursFromNow);
- [ ] }
- [ ] export const canReschedule = (appointment: Appointment): { allowed: boolean, reason?: string } => {
- [ ]   const dateTime = `${appointment.appointment_date}T${appointment.start_time}`;
- [ ]   if (!isTwoHoursAway(dateTime)) {
- [ ]     return { allowed: false, reason: 'Cannot reschedule appointments within 2 hours of start time. Please call the office.' };
- [ ]   }
- [ ]   if (appointment.reschedule_count >= 3) {
- [ ]     return { allowed: false, reason: 'Maximum reschedules (3) reached for this appointment.' };
- [ ]   }
- [ ]   return { allowed: true };
- [ ] }

### Toast Component (app/src/components/common/Toast.tsx)
- [ ] Props: { message: string; type: 'success' | 'error' | 'warning'; duration?: number; onClose: () => void; }
- [ ] Use useEffect with timeout to auto-close after duration (default 5000ms)
- [ ] Render: <div className={`toast toast-${type}`} role="alert">
- [ ]   {type === 'success' && <CheckIcon />}
- [ ]   {type === 'error' && <ErrorIcon />}
- [ ]   {type === 'warning' && <WarningIcon />}
- [ ]   <span>{message}</span>
- [ ]   <button onClick={onClose} aria-label="Close notification">×</button>
- [ ] </div>
- [ ] CSS: Position fixed bottom-right, slide-in animation, auto-dismiss

### Reschedule Hook (app/src/hooks/useReschedule.ts)
- [ ] Import useState, axios, useAppointments, canReschedule
- [ ] export const useReschedule = () => {
- [ ]   const [rescheduleData, setRescheduleData] = useState<{ appointment: Appointment | null, newDate: Date | null, newSlot: TimeSlot | null }>({ appointment: null, newDate: null, newSlot: null })
- [ ]   const [loading, setLoading] = useState(false)
- [ ]   const [error, setError] = useState<string | null>(null)
- [ ]   const [showModal, setShowModal] = useState(false)
- [ ]   const { updateAppointment } = useAppointments()
- [ ]   const openRescheduleModal = (appointment: Appointment) => {
- [ ]     const validation = canReschedule(appointment);
- [ ]     if (!validation.allowed) {
- [ ]       setError(validation.reason);
- [ ]       return;
- [ ]     }
- [ ]     setRescheduleData({ appointment, newDate: null, newSlot: null });
- [ ]     setShowModal(true);
- [ ]   };
- [ ]   const reschedule = async () => {
- [ ]     if (!rescheduleData.appointment || !rescheduleData.newDate || !rescheduleData.newSlot) return;
- [ ]     setLoading(true); setError(null);
- [ ]     const originalAppointment = { ...rescheduleData.appointment };
- [ ]     try {
- [ ]       // Optimistic update
- [ ]       const updatedAppointment = {
- [ ]         ...rescheduleData.appointment,
- [ ]         appointment_date: formatDate(rescheduleData.newDate),
- [ ]         start_time: rescheduleData.newSlot.start_time,
- [ ]         end_time: rescheduleData.newSlot.end_time
- [ ]       };
- [ ]       updateAppointment(updatedAppointment);
- [ ]       // API call
- [ ]       const response = await axios.put(`/api/appointments/${rescheduleData.appointment.id}`, {
- [ ]         appointment_date: formatDate(rescheduleData.newDate),
- [ ]         start_time: rescheduleData.newSlot.start_time,
- [ ]         end_time: rescheduleData.newSlot.end_time
- [ ]       });
- [ ]       setShowModal(false);
- [ ]       return { success: true, appointment: response.data };
- [ ]     } catch (err) {
- [ ]       // Revert optimistic update
- [ ]       updateAppointment(originalAppointment);
- [ ]       const errorMessage = err.response?.data?.message || 'Failed to reschedule appointment';
- [ ]       setError(errorMessage);
- [ ]       return { success: false, error: errorMessage };
- [ ]     } finally {
- [ ]       setLoading(false);
- [ ]     }
- [ ]   };
- [ ]   return { rescheduleData, setRescheduleData, loading, error, showModal, openRescheduleModal, closeModal: () => setShowModal(false), reschedule };
- [ ] }

### Reschedule Modal (app/src/components/dashboard/RescheduleModal.tsx)
- [ ] Import Calendar, TimeSlotGrid (from US_013), useAvailableSlots, formatDate, formatTime
- [ ] Props: { appointment: Appointment; onClose: () => void; onConfirm: () => Promise<{ success: boolean, error?: string }>; }
- [ ] State: const [selectedDate, setSelectedDate] = useState<Date | null>(null)
- [ ] State: const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
- [ ] State: const [loading, setLoading] = useState(false)
- [ ] Fetch slots: const { slots, loading: slotsLoading } = useAvailableSlots(selectedDate, appointment.provider_id)
- [ ] Render modal: <div className="modal-overlay" onClick={onClose}>
- [ ]   <div className="modal-content" onClick={(e) => e.stopPropagation()}>
- [ ]     <div className="modal-header"><h2>Reschedule Appointment</h2><button onClick={onClose} aria-label="Close">×</button></div>
- [ ]     <div className="modal-body">
- [ ]       <div className="current-appointment"><h3>Current Appointment</h3><p>Date: {formatDate(appointment.appointment_date)}</p><p>Time: {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p><p>Provider: {appointment.provider_name}</p></div>
- [ ]       <div className="new-appointment"><h3>Select New Date & Time</h3><Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} availableDates={[/* fetch available dates */]} /><TimeSlotGrid slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} loading={slotsLoading} /></div>
- [ ]     </div>
- [ ]     <div className="modal-footer"><button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button><button onClick={async () => { setLoading(true); const result = await onConfirm(); setLoading(false); if (result.success) onClose(); }} disabled={!selectedDate || !selectedSlot || loading} className="btn-primary">{loading ? 'Updating...' : 'Confirm Reschedule'}</button></div>
- [ ]   </div>
- [ ] </div>

### Update AppointmentCard (app/src/components/dashboard/AppointmentCard.tsx)
- [ ] Import useReschedule, canReschedule, Toast
- [ ] const { openRescheduleModal, showModal, rescheduleData, setRescheduleData, reschedule, closeModal, loading, error } = useReschedule()
- [ ] State: const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
- [ ] Check if can reschedule: const rescheduleValidation = canReschedule(appointment)
- [ ] Add Reschedule button to card footer:
- [ ] <button onClick={() => openRescheduleModal(appointment)} disabled={!rescheduleValidation.allowed} className="btn-secondary" title={rescheduleValidation.reason}>{appointment.reschedule_count >= 3 ? 'Max Reschedules' : 'Reschedule'}</button>
- [ ] Render modal: {showModal && <RescheduleModal appointment={rescheduleData.appointment} onClose={closeModal} onConfirm={async () => { const result = await reschedule(); if (result.success) { setToast({ message: `Appointment rescheduled successfully for ${formatDate(rescheduleData.newDate)}`, type: 'success' }); } else { setToast({ message: result.error, type: 'error' }); } return result; }} />}
- [ ] Render toast: {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

### Update AppointmentContext (app/src/context/AppointmentContext.tsx)
- [ ] Add updateAppointment method to context:
- [ ] const updateAppointment = (updatedAppointment: Appointment) => {
- [ ]   setAppointments(prev => prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt));
- [ ] };
- [ ] Export in context value: { appointments, addAppointment, updateAppointment, refreshAppointments, loading }

### Modal Styles (app/src/styles/RescheduleModal.module.css)
- [ ] Reuse modal styles from ConfirmationModal (US_013 TASK_006)
- [ ] .current-appointment { background: #F3F4F6; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
- [ ] .new-appointment h3 { margin-bottom: 12px; }
- [ ] .modal-body { max-height: 70vh; overflow-y: auto; }

### Validation and Testing
- [ ] Start servers, login as patient
- [ ] Navigate to /patient/dashboard
- [ ] Hover over appointment card → Reschedule button visible
- [ ] Click Reschedule → Modal opens with current appointment details
- [ ] Select new date → Time slots load
- [ ] Select time slot → Confirm button enabled
- [ ] Click Confirm Reschedule → Loading spinner
- [ ] Success: Toast "Appointment rescheduled successfully", card updates
- [ ] Test 2-hour restriction: Appointment < 2 hours away → Button disabled
- [ ] Test reschedule limit: After 3 reschedules → Button shows "Max Reschedules"
- [ ] Test slot unavailable: Mock 409 response → Error toast, slots refresh
- [ ] Test API failure: Mock 500 error → Error toast, appointment reverts
- [ ] Test accessibility: Tab through modal, Esc closes
- [ ] Verify: Backend updated, email sent, calendar synced (via TASK_002)
