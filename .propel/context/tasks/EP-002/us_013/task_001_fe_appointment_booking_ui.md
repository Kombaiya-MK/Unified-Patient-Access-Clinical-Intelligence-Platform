# Task - TASK_001_FE_APPOINTMENT_BOOKING_UI

## Requirement Reference
- User Story: US_013
- Story Location: `.propel/context/tasks/us_013/us_013.md`
- Acceptance Criteria:
    - AC1: Booking page (SCR-006) displays calendar with available dates highlighted, department dropdown, provider dropdown (filtered by department), time slot grid for selected date
    - AC2: Selected slot triggers "Book Appointment" → creates appointment, updates dashboard (SCR-002), triggers calendar sync
    - AC3: Unavailable slot shows "Add to Waitlist" option
    - AC4: PDF confirmation includes appointment details, QR code
- Edge Cases:
    - Slot becomes unavailable between selection and submission: Display error "This slot was just taken", refresh available slots
    - Booking outside business hours: Only show slots within configured hours
    - Calendar sync fails: Complete booking, show warning "Calendar sync failed - add manually" with retry
    - Same-day appointments: Allow if slot available and >2 hours from current time

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-006, #SCR-002 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-006-appointment-booking.html, .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | SCR-006 (Appointment Booking), SCR-002 (Patient Dashboard confirmation) |
| **UXR Requirements** | UXR-001 (Max 3 clicks), UXR-002 (Clear hierarchy), UXR-101 (WCAG AA), UXR-201 (Mobile-first), UXR-402 (Optimistic UI) |
| **Design Tokens** | Calendar: Available (green #28A745), Unavailable (gray #6C757D), Selected (blue #007BFF); Time slots: 30-min intervals; Responsive: Mobile 375px+, Tablet 768px+ (2-col), Desktop 1024px+ (3-col) |

**Note**: PDF generation and calendar sync handled in separate backend tasks

> **Wireframe Components (SCR-006):**
> - Calendar: Month view, available dates green, unavailable gray, selected blue, keyboard nav (arrow keys)
> - Department dropdown: Searchable select (react-select), loads active departments
> - Provider dropdown: Dynamically filtered by department, shows provider name + specialty
> - Time slot grid: 30-minute intervals (8AM-8PM), available slots as buttons, booked slots disabled/grayed
> - Slot details panel: Selected date/time, provider name, duration, "Book" + "Add to Waitlist" buttons
> - Loading states: Skeleton screens for slots (<500ms), spinner for booking action
> - Accessibility: ARIA labels, keyboard Tab/Enter, screen reader announcements

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | react-calendar | 4.x |
| Frontend | react-select | 5.x |
| Frontend | Axios | 1.x |
| Backend | Express (API) | 4.x |
| Database | N/A (FE only) | N/A |
| AI/ML | N/A | N/A |

**Note**: All UI components MUST follow React 18.2, TypeScript 5.3, WCAG 2.2 AA standards

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI features - booking UI only (AI intake is US_025)

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive Web - Mobile-first) |
| **Platform Target** | Web (Responsive) |
| **Min OS Version** | iOS 14+, Android 10+ (browser support) |
| **Mobile Framework** | React (Responsive Web App) |

> **Note**: Mobile-first responsive design: Single-column on mobile (<768px), 2-column on tablet, 3-column on desktop

## Task Overview
Implement Appointment Booking page (SCR-006) with calendar view (react-calendar), department/provider dropdowns (react-select), dynamic time slot grid (30-min intervals), optimistic UI updates (instant feedback before API), slot conflict detection ("This slot was just taken"), waitlist option for unavailable slots. Integrates with GET /api/slots, POST /api/appointments. Follows wireframe-SCR-006-appointment-booking.html layout. WCAG 2.2 AA compliant (keyboard nav, ARIA labels, 4.5:1 contrast).

## Dependent Tasks
- US_001: React frontend setup
- US_009 Task 001: Authentication (protected route)
- US_019: Patient dashboard (to display booked appointments)
- US_013 Task 002: Booking API endpoints (to be created)

## Impacted Components
**New:**
- app/src/pages/AppointmentBookingPage.tsx (Main booking page layout)
- app/src/components/AppointmentCalendar.tsx (Calendar component with react-calendar)
- app/src/components/TimeSlotsGrid.tsx (Time slot buttons grid)
- app/src/components/AvailabilityFilters.tsx (Department/Provider dropdowns)
- app/src/components/BookingConfirmation.tsx (Confirmation modal)
- app/src/hooks/useSlots.ts (Fetch available slots with caching)
- app/src/hooks/useBooking.ts (Create appointment with optimistic updates)
- app/src/services/appointmentService.ts (API calls: getSlots, bookAppointment, joinWaitlist)
- app/src/types/appointment.types.ts (Slot, Appointment, Department, Provider interfaces)
- app/src/styles/AppointmentBookingPage.module.css (Scoped styles, responsive grid)

## Implementation Plan
1. **Install dependencies**: `npm install react-calendar react-select date-fns`
2. **Create types**: Slot {id, startTime, endTime, isAvailable, providerId, departmentId}, Department, Provider, Appointment
3. **Create appointmentService**:
   - getSlots(departmentId, providerId, date): GET /api/slots?department=X&provider=Y&date=Z
   - bookAppointment(payload): POST /api/appointments {patientId, slotId, notes}
   - joinWaitlist(payload): POST /api/waitlist {patientId, slotId, preferredDate}
4. **Create useSlots hook**: Fetch slots with React Query (caching 5 min, refetch on window focus)
5. **Create useBooking hook**: Optimistic updates (immediate UI feedback), rollback on error, show toast on success
6. **Create AppointmentCalendar component**:
   - react-calendar with custom tileContent (highlight available dates green)
   - onClickDay: Update selected date, trigger slot fetch
   - Keyboard navigation: Arrow keys, Enter to select
7. **Create AvailabilityFilters component**:
   - Department react-select: Load from GET /api/departments, onChange filter providers
   - Provider react-select: Load providers filtered by department, onChange filter slots
8. **Create TimeSlotsGrid component**:
   - Map slots to 30-min grid (8AM-8PM)
   - Available slots: Button (green border, clickable)
   - Booked slots: Button (gray, disabled)
   - Selected slot: Button (blue background)
   - onClick: Update selected slot, enable "Book" button
9. **Create BookingConfirmation modal**:
   - Show selected date/time, provider, department
   - "Confirm Booking" button (calls useBooking.bookAppointment)
   - Loading state (spinner, disabled button)
   - Success: Navigate to /dashboard, show toast "Appointment booked successfully!"
   - Error: Show inline error, allow retry
10. **Create AppointmentBookingPage layout**:
    - Header: "Book Appointment"
    - Section 1: AvailabilityFilters (department, provider dropdowns)
    - Section 2: AppointmentCalendar (left column desktop, stacked mobile)
    - Section 3: TimeSlotsGrid (right column desktop, stacked mobile)
    - Section 4: Slot details panel + "Book" + "Add to Waitlist" buttons
    - BookingConfirmation modal (conditionally rendered)
11. **Implement optimistic UI**: Update UI immediately on slot selection, show loading spinner, revert if API fails
12. **Handle conflicts**: If POST /appointments returns 409 Conflict ("Slot already booked"), display error + refresh slots
13. **Add loading skeletons**: Show skeleton grid during slot fetch (<500ms)
14. **Test responsive**: Mobile (single column), tablet (2 columns), desktop (3 columns)

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_001, US_012 login)
│   ├── src/
│   │   ├── pages/ (LoginPage exists)
│   │   ├── components/ (LoginForm exists)
│   │   ├── hooks/ (useAuth exists)
│   │   ├── services/ (authService exists)
│   │   └── types/ (auth.types exists)
│   └── package.json
└── server/ (booking API endpoints to be created in Task 002)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/AppointmentBookingPage.tsx | Main booking page with header, filters, calendar, slots, confirmation |
| CREATE | app/src/components/AppointmentCalendar.tsx | react-calendar wrapper with available date highlighting |
| CREATE | app/src/components/TimeSlotsGrid.tsx | 30-min slot grid (8AM-8PM), available/booked/selected states |
| CREATE | app/src/components/AvailabilityFilters.tsx | Department + Provider react-select dropdowns |
| CREATE | app/src/components/BookingConfirmation.tsx | Confirmation modal with selected slot details |
| CREATE | app/src/hooks/useSlots.ts | React Query hook for fetching slots with caching |
| CREATE | app/src/hooks/useBooking.ts | Booking mutation with optimistic updates |
| CREATE | app/src/services/appointmentService.ts | Axios calls: getSlots, bookAppointment, joinWaitlist |
| CREATE | app/src/types/appointment.types.ts | Slot, Appointment, Department, Provider, TimeSlotStatus interfaces |
| CREATE | app/src/styles/AppointmentBookingPage.module.css | Responsive grid, mobile-first, 4.5:1 contrast |
| UPDATE | app/src/App.tsx | Add route: /appointments/book → AppointmentBookingPage (protected) |
| UPDATE | app/package.json | Add dependencies: react-calendar, react-select, date-fns, @tanstack/react-query |

> Creates 10 new files, updates 2 existing files

## External References
- [react-calendar Documentation](https://www.npmjs.com/package/react-calendar)
- [react-select Documentation](https://react-select.com/)
- [date-fns Formatting](https://date-fns.org/docs/Getting-Started)
- [React Query (TanStack Query)](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Wireframe SCR-006](../../../.propel/context/wireframes/Hi-Fi/wireframe-SCR-006-appointment-booking.html)
- [UXR-402 Optimistic UI](../../../.propel/context/docs/spec.md#UXR-402)

## Build Commands
```bash
# Install dependencies
cd app
npm install react-calendar react-select date-fns @tanstack/react-query

# Development server
npm run dev  # Opens http://localhost:3000/appointments/book

# Build
npm run build

# Test
npm run test
```

## Implementation Validation Strategy
- [ ] Unit tests: AppointmentCalendar renders calendar, highlights available dates
- [ ] Unit tests: TimeSlotsGrid renders 30-min slots for selected date
- [ ] Integration tests: Selecting slot → clicking "Book" → appointment created
- [ ] react-calendar installed: package.json shows react-calendar@4.x
- [ ] react-select installed: package.json shows react-select@5.x
- [ ] Booking page renders: Navigate to /appointments/book → see calendar, dropdowns, slots grid
- [ ] Department dropdown populated: GET /api/departments → dropdown shows options
- [ ] Provider dropdown filtered: Select department → provider dropdown filtered by department
- [ ] Calendar highlights available dates: Dates with available slots highlighted green
- [ ] Slots grid displays correctly: Selected date → see 30-min slots (8AM-8PM), available (green), booked (gray)
- [ ] Slot selection works: Click available slot → selected (blue), "Book" button enabled
- [ ] Booking confirmation modal: Click "Book" → modal shows selected date/time/provider/department
- [ ] Optimistic UI update: Confirm booking → immediate UI feedback (slot turns gray, dashboard updated) before API response
- [ ] Conflict handling: Slot becomes unavailable (409 response) → display error "This slot was just taken", refresh slots
- [ ] Keyboard navigation: Tab through filters → calendar → slots → "Book" button, Enter to select
- [ ] ARIA labels: Use screen reader → verify calendar dates announced, slot times announced
- [ ] Color contrast: Browser DevTools → verify 4.5:1 minimum for all text/buttons
- [ ] Loading states: Fetching slots → skeleton grid, booking → spinner on button
- [ ] Waitlist option: Click unavailable slot → "Add to Waitlist" button visible
- [ ] Responsive layout: Mobile (375px single-column), tablet (768px 2-column), desktop (1024px 3-column)
- [ ] Same-day restriction: Today's date → slots <2 hours from now disabled/hidden

## Implementation Checklist
- [ ] Install dependencies: `cd app && npm install react-calendar react-select date-fns @tanstack/react-query`
- [ ] Create app/src/types/appointment.types.ts:
  - [ ] `export interface Slot { id: string; startTime: string; endTime: string; isAvailable: boolean; providerId: string; departmentId: string; duration: number; }`
  - [ ] `export interface Department { id: string; name: string; description: string; }`
  - [ ] `export interface Provider { id: string; name: string; specialty: string; departmentId: string; }`
  - [ ] `export interface Appointment { id: string; patientId: string; providerId: string; slotId: string; appointmentDate: string; status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'; }`
  - [ ] `export type TimeSlotStatus = 'available' | 'booked' | 'selected'`
- [ ] Create app/src/services/appointmentService.ts:
  - [ ] Import axios
  - [ ] `const API_URL = import.meta.env.VITE_API_URL + '/api'`
  - [ ] Implement getSlots(departmentId?, providerId?, date?): `axios.get('${API_URL}/slots', { params: { department: departmentId, provider: providerId, date } })`
  - [ ] Implement getDepartments(): `axios.get('${API_URL}/departments')`
  - [ ] Implement getProviders(departmentId?): `axios.get('${API_URL}/providers', { params: { department: departmentId } })`
  - [ ] Implement bookAppointment(payload): `axios.post('${API_URL}/appointments', payload, { headers: { Authorization: 'Bearer ${getToken()}' }})`
  - [ ] Implement joinWaitlist(payload): `axios.post('${API_URL}/waitlist', payload, { headers: { Authorization: 'Bearer ${getToken()}' }})`
- [ ] Create app/src/hooks/useSlots.ts:
  - [ ] Import useQuery from @tanstack/react-query
  - [ ] `export function useSlots(departmentId, providerId, date) { return useQuery({ queryKey: ['slots', departmentId, providerId, date], queryFn: () => appointmentService.getSlots(departmentId, providerId, date), staleTime: 5 * 60 * 1000, refetchOnWindowFocus: true }); }`
- [ ] Create app/src/hooks/useBooking.ts:
  - [ ] Import useMutation, useQueryClient
  - [ ] `export function useBooking() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (payload) => appointmentService.bookAppointment(payload), onMutate: async (newAppointment) => { /* Optimistic update: immediately update UI */ await queryClient.cancelQueries(['slots']); const previousSlots = queryClient.getQueryData(['slots']); queryClient.setQueryData(['slots'], (old) => markSlotBooked(old, newAppointment.slotId)); return { previousSlots }; }, onError: (err, variables, context) => { /* Rollback on error */ queryClient.setQueryData(['slots'], context.previousSlots); }, onSuccess: () => { queryClient.invalidateQueries(['slots']); queryClient.invalidateQueries(['appointments']); } }); }`
- [ ] Create app/src/components/AppointmentCalendar.tsx:
  - [ ] Import Calendar from 'react-calendar'
  - [ ] Props: selectedDate, onDateChange, availableDates[]
  - [ ] Custom tileContent: Check if date in availableDates → add green dot indicator
  - [ ] Custom tileClassName: Selected (blue background), available (green border), unavailable (gray)
  - [ ] onClickDay: Call onDateChange(date)
  - [ ] ARIA labels: aria-label="Select appointment date", role="application"
- [ ] Create app/src/components/AvailabilityFilters.tsx:
  - [ ] Import Select from 'react-select'
  - [ ] Fetch departments: useQuery(['departments'], getDepartments)
  - [ ] Fetch providers: useQuery(['providers', selectedDepartment], () => getProviders(selectedDepartment))
  - [ ] Render: Department Select + Provider Select (stacked vertically on mobile, side-by-side on desktop)
  - [ ] onChange: Update parent state (selectedDepartment, selectedProvider)
  - [ ] ARIA labels: aria-label="Select department", aria-label="Select provider"
- [ ] Create app/src/components/TimeSlotsGrid.tsx:
  - [ ] Props: slots[], selectedSlot, onSlotSelect
  - [ ] Generate time labels: 8:00 AM, 8:30 AM, ..., 8:00 PM (use date-fns format)
  - [ ] Map slots to buttons: Available (green border, clickable), Booked (gray, disabled), Selected (blue background)
  - [ ] onClick slot: Call onSlotSelect(slot.id)
  - [ ] Responsive grid: CSS Grid with auto-fill, min-width 120px
  - [ ] ARIA labels: aria-label="${format(slot.startTime, 'h:mm a')} with ${provider.name}", aria-pressed={selected}
- [ ] Create app/src/components/BookingConfirmation.tsx:
  - [ ] Props: isOpen, onClose, selectedSlot, provider, department
  - [ ] Import useBooking hook
  - [ ] Render modal (overlay + card):
    - [ ] Header: "Confirm Appointment"
    - [ ] Body: Date, Time, Provider, Department (formatted nicely)
    - [ ] Footer: "Cancel" button, "Confirm Booking" button (primary)
  - [ ] onConfirm: Call booking.mutate({ slotId, patientId, notes }), show loading spinner
  - [ ] onSuccess: Navigate to /dashboard, show toast "Appointment booked!"
  - [ ] onError: Display error message inline, allow retry
  - [ ] Accessibility: Focus trapped in modal, Esc to close, focus returns to trigger
- [ ] Create app/src/pages/AppointmentBookingPage.tsx:
  - [ ] State: selectedDate, selectedDepartment, selectedProvider, selectedSlot, showConfirmation
  - [ ] Hooks: useSlots(selectedDepartment, selectedProvider, selectedDate)
  - [ ] Layout:
    - [ ] Header: "Book Appointment" (H1)
    - [ ] AvailabilityFilters component
    - [ ] Grid container (3 columns desktop, stacked mobile):
      - [ ] Column 1: AppointmentCalendar
      - [ ] Column 2: TimeSlotsGrid
      - [ ] Column 3: Slot details panel (show when slot selected)
    - [ ] BookingConfirmation modal (if showConfirmation)
  - [ ] Slot details panel:
    - [ ] Selected date/time, provider name, estimated duration
    - [ ] "Book Appointment" button (primary), "Add to Waitlist" button (secondary) if slot unavailable
    - [ ] onClick "Book": Set showConfirmation=true
  - [ ] Loading states: Skeleton grid during useSlots loading
- [ ] Create app/src/styles/AppointmentBookingPage.module.css:
  - [ ] Grid layout: `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem;`
  - [ ] Media query @media (max-width: 1024px): 2 columns
  - [ ] Media query @media (max-width: 768px): 1 column (stacked)
  - [ ] Slot buttons: padding 0.75rem, border-radius 4px, font-size 14px
  - [ ] Available slot: border 2px solid #28A745, background #fff, cursor pointer
  - [ ] Booked slot: border 1px solid #6C757D, background #E9ECEF, cursor not-allowed
  - [ ] Selected slot: background #007BFF, color #fff, border 2px solid #0056B3
  - [ ] Focus styles: outline 2px solid #007BFF, outline-offset 2px
  - [ ] Color contrast: All text 4.5:1 minimum
- [ ] Update app/src/App.tsx:
  - [ ] Import AppointmentBookingPage
  - [ ] Add protected route: <Route path="/appointments/book" element={<ProtectedRoute><AppointmentBookingPage /></ProtectedRoute>} />
  - [ ] Wrap App in QueryClientProvider from @tanstack/react-query
- [ ] Update app/package.json: Document appointment booking feature
- [ ] Test booking page:
  - [ ] `npm run dev` → navigate to /appointments/book
  - [ ] Verify calendar, dropdowns, slots grid render
- [ ] Test department/provider filtering:
  - [ ] Select department → verify providers filtered
  - [ ] Select provider → verify slots filtered
- [ ] Test slot selection:
  - [ ] Click available slot → verify selected (blue), "Book" button enabled
  - [ ] Click "Book" → confirmation modal opens
  - [ ] Confirm → verify appointment created, redirected to /dashboard
- [ ] Test conflict handling:
  - [ ] Simulate 409 response → verify error "This slot was just taken", slots refreshed
- [ ] Test keyboard navigation: Tab through all interactive elements, Enter to select
- [ ] Test responsive: 375px (mobile), 768px (tablet), 1024px (desktop)
- [ ] Document booking flow in app/README.md: Appointment booking process, optimistic UI strategy, error handling
