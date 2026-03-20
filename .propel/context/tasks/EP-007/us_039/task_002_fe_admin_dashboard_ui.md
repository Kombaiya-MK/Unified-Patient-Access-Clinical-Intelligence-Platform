# Task - TASK_002_FE_ADMIN_DASHBOARD_UI

## Requirement Reference
- User Story: US_039
- Story Location: .propel/context/tasks/us_039/us_039.md
- Acceptance Criteria:
    - Admin Dashboard (SCR-004) displays real-time metrics updated every 30 seconds via WebSocket
    - Top metrics cards: Current Queue Size, Average Wait Time, Today's Appointments, No-Show Rate with trend indicators
    - System health panel: Traffic light indicators (Green/Yellow/Red) for API Speed, AI Service, Database, Cache
    - Charts: Line chart (Daily Appointments 7-day view), Bar chart (No-Shows by Weekday), Pie chart (Appointment Types)
    - Date range selector: Today/Last 7 Days/Last 30 Days/Custom with calendar picker
    - Export CSV button next to date selector
    - Alerts section: Red banner for critical issues, yellow warning box for non-critical, each alert has timestamp, description, Dismiss/View Details buttons
    - Auto-refresh indicator: "Live" status with green dot, last updated timestamp
    - Updates with smooth animations (no jarring refreshes)
- Edge Case:
    - WebSocket connection drops: Fall back to polling every 60 seconds, show "Real-time sync paused" warning banner
    - No data for selected date range: Show "No appointments in this period" message with option to select different range
    - Historical metrics retained for 90 days (backend handles)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-004-admin-dashboard.html |
| **Screen Spec** | figma_spec.md#SCR-004 |
| **UXR Requirements** | UXR-201 (Dashboard layout best practices), UXR-504 (Real-time data visualization), NFR-PERF01 (WebSocket updates <30s), NFR-REL03 (Proactive health monitoring) |
| **Design Tokens** | designsystem.md#colors (status-success, status-warning, status-error), designsystem.md#charts (Chart.js colors), designsystem.md#spacing (card gaps) |

> **Wireframe Details:**
> - **Top metrics cards**: 4 cards in row - Current Queue (large number + trend arrow), Avg Wait Time (minutes + target indicator), Today's Appointments (fraction like "45/60"), No-Show Rate (% + daily comparison). Each card has icon, value, label, and sparkline mini-chart.
> - **System Health panel**: Traffic light indicators (Green/Yellow/Red) for API Speed (current ms), AI Service (success rate %), Database (connection %), Cache (hit rate %). Click indicator opens details modal with last 24h trend chart.
> - **Main charts section**: 3 charts - Line chart (Daily Appointments - 7 day view with hover tooltips), Bar chart (No-Shows by Weekday - Mon-Sun), Pie chart (Appointment Types - Online/Walk-in/Staff-booked with percentages)
> - **Date range selector**: Dropdown (Today/Last 7 Days/Last 30 Days/Custom) + calendar picker for custom, "Export CSV" button next to date selector
> - **Alerts section**: Red banner at top if critical issues, yellow warning box for non-critical, each alert has timestamp, description, "Dismiss" or "View Details" button
> - **Auto-refresh indicator**: Small icon in header showing "Live" status with green dot, shows last updated timestamp

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference wireframe-SCR-004-admin-dashboard.html during implementation
- **MUST** match card layout, chart positions, color scheme from wireframe
- **MUST** implement all states: Loading skeleton, real-time updates, WebSocket disconnected warning
- **MUST** validate implementation against wireframe at breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)
- Run `/analyze-ux` after implementation to verify alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | Socket.IO Client | 4.x |
| Frontend | Chart.js | 4.x |
| Frontend | react-chartjs-2 | 5.x |
| Frontend | date-fns | 3.x |
| Frontend | React Router | 6.x |
| Backend | Express | 4.18.x |
| Database | N/A (Frontend only) | N/A |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above. Must follow React 18.2, TypeScript 5.3, WCAG 2.2 AA accessibility standards.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web (Responsive design) |
| **Min OS Version** | iOS 14+, Android 10+ (Safari, Chrome) |
| **Mobile Framework** | React (Responsive web) |

## Task Overview
Create Admin Dashboard UI (SCR-004) with real-time metrics visualization: (1) MetricCard component for top 4 cards (Queue Size, Wait Time, Today's Appointments, No-Show Rate) with icons, large values, trend arrows, sparkline mini-charts, (2) SystemHealthPanel with traffic light indicators (Green/Yellow/Red) for API/AI/DB/Cache, click opens details modal with 24h trend chart, (3) Charts using Chart.js: DailyAppointmentsChart (Line chart 7-day view), NoShowsByWeekdayChart (Bar chart Mon-Sun), AppointmentTypesChart (Pie chart with percentages), (4) DateRangeSelector dropdown (Today/Last 7/Last 30/Custom) with calendar picker for custom range, (5) ExportCSVButton triggering POST /api/metrics/export, (6) AlertsBanner at top showing critical/warning alerts with Dismiss/View Details actions, (7) LiveStatusIndicator showing green dot "Live" or yellow "Paused" with last updated timestamp, (8) WebSocket integration with Socket.IO Client connecting to metrics channel, receiving 'metrics:update' events every 30s, fallback to polling if disconnected, (9) Loading skeletons for initial load, smooth transitions on data updates (no jarring refreshes), (10) Empty state when no data for selected date range, (11) Responsive design for mobile/tablet/desktop breakpoints, (12) WCAG AA accessibility with ARIA labels, keyboard navigation, screen reader support.

## Dependent Tasks
- US_039 - TASK_001_BE_ADMIN_METRICS_API (API endpoints and WebSocket available)
- US-010 (RBAC - admin role required to access dashboard)

## Impacted Components
- app/src/pages/AdminDashboard.tsx - New page (or modify existing from US-035/US-036)
- app/src/components/admin-dashboard/MetricCard.tsx - New component
- app/src/components/admin-dashboard/SystemHealthPanel.tsx - New component
- app/src/components/admin-dashboard/SystemHealthModal.tsx - New modal component
- app/src/components/admin-dashboard/DailyAppointmentsChart.tsx - New chart component
- app/src/components/admin-dashboard/NoShowsByWeekdayChart.tsx - New chart component
- app/src/components/admin-dashboard/AppointmentTypesChart.tsx - New chart component
- app/src/components/admin-dashboard/DateRangeSelector.tsx - New component
- app/src/components/admin-dashboard/ExportCSVButton.tsx - New component
- app/src/components/admin-dashboard/AlertsBanner.tsx - New component
- app/src/components/admin-dashboard/LiveStatusIndicator.tsx - New component
- app/src/hooks/useAdminMetrics.ts - New hook for metrics data fetching
- app/src/hooks/useMetricsWebSocket.ts - New hook for WebSocket integration
- app/src/services/admin-metrics.service.ts - New API service
- app/src/types/admin-metrics.types.ts - TypeScript interfaces
- app/src/App.tsx - Add route for /admin/dashboard

## Implementation Plan
1. **Create Admin Metrics Types (admin-metrics.types.ts)**:
   - Interface RealTimeMetrics: {queueSize: number, avgWaitTime: number, todayAppointments: {scheduled: number, checkedIn: number, completed: number, noShows: number}, noShowRate: number, trend: {queueSize: 'up'|'down'|'stable', waitTime: 'up'|'down'|'stable'}}
   - Interface OperationalKPIs: {totalAppointments: number, noShowRate: number, avgLeadTime: number, insuranceVerificationSuccessRate: number, patientSatisfactionScore: number | null}
   - Interface SystemHealth: {apiResponseTime: {value: number, status: 'green'|'yellow'|'red', target: 500}, aiService: {successRate: number, status: 'green'|'yellow'|'red'}, database: {activeConnections: number, maxConnections: number, status: 'green'|'yellow'|'red'}, cache: {hitRate: number, status: 'green'|'yellow'|'red'}}
   - Interface Alert: {id: string, timestamp: string, alertType: string, severity: 'critical'|'warning', message: string, resolvedAt: string | null}
   - Interface ChartData: {dailyVolume: {date: string, count: number}[], noShowsByDay: {dayOfWeek: number, count: number}[], appointmentTypes: {type: string, count: number}[]}
2. **Create Admin Metrics API Service (admin-metrics.service.ts)**:
   - Function getRealTimeMetrics(): Promise<RealTimeMetrics> → GET /api/metrics/realtime
   - Function getOperationalKPIs(from: Date, to: Date): Promise<OperationalKPIs> → GET /api/metrics/kpis?from=X&to=Y
   - Function getChartData(from: Date, to: Date): Promise<ChartData> → GET /api/metrics/chart-data?from=X&to=Y
   - Function getSystemHealth(): Promise<SystemHealth> → GET /api/metrics/system-health
   - Function getAlerts(): Promise<Alert[]> → GET /api/metrics/alerts
   - Function resolveAlert(alertId: string): Promise<void> → POST /api/metrics/alerts/:id/resolve
   - Function exportCSV(from: Date, to: Date): Promise<Blob> → POST /api/metrics/export, return blob for download
3. **Create useAdminMetrics Hook**:
   - State: realTimeMetrics, kpis, chartData, systemHealth, alerts, dateRange, loading, error
   - useEffect: Fetch data on mount and when dateRange changes
   - Functions: refreshData(), setDateRange(from, to), exportCSV()
   - Handle loading and error states
4. **Create useMetricsWebSocket Hook**:
   - Use Socket.IO Client: import { io } from 'socket.io-client'
   - Connect to WebSocket: const socket = io('http://localhost:3001', {auth: {token: authToken}})
   - Listen for 'metrics:update' event: socket.on('metrics:update', (data) => updateRealTimeMetrics(data))
   - Handle disconnect: socket.on('disconnect', () => setConnectionStatus('paused'), fallback to polling)
   - Polling fallback: useEffect with setInterval(fetchRealTimeMetrics, 60000) when disconnected
   - Cleanup: socket.disconnect() on unmount
5. **MetricCard Component**:
   - Props: {title: string, value: number | string, icon: React.ReactNode, trend?: 'up'|'down'|'stable', sparklineData?: number[], unit?: string, targetIndicator?: boolean}
   - Layout: Card with icon left, value center (large font), label below, trend arrow top-right
   - Sparkline: Mini Line chart using react-chartjs-2 (width 60px, height 20px, no axes)
   - Trend arrow: ↑ green (up), ↓ red (down), → gray (stable)
   - Target indicator: Green checkmark if meeting target, red X if not
   - Animation: Smooth number transition using CSS transition or react-spring
   - Responsive: Stack vertically on mobile, 2-column on tablet, 4-column on desktop
6. **SystemHealthPanel Component**:
   - Props: {systemHealth: SystemHealth}
   - Layout: 4 indicators in row (API Speed, AI Service, Database, Cache)
   - Each indicator: Traffic light circle (green/yellow/red), metric value, label
   - Colors: Green (#10B981), Yellow (#F59E0B), Red (#EF4444)
   - Click indicator opens SystemHealthModal with 24h trend chart
   - Responsive: 2x2 grid on mobile, 4-column on desktop
7. **SystemHealthModal Component**:
   - Props: {indicator: string, trendData: {timestamp: string, value: number}[], onClose: () => void}
   - Modal: Show indicator name, current value, status, 24h trend Line chart
   - Close: X button, click outside, Escape key
   - Accessibility: role="dialog", aria-labelledby, focus trap
8. **DailyAppointmentsChart Component**:
   - Props: {data: {date: string, count: number}[]}
   - Use react-chartjs-2 Line chart
   - Config: X-axis (dates formatted "Mon 3/10"), Y-axis (count 0-100), line color #3B82F6, point radius 4, tension 0.3 (curved line)
   - Tooltip: "Monday, March 10: 45 appointments"
   - Responsive: width="100%" height={300}
9. **NoShowsByWeekdayChart Component**:
   - Props: {data: {dayOfWeek: number, count: number}[]}
   - Use react-chartjs-2 Bar chart
   - Config: X-axis (Mon-Sun labels), Y-axis (count), bar color #EF4444 (red for no-shows)
   - Labels: Map dayOfWeek (0=Sun) to ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
   - Responsive: width="100%" height={300}
10. **AppointmentTypesChart Component**:
    - Props: {data: {type: string, count: number}[]}
    - Use react-chartjs-2 Pie chart
    - Config: Colors for each type: Online=#3B82F6, Walk-in=#F59E0B, Staff-booked=#10B981
    - Legend: Show percentages, position bottom
    - Labels: Show type + percentage on hover
    - Responsive: width="100%" height={300}
11. **DateRangeSelector Component**:
    - Props: {selectedRange: string, onRangeChange: (from: Date, to: Date) => void}
    - Dropdown: Options ["Today", "Last 7 Days", "Last 30 Days", "Custom"]
    - Custom: Show calendar picker (use react-datepicker or native input type="date")
    - State: startDate, endDate
    - onChange: Calculate dates based on selection, call onRangeChange(from, to)
12. **ExportCSVButton Component**:
    - Props: {dateRange: {from: Date, to: Date}}
    - Button: "Export CSV" with download icon
    - onClick: Call adminMetricsService.exportCSV(from, to), trigger browser download
    - Loading state: Show spinner while exporting
    - Error handling: Show toast notification if export fails
13. **AlertsBanner Component**:
    - Props: {alerts: Alert[]}
    - Layout: Banner at top of dashboard (above metrics cards)
    - Critical alerts: Red background, white text, "Critical Issue" label
    - Warning alerts: Yellow background, black text, "Warning" label
    - Each alert: Icon, timestamp (formatDistanceToNow), message, action buttons (Dismiss, View Details)
    - Dismiss: Call adminMetricsService.resolveAlert(alertId), remove from UI
    - View Details: Open modal with full alert information
    - Multiple alerts: Stack vertically with spacing
14. **LiveStatusIndicator Component**:
    - Props: {connectionStatus: 'live'|'paused', lastUpdated: Date}
    - Layout: Small component in header right
    - Live: Green dot, "Live" text, last updated "2 seconds ago"
    - Paused: Yellow dot, "Paused" text, "Real-time sync paused" tooltip, last updated timestamp
    - Update timestamp every second using useEffect
15. **AdminDashboard Page**:
    - Layout: Grid structure
      - Header: Title "Admin Dashboard", LiveStatusIndicator
      - AlertsBanner (if alerts exist)
      - Top section: 4 MetricCards in row
      - System health: SystemHealthPanel
      - Date range selector + Export CSV button
      - Charts section: 3 charts in grid (1 full-width line chart, 2 half-width bar/pie)
    - Hooks: useAdminMetrics(), useMetricsWebSocket()
    - Loading: Show skeleton cards/charts while loading
    - Empty state: If no data for date range, show "No appointments in this period. Try selecting a different date range."
    - WebSocket updates: When 'metrics:update' received, update realTimeMetrics in state with smooth transition
    - Authorization: Check user.role === 'admin', redirect to /unauthorized if not
16. **Routing**:
    - Add route in App.tsx: <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── admin-dashboard/ (to be created)
│   │   │   ├── MetricCard.tsx (to be created)
│   │   │   ├── SystemHealthPanel.tsx (to be created)
│   │   │   ├── SystemHealthModal.tsx (to be created)
│   │   │   ├── DailyAppointmentsChart.tsx (to be created)
│   │   │   ├── NoShowsByWeekdayChart.tsx (to be created)
│   │   │   ├── AppointmentTypesChart.tsx (to be created)
│   │   │   ├── DateRangeSelector.tsx (to be created)
│   │   │   ├── ExportCSVButton.tsx (to be created)
│   │   │   ├── AlertsBanner.tsx (to be created)
│   │   │   └── LiveStatusIndicator.tsx (to be created)
│   │   └── index.ts (update exports)
│   ├── pages/
│   │   └── AdminDashboard.tsx (to be created or modify existing)
│   ├── hooks/
│   │   ├── useAdminMetrics.ts (to be created)
│   │   └── useMetricsWebSocket.ts (to be created)
│   ├── services/
│   │   └── admin-metrics.service.ts (to be created)
│   ├── types/
│   │   └── admin-metrics.types.ts (to be created)
│   └── App.tsx (add route)
└── package.json (add chart.js, react-chartjs-2, socket.io-client, react-datepicker)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/types/admin-metrics.types.ts | TypeScript interfaces: RealTimeMetrics, OperationalKPIs, SystemHealth, Alert, ChartData |
| CREATE | app/src/services/admin-metrics.service.ts | API service for metrics endpoints |
| CREATE | app/src/hooks/useAdminMetrics.ts | Custom hook for metrics data fetching and state management |
| CREATE | app/src/hooks/useMetricsWebSocket.ts | Custom hook for WebSocket integration with fallback polling |
| CREATE | app/src/components/admin-dashboard/MetricCard.tsx | Metric card with value, icon, trend, sparkline |
| CREATE | app/src/components/admin-dashboard/SystemHealthPanel.tsx | Traffic light indicators for system health |
| CREATE | app/src/components/admin-dashboard/SystemHealthModal.tsx | Modal showing 24h trend chart for health indicator |
| CREATE | app/src/components/admin-dashboard/DailyAppointmentsChart.tsx | Line chart for 7-day appointment volume |
| CREATE | app/src/components/admin-dashboard/NoShowsByWeekdayChart.tsx | Bar chart for no-shows by weekday |
| CREATE | app/src/components/admin-dashboard/AppointmentTypesChart.tsx | Pie chart for appointment types distribution |
| CREATE | app/src/components/admin-dashboard/DateRangeSelector.tsx | Dropdown and calendar picker for date range |
| CREATE | app/src/components/admin-dashboard/ExportCSVButton.tsx | Button triggering CSV export |
| CREATE | app/src/components/admin-dashboard/AlertsBanner.tsx | Banner showing critical/warning alerts |
| CREATE | app/src/components/admin-dashboard/LiveStatusIndicator.tsx | Live/Paused status with last updated timestamp |
| CREATE | app/src/pages/AdminDashboard.tsx | Main dashboard page assembling all components |
| MODIFY | app/src/components/index.ts | Export all admin-dashboard components |
| MODIFY | app/src/App.tsx | Add route /admin/dashboard with admin role protection |
| MODIFY | app/package.json | Add chart.js@4.x, react-chartjs-2@5.x, socket.io-client@4.x, react-datepicker@4.x |

## External References
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [react-chartjs-2](https://react-chartjs-2.js.org/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [React DatePicker](https://reactdatepicker.com/)
- [date-fns formatDistanceToNow](https://date-fns.org/v3.0.0/docs/formatDistanceToNow)
- [Wireframe SCR-004](../../../.propel/context/wireframes/Hi-Fi/wireframe-SCR-004-admin-dashboard.html)

## Build Commands
```bash
# Install dependencies
cd app
npm install chart.js@4.x react-chartjs-2@5.x socket.io-client@4.x react-datepicker@4.x

# Start development server
npm run dev

# Build for production
npm run build

# Run accessibility tests
npm run test:a11y
```

## Implementation Validation Strategy
- [ ] Unit tests: MetricCard renders value, icon, trend arrow correctly
- [ ] Integration tests: AdminDashboard fetches and displays all metrics
- [ ] **[UI Tasks]** Visual comparison against wireframe-SCR-004-admin-dashboard.html at 375px, 768px, 1440px
- [ ] **[UI Tasks]** Run `/analyze-ux` to validate wireframe alignment
- [ ] WebSocket connection: 'metrics:update' event updates real-time metrics every 30s
- [ ] WebSocket disconnect fallback: Polling starts every 60s, "Real-time sync paused" warning shown
- [ ] Charts render: Line chart, Bar chart, Pie chart all display correct data
- [ ] Date range selector: Selecting different range (Today/7d/30d/Custom) updates charts
- [ ] Export CSV: Button triggers download, CSV contains correct data
- [ ] Alerts banner: Critical alerts show red banner, warnings show yellow, dismiss button works
- [ ] System health indicators: Traffic light colors correct (Green <500ms, Yellow 500-1000ms, Red >1000ms)
- [ ] System health modal: Clicking indicator opens modal with 24h trend chart
- [ ] Live status indicator: Shows "Live" with green dot, updates timestamp every second
- [ ] Empty state: Selecting date range with no data shows "No appointments in this period" message
- [ ] Loading state: Skeleton cards/charts shown while fetching data
- [ ] Error handling: API failure shows error message, retry button available
- [ ] Accessibility: All charts have aria-labels, keyboard navigation works, screen reader announces values
- [ ] Responsive: Layout correct at mobile (375px), tablet (768px), desktop (1440px)
- [ ] Animation: Metric value transitions smooth, no jarring refreshes
- [ ] Authorization: Non-admin users redirected to /unauthorized

## Implementation Checklist
- [ ] Install dependencies: npm install chart.js react-chartjs-2 socket.io-client react-datepicker @types/react-datepicker
- [ ] Create app/src/types/admin-metrics.types.ts with all interfaces
- [ ] Create app/src/services/admin-metrics.service.ts with API functions
- [ ] Implement getRealTimeMetrics(), getOperationalKPIs(), getChartData(), getSystemHealth(), getAlerts(), resolveAlert(), exportCSV()
- [ ] Create app/src/hooks/useAdminMetrics.ts with state management
- [ ] Implement data fetching on mount and date range change
- [ ] Create app/src/hooks/useMetricsWebSocket.ts with Socket.IO Client
- [ ] Connect to WebSocket, listen for 'metrics:update' event
- [ ] Implement disconnect fallback: Start polling every 60s, show paused status
- [ ] Implement MetricCard.tsx: Layout with icon, value, label, trend arrow, sparkline
- [ ] Add smooth number transition animation (CSS transition or react-spring)
- [ ] Implement SystemHealthPanel.tsx: 4 traffic light indicators in row
- [ ] Map status to colors: Green (#10B981), Yellow (#F59E0B), Red (#EF4444)
- [ ] Add click handler opening SystemHealthModal
- [ ] Implement SystemHealthModal.tsx: Modal with 24h trend Line chart
- [ ] Add modal accessibility: role="dialog", focus trap, Escape to close
- [ ] Implement DailyAppointmentsChart.tsx: react-chartjs-2 Line chart
- [ ] Configure chart: X-axis dates, Y-axis count, line color #3B82F6, tooltip
- [ ] Implement NoShowsByWeekdayChart.tsx: react-chartjs-2 Bar chart
- [ ] Map dayOfWeek to labels, bar color #EF4444
- [ ] Implement AppointmentTypesChart.tsx: react-chartjs-2 Pie chart
- [ ] Configure colors: Online=#3B82F6, Walk-in=#F59E0B, Staff-booked=#10B981
- [ ] Implement DateRangeSelector.tsx: Dropdown with Today/7d/30d/Custom
- [ ] Add calendar picker for custom range (react-datepicker)
- [ ] Implement onChange handler calculating date range
- [ ] Implement ExportCSVButton.tsx: Button triggering CSV export
- [ ] Add loading state (spinner) while exporting
- [ ] Handle download: Create blob URL, trigger browser download
- [ ] Implement AlertsBanner.tsx: Banner showing critical/warning alerts
- [ ] Layout: Red banner for critical, yellow for warning, stack multiple alerts
- [ ] Add Dismiss button: Call resolveAlert API, remove from UI
- [ ] Implement LiveStatusIndicator.tsx: Green/Yellow dot with status text
- [ ] Update timestamp every second using setInterval
- [ ] Implement AdminDashboard.tsx page: Assemble all components
- [ ] Layout: Header + AlertsBanner + 4 MetricCards + SystemHealthPanel + DateRangeSelector/ExportCSV + 3 Charts
- [ ] Integrate useAdminMetrics() hook: Fetch data, manage state
- [ ] Integrate useMetricsWebSocket() hook: Real-time updates
- [ ] Add loading skeletons for initial load
- [ ] Add empty state: "No appointments in this period" when no data
- [ ] Add authorization check: Redirect if user.role !== 'admin'
- [ ] Update app/src/components/index.ts: Export all admin-dashboard components
- [ ] Update app/src/App.tsx: Add route /admin/dashboard with ProtectedRoute
- [ ] **[UI Tasks - MANDATORY]** Open and reference wireframe-SCR-004-admin-dashboard.html during implementation
- [ ] **[UI Tasks - MANDATORY]** Match card layout, chart positions, spacing from wireframe
- [ ] **[UI Tasks - MANDATORY]** Validate at breakpoints: 375px, 768px, 1440px
- [ ] Test WebSocket connection: Verify 'metrics:update' event received every 30s
- [ ] Test WebSocket disconnect: Disconnect server, verify polling fallback, check warning banner
- [ ] Test date range selector: Select Today/7d/30d/Custom, verify charts update
- [ ] Test export CSV: Click button, verify CSV file downloaded with correct data
- [ ] Test alerts: Create test alert, verify banner shown, click Dismiss, verify alert resolved
- [ ] Test system health modal: Click traffic light, verify modal opens with trend chart
- [ ] Test empty state: Select date range with no appointments, verify message shown
- [ ] Test loading state: Verify skeleton cards/charts during initial load
- [ ] Test responsive design: Layout correct at mobile, tablet, desktop breakpoints
- [ ] Test accessibility: Keyboard navigation (Tab, Enter), screen reader announces values
- [ ] Test smooth animations: Metric values transition smoothly, no jarring refreshes
- [ ] Test authorization: Login as non-admin, verify redirect to /unauthorized
- [ ] Run `/analyze-ux` to validate pixel-perfect alignment with wireframe
- [ ] Document component API in app/README.md
- [ ] Commit all files to version control
