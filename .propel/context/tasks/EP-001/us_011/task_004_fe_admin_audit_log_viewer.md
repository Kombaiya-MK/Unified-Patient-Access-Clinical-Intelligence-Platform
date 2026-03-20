# Task - TASK_004_FE_ADMIN_AUDIT_LOG_VIEWER

## Requirement Reference
- User Story: US_011  
- Story Location: `.propel/context/tasks/us_011/us_011.md`
- Acceptance Criteria:
    - AC1: Admin can view audit logs with filters (user, action type, resource, date range)
- Visual Design Context:
    - Screen ID: SCR-012 (Admin views audit logs)
    - Figma Spec: .propel/context/docs/figma_spec.md#SCR-012
    - Wireframe: .propel/context/wireframes/Hi-Fi/wireframe-SCR-012-audit-logs.html

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-012 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-012-audit-logs.html |
| **Screen Spec** | SCR-012 |
| **UXR Requirements** | WCAG 2.2 AA compliance |
| **Design Tokens** | Material Design color palette, 16px base font |

> **Note**: Admin-only audit log viewer UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | Axios | 1.x |
| Frontend | date-fns | 2.x |
| Frontend | Material-UI | 5.x (optional for table) |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Database | PostgreSQL | 15+ |

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

> **Note**: Data display UI only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Web UI only

## Task Overview
Implement admin-only audit log viewer component (SCR-012) that displays audit_logs table with pagination, sorting, filtering. Create AuditLogsPage component with data table showing: timestamp, user, action type, resource type/ID, IP address, status. Implement filters: date range picker (from/to), user dropdown (autocomplete), action type dropdown (LOGIN, CREATE, READ, UPDATE, DELETE), resource type dropdown (patient, appointment, user), status filter (success/failed). Add search by resource ID. Implement pagination (20 records per page) with page navigation. Create backend API endpoint GET /api/admin/audit-logs with query params for filters/pagination. Add export functionality (CSV/JSON) for compliance reporting. Ensure RBAC: Admin role only. Follow WCAG 2.2 AA accessibility guidelines.

## Dependent Tasks
- US_011 TASK_001: Audit logging service must exist
- US_010 TASK_001: RBAC middleware for admin-only access

## Impacted Components
**Modified:**
- server/src/routes/admin.routes.ts (Add audit logs endpoint)

**New:**
- app/src/pages/AuditLogsPage.tsx (Main audit log viewer page)
- app/src/components/AuditLogTable.tsx (Data table component)
- app/src/components/AuditLogFilters.tsx (Filter controls component)
- app/src/hooks/useAuditLogs.ts (Custom hook for fetching audit logs)
- app/src/types/audit.types.ts (AuditLog interface, FilterParams interface)
- server/src/controllers/auditLogController.ts (Controller for audit log endpoints)
- server/src/services/auditLogService.ts (Business logic for audit log queries)
- server/tests/integration/auditLogApi.test.ts (API tests for audit endpoint)

## Implementation Plan
1. **Backend API**: Create GET /api/admin/audit-logs endpoint with pagination, filters
2. **Query Builder**: Build SQL query with WHERE clauses for filters (date range, user_id, action_type, resource_type)
3. **Pagination**: Implement LIMIT/OFFSET with total count query
4. **Response Format**: Return { data: AuditLog[], total: number, page: number, pageSize: number }
5. **RBAC**: Protect endpoint with authorize(UserRole.ADMIN)
6. **Frontend Page**: Create AuditLogsPage with table and filters
7. **Data Table**: Display audit logs with columns: timestamp, user, action, resource, IP, status
8. **Filters Component**: Date range, user, action type, resource type, resource ID search
9. **Pagination Component**: Previous/Next buttons, page selector, showing X-Y of Z records
10. **Export Functionality**: Button to download filtered results as CSV or JSON
11. **Real-time Updates**: Optional: Poll API every 30 seconds for new logs
12. **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
│   ├── src/
│   │   ├── pages/
│   │   │   └── AdminDashboard.tsx
│   │   └── components/
└── server/                  # Backend API (US_002-011)
    ├── src/
    │   ├── routes/
    │   │   └── admin.routes.ts  # Admin routes
    │   └── services/
    │       └── auditLogger.ts  # Audit logging (US_011 TASK_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/AuditLogsPage.tsx | Main audit log viewer page component |
| CREATE | app/src/components/AuditLogTable.tsx | Data table with columns: timestamp, user, action, resource, IP |
| CREATE | app/src/components/AuditLogFilters.tsx | Filter controls: date range, user, action, resource |
| CREATE | app/src/components/AuditLogPagination.tsx | Pagination controls with page navigation |
| CREATE | app/src/hooks/useAuditLogs.ts | Custom hook for fetching and filtering audit logs |
| CREATE | app/src/types/audit.types.ts | AuditLog, FilterParams, AuditLogResponse interfaces |
| CREATE | app/src/utils/auditExport.ts | Export audit logs to CSV/JSON |
| CREATE | server/src/controllers/auditLogController.ts | Controller: getAuditLogs, exportAuditLogs |
| CREATE | server/src/services/auditLogService.ts | Service: queryAuditLogs with filters and pagination |
| MODIFY | server/src/routes/admin.routes.ts | Add GET /audit-logs and GET /audit-logs/export endpoints |
| CREATE | server/tests/integration/auditLogApi.test.ts | Test audit log API with filters, pagination |

> 1 modified file, 10 new files created

## External References
- [React Table](https://tanstack.com/table/v8)
- [date-fns Date Range Picker](https://date-fns.org/)
- [Material-UI Table](https://mui.com/material-ui/react-table/)
- [CSV Export in JavaScript](https://www.npmjs.com/package/react-csv)
- [WCAG 2.2 AA Guidelines](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2&levels=aa)
- [ARIA Table Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/table/)

## Build Commands
```bash
# Start backend
cd server
npm run dev

# Start frontend
cd app
npm start

# Access audit logs page (as admin)
# Login as admin → Navigate to /admin/audit-logs

# Test filters
# 1. Filter by date range: Select Jan 1 - Feb 1 → Click Filter
# 2. Filter by action: Select "LOGIN" → Click Filter
# 3. Filter by user: Enter user email or ID → Click Filter
# 4. Combine filters: Date + Action + User → Click Filter

# Test pagination
# Navigate to page 2 → Verify different records shown
# Change page size (20/50/100) → Verify correct number displayed

# Test export
# Click "Export CSV" → Download file → Verify contents match table
# Click "Export JSON" → Download file → Verify JSON structure

# Test with curl (backend API)
TOKEN_ADMIN="<admin-jwt-token>"

# Get first page (20 records)
curl http://localhost:3001/api/admin/audit-logs?page=1&pageSize=20 \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: JSON with data array, total, page, pageSize

# Filter by action type
curl http://localhost:3001/api/admin/audit-logs?action_type=LOGIN \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: Only LOGIN actions

# Filter by date range
curl "http://localhost:3001/api/admin/audit-logs?start_date=2026-01-01&end_date=2026-02-01" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: Logs within date range

# Filter by user
curl http://localhost:3001/api/admin/audit-logs?user_id=1 \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: Logs for user_id=1 only

# Combine filters
curl "http://localhost:3001/api/admin/audit-logs?action_type=CREATE&resource_type=appointment&start_date=2026-01-01" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: CREATE actions on appointments since Jan 1

# Export CSV
curl http://localhost:3001/api/admin/audit-logs/export?format=csv \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -o audit_logs.csv

# Export JSON
curl http://localhost:3001/api/admin/audit-logs/export?format=json \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -o audit_logs.json

# Test RBAC (staff/patient should be denied)
TOKEN_STAFF="<staff-jwt-token>"
curl http://localhost:3001/api/admin/audit-logs \
  -H "Authorization: Bearer $TOKEN_STAFF"
# Expected: 403 Forbidden

# Run integration tests
cd server
npm test -- auditLogApi.test.ts
```

## Implementation Validation Strategy
- [ ] Backend endpoint created: GET /api/admin/audit-logs
- [ ] RBAC enforced: Admin only, staff/patient denied
- [ ] Pagination works: page and pageSize query params
- [ ] Date filter works: start_date and end_date params
- [ ] User filter works: user_id param
- [ ] Action filter works: action_type param (LOGIN, CREATE, etc.)
- [ ] Resource filter works: resource_type and resource_id params
- [ ] Sorting works: order_by and order_dir params (created_at DESC default)
- [ ] Total count accurate: Response includes total record count
- [ ] Frontend page renders with data table
- [ ] Table displays all columns: timestamp, user, action, resource, IP, status
- [ ] Filters UI functional: Date picker, dropdowns, search input
- [ ] Filter submit updates table: Click "Filter" button fetches filtered data
- [ ] Pagination UI works: Previous/Next buttons, page selector
- [ ] Export CSV works: Downloads file with correct data
- [ ] Export JSON works: Downloads file with correct structure
- [ ] WCAG 2.2 AA compliant: Keyboard navigation, ARIA labels, screen reader support
- [ ] Responsive design: Works on desktop and tablet (mobile optional)

## Implementation Checklist

### Type Definitions (app/src/types/audit.types.ts)
- [ ] Define AuditLog interface: { id: number, user_id: number, user_email: string, action_type: string, resource_type: string, resource_id: string, ip_address: string, user_agent: string, details: object, created_at: string, status?: string }
- [ ] Define FilterParams interface: { page?: number, pageSize?: number, start_date?: string, end_date?: string, user_id?: number, action_type?: string, resource_type?: string, resource_id?: string, order_by?: string, order_dir?: 'ASC' | 'DESC' }
- [ ] Define AuditLogResponse interface: { data: AuditLog[], total: number, page: number, pageSize: number, totalPages: number }
- [ ] Export all types

### Backend Service (server/src/services/auditLogService.ts)
- [ ] Import pg Client, FilterParams type
- [ ] Implement queryAuditLogs(filters: FilterParams): Promise<AuditLogResponse>
- [ ] Build base query: SELECT a.*, u.email as user_email FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1
- [ ] Add WHERE clauses for each filter:
- [ ] If filters.start_date: AND a.created_at >= $start_date
- [ ] If filters.end_date: AND a.created_at <= $end_date
- [ ] If filters.user_id: AND a.user_id = $user_id
- [ ] If filters.action_type: AND a.action_type = $action_type
- [ ] If filters.resource_type: AND a.resource_type = $resource_type
- [ ] If filters.resource_id: AND a.resource_id = $resource_id
- [ ] Add ORDER BY: ORDER BY a.created_at DESC (or custom order_by)
- [ ] Add pagination: LIMIT $pageSize OFFSET $offset (offset = (page - 1) * pageSize)
- [ ] Execute query: const result = await client.query(query, params)
- [ ] Get total count: const countResult = await client.query(countQuery, countParams)
- [ ] Calculate totalPages: Math.ceil(total / pageSize)
- [ ] Return { data: result.rows, total: countResult.rows[0].count, page, pageSize, totalPages }
- [ ] Export queryAuditLogs

### Backend Controller (server/src/controllers/auditLogController.ts)
- [ ] Import auditLogService, FilterParams
- [ ] Implement getAuditLogs: async (req: Request, res: Response) => {}
- [ ] Parse query params: const filters: FilterParams = { page: parseInt(req.query.page) || 1, pageSize: parseInt(req.query.pageSize) || 20, start_date: req.query.start_date, end_date: req.query.end_date, user_id: req.query.user_id ? parseInt(req.query.user_id) : undefined, action_type: req.query.action_type, resource_type: req.query.resource_type, resource_id: req.query.resource_id, order_by: req.query.order_by || 'created_at', order_dir: req.query.order_dir || 'DESC' }
- [ ] Call service: const result = await auditLogService.queryAuditLogs(filters)
- [ ] Return: res.json(result)
- [ ] Catch errors: res.status(500).json({ error: 'Failed to fetch audit logs' })
- [ ] Implement exportAuditLogs: async (req: Request, res: Response) => {}
- [ ] Parse filters (same as above, no pagination)
- [ ] Call service with large pageSize (e.g., 10000) to get all matching records
- [ ] Format based on req.query.format: 'csv' or 'json'
- [ ] CSV: Convert to CSV string, set Content-Type: text/csv, Content-Disposition: attachment
- [ ] JSON: Set Content-Type: application/json, res.json(data)
- [ ] Export controller methods

### Backend Routes (server/src/routes/admin.routes.ts)
- [ ] Import auditLogController, authorize, UserRole
- [ ] Add route: router.get('/audit-logs', authenticate, authorize(UserRole.ADMIN), auditLogController.getAuditLogs)
- [ ] Add route: router.get('/audit-logs/export', authenticate, authorize(UserRole.ADMIN), auditLogController.exportAuditLogs)
- [ ] Ensure authenticate and authorize middleware applied

### Custom Hook (app/src/hooks/useAuditLogs.ts)
- [ ] Import useState, useEffect, axios, types
- [ ] Implement useAuditLogs(filters: FilterParams): { logs: AuditLog[], total: number, loading: boolean, error: string | null, refetch: () => void }
- [ ] State: logs, total, loading, error
- [ ] useEffect: On mount and when filters change:
- [ ] Set loading=true, error=null
- [ ] Fetch: axios.get('/api/admin/audit-logs', { params: filters, headers: { Authorization: Bearer ${token} } })
- [ ] On success: Set logs=response.data.data, total=response.data.total, loading=false
- [ ] On error: Set error=err.message, loading=false
- [ ] Implement refetch function to manually trigger fetch
- [ ] Return { logs, total, loading, error, refetch }
- [ ] Export useAuditLogs

### Filters Component (app/src/components/AuditLogFilters.tsx)
- [ ] Import React, useState, DatePicker (or input type="date"), Select/Dropdown
- [ ] Props: { onFilterChange: (filters: FilterParams) => void, initialFilters?: FilterParams }
- [ ] State for each filter: startDate, endDate, userId, actionType, resourceType, resourceId
- [ ] Render date range picker: From and To date inputs
- [ ] Render action type dropdown: OPTIONS: All, LOGIN, LOGOUT, CREATE, READ, UPDATE, DELETE
- [ ] Render resource type dropdown: OPTIONS: All, patient, appointment, user, department
- [ ] Render user search: Input field for user ID or email
- [ ] Render resource ID search: Input field
- [ ] Render "Apply Filters" button
- [ ] On button click: Call onFilterChange({ start_date: startDate, end_date: endDate, user_id: userId, action_type: actionType, resource_type: resourceType, resource_id: resourceId })
- [ ] Render "Clear Filters" button to reset all fields
- [ ] ARIA labels: aria-label="Start date", aria-label="Action type filter"
- [ ] Export AuditLogFilters

### Table Component (app/src/components/AuditLogTable.tsx)
- [ ] Import React, AuditLog type
- [ ] Props: { logs: AuditLog[], loading: boolean }
- [ ] Render table with columns:
- [ ] Timestamp (format with date-fns: format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'))
- [ ] User (display user_email or user_id)
- [ ] Action (action_type)
- [ ] Resource (resource_type + resource_id, e.g., "patient #123")
- [ ] IP Address (ip_address)
- [ ] Status (details.status_code or "N/A")
- [ ] Render loading state: "Loading..." or spinner
- [ ] Render empty state: "No audit logs found"
- [ ] Add table sorting: Column headers clickable to sort by that column
- [ ] ARIA: role="table", aria-label="Audit logs table", <thead> with role="rowgroup", <th> with role="columnheader"
- [ ] Export AuditLogTable

### Pagination Component (app/src/components/AuditLogPagination.tsx)
- [ ] Import React
- [ ] Props: { currentPage: number, totalPages: number, pageSize: number, total: number, onPageChange: (page: number) => void, onPageSizeChange: (size: number) => void }
- [ ] Render "Previous" button: Disabled if currentPage === 1, onClick={() => onPageChange(currentPage - 1)}
- [ ] Render page numbers: Display current page and nearby pages (e.g., 1 ... 5 6 7 ... 20)
- [ ] Render "Next" button: Disabled if currentPage === totalPages, onClick={() => onPageChange(currentPage + 1)}
- [ ] Render page size selector: Dropdown with options 20, 50, 100
- [ ] Render "Showing X-Y of Z records"
- [ ] ARIA: aria-label="Pagination navigation", aria-current="page" for current page button
- [ ] Export AuditLogPagination

### Main Page (app/src/pages/AuditLogsPage.tsx)
- [ ] Import React, useState, useAuditLogs, AuditLogFilters, AuditLogTable, AuditLogPagination
- [ ] State: filters (FilterParams), page, pageSize
- [ ] Call useAuditLogs({ ...filters, page, pageSize }): { logs, total, loading, error, refetch }
- [ ] Render page title: <h1>Audit Logs</h1>
- [ ] Render AuditLogFilters: Pass onFilterChange handler to update filters state
- [ ] Render export buttons: "Export CSV" and "Export JSON"
- [ ] Export CSV: Trigger download via downloadAuditLogs('csv', filters)
- [ ] Export JSON: Trigger download via downloadAuditLogs('json', filters)
- [ ] Render AuditLogTable: Pass logs and loading
- [ ] Render AuditLogPagination: Pass page, totalPages, pageSize, total, onPageChange, onPageSizeChange
- [ ] Implement downloadAuditLogs(format: 'csv' | 'json', filters: FilterParams): Fetch /api/admin/audit-logs/export?format=${format}&..., trigger browser download
- [ ] Error handling: Display error message if error
- [ ] WCAG: Ensure keyboard navigation works for all interactive elements
- [ ] Export AuditLogsPage

### Export Utility (app/src/utils/auditExport.ts)
- [ ] Implement exportToCSV(data: AuditLog[]): string
- [ ] Generate CSV header: "ID,User,Action,Resource Type,Resource ID,IP Address,Timestamp,Status"
- [ ] For each log: Append row with comma-separated values
- [ ] Return CSV string
- [ ] Implement exportToJSON(data: AuditLog[]): string
- [ ] Return JSON.stringify(data, null, 2)
- [ ] Implement downloadFile(content: string, filename: string, contentType: string): void
- [ ] Create Blob: const blob = new Blob([content], { type: contentType })
- [ ] Create download link: const url = URL.createObjectURL(blob), const a = document.createElement('a'), a.href = url, a.download = filename, a.click()
- [ ] Cleanup: URL.revokeObjectURL(url)
- [ ] Export functions

### Integration Tests (server/tests/integration/auditLogApi.test.ts)
- [ ] Test: "GET /api/admin/audit-logs returns paginated audit logs"
- [ ] Test: "GET /api/admin/audit-logs with date filter"
- [ ] Test: "GET /api/admin/audit-logs with action_type filter"
- [ ] Test: "GET /api/admin/audit-logs with user_id filter"
- [ ] Test: "GET /api/admin/audit-logs with resource_type filter"
- [ ] Test: "GET /api/admin/audit-logs combined filters"
- [ ] Test: "GET /api/admin/audit-logs?page=2 returns second page"
- [ ] Test: "GET /api/admin/audit-logs?pageSize=50 returns 50 records"
- [ ] Test: "GET /api/admin/audit-logs returns total count"
- [ ] Test: "GET /api/admin/audit-logs/export?format=csv returns CSV"
- [ ] Test: "GET /api/admin/audit-logs/export?format=json returns JSON"
- [ ] Test: "staff user cannot access audit logs (403)"
- [ ] Test: "patient user cannot access audit logs (403)"
- [ ] Test: "admin user can access audit logs (200)"

### Validation and Testing
- [ ] Start backend and frontend: npm run dev
- [ ] Login as admin user: Navigate to /admin/audit-logs
- [ ] Verify page loads: Table displays audit logs
- [ ] Test filters: Apply date range filter → Table updates
- [ ] Test filters: Apply action type filter → Only matching actions shown
- [ ] Test pagination: Click page 2 → New records displayed
- [ ] Test page size: Change to 50 → 50 records per page
- [ ] Test export CSV: Click button → File downloads → Open in Excel
- [ ] Test export JSON: Click button → File downloads → Verify JSON structure
- [ ] Test RBAC: Login as staff → Navigate to /admin/audit-logs → 403 or redirect
- [ ] Test accessibility: Tab through all controls, screen reader announces labels
- [ ] Run API tests: npm test -- auditLogApi.test.ts → all pass
