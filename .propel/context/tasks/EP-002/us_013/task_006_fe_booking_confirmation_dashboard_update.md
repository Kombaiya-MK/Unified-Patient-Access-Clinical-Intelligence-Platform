# Task - TASK_006_FE_BOOKING_CONFIRMATION_DASHBOARD_UPDATE

## Requirement Reference
- User Story: US_013  
- Story Location: `.propel/context/tasks/us_013/us_013.md`
- Acceptance Criteria:
    - AC2: After booking, system updates patient dashboard (SCR-002) with new appointment card
- Edge Cases:
    - Calendar sync fails: Complete booking, show warning "Calendar sync failed - add manually" with retry button

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|----|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-002 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | SCR-002 (Patient Dashboard) |
| **UXR Requirements** | UXR-402 (Optimistic UI updates) |
| **Design Tokens** | Success: green, Warning: yellow, Error: red, Card shadow: 0 2px 4px rgba(0,0,0,0.1) |

> **Wireframe Components:**
> - Confirmation modal: Success message, appointment details, calendar sync status, close/dashboard button
> - Dashboard appointment card: Date/time, provider, department, status badge, action buttons
> - Success state: Green checkmark icon, "Appointment Booked Successfully"
> - Warning state (sync failed): Yellow warning icon, "Calendar sync failed - add manually", retry button

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
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

> **Note**: Mobile-first responsive design

## Task Overview
Implement booking confirmation flow with success modal and automatic dashboard update. Create ConfirmationModal component showing appointment details, success message, and calendar sync status. Handle booking API response with optimistic UI updates. Display success state immediately, then sync appointment to dashboard. If calendar sync fails, show warning with retry button (non-blocking). Implement real-time dashboard update without page refresh - add new appointment card to dashboard state. Create AppointmentCard component with date/time, provider, department, status badge (Scheduled). Ensure smooth UX with loading states, success animations, and error handling.

## Dependent Tasks
- US_013 TASK_001: Appointment booking UI must exist
- US_013 TASK_002: Appointment booking API must be implemented
- US_019: Patient dashboard (for displaying appointments)

## Impacted Components
**Modified:**
- app/src/pages/AppointmentBookingPage.tsx (Add confirmation handling)
- app/src/pages/PatientDashboard.tsx (Add new appointment card on booking)

**New:**
- app/src/components/booking/ConfirmationModal.tsx (Success modal with appointment details)
- app/src/components/dashboard/AppointmentCard.tsx (Dashboard appointment card)
- app/src/hooks/useBookingConfirmation.ts (Handle booking and confirmation flow)
- app/src/context/AppointmentContext.tsx (Global appointment state)
- app/src/styles/ConfirmationModal.module.css (Modal styles)
- app/src/styles/AppointmentCard.module.css (Card styles)

## Implementation Plan
1. **Booking API Call**: Implement POST /api/appointments with appointment details
2. **Optimistic UI**: Show immediate success feedback before API completes
3. **Confirmation Modal**: Display success modal with appointment details
4. **Calendar Sync Status**: Show sync status (success, in progress, failed with retry)
5. **Dashboard Update**: Add new appointment to dashboard state without reload
6. **Appointment Card**: Create card component with appointment details
7. **Error Handling**: Handle API failures, show error modal with retry
8. **Loading States**: Spinner during booking, smooth transitions
9. **Routing**: Redirect to dashboard after confirmation (optional)
10. **State Management**: Use Context API or props to share appointment state
11. **Animations**: Success checkmark animation, card fade-in
12. **Accessibility**: Modal focus trap, keyboard close (Esc), ARIA labels

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AppointmentBookingPage.tsx (US_013 TASK_001)
│   │   │   └── PatientDashboard.tsx (US_012/US_019)
│   │   └── components/
│   │       └── booking/ (US_013 TASK_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/booking/ConfirmationModal.tsx | Success modal with appointment details and calendar sync status |
| CREATE | app/src/components/dashboard/AppointmentCard.tsx | Reusable appointment card for dashboard |
| CREATE | app/src/hooks/useBookingConfirmation.ts | Custom hook for booking and confirmation logic |
| CREATE | app/src/context/AppointmentContext.tsx | Global appointment state management |
| CREATE | app/src/styles/ConfirmationModal.module.css | Modal styling with animations |
| CREATE | app/src/styles/AppointmentCard.module.css | Card styling with hover effects |
| MODIFY | app/src/pages/AppointmentBookingPage.tsx | Integrate booking API call and show confirmation |
| MODIFY | app/src/pages/PatientDashboard.tsx | Consume appointment context, display cards |

> 2 modified files, 6 new files created

## External References
- [React Context API](https://react.dev/reference/react/useContext)
- [React Router Navigate](https://reactrouter.com/en/main/hooks/use-navigate)
- [Modal Accessibility](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Optimistic UI Updates](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Using_CSS_animations)

## Build Commands
```bash
# Start development servers
cd server
npm run dev

cd app
npm start

# Test booking confirmation flow
# 1. Login as patient, navigate to /patient/appointments/book
# 2. Select date, department, provider, time slot
# 3. Click "Book Appointment"
# Expected: Loading spinner → Success modal → Dashboard with new appointment

# Test calendar sync success
# Book appointment with calendar sync enabled
# Expected: Modal shows "Calendar synced successfully" with green checkmark

# Test calendar sync failure (simulate)
# Mock calendar API to fail
# Expected: Modal shows warning "Calendar sync failed - add manually" with retry button

# Test dashboard update
# After booking, navigate to /patient/dashboard
# Expected: New appointment card appears at top

# Test error handling
# Mock booking API to fail
# Expected: Error modal with "Failed to book appointment" and retry button

# Test accessibility
# Tab through modal: Focus trapped, Esc key closes modal
# Screen reader announces: Success message, appointment details

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Booking API call successful: Returns appointment with ID
- [ ] Optimistic UI: Loading spinner shown during request
- [ ] Confirmation modal displays on success
- [ ] Modal shows: Success checkmark, appointment details, calendar sync status
- [ ] Calendar sync success: Green checkmark, "Calendar synced"
- [ ] Calendar sync failure: Yellow warning, "Calendar sync failed - add manually", retry button
- [ ] Retry button triggers calendar sync again
- [ ] Dashboard updates automatically with new appointment card
- [ ] Appointment card shows: Date/time, provider, department, "Scheduled" badge
- [ ] Card styling: Shadow, hover effect, responsive
- [ ] Error handling: API failure shows error modal with retry
- [ ] Loading states: Smooth transitions, no flashing
- [ ] Modal accessibility: Focus trap, Esc to close, ARIA labels
- [ ] Routing: Optional redirect to dashboard after booking

## Implementation Checklist

### Appointment Context (app/src/context/AppointmentContext.tsx)
- [ ] Import React, createContext, useState, useEffect
- [ ] interface AppointmentContextType { appointments: Appointment[]; addAppointment: (appointment: Appointment) => void; refreshAppointments: () => Promise<void>; loading: boolean; }
- [ ] export const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined)
- [ ] export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
- [ ]   const [appointments, setAppointments] = useState<Appointment[]>([])
- [ ]   const [loading, setLoading] = useState(false)
- [ ]   const refreshAppointments = async () => {
- [ ]     setLoading(true);
- [ ]     try {
- [ ]       const response = await axios.get('/api/appointments/my');
- [ ]       setAppointments(response.data);
- [ ]     } catch (err) {
- [ ]       console.error('Failed to load appointments:', err);
- [ ]     } finally {
- [ ]       setLoading(false);
- [ ]     }
- [ ]   };
- [ ]   const addAppointment = (appointment: Appointment) => {
- [ ]     setAppointments(prev => [appointment, ...prev]);
- [ ]   };
- [ ]   useEffect(() => { refreshAppointments(); }, []);
- [ ]   return <AppointmentContext.Provider value={{ appointments, addAppointment, refreshAppointments, loading }}>{children}</AppointmentContext.Provider>;
- [ ] }
- [ ] export const useAppointments = () => {
- [ ]   const context = useContext(AppointmentContext);
- [ ]   if (!context) throw new Error('useAppointments must be used within AppointmentProvider');
- [ ]   return context;
- [ ] }

### Booking Confirmation Hook (app/src/hooks/useBookingConfirmation.ts)
- [ ] Import useState, axios, useAppointments
- [ ] export const useBookingConfirmation = () => {
- [ ]   const [booking, setBooking] = useState(false)
- [ ]   const [error, setError] = useState<string | null>(null)
- [ ]   const [confirmation, setConfirmation] = useState<any | null>(null)
- [ ]   const { addAppointment } = useAppointments()
- [ ]   const bookAppointment = async (bookingData: any) => {
- [ ]     setBooking(true); setError(null);
- [ ]     try {
- [ ]       const response = await axios.post('/api/appointments', bookingData);
- [ ]       const appointment = response.data;
- [ ]       setConfirmation(appointment);
- [ ]       addAppointment(appointment); // Optimistic update
- [ ]       return { success: true, appointment };
- [ ]     } catch (err) {
- [ ]       const errorMessage = err.response?.data?.message || 'Failed to book appointment';
- [ ]       setError(errorMessage);
- [ ]       return { success: false, error: errorMessage };
- [ ]     } finally {
- [ ]       setBooking(false);
- [ ]     }
- [ ]   };
- [ ]   const retryCalendarSync = async (appointmentId: number, provider: string) => {
- [ ]     try {
- [ ]       await axios.post('/api/calendar/sync', { appointmentId, provider });
- [ ]       return { success: true };
- [ ]     } catch (err) {
- [ ]       return { success: false, error: err.message };
- [ ]     }
- [ ]   };
- [ ]   const closeConfirmation = () => { setConfirmation(null); setError(null); };
- [ ]   return { bookAppointment, booking, error, confirmation, retryCalendarSync, closeConfirmation };
- [ ] }

### Confirmation Modal (app/src/components/booking/ConfirmationModal.tsx)
- [ ] Props: { appointment: Appointment | null; calendarSyncStatus: { attempted: boolean, success: boolean, error?: string }; onClose: () => void; onRetrySync?: () => void; }
- [ ] Render modal overlay: <div className="modal-overlay" onClick={onClose}>
- [ ]   <div className="modal-content" onClick={(e) => e.stopPropagation()}>
- [ ]     <div className="modal-header"><SuccessIcon className="success-icon" /><h2>Appointment Booked Successfully!</h2><button onClick={onClose} aria-label="Close modal" className="close-btn">×</button></div>
- [ ]     <div className="modal-body">
- [ ]       <div className="appointment-details">
- [ ]         <p><strong>Date:</strong> {formatDate(appointment.appointment_date)}</p>
- [ ]         <p><strong>Time:</strong> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p>
- [ ]         <p><strong>Provider:</strong> {appointment.provider_name}</p>
- [ ]         <p><strong>Department:</strong> {appointment.department_name}</p>
- [ ]         <p><strong>Appointment ID:</strong> {appointment.id}</p>
- [ ]       </div>
- [ ]       {calendarSyncStatus.attempted && (
- [ ]         <div className={`sync-status ${calendarSyncStatus.success ? 'success' : 'warning'}`}>
- [ ]           {calendarSyncStatus.success ? (
- [ ]             <><CheckIcon /> Calendar synced successfully</>
- [ ]           ) : (
- [ ]             <><WarningIcon /> Calendar sync failed - add manually {onRetrySync && <button onClick={onRetrySync} className="retry-btn">Retry</button>}</>
- [ ]           )}
- [ ]         </div>
- [ ]       )}
- [ ]       <p className="confirmation-note">A confirmation email with PDF has been sent to your registered email address.</p>
- [ ]     </div>
- [ ]     <div className="modal-footer"><button onClick={onClose} className="btn-primary">View Dashboard</button></div>
- [ ]   </div>
- [ ] </div>
- [ ] CSS: Add focus trap with useEffect, handle Esc key to close

### Appointment Card (app/src/components/dashboard/AppointmentCard.tsx)
- [ ] Props: { appointment: Appointment; }
- [ ] Render card: <div className="appointment-card">
- [ ]   <div className="card-header"><span className="date">{formatDate(appointment.appointment_date)}</span><span className={`status-badge status-${appointment.status}`}>{appointment.status}</span></div>
- [ ]   <div className="card-body">
- [ ]     <div className="time"><ClockIcon /> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</div>
- [ ]     <div className="provider"><UserIcon /> {appointment.provider_name}</div>
- [ ]     <div className="department"><BuildingIcon /> {appointment.department_name}</div>
- [ ]     {appointment.location && <div className="location"><LocationIcon /> {appointment.location}</div>}
- [ ]   </div>
- [ ]   <div className="card-footer"><button className="btn-secondary">Reschedule</button><button className="btn-secondary">Cancel</button></div>
- [ ] </div>
- [ ] CSS: .appointment-card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 16px; transition: box-shadow 0.2s; } .appointment-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
- [ ] CSS: .status-badge.status-scheduled { background: #D1FAE5; color: #059669; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }

### Update Booking Page (app/src/pages/AppointmentBookingPage.tsx)
- [ ] Import useBookingConfirmation, ConfirmationModal, useNavigate
- [ ] const { bookAppointment, booking, error, confirmation, retryCalendarSync, closeConfirmation } = useBookingConfirmation()
- [ ] const navigate = useNavigate()
- [ ] Update handleBook from TASK_001:
- [ ] const handleBook = async () => {
- [ ]   if (!bookingState.selectedDate || !bookingState.selectedProvider || !bookingState.selectedSlot) {
- [ ]     alert('Please select date, provider, and time slot');
- [ ]     return;
- [ ]   }
- [ ]   const bookingData = {
- [ ]     patient_id: user.id, // from auth context
- [ ]     provider_id: bookingState.selectedProvider.id,
- [ ]     department_id: bookingState.selectedDepartment.id,
- [ ]     appointment_date: formatDate(bookingState.selectedDate),
- [ ]     start_time: bookingState.selectedSlot.start_time,
- [ ]     end_time: bookingState.selectedSlot.end_time,
- [ ]     syncCalendar: true, // if user opted in
- [ ]     calendarProvider: 'google' // or 'outlook' based on user preference
- [ ]   };
- [ ]   const result = await bookAppointment(bookingData);
- [ ]   if (!result.success) {
- [ ]     alert(result.error); // Or show error modal
- [ ]   }
- [ ] };
- [ ] Render confirmation modal: {confirmation && <ConfirmationModal appointment={confirmation} calendarSyncStatus={confirmation.calendarSyncStatus || { attempted: false, success: false }} onClose={() => { closeConfirmation(); navigate('/patient/dashboard'); }} onRetrySync={() => retryCalendarSync(confirmation.id, 'google')} />}

### Update Patient Dashboard (app/src/pages/PatientDashboard.tsx)
- [ ] Import useAppointments, AppointmentCard
- [ ] const { appointments, loading } = useAppointments()
- [ ] Render appointments: <div className="appointments-section"><h2>My Appointments</h2>{loading ? <SkeletonLoader count={3} height="150px" /> : appointments.length === 0 ? <p>No upcoming appointments</p> : appointments.map(appointment => <AppointmentCard key={appointment.id} appointment={appointment} />)}</div>

### Wrap App with Context (app/src/App.tsx)
- [ ] Import AppointmentProvider
- [ ] Wrap routes: <AppointmentProvider><Routes>...</Routes></AppointmentProvider>

### Modal Styles (app/src/styles/ConfirmationModal.module.css)
- [ ] .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
- [ ] .modal-content { background: white; border-radius: 12px; max-width: 500px; width: 90%; padding: 24px; animation: slideIn 0.3s ease-out; }
- [ ] @keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
- [ ] .success-icon { width: 60px; height: 60px; color: #28A745; animation: checkmark 0.6s ease-in-out; }
- [ ] @keyframes checkmark { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
- [ ] .sync-status.success { color: #28A745; background: #D1FAE5; padding: 12px; border-radius: 8px; }
- [ ] .sync-status.warning { color: #FFC107; background: #FFF9E5; padding: 12px; border-radius: 8px; }

### Validation and Testing
- [ ] Wrap App with AppointmentProvider
- [ ] Start servers, login as patient
- [ ] Navigate to /patient/appointments/book
- [ ] Select date, department, provider, time slot
- [ ] Click "Book Appointment" → Loading spinner shows
- [ ] Success: Confirmation modal displays with appointment details
- [ ] Calendar sync success: Green checkmark, "Calendar synced"
- [ ] Close modal → Navigate to dashboard
- [ ] Dashboard: New appointment card appears at top
- [ ] Card shows: Date, time, provider, department, "Scheduled" badge
- [ ] Test calendar sync failure: Mock API to fail → Warning with retry button
- [ ] Click retry → Attempts sync again
- [ ] Test booking failure: Mock API error → Error modal with retry
- [ ] Test accessibility: Tab through modal, Esc closes, screen reader announces
- [ ] Verify: No page refresh needed, smooth transitions
