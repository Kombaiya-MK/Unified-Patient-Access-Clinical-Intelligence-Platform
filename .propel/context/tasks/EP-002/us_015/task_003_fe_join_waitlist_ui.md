# Task - TASK_003_FE_JOIN_WAITLIST_UI

## Requirement Reference
- User Story: US_015  
- Story Location: `.propel/context/tasks/us_015/us_015.md`
- Acceptance Criteria:
    - AC1: Click "Join Waitlist" → confirm → system adds to waitlist, sends confirmation "You're on the waitlist for [date/time]. We'll notify you if it becomes available"
- Edge Cases:
    - Duplicate entry: Show error message
    - Slot becomes available during join: Allow immediate booking instead

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-002, #SCR-006 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html, wireframe-SCR-006-appointment-booking.html |
| **Screen Spec** | SCR-002 (Patient Dashboard), SCR-006 (Booking page) |
| **UXR Requirements** | UXR-001 (Quick join), UXR-401 (Fast notification) |
| **Design Tokens** | Yellow border button, modal overlay |

> **Wireframe Components:**
> - "Join Waitlist" button on booking page (yellow border, shown when slot full)
> - Waitlist confirmation modal: Message, patient email display, OK button
> - Dashboard waitlist section: Active entries with "Cancel Waitlist" option

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

> **Note**: Mobile-first responsive UI

## Task Overview
Implement "Join Waitlist" button on appointment booking page (SCR-006) when selected time slot is fully booked. Button displays with yellow border styling per wireframe. Click button → open JoinWaitlistModal with slot details (date, time, provider name), patient email display, and Confirm/Cancel buttons. On confirm, call POST /api/waitlist (US_015 TASK_002), show loading spinner, display success toast "You're on the waitlist for [date/time]. We'll notify you if it becomes available." Handle errors (duplicate entry: show "You're already on this waitlist", general error: show retry option). Add "My Waitlist" section to patient dashboard (SCR-002) displaying active waitlist entries in WaitlistCard components with Cancel button. Implement WaitlistContext for global state management. WCAG 2.2 AA compliance: keyboard navigation, ARIA labels, 4.5:1 contrast ratio.

## Dependent Tasks
- US_013 TASK_001: Booking page must exist
- US_013 TASK_006: Patient dashboard must exist
- US_015 TASK_002: Join Waitlist API must exist

## Impacted Components
**Modified:**
- app/src/pages/AppointmentBooking.tsx (Add Join Waitlist button, check slot capacity)
- app/src/pages/PatientDashboard.tsx (Add "My Waitlist" section)

**New:**
- app/src/components/waitlist/JoinWaitlistModal.tsx (Confirmation modal)
- app/src/components/waitlist/WaitlistCard.tsx (Display waitlist entry)
- app/src/components/waitlist/WaitlistSection.tsx (Dashboard waitlist section)
- app/src/context/WaitlistContext.tsx (Global waitlist state)
- app/src/hooks/useWaitlist.ts (Waitlist API integration)
- app/src/styles/Waitlist.module.css (Waitlist styling)

## Implementation Plan
1. **Join Waitlist Button**: Add to booking page, shown when slot is full
2. **Slot Capacity Check**: Query backend for slot availability, show Join Waitlist if full
3. **Join Waitlist Modal**: Create modal with slot details, email display, Confirm/Cancel
4. **Waitlist Context**: Create context for managing waitlist entries globally
5. **useWaitlist Hook**: Custom hook for API calls (joinWaitlist, getWaitlist, cancelWaitlist)
6. **API Call**: POST /api/waitlist with preferred date/time
7. **Success Toast**: Show confirmation message
8. **Error Handling**: Display duplicate entry error, general errors with retry
9. **Dashboard Section**: Add "My Waitlist" section with WaitlistCard components
10. **Cancel Waitlist**: Implement cancel button with confirmation prompt
11. **Accessibility**: Modal focus trap, keyboard nav, ARIA labels

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AppointmentBooking.tsx (US_013 TASK_001)
│   │   │   └── PatientDashboard.tsx (US_013 TASK_006)
│   │   ├── components/
│   │   │   ├── booking/ (US_013)
│   │   │   └── dashboard/
│   │   └── context/
│   │       └── AppointmentContext.tsx
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/waitlist/JoinWaitlistModal.tsx | Confirmation modal for joining waitlist |
| CREATE | app/src/components/waitlist/WaitlistCard.tsx | Card displaying waitlist entry |
| CREATE | app/src/components/waitlist/WaitlistSection.tsx | Dashboard section for waitlist |
| CREATE | app/src/context/WaitlistContext.tsx | Global waitlist state management |
| CREATE | app/src/hooks/useWaitlist.ts | Waitlist API integration hook |
| CREATE | app/src/styles/Waitlist.module.css | Waitlist component styles |
| MODIFY | app/src/pages/AppointmentBooking.tsx | Add Join Waitlist button logic |
| MODIFY | app/src/pages/PatientDashboard.tsx | Add WaitlistSection component |

> 2 modified files, 6 new files created

## External References
- [WCAG Modal Dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Context API](https://react.dev/reference/react/useContext)
- [Focus Trap](https://www.npmjs.com/package/focus-trap-react)

## Build Commands
```bash
# Start development servers
cd server
npm run dev

cd app
npm start

# Test join waitlist flow
# 1. Login as patient, navigate to /patient/book-appointment
# 2. Select provider, date, and fully-booked time slot
# 3. "Join Waitlist" button appears (yellow border)
# 4. Click "Join Waitlist" → Modal opens
# Expected: Modal shows slot details, patient email, Confirm/Cancel buttons

# 5. Click "Confirm" → Loading spinner
# Expected: Success toast "You're on the waitlist for [date/time]..."
# Expected: Modal closes

# 6. Navigate to /patient/dashboard
# Expected: "My Waitlist" section displays waitlist entry with Cancel button

# Test duplicate entry
# Try to join same slot again
# Expected: Error toast "You're already on this waitlist"

# Test cancel waitlist
# Click "Cancel Waitlist" on dashboard
# Expected: Confirmation prompt → Entry removed

# Test accessibility
# Tab through modal, Esc to close, screen reader announces slot details

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Join Waitlist button displays on booking page when slot is full
- [ ] Button has yellow border styling per wireframe
- [ ] Button hidden when slot has availability
- [ ] Click button → JoinWaitlistModal opens
- [ ] Modal displays slot details: date, time, provider name
- [ ] Modal displays patient email
- [ ] Modal has Confirm and Cancel buttons
- [ ] Click Confirm → Loading spinner, API call
- [ ] Success: Toast "You're on the waitlist...", modal closes
- [ ] Duplicate error: Toast "You're already on this waitlist"
- [ ] Dashboard "My Waitlist" section displays active entries
- [ ] WaitlistCard shows date, time, status, Cancel button
- [ ] Click Cancel → Confirmation prompt → API call → Entry removed
- [ ] Modal accessibility: Focus trap, Esc closes, ARIA labels
- [ ] Button is keyboard accessible (Tab, Enter to activate)

## Implementation Checklist

### Waitlist Hook (app/src/hooks/useWaitlist.ts)
- [ ] Import: useState, useEffect, axios
- [ ] export const useWaitlist = () => {
- [ ]   const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
- [ ]   const [loading, setLoading] = useState(false);
- [ ]   const [error, setError] = useState<string | null>(null);
- [ ]   const joinWaitlist = async (data: { preferred_date: string, preferred_time: string, preferred_appointment_id?: number }) => {
- [ ]     setLoading(true); setError(null);
- [ ]     try {
- [ ]       const response = await axios.post('/api/waitlist', data);
- [ ]       setWaitlist(prev => [...prev, response.data]);
- [ ]       return { success: true, data: response.data };
- [ ]     } catch (err) {
- [ ]       const errorMessage = err.response?.data?.error || 'Failed to join waitlist';
- [ ]       setError(errorMessage);
- [ ]       return { success: false, error: errorMessage };
- [ ]     } finally {
- [ ]       setLoading(false);
- [ ]     }
- [ ]   };
- [ ]   const fetchWaitlist = async () => {
- [ ]     setLoading(true);
- [ ]     try {
- [ ]       const response = await axios.get('/api/waitlist');
- [ ]       setWaitlist(response.data);
- [ ]     } catch (err) {
- [ ]       setError('Failed to load waitlist');
- [ ]     } finally {
- [ ]       setLoading(false);
- [ ]     }
- [ ]   };
- [ ]   const cancelWaitlist = async (id: number) => {
- [ ]     setLoading(true); setError(null);
- [ ]     try {
- [ ]       await axios.delete(`/api/waitlist/${id}`);
- [ ]       setWaitlist(prev => prev.filter(entry => entry.id !== id));
- [ ]       return { success: true };
- [ ]     } catch (err) {
- [ ]       const errorMessage = err.response?.data?.error || 'Failed to cancel waitlist';
- [ ]       setError(errorMessage);
- [ ]       return { success: false, error: errorMessage };
- [ ]     } finally {
- [ ]       setLoading(false);
- [ ]     }
- [ ]   };
- [ ]   useEffect(() => { fetchWaitlist(); }, []);
- [ ]   return { waitlist, loading, error, joinWaitlist, cancelWaitlist, refreshWaitlist: fetchWaitlist };
- [ ] };

### Waitlist Context (app/src/context/WaitlistContext.tsx)
- [ ] Import: createContext, useContext, ReactNode, useWaitlist
- [ ] interface WaitlistContextType { waitlist: WaitlistEntry[]; loading: boolean; error: string | null; joinWaitlist: (data: any) => Promise<any>; cancelWaitlist: (id: number) => Promise<any>; refreshWaitlist: () => Promise<void>; }
- [ ] const WaitlistContext = createContext<WaitlistContextType | undefined>(undefined);
- [ ] export const WaitlistProvider = ({ children }: { children: ReactNode }) => {
- [ ]   const waitlistData = useWaitlist();
- [ ]   return <WaitlistContext.Provider value={waitlistData}>{children}</WaitlistContext.Provider>;
- [ ] };
- [ ] export const useWaitlistContext = () => {
- [ ]   const context = useContext(WaitlistContext);
- [ ]   if (!context) throw new Error('useWaitlistContext must be used within WaitlistProvider');
- [ ]   return context;
- [ ] };

### Join Waitlist Modal (app/src/components/waitlist/JoinWaitlistModal.tsx)
- [ ] Import: formatDate, formatTime, useAuth
- [ ] Props: { isOpen: boolean; onClose: () => void; slotDetails: { date: string, time: string, provider_name: string, appointment_id?: number }; onConfirm: () => Promise<void>; }
- [ ] State: const [loading, setLoading] = useState(false)
- [ ] const { user } = useAuth()
- [ ] Render modal: <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="waitlist-modal-title">
- [ ]   <div className="modal-content" onClick={(e) => e.stopPropagation()}>
- [ ]     <div className="modal-header"><h2 id="waitlist-modal-title">Join Waitlist</h2><button onClick={onClose} aria-label="Close" className="close-button">×</button></div>
- [ ]     <div className="modal-body">
- [ ]       <p>You'll be notified if this appointment becomes available:</p>
- [ ]       <div className="slot-details"><strong>Date:</strong> {formatDate(slotDetails.date)}<br/><strong>Time:</strong> {formatTime(slotDetails.time)}<br/><strong>Provider:</strong> {slotDetails.provider_name}</div>
- [ ]       <p className="email-notice">Notification will be sent to: <strong>{user.email}</strong></p>
- [ ]     </div>
- [ ]     <div className="modal-footer"><button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button><button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }} disabled={loading} className="btn-primary btn-waitlist">{loading ? 'Joining...' : 'Confirm & Join Waitlist'}</button></div>
- [ ]   </div>
- [ ] </div>
- [ ] Focus trap: Use focus-trap-react or manual Tab handling

### Waitlist Card (app/src/components/waitlist/WaitlistCard.tsx)
- [ ] Props: { entry: WaitlistEntry; onCancel: (id: number) => Promise<void>; }
- [ ] State: const [showCancelConfirm, setShowCancelConfirm] = useState(false)
- [ ] const [cancelling, setCancelling] = useState(false)
- [ ] Render card: <div className="waitlist-card">
- [ ]   <div className="card-header"><h3>{formatDate(entry.preferred_date)} at {formatTime(entry.preferred_time)}</h3><span className={`status-badge status-${entry.status}`}>{entry.status}</span></div>
- [ ]   <div className="card-body"><p>Provider: {entry.provider_name || 'Any Available'}</p><p>Position: {entry.priority_score === 0 ? 'First come, first served' : `Priority ${entry.priority_score}`}</p><p>Joined: {formatDate(entry.created_at)}</p></div>
- [ ]   <div className="card-footer">{!showCancelConfirm ? (<button onClick={() => setShowCancelConfirm(true)} className="btn-secondary btn-cancel-waitlist">Cancel Waitlist</button>) : (<><p className="cancel-confirm-text">Are you sure?</p><button onClick={async () => { setCancelling(true); await onCancel(entry.id); setCancelling(false); }} disabled={cancelling} className="btn-danger">{cancelling ? 'Cancelling...' : 'Yes, Cancel'}</button><button onClick={() => setShowCancelConfirm(false)} className="btn-secondary">No, Keep It</button></>)}</div>
- [ ] </div>

### Waitlist Section (app/src/components/waitlist/WaitlistSection.tsx)
- [ ] Import: useWaitlistContext, WaitlistCard, Toast
- [ ] const { waitlist, loading, cancelWaitlist } = useWaitlistContext()
- [ ] State: const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
- [ ] const handleCancel = async (id: number) => {
- [ ]   const result = await cancelWaitlist(id);
- [ ]   if (result.success) {
- [ ]     setToast({ message: 'Waitlist entry cancelled', type: 'success' });
- [ ]   } else {
- [ ]     setToast({ message: result.error, type: 'error' });
- [ ]   }
- [ ] };
- [ ] Render: <section className="waitlist-section">
- [ ]   <h2>My Waitlist</h2>
- [ ]   {loading && <p>Loading waitlist...</p>}
- [ ]   {!loading && waitlist.length === 0 && <p className="empty-message">You're not on any waitlists. When you join a waitlist, it will appear here.</p>}
- [ ]   {!loading && waitlist.length > 0 && (<div className="waitlist-grid">{waitlist.map(entry => <WaitlistCard key={entry.id} entry={entry} onCancel={handleCancel} />)}</div>)}
- [ ]   {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
- [ ] </section>

### Update Booking Page (app/src/pages/AppointmentBooking.tsx)
- [ ] Import: useWaitlistContext, JoinWaitlistModal, Toast
- [ ] const { joinWaitlist } = useWaitlistContext()
- [ ] State: const [showWaitlistModal, setShowWaitlistModal] = useState(false)
- [ ] State: const [selectedSlotForWaitlist, setSelectedSlotForWaitlist] = useState<any>(null)
- [ ] State: const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
- [ ] Check slot capacity: After selecting time slot, query backend for availability
- [ ] If slot full: Show "Join Waitlist" button instead of "Book Appointment"
- [ ] <button onClick={() => { setSelectedSlotForWaitlist({ date: selectedDate, time: selectedSlot.start_time, provider_name: selectedProvider.name, appointment_id: selectedSlot.id }); setShowWaitlistModal(true); }} className="btn-waitlist">Join Waitlist</button>
- [ ] Render modal: {showWaitlistModal && <JoinWaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} slotDetails={selectedSlotForWaitlist} onConfirm={async () => { const result = await joinWaitlist({ preferred_date: selectedSlotForWaitlist.date, preferred_time: selectedSlotForWaitlist.time, preferred_appointment_id: selectedSlotForWaitlist.appointment_id }); if (result.success) { setToast({ message: `You're on the waitlist for ${formatDate(selectedSlotForWaitlist.date)} at ${formatTime(selectedSlotForWaitlist.time)}. We'll notify you if it becomes available.`, type: 'success' }); setShowWaitlistModal(false); } else { setToast({ message: result.error, type: 'error' }); } }} />}

### Update Dashboard (app/src/pages/PatientDashboard.tsx)
- [ ] Import: WaitlistSection
- [ ] Add <WaitlistSection /> below appointments section
- [ ] Wrap in WaitlistProvider at App.tsx level

### Styles (app/src/styles/Waitlist.module.css)
- [ ] .btn-waitlist { border: 2px solid #FFC107; background: white; color: #F57C00; font-weight: 600; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
- [ ] .btn-waitlist:hover { background: #FFF8E1; }
- [ ] .waitlist-section { margin-top: 32px; }
- [ ] .waitlist-card { border: 1px solid #E0E0E0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
- [ ] .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
- [ ] .status-waiting { background: #FFF8E1; color: #F57C00; }
- [ ] .status-notified { background: #E3F2FD; color: #1976D2; }
- [ ] .cancel-confirm-text { color: #D32F2F; margin-bottom: 8px; }

### Validation and Testing
- [ ] Start servers, login as patient
- [ ] Navigate to booking page, select fully-booked slot
- [ ] Join Waitlist button appears with yellow border
- [ ] Click button → Modal opens with slot details, patient email
- [ ] Click Confirm → Loading spinner → Success toast
- [ ] Navigate to dashboard → "My Waitlist" section shows entry
- [ ] Click Cancel Waitlist → Confirmation prompt → Entry removed
- [ ] Test duplicate: Try joining same slot → Error toast
- [ ] Test accessibility: Tab through modal, Esc closes, screen reader announces
- [ ] Test keyboard: Tab to Join Waitlist button, Enter to activate
- [ ] Verify contrast ratio: Yellow border button meets 4.5:1
