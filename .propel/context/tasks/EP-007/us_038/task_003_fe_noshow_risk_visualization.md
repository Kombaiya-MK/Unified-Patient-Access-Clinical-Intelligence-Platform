# Task - TASK_003_FE_NOSHOW_RISK_VISUALIZATION

## Requirement Reference
- User Story: US_038
- Story Location: .propel/context/tasks/us_038/us_038.md
- Acceptance Criteria:
    - Displays risk indicator in staff queue (SCR-009) as colored badge next to patient name
    - Color codes: Low Risk (<20%, green), Medium Risk (20-50%, yellow), High Risk (>50%, red)
    - Risk popover shows numeric risk score, top 3 contributing factors with icons, "Send Extra Reminder" button
    - Patient profile (SCR-011) displays risk details panel with contributing factors breakdown
    - Risk trend graph shows risk over time for last 12 months
    - Attendance summary shows X no-shows / Y total appointments = Z% no-show rate
    - Admin analytics dashboard shows distribution of risk categories, predicted vs actual no-shows for accuracy tracking
- Edge Case:
    - Brand new patients: Display "New Patient - Baseline Risk" tag
    - Perfect attendance: Display "Reliable Patient" tag
    - External factors note: Show "Historical factors only" disclaimer

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html, .propel/context/wireframes/Hi-Fi/wireframe-SCR-011-patient-profile.html |
| **Screen Spec** | figma_spec.md#SCR-009 (Staff Queue), figma_spec.md#SCR-011 (Patient Profile) |
| **UXR Requirements** | AIR-S04 (>75% prediction accuracy display), UXR-503 (Risk indicators with severity colors), UXR-202 (Data-driven insights) |
| **Design Tokens** | designsystem.md#colors (status-success, status-warning, status-error), designsystem.md#typography (badge, caption) |

> **Wireframe Details:**
> - **SCR-009 Staff Queue**: Risk badge next to patient name - Green "Low Risk ●" (<20%), Yellow "Med Risk ●●" (20-50%), Red "High Risk ●●●" (>50%). Click badge shows risk popover.
> - **Risk Popover**: Numeric risk score (e.g., "52% No-Show Risk"), top 3 contributing factors with icons (📅 "Weekend appointment +10%", ⚠️ "2 no-shows in last 3 months +25%", 💰 "Insurance issue +15%"), "Send Extra Reminder" button.
> - **SCR-011 Patient Profile - Appointment History Panel**: Risk Score column (%), risk trend graph (line chart last 12 months), attendance summary (X no-shows / Y total = Z% rate).
> - **Admin Analytics**: Dashboard showing risk category distribution pie chart, predicted vs actual no-shows table, top risk factors impact chart.

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference wireframe-SCR-009-queue-management.html and wireframe-SCR-011-patient-profile.html during implementation
- **MUST** match badge colors, popover layout, risk panel positioning from wireframes
- **MUST** implement all states: Default badge, hover with popover, loading state during recalculation
- **MUST** validate implementation against wireframe at breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)
- Run `/analyze-ux` after implementation to verify alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | recharts | 2.x (Risk trend chart) |
| Frontend | date-fns | 3.x (Date formatting) |
| Backend | Express | 4.18.x |
| Database | PostgreSQL | 15.x |
| AI/ML | N/A (Display ML results) | N/A |

**Note**: All code and libraries MUST be compatible with versions above. Must follow React 18.2, TypeScript 5.3, WCAG 2.2 AA accessibility standards.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (Display AI-generated risk scores) |
| **AIR Requirements** | AIR-S04 (Display >75% accuracy), AIR-006 (Predictive analytics visualization) |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Frontend displays ML model outputs with transparency (show factors, accuracy disclaimer)

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web (Responsive design) |
| **Min OS Version** | iOS 14+, Android 10+ (Safari, Chrome) |
| **Mobile Framework** | React (Responsive web) |

## Task Overview
Create no-show risk visualization components: (1) NoShowRiskBadge for Staff Queue - color-coded badge (<20% green, 20-50% yellow, >50% red) with dot indicators (● ●● ●●●), (2) RiskFactorsPopover - shows numeric risk score, top 3 contributing factors with icons and percentages, "Send Extra Reminder" button triggers notification, (3) NoShowRiskPanel for Patient Profile - displays current risk score, risk trend line chart (12 months), attendance summary (X no-shows / Y total = Z% rate), "Recalculate Risk" button, (4) AdminRiskAnalyticsDashboard - pie chart of risk distribution (low/medium/high), predicted vs actual no-shows table for accuracy validation, top risk factors impact bar chart, (5) Edge case tags: "New Patient - Baseline Risk" for new patients, "Reliable Patient" for perfect attendance, (6) Responsive design for mobile/tablet/desktop breakpoints, (7) WCAG AA accessibility with ARIA labels, keyboard navigation, screen reader support.

## Dependent Tasks
- US_038 - TASK_001_DB_NOSHOW_RISK_SCHEMA (database columns exist)
- US_038 - TASK_002_BE_NOSHOW_RISK_ML_ALGORITHM (API endpoints available)
- US-020 - TASK_001_FE_STAFF_QUEUE_UI (Staff Queue component exists)

## Impacted Components
- app/src/components/noshow-risk/NoShowRiskBadge.tsx - New badge component
- app/src/components/noshow-risk/RiskFactorsPopover.tsx - New popover component
- app/src/components/noshow-risk/NoShowRiskPanel.tsx - New panel for Patient Profile
- app/src/components/noshow-risk/RiskTrendChart.tsx - New line chart component
- app/src/components/noshow-risk/AdminRiskAnalyticsDashboard.tsx - New admin dashboard
- app/src/pages/StaffQueue.tsx - Modify to include NoShowRiskBadge in patient row
- app/src/pages/PatientProfile.tsx - Modify to include NoShowRiskPanel
- app/src/pages/AdminDashboard.tsx - Modify to include AdminRiskAnalyticsDashboard
- app/src/services/risk.service.ts - New API service
- app/src/types/risk.types.ts - TypeScript interfaces

## Implementation Plan
1. **Create Risk Types (risk.types.ts)**:
   - Interface RiskAssessment: {riskScore: number, category: 'low'|'medium'|'high', calculatedAt: string, factors: RiskFactor[]}
   - Interface RiskFactor: {name: string, contribution: number, icon: string}
   - Interface RiskTrendPoint: {date: string, riskScore: number}
   - Interface AttendanceSummary: {totalAppointments: number, noShowCount: number, noShowRate: number}
2. **Create Risk API Service (risk.service.ts)**:
   - Function getAppointmentRisk(appointmentId: string): Promise<RiskAssessment> → GET /api/risk/appointment/:id
   - Function calculateRisk(appointmentId: string): Promise<RiskAssessment> → POST /api/risk/calculate-noshow
   - Function getRiskTrend(patientId: string): Promise<RiskTrendPoint[]> → GET /api/risk/trend/:patientId
   - Function getAttendanceSummary(patientId: string): Promise<AttendanceSummary> → GET /api/risk/attendance/:patientId
   - Function getHighRiskPatients(): Promise<RiskAssessment[]> → GET /api/risk/high-risk-patients
   - Function sendExtraReminder(appointmentId: string): Promise<void> → POST /api/risk/extra-reminder
3. **NoShowRiskBadge Component**:
   - Props: {appointmentId: string, patientName: string, compact?: boolean}
   - Fetch risk: useEffect(() => riskService.getAppointmentRisk(appointmentId))
   - Show loading state: <Skeleton width={80} height={24} />
   - Render badge based on category:
     - low (<20%): Green background (#10B981), "Low Risk ●", aria-label="Low no-show risk, 15%"
     - medium (20-50%): Yellow background (#F59E0B), "Med Risk ●●", aria-label="Medium no-show risk, 35%"
     - high (>50%): Red background (#EF4444), "High Risk ●●●", aria-label="High no-show risk, 60%"
   - On hover: Show RiskFactorsPopover anchored to badge
   - Keyboard: Tab to focus badge, Enter/Space to toggle popover
   - Edge cases:
     - New patient: Badge shows "New Patient" tag with info icon, popover explains "Baseline Risk - No History"
     - Reliable patient: Badge shows "Reliable ✓" green, popover shows "Perfect Attendance"
4. **RiskFactorsPopover Component**:
   - Props: {riskAssessment: RiskAssessment, appointmentId: string, onClose: () => void}
   - Header: Numeric risk score "52% No-Show Risk" with large font
   - Body: List top 3 factors:
     - Factor row: Icon (📅 ⚠️ 💰 🏥 📍), Factor name, Contribution percentage (+25%)
     - Icons mapping: weekend → 📅, previous_noshows → ⚠️, insurance_issue → 💰, distance → 📍, new_patient → 👤
   - Footer: "Send Extra Reminder" button → onClick: riskService.sendExtraReminder(appointmentId), show success toast
   - Disclaimer: "Historical factors only. Accuracy ~78%." (from model_metadata.json)
   - Close: X button top-right, click outside, Escape key
   - Accessibility: role="dialog", aria-labelledby="risk-popover-title", focus trap
5. **NoShowRiskPanel Component**:
   - Props: {patientId: string}
   - Fetch data: useEffect(() => Promise.all([getRiskTrend(patientId), getAttendanceSummary(patientId)]))
   - Layout: Grid with 2 columns (desktop), 1 column (mobile)
   - Left column:
     - Current Risk Score: Large number "52%" with colored circle indicator
     - Risk Category: Badge "High Risk" (red)
     - Last Calculated: "2 hours ago" (date-fns formatDistanceToNow)
     - "Recalculate Risk" button → onClick: calculateRisk(latestAppointmentId), show loading spinner
   - Right column:
     - Risk Trend Chart: <RiskTrendChart data={trendData} /> - Line chart with X-axis: months (Jan-Dec), Y-axis: Risk % (0-100), threshold lines at 20% (green/yellow) and 50% (yellow/red)
     - Attendance Summary: "3 no-shows / 18 total appointments = 16.7% no-show rate"
   - Edge cases:
     - No risk data: Show "Risk not calculated yet. Click Recalculate Risk to analyze."
     - New patient: Show "New Patient - Baseline Risk 15%" with info tooltip
     - Perfect attendance: Show "Reliable Patient ✓" badge
6. **RiskTrendChart Component**:
   - Props: {data: RiskTrendPoint[]}
   - Use recharts: <LineChart data={data}><XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'MMM')} /><YAxis domain={[0, 100]} /><Line dataKey="riskScore" stroke="#3B82F6" strokeWidth={2} /><ReferenceLine y={20} stroke="#10B981" label="Low/Med" /><ReferenceLine y={50} stroke="#F59E0B" label="Med/High" /></LineChart>
   - Show tooltip on hover: "March: 52% High Risk"
   - Responsive: width="100%" height={300} for desktop, height={200} for mobile
7. **AdminRiskAnalyticsDashboard Component**:
   - Fetch data: useEffect(() => riskService.getRiskDistribution(), getRiskAccuracy())
   - Layout: Grid with 3 cards
   - Card 1 - Risk Distribution Pie Chart:
     - recharts PieChart: {low: 60%, medium: 30%, high: 10%}
     - Colors: low=#10B981, medium=#F59E0B, high=#EF4444
     - Legend with counts: "Low Risk (180 patients)", "Medium (90)", "High (30)"
   - Card 2 - Predicted vs Actual Table:
     - Table headers: Risk Category | Total Predicted | Actual No-Shows | Accuracy
     - Rows: High | 30 | 18 | 60%, Medium | 90 | 27 | 30%, Low | 180 | 18 | 10%
     - Overall accuracy footer: "Model Accuracy: 78%" (from model_metadata.json)
   - Card 3 - Top Risk Factors Bar Chart:
     - recharts BarChart: {previous_noshows: 35%, weekend_appointment: 20%, insurance_issue: 18%, distance: 15%, lead_time: 12%}
     - X-axis: Factor names, Y-axis: Average contribution %
     - Sort by contribution descending
   - Auto-refresh every 5 minutes: useEffect with interval
8. **Integrate into StaffQueue.tsx**:
   - Modify patient row to include NoShowRiskBadge after patient name
   - Column layout: Patient Name | <NoShowRiskBadge appointmentId={appt.id} compact /> | Appointment Time | Status
   - Mobile: Stack badge below patient name
9. **Integrate into PatientProfile.tsx**:
   - Add new tab "No-Show Risk" or section in "Appointment History" panel
   - Render <NoShowRiskPanel patientId={patient.id} />
   - Show/hide based on user role: Only visible to staff (not patients)
10. **Integrate into AdminDashboard.tsx**:
    - Add new section "No-Show Risk Analytics"
    - Render <AdminRiskAnalyticsDashboard />
    - Position after queue metrics, before user management

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── noshow-risk/ (to be created)
│   │   │   ├── NoShowRiskBadge.tsx (to be created)
│   │   │   ├── RiskFactorsPopover.tsx (to be created)
│   │   │   ├── NoShowRiskPanel.tsx (to be created)
│   │   │   ├── RiskTrendChart.tsx (to be created)
│   │   │   └── AdminRiskAnalyticsDashboard.tsx (to be created)
│   │   └── index.ts (update exports)
│   ├── pages/
│   │   ├── StaffQueue.tsx (exists from US-020, to be modified)
│   │   ├── PatientProfile.tsx (exists, to be modified)
│   │   └── AdminDashboard.tsx (exists from US-039, to be modified)
│   ├── services/
│   │   └── risk.service.ts (to be created)
│   └── types/
│       └── risk.types.ts (to be created)
└── package.json (add recharts@2.x dependency)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/types/risk.types.ts | TypeScript interfaces: RiskAssessment, RiskFactor, RiskTrendPoint, AttendanceSummary |
| CREATE | app/src/services/risk.service.ts | API service for risk endpoints: getAppointmentRisk, calculateRisk, getRiskTrend, etc. |
| CREATE | app/src/components/noshow-risk/NoShowRiskBadge.tsx | Color-coded risk badge (green/yellow/red) with dot indicators |
| CREATE | app/src/components/noshow-risk/RiskFactorsPopover.tsx | Popover showing risk score, top 3 factors, "Send Extra Reminder" button |
| CREATE | app/src/components/noshow-risk/NoShowRiskPanel.tsx | Patient Profile panel with current risk, trend chart, attendance summary |
| CREATE | app/src/components/noshow-risk/RiskTrendChart.tsx | Line chart showing risk over 12 months with threshold lines |
| CREATE | app/src/components/noshow-risk/AdminRiskAnalyticsDashboard.tsx | Admin dashboard with pie chart, accuracy table, top factors bar chart |
| MODIFY | app/src/components/index.ts | Export all noshow-risk components |
| MODIFY | app/src/pages/StaffQueue.tsx | Add NoShowRiskBadge column in patient table |
| MODIFY | app/src/pages/PatientProfile.tsx | Add NoShowRiskPanel section |
| MODIFY | app/src/pages/AdminDashboard.tsx | Add AdminRiskAnalyticsDashboard section |
| MODIFY | app/package.json | Add recharts@2.x dependency |

## External References
- [Recharts Documentation](https://recharts.org/en-US/api)
- [date-fns formatDistanceToNow](https://date-fns.org/v3.0.0/docs/formatDistanceToNow)
- [WCAG 2.2 Color Contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Wireframe SCR-009](../../../.propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html)
- [Wireframe SCR-011](../../../.propel/context/wireframes/Hi-Fi/wireframe-SCR-011-patient-profile.html)

## Build Commands
```bash
# Install dependencies
cd app
npm install recharts@2.x

# Start development server
npm run dev

# Build for production
npm run build

# Run accessibility tests
npm run test:a11y

# Visual regression test
npm run test:visual
```

## Implementation Validation Strategy
- [ ] Unit tests: NoShowRiskBadge renders correct color for each category (low/medium/high)
- [ ] Integration tests: Risk data fetched from API and displayed correctly
- [ ] **[UI Tasks]** Visual comparison against wireframe-SCR-009-queue-management.html at 375px, 768px, 1440px
- [ ] **[UI Tasks]** Visual comparison against wireframe-SCR-011-patient-profile.html at breakpoints
- [ ] **[UI Tasks]** Run `/analyze-ux` to validate wireframe alignment
- [ ] Color contrast: Badge text passes WCAG AA (4.5:1 for normal text)
- [ ] Keyboard navigation: Tab through badges, Enter/Space opens popover, Escape closes
- [ ] Screen reader: Badge announces "High no-show risk, 60%"
- [ ] Popover: Shows correct top 3 factors with icons and percentages
- [ ] Send Extra Reminder: Button triggers API call, shows success toast
- [ ] Risk Trend Chart: Line chart displays 12 months of risk data with threshold lines
- [ ] Attendance Summary: Displays "3 no-shows / 18 total = 16.7% rate" correctly
- [ ] Admin Dashboard: Pie chart, accuracy table, bar chart render without errors
- [ ] Edge case - New patient: Badge shows "New Patient" tag, popover explains baseline risk
- [ ] Edge case - Reliable patient: Badge shows "Reliable ✓", popover shows perfect attendance
- [ ] Responsive: Layout adapts correctly at 375px (mobile), 768px (tablet), 1440px (desktop)
- [ ] Loading state: Skeleton shown while fetching risk data
- [ ] Error state: Friendly error message if API fails, "Unable to load risk data. Try again."
- [ ] Auto-refresh: Admin dashboard updates every 5 minutes

## Implementation Checklist
- [ ] Install recharts dependency: `npm install recharts @types/recharts`
- [ ] Create app/src/types/risk.types.ts with RiskAssessment, RiskFactor, RiskTrendPoint, AttendanceSummary interfaces
- [ ] Create app/src/services/risk.service.ts with API functions: getAppointmentRisk, calculateRisk, getRiskTrend, getAttendanceSummary, getHighRiskPatients, sendExtraReminder
- [ ] Implement NoShowRiskBadge.tsx: Fetch risk, render color-coded badge (green/yellow/red), show loading skeleton
- [ ] Add badge accessibility: aria-label with risk percentage, role="button", tabindex="0"
- [ ] Implement hover interaction: Show RiskFactorsPopover on badge hover
- [ ] Implement keyboard interaction: Tab to focus badge, Enter/Space toggles popover, Escape closes
- [ ] Handle edge cases in badge: New patient shows "New Patient" tag, reliable patient shows "Reliable ✓"
- [ ] Implement RiskFactorsPopover.tsx: Header with numeric risk score, list top 3 factors with icons
- [ ] Map factor icons: weekend → 📅, previous_noshows → ⚠️, insurance_issue → 💰, distance → 📍, new_patient → 👤
- [ ] Add "Send Extra Reminder" button: onClick triggers riskService.sendExtraReminder(), show success toast
- [ ] Add disclaimer: "Historical factors only. Accuracy ~78%."
- [ ] Implement popover accessibility: role="dialog", aria-labelledby, focus trap, Escape to close
- [ ] Implement NoShowRiskPanel.tsx: Grid layout (2 columns desktop, 1 column mobile)
- [ ] Left column: Current risk score (large number), category badge, last calculated timestamp, "Recalculate Risk" button
- [ ] Right column: <RiskTrendChart /> and attendance summary
- [ ] Implement "Recalculate Risk" button: onClick triggers calculateRisk(), show loading spinner, update UI
- [ ] Handle no data case: Show "Risk not calculated yet. Click Recalculate Risk to analyze."
- [ ] Implement RiskTrendChart.tsx: recharts LineChart with 12 months data, X-axis (months), Y-axis (0-100%)
- [ ] Add threshold reference lines: ReferenceLine y={20} (green/yellow), y={50} (yellow/red)
- [ ] Implement chart tooltip: Show "March: 52% High Risk" on hover
- [ ] Make chart responsive: width="100%", height={300} desktop, height={200} mobile
- [ ] Implement AdminRiskAnalyticsDashboard.tsx: Grid layout with 3 cards
- [ ] Card 1: recharts PieChart showing risk distribution (low/medium/high) with legend and counts
- [ ] Card 2: Table showing predicted vs actual no-shows with accuracy percentages
- [ ] Card 3: recharts BarChart showing top risk factors by average contribution
- [ ] Add auto-refresh: useEffect with setInterval every 5 minutes
- [ ] Integrate NoShowRiskBadge into StaffQueue.tsx: Add badge column after patient name
- [ ] Integrate NoShowRiskPanel into PatientProfile.tsx: Add new section or tab "No-Show Risk"
- [ ] Restrict visibility: Only show risk panel to staff users (check user.role)
- [ ] Integrate AdminRiskAnalyticsDashboard into AdminDashboard.tsx: Add new section "No-Show Risk Analytics"
- [ ] **[UI Tasks - MANDATORY]** Open and reference wireframe-SCR-009-queue-management.html during implementation
- [ ] **[UI Tasks - MANDATORY]** Open and reference wireframe-SCR-011-patient-profile.html during implementation
- [ ] **[UI Tasks - MANDATORY]** Match badge colors from wireframe: Green (#10B981), Yellow (#F59E0B), Red (#EF4444)
- [ ] **[UI Tasks - MANDATORY]** Match popover layout and spacing from wireframe
- [ ] **[UI Tasks - MANDATORY]** Validate at breakpoints: 375px, 768px, 1440px
- [ ] Test color contrast: Badge text meets WCAG AA (4.5:1 ratio)
- [ ] Test keyboard navigation: Tab, Enter/Space, Escape all work correctly
- [ ] Test screen reader: Badge announces risk category and percentage
- [ ] Test "Send Extra Reminder" button: API call triggered, success toast shown
- [ ] Test risk trend chart: Displays 12 months data with correct threshold lines
- [ ] Test attendance summary calculation: (noShows / total) * 100 = rate
- [ ] Test admin pie chart: Percentages sum to 100%, correct colors for each category
- [ ] Test admin accuracy table: Displays correct predicted vs actual no-shows
- [ ] Test admin bar chart: Factors sorted by contribution descending
- [ ] Test new patient edge case: "New Patient" tag shown, baseline risk explained
- [ ] Test reliable patient edge case: "Reliable ✓" badge shown, perfect attendance message
- [ ] Test responsive design: Layout correct at mobile, tablet, desktop breakpoints
- [ ] Test loading state: Skeleton shown while fetching data
- [ ] Test error state: Friendly error message on API failure
- [ ] Test auto-refresh: Admin dashboard updates every 5 minutes
- [ ] Run `/analyze-ux` to validate pixel-perfect alignment with wireframes
- [ ] Document component API in app/README.md
- [ ] Commit all files to version control
