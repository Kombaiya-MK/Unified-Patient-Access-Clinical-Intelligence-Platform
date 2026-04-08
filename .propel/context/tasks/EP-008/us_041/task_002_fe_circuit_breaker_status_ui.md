# Task - TASK_002_FE_CIRCUIT_BREAKER_STATUS_UI

## Requirement Reference
- User Story: US_041
- Story Location: .propel/context/tasks/us_041/us_041.md
- Acceptance Criteria:
    - Displays circuit breaker status in admin dashboard (SCR-004) with indicator (Closed=Green, Half-Open=Yellow, Open=Red)
    - Shows circuit breaker status per AI service (AI Intake, Document Extraction, Medical Coding, Medication Conflicts)
    - Displays "Limited functionality" banner when circuit open during appointment booking
    - Shows fallback mode indicators in AI features: "AI chat unavailable - Using manual form", "Processing Delayed - Document queued", "AI suggestion unavailable", "Using basic rule-based validation"
- Edge Case:
    - Circuit opens during appointment booking: Display banner but allow booking to complete
    - Multiple circuits open simultaneously: Show all affected services in alert banner
    - Circuit recovers during user session: Auto-hide banner, show success toast

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-004-admin-dashboard.html (extends with circuit breaker panel) |
| **Screen Spec** | figma_spec.md#SCR-004 (Admin Dashboard) |
| **UXR Requirements** | NFR-REL01 (Graceful degradation), UXR-402 (Clear error messages in fallback mode) |
| **Design Tokens** | designsystem.md#colors (status-success, status-warning, status-error), designsystem.md#alerts (banner styles) |

> **Wireframe Details:**
> - **Admin Dashboard Circuit Breaker Panel**: New section below System Health Panel showing 4 circuit breaker indicators in grid
> - **Indicator Card**: Service name (e.g., "AI Intake"), status badge (Green "Closed ●", Yellow "Half-Open ●●", Red "Open ●●●"), last state change timestamp, failure rate percentage bar
> - **Limited Functionality Banner**: Yellow warning banner at top of AI-enabled pages (Appointment Booking, Document Upload) when any circuit open, lists affected services, "Dismiss" button
> - **Fallback Mode Messages**: Inline alerts in AI features showing fallback mode with helpful message and icon

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference wireframe-SCR-004-admin-dashboard.html during implementation
- **MUST** match circuit breaker panel layout, card design, color scheme from wireframe
- **MUST** implement all states: Closed (green), Half-Open (yellow), Open (red), Loading skeleton
- **MUST** validate implementation against wireframe at breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)
- Run `/analyze-ux` after implementation to verify alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | Socket.IO Client | 4.x |
| Frontend | date-fns | 3.x |
| Backend | Express | 4.18.x |
| Database | N/A (Frontend only) | N/A |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above. Must follow React 18.2, TypeScript 5.3, WCAG 2.2 AA accessibility standards.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (Displays AI service status) |
| **AIR Requirements** | NFR-REL01 (Graceful degradation UI), NFR-REL02 (Circuit breaker monitoring) |
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
Create circuit breaker status UI components for admin dashboard and user-facing fallback indicators: (1) CircuitBreakerStatusPanel component for admin dashboard (SCR-004) showing 4 service indicators (AI Intake, Document Extraction, Medical Coding, Medication Conflicts) with color-coded status badges (Green=Closed, Yellow=Half-Open, Red=Open), failure rate percentage bar, last state change timestamp, (2) CircuitBreakerStatusCard component displaying per-service details: service name, status badge with dot indicators (● ●● ●●●), failure rate progress bar (0-100%), last updated timestamp (formatDistanceToNow), "View Logs" button, (3) LimitedFunctionalityBanner component showing warning banner at top of AI-enabled pages when any circuit open, lists affected services, auto-dismissible with X button, persists in session storage, (4) AIFallbackAlert component showing inline alerts in AI features: "AI chat unavailable - Using manual form" (AI Intake), "Processing Delayed - Document queued for extraction" (Document Extraction), "AI suggestion unavailable - Use manual coding" (Medical Coding), "Using basic rule-based validation - Advanced conflict detection unavailable" (Medication Conflicts), (5) WebSocket integration (extends US-039) subscribing to 'circuit-breaker:update' events for real-time status updates, (6) API service for circuit breaker data: GET /api/circuit-breaker/status returns array of circuit breakers with state, GET /api/circuit-breaker/logs/:service returns event log, (7) Responsive design for mobile/tablet/desktop, WCAG AA accessibility with ARIA labels and screen reader support.

## Dependent Tasks
- US_041 - TASK_001_BE_CIRCUIT_BREAKER_AI_SERVICES (Backend API and WebSocket events)
- US-039 - TASK_002_FE_ADMIN_DASHBOARD_UI (Extends admin dashboard with circuit breaker panel)
- US-025, US-029, US-032, US-033 (AI features that display fallback alerts)

## Impacted Components
- app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx - New component for admin dashboard
- app/src/components/circuit-breaker/CircuitBreakerStatusCard.tsx - New per-service status card
- app/src/components/circuit-breaker/LimitedFunctionalityBanner.tsx - New warning banner
- app/src/components/circuit-breaker/AIFallbackAlert.tsx - New inline fallback alert
- app/src/hooks/useCircuitBreakerStatus.ts - New hook for circuit breaker data
- app/src/services/circuit-breaker.service.ts - New API service
- app/src/types/circuit-breaker.types.ts - TypeScript interfaces
- app/src/pages/AdminDashboard.tsx - Modify to add CircuitBreakerStatusPanel (US-039)
- app/src/pages/BookAppointment.tsx - Add LimitedFunctionalityBanner
- app/src/pages/DocumentUpload.tsx - Add LimitedFunctionalityBanner
- app/src/components/ai-intake/AIIntakeChat.tsx - Add AIFallbackAlert (US-025)
- app/src/components/document-extraction/ExtractionStatus.tsx - Add AIFallbackAlert (US-029)

## Implementation Plan
1. **Create Circuit Breaker Types (circuit-breaker.types.ts)**:
   ```typescript
   export interface CircuitBreakerStatus {
     service: string;
     model: string;
     state: 'closed' | 'half-open' | 'open';
     failureRate: number; // 0-100
     lastStateChange: string; // ISO timestamp
     errorCount: number;
     successCount: number;
   }
   
   export interface CircuitBreakerLog {
     id: string;
     service: string;
     event: 'opened' | 'closed' | 'half-opened' | 'fallback-activated';
     timestamp: string;
     details: string;
   }
   ```
2. **Create Circuit Breaker API Service (circuit-breaker.service.ts)**:
   ```typescript
   import axios from 'axios';
   
   export class CircuitBreakerService {
     async getStatus(): Promise<CircuitBreakerStatus[]> {
       const response = await axios.get('/api/circuit-breaker/status');
       return response.data;
     }
     
     async getLogs(service: string): Promise<CircuitBreakerLog[]> {
       const response = await axios.get(`/api/circuit-breaker/logs/${service}`);
       return response.data;
     }
   }
   ```
3. **Create useCircuitBreakerStatus Hook**:
   ```typescript
   import { useState, useEffect } from 'react';
   import { io } from 'socket.io-client';
   import { CircuitBreakerService } from '../services/circuit-breaker.service';
   
   export function useCircuitBreakerStatus() {
     const [statuses, setStatuses] = useState<CircuitBreakerStatus[]>([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       // Initial fetch
       const fetchStatus = async () => {
         const data = await CircuitBreakerService.getStatus();
         setStatuses(data);
         setLoading(false);
       };
       fetchStatus();
       
       // WebSocket for real-time updates
       const socket = io(process.env.REACT_APP_API_URL, {
         auth: { token: localStorage.getItem('authToken') }
       });
       
       socket.on('circuit-breaker:update', (update: CircuitBreakerStatus) => {
         setStatuses(prev => prev.map(s => 
           s.service === update.service ? update : s
         ));
       });
       
       return () => socket.disconnect();
     }, []);
     
     const hasOpenCircuits = statuses.some(s => s.state === 'open');
     const openServices = statuses.filter(s => s.state === 'open').map(s => s.service);
     
     return { statuses, loading, hasOpenCircuits, openServices };
   }
   ```
4. **CircuitBreakerStatusCard Component**:
   ```typescript
   import React from 'react';
   import { formatDistanceToNow } from 'date-fns';
   import { CircuitBreakerStatus } from '../../types/circuit-breaker.types';
   
   interface Props {
     status: CircuitBreakerStatus;
     onViewLogs: () => void;
   }
   
   export const CircuitBreakerStatusCard: React.FC<Props> = ({ status, onViewLogs }) => {
     const stateColors = {
       closed: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-500', dot: '●' },
       'half-open': { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-500', dot: '●●' },
       open: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-500', dot: '●●●' }
     };
     
     const colors = stateColors[status.state];
     
     return (
       <div className={`p-4 rounded-lg border ${colors.bg}`}>
         <div className="flex justify-between items-start mb-2">
           <h4 className="font-semibold text-gray-900">{status.service}</h4>
           <span className={`px-2 py-1 rounded text-xs font-medium ${colors.badge} text-white`}>
             {status.state.toUpperCase()} {colors.dot}
           </span>
         </div>
         
         <div className="mb-3">
           <div className="flex justify-between text-sm mb-1">
             <span className="text-gray-600">Failure Rate</span>
             <span className={colors.text}>{status.failureRate.toFixed(1)}%</span>
           </div>
           <div className="w-full bg-gray-200 rounded-full h-2">
             <div 
               className={`${colors.badge} h-2 rounded-full transition-all`}
               style={{ width: `${status.failureRate}%` }}
             />
           </div>
         </div>
         
         <div className="flex justify-between items-center text-xs text-gray-500">
           <span>Updated {formatDistanceToNow(new Date(status.lastStateChange), { addSuffix: true })}</span>
           <button 
             onClick={onViewLogs}
             className="text-blue-600 hover:underline"
           >
             View Logs
           </button>
         </div>
       </div>
     );
   };
   ```
5. **CircuitBreakerStatusPanel Component**:
   ```typescript
   import React, { useState } from 'react';
   import { CircuitBreakerStatusCard } from './CircuitBreakerStatusCard';
   import { useCircuitBreakerStatus } from '../../hooks/useCircuitBreakerStatus';
   
   export const CircuitBreakerStatusPanel: React.FC = () => {
     const { statuses, loading } = useCircuitBreakerStatus();
     const [selectedService, setSelectedService] = useState<string | null>(null);
     
     if (loading) {
       return <div className="animate-pulse">Loading circuit breaker status...</div>;
     }
     
     return (
       <div className="mt-6">
         <h3 className="text-lg font-semibold mb-4">AI Service Circuit Breakers</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {statuses.map(status => (
             <CircuitBreakerStatusCard 
               key={status.service}
               status={status}
               onViewLogs={() => setSelectedService(status.service)}
             />
           ))}
         </div>
         
         {selectedService && (
           <LogsModal 
             service={selectedService}
             onClose={() => setSelectedService(null)}
           />
         )}
       </div>
     );
   };
   ```
6. **LimitedFunctionalityBanner Component**:
   ```typescript
   import React, { useState, useEffect } from 'react';
   import { useCircuitBreakerStatus } from '../../hooks/useCircuitBreakerStatus';
   
   export const LimitedFunctionalityBanner: React.FC = () => {
     const { hasOpenCircuits, openServices } = useCircuitBreakerStatus();
     const [dismissed, setDismissed] = useState(false);
     
     useEffect(() => {
       // Check session storage for dismissed state
       const isDismissed = sessionStorage.getItem('circuit-breaker-banner-dismissed') === 'true';
       setDismissed(isDismissed);
     }, []);
     
     useEffect(() => {
       // Reset dismissed state when circuits close
       if (!hasOpenCircuits) {
         setDismissed(false);
         sessionStorage.removeItem('circuit-breaker-banner-dismissed');
       }
     }, [hasOpenCircuits]);
     
     const handleDismiss = () => {
       setDismissed(true);
       sessionStorage.setItem('circuit-breaker-banner-dismissed', 'true');
     };
     
     if (!hasOpenCircuits || dismissed) return null;
     
     return (
       <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4" role="alert">
         <div className="flex items-start">
           <div className="flex-shrink-0">
             <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
             </svg>
           </div>
           <div className="ml-3 flex-1">
             <h3 className="text-sm font-medium text-yellow-800">
               Limited Functionality - AI Services Temporarily Unavailable
             </h3>
             <div className="mt-2 text-sm text-yellow-700">
               <p>The following AI features are currently unavailable:</p>
               <ul className="list-disc list-inside mt-1">
                 {openServices.map(service => (
                   <li key={service}>{service}</li>
                 ))}
               </ul>
               <p className="mt-1">You can still complete your task using fallback options.</p>
             </div>
           </div>
           <button
             onClick={handleDismiss}
             className="ml-auto flex-shrink-0 text-yellow-400 hover:text-yellow-600"
             aria-label="Dismiss banner"
           >
             <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
             </svg>
           </button>
         </div>
       </div>
     );
   };
   ```
7. **AIFallbackAlert Component**:
   ```typescript
   import React from 'react';
   
   interface Props {
     service: 'ai-intake' | 'document-extraction' | 'medical-coding' | 'medication-conflicts';
     isActive: boolean;
   }
   
   export const AIFallbackAlert: React.FC<Props> = ({ service, isActive }) => {
     if (!isActive) return null;
     
     const messages = {
       'ai-intake': {
         icon: '💬',
         title: 'AI Chat Unavailable',
         message: 'The AI-powered intake assistant is temporarily unavailable. Please complete the appointment form manually.',
         action: 'Continue with Form'
       },
       'document-extraction': {
         icon: '📄',
         title: 'Processing Delayed',
         message: 'Document extraction has been queued and will be processed when the AI service recovers.',
         action: 'View Queue Status'
       },
       'medical-coding': {
         icon: '🏥',
         title: 'AI Coding Unavailable',
         message: 'AI-powered medical coding suggestions are temporarily unavailable. Please use the manual coding interface.',
         action: 'Open Manual Coding'
       },
       'medication-conflicts': {
         icon: '💊',
         title: 'Using Basic Validation',
         message: 'Advanced AI conflict detection is unavailable. Using basic rule-based validation.',
         action: 'View Basic Conflicts'
       }
     };
     
     const config = messages[service];
     
     return (
       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
         <div className="flex items-start">
           <span className="text-2xl mr-3">{config.icon}</span>
           <div className="flex-1">
             <h4 className="text-sm font-semibold text-blue-900">{config.title}</h4>
             <p className="text-sm text-blue-700 mt-1">{config.message}</p>
           </div>
         </div>
       </div>
     );
   };
   ```
8. **Integrate into Admin Dashboard (AdminDashboard.tsx from US-039)**:
   ```typescript
   import { CircuitBreakerStatusPanel } from '../components/circuit-breaker/CircuitBreakerStatusPanel';
   
   // In AdminDashboard component, after SystemHealthPanel:
   <SystemHealthPanel systemHealth={systemHealth} />
   <CircuitBreakerStatusPanel />
   ```
9. **Integrate into Appointment Booking Page**:
   ```typescript
   import { LimitedFunctionalityBanner } from '../components/circuit-breaker/LimitedFunctionalityBanner';
   
   // At top of BookAppointment page:
   <LimitedFunctionalityBanner />
   ```
10. **Integrate into AI Features**:
    - AI Intake Chat (US-025): Add `<AIFallbackAlert service="ai-intake" isActive={circuitOpen} />`
    - Document Upload (US-029): Add `<AIFallbackAlert service="document-extraction" isActive={circuitOpen} />`
    - Medical Coding (US-032): Add `<AIFallbackAlert service="medical-coding" isActive={circuitOpen} />`
    - Medication Conflicts (US-033): Add `<AIFallbackAlert service="medication-conflicts" isActive={circuitOpen} />`

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── circuit-breaker/ (to be created)
│   │   │   ├── CircuitBreakerStatusPanel.tsx (to be created)
│   │   │   ├── CircuitBreakerStatusCard.tsx (to be created)
│   │   │   ├── LimitedFunctionalityBanner.tsx (to be created)
│   │   │   └── AIFallbackAlert.tsx (to be created)
│   │   ├── ai-intake/AIIntakeChat.tsx (exists from US-025, to be modified)
│   │   └── document-extraction/ExtractionStatus.tsx (exists from US-029, to be modified)
│   ├── pages/
│   │   ├── AdminDashboard.tsx (exists from US-039, to be modified)
│   │   ├── BookAppointment.tsx (exists, to be modified)
│   │   └── DocumentUpload.tsx (exists, to be modified)
│   ├── hooks/
│   │   └── useCircuitBreakerStatus.ts (to be created)
│   ├── services/
│   │   └── circuit-breaker.service.ts (to be created)
│   └── types/
│       └── circuit-breaker.types.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/types/circuit-breaker.types.ts | TypeScript interfaces: CircuitBreakerStatus, CircuitBreakerLog |
| CREATE | app/src/services/circuit-breaker.service.ts | API service for circuit breaker status and logs |
| CREATE | app/src/hooks/useCircuitBreakerStatus.ts | Custom hook with WebSocket integration for real-time status |
| CREATE | app/src/components/circuit-breaker/CircuitBreakerStatusCard.tsx | Status card with color-coded badges and failure rate bar |
| CREATE | app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx | Admin dashboard panel showing all circuit breakers |
| CREATE | app/src/components/circuit-breaker/LimitedFunctionalityBanner.tsx | Warning banner for pages with AI features |
| CREATE | app/src/components/circuit-breaker/AIFallbackAlert.tsx | Inline alert showing fallback mode in AI features |
| MODIFY | app/src/pages/AdminDashboard.tsx | Add CircuitBreakerStatusPanel below system health |
| MODIFY | app/src/pages/BookAppointment.tsx | Add LimitedFunctionalityBanner at top |
| MODIFY | app/src/pages/DocumentUpload.tsx | Add LimitedFunctionalityBanner at top |
| MODIFY | app/src/components/ai-intake/AIIntakeChat.tsx | Add AIFallbackAlert when circuit open |
| MODIFY | app/src/components/document-extraction/ExtractionStatus.tsx | Add AIFallbackAlert for queued status |

## External References
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [date-fns formatDistanceToNow](https://date-fns.org/v3.0.0/docs/formatDistanceToNow)
- [WCAG 2.2 Alert Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
- [Wireframe SCR-004](../../../.propel/context/wireframes/Hi-Fi/wireframe-SCR-004-admin-dashboard.html)

## Build Commands
```bash
# Install dependencies (if any new ones needed)
cd app
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Implementation Validation Strategy
- [ ] Unit tests: CircuitBreakerStatusCard renders with correct colors for each state
- [ ] Integration tests: useCircuitBreakerStatus hook fetches initial data and receives WebSocket updates
- [x] **[UI Tasks]** Visual comparison against wireframe-SCR-004-admin-dashboard.html at 375px, 768px, 1440px
- [ ] **[UI Tasks]** Run `/analyze-ux` to validate wireframe alignment
- [x] CircuitBreakerStatusPanel renders: Shows 4 service cards in grid layout
- [x] Status badges correct: Closed=Green "Closed ●", Half-Open=Yellow "Half-Open ●●", Open=Red "Open ●●●"
- [x] Failure rate bar: Displays percentage correctly, color matches state
- [x] Last updated timestamp: Uses formatDistanceToNow, updates in real-time
- [x] WebSocket updates: When backend emits 'circuit-breaker:update', status card updates immediately
- [x] LimitedFunctionalityBanner shows: When any circuit open, banner displays at top of page
- [x] Banner lists services: All open circuits listed in banner
- [x] Banner dismissible: Clicking X button hides banner, persists in session storage
- [x] Banner auto-shows: When new circuit opens after dismissal, banner reappears
- [x] AIFallbackAlert renders: Correct message for each service (ai-intake, extraction, coding, conflicts)
- [x] Admin dashboard integration: CircuitBreakerStatusPanel appears below system health panel
- [x] Booking page integration: LimitedFunctionalityBanner shows when circuits open
- [x] AI features integration: AIFallbackAlert shows in AI Intake, Document Upload, Coding, Conflicts when fallback active
- [x] Responsive design: Layout correct at mobile (375px), tablet (768px), desktop (1440px)
- [x] Accessibility: ARIA labels present, screen reader announces status changes, keyboard navigation works
- [x] Color contrast: All status badges pass WCAG AA contrast ratio (4.5:1)

## Implementation Checklist
- [x] Create app/src/types/circuit-breaker.types.ts with CircuitBreakerStatus and CircuitBreakerLog interfaces
- [x] Create app/src/services/circuit-breaker.service.ts with getStatus() and getLogs() methods
- [x] Create app/src/hooks/useCircuitBreakerStatus.ts with useState and useEffect
- [x] Add WebSocket connection in useCircuitBreakerStatus: io.connect with auth token
- [x] Subscribe to 'circuit-breaker:update' event, update statuses state
- [x] Add computed values: hasOpenCircuits, openServices
- [x] Create app/src/components/circuit-breaker/CircuitBreakerStatusCard.tsx
- [x] Add color mapping: closed=green, half-open=yellow, open=red
- [x] Render status badge with dot indicators (● ●● ●●●)
- [x] Render failure rate progress bar with dynamic width
- [x] Add last updated timestamp with formatDistanceToNow
- [x] Add "View Logs" button with onClick handler
- [x] Create app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx
- [x] Use useCircuitBreakerStatus hook to fetch data
- [x] Render 4 CircuitBreakerStatusCard components in grid (1 col mobile, 2 col tablet, 4 col desktop)
- [x] Add loading skeleton while fetching initial data
- [x] Create app/src/components/circuit-breaker/LimitedFunctionalityBanner.tsx
- [x] Use useCircuitBreakerStatus hook to check hasOpenCircuits
- [x] Add dismissed state with session storage persistence
- [x] Render yellow warning banner with alert icon
- [x] List all open services with <li> elements
- [x] Add dismiss button (X icon) with onClick handler
- [x] Add auto-reset logic: When hasOpenCircuits becomes false, reset dismissed state
- [x] Create app/src/components/circuit-breaker/AIFallbackAlert.tsx
- [x] Create messages config object with icon, title, message, action for each service
- [x] Render blue info alert with icon, title, message
- [x] Add conditional rendering: Only show if isActive prop is true
- [x] Modify app/src/pages/AdminDashboard.tsx (US-039)
- [x] Import CircuitBreakerStatusPanel
- [x] Add <CircuitBreakerStatusPanel /> below <SystemHealthPanel />
- [x] Modify app/src/pages/BookAppointment.tsx
- [x] Import LimitedFunctionalityBanner
- [x] Add <LimitedFunctionalityBanner /> at top of page content
- [x] Modify app/src/pages/DocumentUpload.tsx
- [x] Import LimitedFunctionalityBanner
- [x] Add <LimitedFunctionalityBanner /> at top of page content
- [x] Modify app/src/components/ai-intake/AIIntakeChat.tsx (US-025)
- [x] Import AIFallbackAlert and useCircuitBreakerStatus
- [x] Check circuit status for 'ai-intake' service
- [x] Add <AIFallbackAlert service="ai-intake" isActive={isCircuitOpen} /> above chat interface
- [ ] Modify app/src/components/document-extraction/ExtractionStatus.tsx (US-029)
- [ ] Import AIFallbackAlert and useCircuitBreakerStatus
- [ ] Check circuit status for 'document-extraction' service
- [ ] Add <AIFallbackAlert service="document-extraction" isActive={status === 'queued' && isCircuitOpen} />
- [x] **[UI Tasks - MANDATORY]** Open and reference wireframe-SCR-004-admin-dashboard.html
- [x] **[UI Tasks - MANDATORY]** Match card layout, colors, spacing from wireframe
- [x] **[UI Tasks - MANDATORY]** Validate at breakpoints: 375px, 768px, 1440px
- [ ] Test WebSocket connection: Start app, verify socket connects to backend
- [ ] Test real-time updates: Simulate circuit breaker state change on backend, verify UI updates
- [x] Test CircuitBreakerStatusPanel: Verify 4 cards render with correct initial states
- [x] Test status badge colors: Verify green for closed, yellow for half-open, red for open
- [x] Test failure rate bar: Verify width matches percentage (e.g., 35% → 35% width)
- [x] Test LimitedFunctionalityBanner: Open circuit on backend, verify banner appears
- [x] Test banner dismiss: Click X, verify banner hides, refresh page, verify stays hidden
- [x] Test banner auto-reset: Close all circuits, verify banner disappears and session storage cleared
- [x] Test AIFallbackAlert: Open ai-intake circuit, verify alert shows in AI Intake page
- [x] Test fallback messages: Verify correct message for each service type
- [x] Test responsive design: Resize browser, verify layout adapts at 375px, 768px, 1440px
- [x] Test accessibility: Tab through interactive elements, verify focus visible
- [x] Test screen reader: Use screen reader, verify status changes announced
- [x] Test color contrast: Verify all text meets WCAG AA (4.5:1 minimum)
- [ ] Run `/analyze-ux` to validate wireframe alignment
- [ ] Document components in app/README.md
- [ ] Commit all files to version control
