# Task - task_003_admin_feature_flags_ui

## Requirement Reference
- User Story: US_049 - Feature Flags for AI Model Version Control
- Story Location: .propel/context/tasks/us_049/us_049.md
- Acceptance Criteria:
    - System allows toggling flags via admin UI (SCR-004 Admin Dashboard - new "Feature Flags" tab) with table showing Flag Name, Status, Target, Last Modified, Modified By
    - System provides flag evaluation analytics in admin dashboard: Flag usage count per day, Conversion rates for A/B tests, Error rates per flag configuration
    - System supports immediate flag updates without app restart (real-time updates via WebSocket)
- Edge Cases:
    - None specified for frontend (UI only displays flag data from backend)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-004-admin-dashboard.html (Feature Flags tab extension) |
| **Screen Spec** | figma_spec.md#SCR-004 (Admin Dashboard extended with Feature Flags) |
| **UXR Requirements** | UXR-201 (Admin UI consistency), TR-008 (Feature flag infrastructure), NFR-REL04 (Zero-downtime updates) |
| **Design Tokens** | designsystem.md#1.1 (Color Palette), #1.2 (Typography), #1.4 (Shadows for cards) |

> **Wireframe Details (Feature Flags Management):**
> - **Feature Flags Tab** (new tab in Admin Dashboard SCR-004):
>   - Tab navigation: Users | Departments | Audit Logs | **Feature Flags** (new)
>   - Table: Flag Name, Description, Status (toggle switch), Target Audience, Current Value, Last Modified, Modified By, Actions (Edit/View Analytics)
>   - Toggle switch colors: Enabled (green), Disabled (gray), uses design tokens --color-success-600, --color-neutral-400
>   - Confirmation modal on toggle: "Disable AI Intake for all users? This will redirect users to manual form. Confirm/Cancel"
> - **Edit Flag Modal**:
>   - Form fields: Flag Name (read-only), Description (textarea), Status (toggle), Target Audience (dropdown: All Users/Beta Testers/Department/Role/Percentage), Value (text input for model versions), Save/Cancel
>   - Percentage rollout: Slider 0-100% with live preview "Will affect approximately X users (Y%)"
> - **Flag Analytics Panel** (click "View Analytics"):
>   - Line chart: Flag evaluations per day (last 30 days) using Chart.js or Recharts
>   - A/B Test Results table: Prompt v1: 85% completion rate, Prompt v2: 92% completion rate, Recommendation: "Prompt v2 shows 7% improvement"
>   - Error Rate card: Count of errors, "0 errors in last 7 days" with green checkmark or "3 errors - Review logs" with warning icon
> - **Real-time Updates**: WebSocket notification "AI Intake flag changed by Admin John" appears as toast, flag table updates immediately

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE:**
- **MUST** open and reference the wireframe file during UI implementation
- **MUST** match layout, spacing, typography, and colors from the wireframe
- **MUST** implement all states shown in wireframe (default, hover, focus, error, loading)
- **MUST** validate implementation against wireframe at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify pixel-perfect alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | React Router | 6.x |
| Library | Socket.io Client | 4.x |
| Library | Chart.js or Recharts | 4.x / 2.x |
| Backend | N/A | N/A |
| Database | N/A | N/A |
| AI/ML | N/A | N/A |

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

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create "Feature Flags" tab in Admin Dashboard (SCR-004) with flag table (toggle switches, targeting, last modified), Edit Flag modal (target audience selector, percentage rollout slider), Flag Analytics panel (usage charts, A/B test results, error rates), confirmation modals for flag changes, and real-time flag updates via WebSocket.

**Purpose**: Provide admin UI for managing feature flags, viewing analytics, and monitoring A/B test results without code deployments.

**Capabilities**:
- Feature Flags tab in Admin Dashboard with flag table (7 AI flags)
- Toggle switches to enable/disable flags with confirmation modals
- Edit Flag modal with target audience selection (All/Beta/Department/Role/Percentage)
- Percentage rollout slider (0-100%) with user count preview
- Flag Analytics panel with line charts (usage over time), A/B test comparison, error rates
- Real-time flag updates via WebSocket (show toast notification when another admin changes flags)
- Responsive design: Desktop (full table), Tablet (scrollable table), Mobile (card layout)

## Dependent Tasks
- task_001_feature_flag_framework (requires backend API: GET/PUT /api/admin/feature-flags)
- task_002_ai_services_flag_integration (provides flag usage data for analytics)

## Impacted Components
- **MODIFY**: app/src/pages/AdminDashboard.tsx (add Feature Flags tab navigation)
- **CREATE**: app/src/components/admin/FeatureFlagsTable.tsx (flag table with toggles)
- **CREATE**: app/src/components/admin/EditFlagModal.tsx (edit flag modal form)
- **CREATE**: app/src/components/admin/FlagAnalyticsPanel.tsx (analytics panel with charts)
- **CREATE**: app/src/components/admin/ConfirmFlagChangeModal.tsx (confirmation modal for toggle)
- **CREATE**: app/src/hooks/useFeatureFlags.ts (React hook for flag API calls)
- **CREATE**: app/src/hooks/useFlagWebSocket.ts (WebSocket hook for real-time flag updates)
- **CREATE**: app/src/services/featureFlagApi.ts (API client for flag endpoints)

## Implementation Plan

### Phase 1: Admin Dashboard Integration & Tab Navigation (1 hour)
1. **Modify AdminDashboard.tsx**:
   - Add "Feature Flags" tab to existing tab navigation (Users, Departments, Audit Logs, **Feature Flags**)
   - Tab state management: `const [activeTab, setActiveTab] = useState('feature-flags')`
   - Conditional rendering: `{activeTab === 'feature-flags' && <FeatureFlagsTable />}`
   - Tab styling: Active tab underline with primary color (--color-primary-600), inactive tabs gray

2. **Create featureFlagApi.ts**:
   - API functions:
     - `getFlags(): Promise<FlagConfig[]>` → GET /api/admin/feature-flags
     - `updateFlag(flagName, config): Promise<void>` → PUT /api/admin/feature-flags/:flagName
     - `getFlagAnalytics(flagName): Promise<FlagAnalytics>` → GET /api/admin/feature-flags/:flagName/analytics
     - `invalidateFlagCache(flagName): Promise<void>` → POST /api/admin/feature-flags/:flagName/invalidate-cache
   - Auth: Include JWT token in Authorization header

### Phase 2: Feature Flags Table Component (2 hours)
3. **Create FeatureFlagsTable.tsx**:
   - Table columns: Flag Name, Description, Status (toggle), Target Audience, Current Value, Last Modified, Modified By, Actions (Edit/Analytics buttons)
   - Toggle switch component: Custom toggle using <input type="checkbox"> styled with CSS
   - Toggle colors: Enabled (green #2E7D32 --color-success-600), Disabled (gray #999 --color-neutral-400)
   - onClick handler: Show ConfirmFlagChangeModal before updating flag
   - Loading state: Show skeleton rows while fetching flags
   - Empty state: "No flags configured" with "Create Flag" button (future feature)

4. **Create ConfirmFlagChangeModal.tsx**:
   - Props: `isOpen`, `onClose`, `onConfirm`, `flagName`, `currentStatus`, `newStatus`
   - Message: "Enable/Disable [Flag Name] for all users? This will [impact description]. Confirm/Cancel"
   - Impact descriptions:
     - ai_intake_enabled=false: "redirect users to manual form"
     - ai_extraction_enabled=false: "queue documents for manual data entry"
     - ai_coding_enabled=false: "show 'AI unavailable' message"
   - Buttons: Cancel (secondary), Confirm (primary, red if disabling critical flag)

### Phase 3: Edit Flag Modal & Target Audience Selector (2 hours)
5. **Create EditFlagModal.tsx**:
   - Form fields:
     - Flag Name (read-only input, gray background)
     - Description (textarea, optional)
     - Status (toggle switch)
     - Target Audience (dropdown: All Users, Beta Testers, Specific Department, Specific Role, Percentage Rollout)
     - Current Value (text input for model/prompt versions, e.g., "gpt-4-turbo", "v2")
   - Conditional fields:
     - If Target = "Specific Department": Show department multi-select dropdown
     - If Target = "Specific Role": Show role dropdown (Patient, Staff, Admin)
     - If Target = "Percentage Rollout": Show slider (0-100%) with live preview text "Will affect ~X users (Y%)"
   - Save button: Call `featureFlagApi.updateFlag(flagName, formData)`
   - Cancel button: Close modal without changes

6. **Percentage Rollout Slider**:
   - Component: <input type="range" min="0" max="100" step="1" />
   - Live preview calculation: `Math.round((totalUsers * percentage) / 100)`
   - Display: "Will affect approximately 250 users (25%)" below slider
   - Slider styling: Track color primary (blue), thumb circular with shadow

### Phase 4: Flag Analytics Panel (1.5 hours)
7. **Create FlagAnalyticsPanel.tsx**:
   - Panel opens in drawer/modal when user clicks "View Analytics" button
   - Usage Chart: Line chart showing flag evaluations per day (last 30 days)
     - Library: Recharts for React: `<LineChart data={usageData}>...</LineChart>`
     - X-axis: Dates, Y-axis: Evaluation count
     - Tooltip: Show exact count on hover
   - A/B Test Results (if applicable):
     - Table: Variant, Total Users, Completion Rate, Avg Time, Recommendation
     - Example: Prompt v1 | 1,250 | 85% | 4.2 min | -, Prompt v2 | 1,300 | 92% | 3.8 min | **Recommended (7% improvement)**
     - Highlight recommended variant with green "✓ Recommended" badge
   - Error Rate Card:
     - Display: "0 errors in last 7 days" with green checkmark
     - Or: "3 errors detected - [View error logs]" link to Audit Logs filtered by flag
   - Close button: X icon to close analytics panel

### Phase 5: Real-time Flag Updates via WebSocket (1 hour)
8. **Create useFlagWebSocket.ts hook**:
   - Connect to WebSocket: `socket = io(BACKEND_URL, { auth: { token: jwtToken } })`
   - Listen for flag update events: `socket.on('flag-updated', (data) => { ... })`
   - Event data: `{ flagName, updatedBy, newStatus, timestamp }`
   - On event: Update local state, show toast notification "AI Intake flag changed by Admin John"
   - Reconnect logic: Auto-reconnect on disconnect with exponential backoff

9. **Toast Notification Component**:
   - Toast library: react-hot-toast or custom toast component
   - Notification style: Blue info banner with icon, auto-dismiss after 5 seconds
   - Message: "[Flag Name] flag changed by [Admin Name]"
   - Action button: "Refresh" to reload flag table immediately

## Current Project State
```
app/
  src/
    pages/
      AdminDashboard.tsx (MODIFY - add Feature Flags tab)
    components/
      admin/
        FeatureFlagsTable.tsx (CREATE - flag table)
        EditFlagModal.tsx (CREATE - edit modal)
        FlagAnalyticsPanel.tsx (CREATE - analytics panel)
        ConfirmFlagChangeModal.tsx (CREATE - confirmation modal)
    hooks/
      useFeatureFlags.ts (CREATE - flag API hook)
      useFlagWebSocket.ts (CREATE - WebSocket hook)
    services/
      featureFlagApi.ts (CREATE - API client)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | app/src/pages/AdminDashboard.tsx | Add "Feature Flags" tab to tab navigation, render FeatureFlagsTable when tab active |
| CREATE | app/src/components/admin/FeatureFlagsTable.tsx | Flag table with columns (Name, Description, Status toggle, Target, Value, LastModified, ModifiedBy, Actions), toggle confirmation, loading/empty states |
| CREATE | app/src/components/admin/EditFlagModal.tsx | Edit flag modal with form (Name read-only, Description, Status toggle, Target audience dropdown, Value input, Percentage slider), Save/Cancel buttons |
| CREATE | app/src/components/admin/FlagAnalyticsPanel.tsx | Analytics drawer with usage line chart (Recharts, last 30 days), A/B test results table, error rate card, Close button |
| CREATE | app/src/components/admin/ConfirmFlagChangeModal.tsx | Confirmation modal for flag toggle with impact description (e.g., "redirect users to manual form"), Confirm/Cancel buttons |
| CREATE | app/src/hooks/useFeatureFlags.ts | React hook for flag API calls (getFlags, updateFlag, getFlagAnalytics) with loading/error states |
| CREATE | app/src/hooks/useFlagWebSocket.ts | WebSocket hook for real-time flag updates (connect, listen to 'flag-updated' events, show toast notifications, auto-reconnect) |
| CREATE | app/src/services/featureFlagApi.ts | API client with functions (getFlags, updateFlag, getFlagAnalytics, invalidateFlagCache) using fetch/axios with JWT auth |

## External References
- **Recharts Documentation**: https://recharts.org/en-US/ (Line chart for flag usage analytics)
- **React Hot Toast**: https://react-hot-toast.com/ (Toast notifications for real-time flag updates)
- **Socket.io Client**: https://socket.io/docs/v4/client-api/ (WebSocket connection for real-time updates)
- **React Toggle Switch**: https://www.npmjs.com/package/react-switch (Toggle switch component library)
- **Admin UI Patterns**: https://ant.design/components/table/ (Table design patterns for flag management)

## Build Commands
```bash
# Install dependencies
cd app
npm install recharts react-hot-toast socket.io-client react-switch

# Start dev server
npm run dev

# Run linting
npm run lint

# Type check
npm run type-check

# Build for production
npm run build
```

## Implementation Validation Strategy
- [x] Unit tests pass (test FeatureFlagsTable, EditFlagModal, FlagAnalyticsPanel components)
- [x] Integration tests pass (test full flag toggle flow with API calls)
- [x] **[UI Tasks]** Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] **[UI Tasks]** Run `/analyze-ux` to validate wireframe alignment
- [x] Manual testing: Toggle each flag, verify confirmation modal appears, verify flag status updates in table
- [x] Edit flag test: Open edit modal, change target audience, save, verify changes reflected in table
- [x] Analytics test: Click "View Analytics", verify chart loads, A/B test results display correctly
- [x] WebSocket test: Open two browser tabs with two admin users, toggle flag in tab 1, verify tab 2 shows toast notification and table updates
- [x] Responsive test: Verify table is scrollable on tablet, card layout on mobile
- [x] Accessibility test: Verify toggle switches have aria-labels, keyboard navigation works (Tab, Enter, Space)

## Implementation Checklist
- [x] Modify AdminDashboard.tsx to add "Feature Flags" tab navigation and render FeatureFlagsTable component when tab is active
- [x] Create FeatureFlagsTable.tsx with table columns (Name, Description, Status toggle, Target, Value, LastModified, ModifiedBy, Edit/Analytics buttons), ConfirmFlagChangeModal for toggle confirmation, loading/empty states
- [x] Create EditFlagModal.tsx with form fields (Flag Name read-only, Description, Status toggle, Target dropdown with conditional fields for Department/Role/Percentage slider with preview), Save/Cancel buttons, validation
- [x] Create FlagAnalyticsPanel.tsx with usage line chart (Recharts, last 30 days), A/B test results table (Variant, Completion Rate, Recommendation badge), error rate card, Close button
- [x] Create useFeatureFlags.ts hook with API functions (getFlags, updateFlag, getFlagAnalytics, invalidateFlagCache) and useFlagWebSocket.ts hook for real-time updates (WebSocket connection, flag-updated events, toast notifications, auto-reconnect)
- [x] Create featureFlagApi.ts API client with fetch/axios functions (GET/PUT flags, GET analytics, POST invalidate-cache) with JWT auth headers
- [x] Install dependencies (recharts, react-hot-toast, socket.io-client, react-switch), implement responsive design (Desktop: full table, Tablet: scrollable, Mobile: card layout), ARIA labels for accessibility
- [ ] Reference wireframe during implementation (SCR-004 Feature Flags tab), validate UI matches wireframe at breakpoints (375px, 768px, 1440px), run accessibility tests (keyboard navigation, screen reader compatibility)
