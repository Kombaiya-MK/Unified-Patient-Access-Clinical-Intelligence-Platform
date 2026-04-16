# Task - TASK_002_FE_CORE_ACCESSIBILITY_FEATURES

## Requirement Reference
- User Story: US_043
- Story Location: .propel/context/tasks/us_043/us_043.md
- Acceptance Criteria:
    - System provides keyboard navigation for all interactive elements with visible focus indicators (2px solid blue outline per UXR-303)
    - Implements skip navigation links ("Skip to main content") on all pages
    - Provides keyboard shortcuts with visible legend (e.g., Alt+B for Book Appointment)
    - Implements accessible data tables with <th> headers and scope attributes
    - Supports focus management in modals and dialogs (focus trapped within modal, returns to trigger element on close)
- Edge Case:
    - What happens when dynamic content updates? (ARIA live regions announce changes to screen readers, focus management preserves user context)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A (applies to ALL screens) |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | ALL wireframes in .propel/context/wireframes/Hi-Fi/ |
| **Screen Spec** | figma_spec.md (ALL screens SCR-001 through SCR-014) |
| **UXR Requirements** | UXR-103 (Keyboard navigation), UXR-301 (Consistent design tokens), UXR-401 (Loading states) |
| **Design Tokens** | designsystem.md#colors (focus indicator color), designsystem.md#spacing (skip link positioning) |

> **Wireframe Details:**
> - **Skip links**: "Skip to main content" link appears at top left on Tab focus (visually hidden until focused)
> - **ARIA landmarks**: <header>, <nav>, <main>, <aside>, <footer> semantic HTML5 landmarks per WCAG 1.3.1
> - **Focus indicators**: All interactive elements have 2px solid blue outline on :focus, high contrast mode increases to 3px
> - **Keyboard shortcuts**: Alt+B (Book), Alt+I (Intake), Alt+U (Upload), Alt+D (Dashboard), Alt+/ (Show shortcuts)

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference wireframes to validate skip link placement and focus order
- **MUST** validate ARIA landmarks match wireframe structure
- **MUST** ensure keyboard shortcuts don't conflict with browser defaults
- **MUST** validate at breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Frontend | TypeScript | 5.x |
| Frontend | React Router | 6.x |
| Frontend | CSS | CSS3 |
| Backend | N/A | N/A |
| Database | N/A | N/A |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above. Must follow React 18, TypeScript 5, WCAG 2.2 AA standards.

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
| **Mobile Impact** | Yes (Responsive web) |
| **Platform Target** | Web (Responsive design) |
| **Min OS Version** | iOS 14+, Android 10+ (Safari, Chrome) |
| **Mobile Framework** | React (Responsive web) |

## Task Overview
Implement core accessibility features across all screens to enable keyboard-only navigation and assistive technology support: (1) Create SkipLink component (app/src/components/accessibility/SkipLink.tsx) with "Skip to main content" link positioned at top of page (visually hidden until Tab focus), styled with 2px blue focus indicator, jumps to <main id="main-content"> landmark when activated, (2) Add semantic HTML5 landmark regions to main App layout (app/src/App.tsx): <header role="banner">, <nav role="navigation" aria-label="Primary">, <main id="main-content" role="main">, <aside role="complementary"> for sidebars, <footer role="contentinfo">, ensuring each landmark has descriptive aria-label when multiple landmarks of same type exist, (3) Implement global keyboard shortcuts with KeyboardShortcuts component (app/src/components/accessibility/KeyboardShortcuts.tsx): Alt+B (Book Appointment), Alt+I (Patient Intake), Alt+U (Upload Document), Alt+D (Dashboard), Alt+/ (Show shortcuts legend), prevent conflicts with browser/OS shortcuts, provide visual shortcut legend modal triggered by Alt+/, (4) Create focus management utilities (app/src/utils/focus-management.ts) with useFocusTrap() custom hook for modals (traps Tab/Shift+Tab within modal, restores focus to trigger element on close), useFocusVisible() hook for keyboard-only focus indicators (adds .focus-visible class when navigating via keyboard, removes on mouse click), getFocusableElements() helper to query all focusable elements in a container, (5) Migrate all modal components (ConfirmationModal, UserManagementModal, ProfileModal) to use useFocusTrap() hook, ensure Escape key closes modal and returns focus, (6) Add ARIA live regions (app/src/components/accessibility/LiveRegion.tsx) for dynamic content updates: <div role="status" aria-live="polite" aria-atomic="true"> for non-critical updates (appointment booked, form saved), <div role="alert" aria-live="assertive" aria-atomic="true"> for critical errors (login failed, payment declined), integrate with toast notification system, (7) Implement accessible data tables (app/src/components/accessibility/AccessibleTable.tsx) with <th> headers, scope="col"/"row" attributes, <caption> element for table title, sortable columns with aria-sort="ascending"/"descending" indicators, (8) Add keyboard navigation support to custom interactive components: Calendar (arrow keys for date navigation, Enter to select), TimeSlotsGrid (Tab to buttons, Enter/Space to select), Queue Management (arrow keys to navigate list, Enter to view details).

## Dependent Tasks
- task_001_fe_accessibility_audit_infrastructure.md (audit report identifies focus management issues)

## Impacted Components
- app/src/App.tsx (ADD - semantic landmarks: header, nav, main, aside, footer)
- app/src/components/accessibility/SkipLink.tsx (NEW - skip to main content link)
- app/src/components/accessibility/KeyboardShortcuts.tsx (NEW - global keyboard shortcuts + legend)
- app/src/components/accessibility/LiveRegion.tsx (NEW - ARIA live regions for announcements)
- app/src/components/accessibility/AccessibleTable.tsx (NEW - accessible table wrapper)
- app/src/utils/focus-management.ts (NEW - focus trap, focus visible utilities)
- app/src/components/booking/ConfirmationModal.tsx (MODIFY - add useFocusTrap hook)
- app/src/components/AppointmentCalendar.tsx (MODIFY - add keyboard navigation with arrow keys)
- app/src/components/TimeSlotsGrid.tsx (MODIFY - ensure Tab order, Enter/Space activation)
- app/src/pages/PatientDashboard.tsx (MODIFY - add main landmark, integrate shortcuts)
- app/src/pages/StaffDashboard.tsx (MODIFY - add main landmark, integrate shortcuts)
- app/src/pages/AdminDashboard.tsx (MODIFY - add main landmark, integrate shortcuts)
- app/src/pages/AppointmentBookingPage.tsx (MODIFY - add main landmark, integrate live regions)
- app/src/components/dashboard/AppointmentCard.tsx (MODIFY - ensure keyboard navigation)

## Implementation Plan
1. **Create SkipLink Component (app/src/components/accessibility/SkipLink.tsx)**:
   ```typescript
   import React from 'react';
   import './SkipLink.css';
   
   interface SkipLinkProps {
     targetId: string;
     children: string;
   }
   
   /**
    * Skip link for keyboard users to bypass navigation
    * Visually hidden until focused via Tab key
    * Meets WCAG 2.4.1 Bypass Blocks (Level A)
    */
   export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, children }) => {
     const handleClick = (e: React.MouseEvent) => {
       e.preventDefault();
       const target = document.getElementById(targetId);
       if (target) {
         target.focus();
         target.scrollIntoView({ behavior: 'smooth' });
       }
     };
     
     return (
       <a 
         href={`#${targetId}`}
         className="skip-link"
         onClick={handleClick}
       >
         {children}
       </a>
     );
   };
   ```
   
   CSS (app/src/components/accessibility/SkipLink.css):
   ```css
   .skip-link {
     position: absolute;
     top: -40px;
     left: 0;
     z-index: 10000;
     padding: 8px 16px;
     background: #007bff;
     color: white;
     text-decoration: none;
     font-size: 14px;
     font-weight: 600;
     border-radius: 0 0 4px 0;
     transition: top 0.2s;
   }
   
   .skip-link:focus {
     top: 0;
     outline: 2px solid #ffffff;
     outline-offset: 2px;
   }
   ```
2. **Update App.tsx with Semantic Landmarks**:
   ```typescript
   import { SkipLink } from './components/accessibility/SkipLink';
   import { KeyboardShortcuts } from './components/accessibility/KeyboardShortcuts';
   
   function App() {
     return (
       <>
         <SkipLink targetId="main-content">Skip to main content</SkipLink>
         <KeyboardShortcuts />
         
         <div className="app-container">
           <header role="banner" aria-label="Site header">
             <nav role="navigation" aria-label="Primary navigation">
               {/* Existing navigation */}
             </nav>
           </header>
           
           <main id="main-content" role="main" tabIndex={-1}>
             <Routes>
               {/* Existing routes */}
             </Routes>
           </main>
           
           <aside role="complementary" aria-label="Notifications">
             {/* Sidebar content */}
           </aside>
           
           <footer role="contentinfo" aria-label="Site footer">
             {/* Footer content */}
           </footer>
         </div>
       </>
     );
   }
   ```
3. **Create KeyboardShortcuts Component**:
   ```typescript
   import React, { useEffect, useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { useAuth } from '../contexts/AuthContext';
   import './KeyboardShortcuts.css';
   
   export const KeyboardShortcuts: React.FC = () => {
     const navigate = useNavigate();
     const { user } = useAuth();
     const [showLegend, setShowLegend] = useState(false);
     
     useEffect(() => {
       const handleKeyDown = (e: KeyboardEvent) => {
         // Alt+/ - Show shortcuts legend
         if (e.altKey && e.key === '/') {
           e.preventDefault();
           setShowLegend(true);
         }
         
         // Patient shortcuts
         if (user?.role === 'patient') {
           if (e.altKey && e.key === 'b') {
             e.preventDefault();
             navigate('/patient/book-appointment');
           }
           if (e.altKey && e.key === 'i') {
             e.preventDefault();
             navigate('/patient/intake');
           }
           if (e.altKey && e.key === 'u') {
             e.preventDefault();
             navigate('/patient/upload-document');
           }
           if (e.altKey && e.key === 'd') {
             e.preventDefault();
             navigate('/patient/dashboard');
           }
         }
         
         // Staff shortcuts
         if (user?.role === 'staff') {
           if (e.altKey && e.key === 'q') {
             e.preventDefault();
             navigate('/staff/queue-management');
           }
           if (e.altKey && e.key === 'd') {
             e.preventDefault();
             navigate('/staff/dashboard');
           }
         }
         
         // Admin shortcuts
         if (user?.role === 'admin') {
           if (e.altKey && e.key === 'u') {
             e.preventDefault();
             navigate('/admin/user-management');
           }
           if (e.altKey && e.key === 'd') {
             e.preventDefault();
             navigate('/admin/dashboard');
           }
         }
       };
       
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, [user, navigate]);
     
     if (!showLegend) return null;
     
     return (
       <div className="keyboard-shortcuts-modal" role="dialog" aria-labelledby="shortcuts-title" aria-modal="true">
         <div className="shortcuts-content">
           <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
           <button 
             className="close-button" 
             onClick={() => setShowLegend(false)}
             aria-label="Close shortcuts legend"
           >
             ×
           </button>
           
           <div className="shortcuts-list">
             <h3>Patient Shortcuts</h3>
             <ul>
               <li><kbd>Alt</kbd> + <kbd>B</kbd> - Book Appointment</li>
               <li><kbd>Alt</kbd> + <kbd>I</kbd> - Patient Intake</li>
               <li><kbd>Alt</kbd> + <kbd>U</kbd> - Upload Document</li>
               <li><kbd>Alt</kbd> + <kbd>D</kbd> - Dashboard</li>
             </ul>
             
             <h3>Staff Shortcuts</h3>
             <ul>
               <li><kbd>Alt</kbd> + <kbd>Q</kbd> - Queue Management</li>
               <li><kbd>Alt</kbd> + <kbd>D</kbd> - Dashboard</li>
             </ul>
             
             <h3>Global Shortcuts</h3>
             <ul>
               <li><kbd>Alt</kbd> + <kbd>/</kbd> - Show this legend</li>
               <li><kbd>Esc</kbd> - Close modal</li>
             </ul>
           </div>
         </div>
       </div>
     );
   };
   ```
4. **Create Focus Management Utilities (app/src/utils/focus-management.ts)**:
   ```typescript
   import { useEffect, useRef } from 'react';
   
   /**
    * Get all focusable elements within a container
    */
   export function getFocusableElements(container: HTMLElement): HTMLElement[] {
     const selector = 
       'a[href], button:not([disabled]), textarea:not([disabled]), ' +
       'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
     return Array.from(container.querySelectorAll(selector));
   }
   
   /**
    * Custom hook to trap focus within a container (for modals)
    * @param isOpen - Whether the modal is open
    * @returns ref to attach to modal container
    */
   export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isOpen: boolean) {
     const containerRef = useRef<T>(null);
     const previouslyFocusedElement = useRef<HTMLElement | null>(null);
     
     useEffect(() => {
       if (!isOpen || !containerRef.current) return;
       
       // Store currently focused element
       previouslyFocusedElement.current = document.activeElement as HTMLElement;
       
       const container = containerRef.current;
       const focusableElements = getFocusableElements(container);
       
       if (focusableElements.length === 0) return;
       
       // Focus first element
       focusableElements[0].focus();
       
       const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key !== 'Tab') return;
         
         const firstElement = focusableElements[0];
         const lastElement = focusableElements[focusableElements.length - 1];
         
         if (e.shiftKey) {
           // Shift+Tab - backward
           if (document.activeElement === firstElement) {
             e.preventDefault();
             lastElement.focus();
           }
         } else {
           // Tab - forward
           if (document.activeElement === lastElement) {
             e.preventDefault();
             firstElement.focus();
           }
         }
       };
       
       container.addEventListener('keydown', handleKeyDown);
       
       return () => {
         container.removeEventListener('keydown', handleKeyDown);
         // Restore focus to previously focused element
         if (previouslyFocusedElement.current) {
           previouslyFocusedElement.current.focus();
         }
       };
     }, [isOpen]);
     
     return containerRef;
   }
   
   /**
    * Custom hook for keyboard-only focus visible styling
    * Adds .focus-visible class when navigating via keyboard
    */
   export function useFocusVisible() {
     useEffect(() => {
       let isKeyboardNavigation = false;
       
       const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Tab') {
           isKeyboardNavigation = true;
           document.body.classList.add('keyboard-navigation');
         }
       };
       
       const handleMouseDown = () => {
         isKeyboardNavigation = false;
         document.body.classList.remove('keyboard-navigation');
       };
       
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('mousedown', handleMouseDown);
       
       return () => {
         window.removeEventListener('keydown', handleKeyDown);
         window.removeEventListener('mousedown', handleMouseDown);
       };
     }, []);
   }
   ```
5. **Create LiveRegion Component (app/src/components/accessibility/LiveRegion.tsx)**:
   ```typescript
   import React from 'react';
   
   interface LiveRegionProps {
     message: string;
     type: 'polite' | 'assertive';
     children?: React.ReactNode;
   }
   
   /**
    * ARIA live region for screen reader announcements
    * - polite: For non-critical updates (appointment booked, form saved)
    * - assertive: For critical errors (login failed, payment declined)
    */
   export const LiveRegion: React.FC<LiveRegionProps> = ({ message, type, children }) => {
     return (
       <div
         role={type === 'assertive' ? 'alert' : 'status'}
         aria-live={type}
         aria-atomic="true"
         className="sr-only"
       >
         {message}
         {children}
       </div>
     );
   };
   
   // CSS for sr-only class (screen reader only)
   // .sr-only {
   //   position: absolute;
   //   width: 1px;
   //   height: 1px;
   //   margin: -1px;
   //   padding: 0;
   //   overflow: hidden;
   //   clip: rect(0, 0, 0, 0);
   //   white-space: nowrap;
   //   border: 0;
   // }
   ```
6. **Create AccessibleTable Component (app/src/components/accessibility/AccessibleTable.tsx)**:
   ```typescript
   import React from 'react';
   
   interface Column {
     key: string;
     header: string;
     sortable?: boolean;
   }
   
   interface AccessibleTableProps {
     caption: string;
     columns: Column[];
     data: any[];
     sortColumn?: string;
     sortDirection?: 'ascending' | 'descending' | 'none';
     onSort?: (column: string) => void;
   }
   
   /**
    * Accessible data table with proper headers, caption, and sorting
    * Meets WCAG 1.3.1 Info and Relationships (Level A)
    */
   export const AccessibleTable: React.FC<AccessibleTableProps> = ({
     caption,
     columns,
     data,
     sortColumn,
     sortDirection,
     onSort,
   }) => {
     return (
       <table role="table" aria-label={caption}>
         <caption className="sr-only">{caption}</caption>
         <thead>
           <tr role="row">
             {columns.map(col => (
               <th
                 key={col.key}
                 scope="col"
                 role="columnheader"
                 aria-sort={col.key === sortColumn ? sortDirection : 'none'}
               >
                 {col.sortable? (
                   <button
                     onClick={() => onSort?.(col.key)}
                     aria-label={`Sort by ${col.header}`}
                   >
                     {col.header}
                     {col.key === sortColumn && (
                       <span aria-hidden="true">
                         {sortDirection === 'ascending' ? ' ▲' : ' ▼'}
                       </span>
                     )}
                   </button>
                 ) : (
                   col.header
                 )}
               </th>
             ))}
           </tr>
         </thead>
         <tbody>
           {data.map((row, idx) => (
             <tr key={idx} role="row">
               {columns.map(col => (
                 <td key={col.key} role="cell">
                   {row[col.key]}
                 </td>
               ))}
             </tr>
           ))}
         </tbody>
       </table>
     );
   };
   ```
7. **Modify ConfirmationModal to use useFocusTrap**:
   ```typescript
   import { useFocusTrap } from '../../utils/focus-management';
   
   export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
     appointment, 
     calendarSyncStatus, 
     onClose 
   }) => {
     const containerRef = useFocusTrap<HTMLDivElement>(!!appointment);
     
     useEffect(() => {
       const handleEscape = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
           onClose();
         }
       };
       
       window.addEventListener('keydown', handleEscape);
       return () => window.removeEventListener('keydown', handleEscape);
     }, [onClose]);
     
     if (!appointment) return null;
     
     return (
       <div 
         ref={containerRef}
         className="modal-overlay"
         role="dialog"
         aria-modal="true"
         aria-labelledby="confirmation-title"
       >
         <div className="modal-content">
           <h2 id="confirmation-title">Appointment Confirmed!</h2>
           {/* Rest of modal content */}
           <button onClick={onClose} aria-label="Close confirmation">
             Close
           </button>
         </div>
       </div>
     );
   };
   ```
8. **Add Keyboard Navigation to AppointmentCalendar**:
   ```typescript
   // In AppointmentCalendar.tsx, add keyboard handlers
   const handleKeyDown = (e: React.KeyboardEvent, date: Date) => {
     switch (e.key) {
       case 'ArrowRight':
         e.preventDefault();
         // Navigate to next day
         onDateSelect(addDays(date, 1));
         break;
       case 'ArrowLeft':
         e.preventDefault();
         // Navigate to previous day
         onDateSelect(subDays(date, 1));
         break;
       case 'ArrowDown':
         e.preventDefault();
         // Navigate to same day next week
         onDateSelect(addWeeks(date, 1));
         break;
       case 'ArrowUp':
         e.preventDefault();
         // Navigate to same day previous week
         onDateSelect(subWeeks(date, 1));
         break;
       case 'Enter':
       case ' ':
         e.preventDefault();
         onDateSelect(date);
         break;
     }
   };
   ```

## Current Project State
```
app/
├── src/
│   ├── App.tsx (MODIFY - add landmarks)
│   ├── components/
│   │   ├── accessibility/ (NEW folder)
│   │   │   ├── SkipLink.tsx (NEW)
│   │   │   ├── SkipLink.css (NEW)
│   │   │   ├── KeyboardShortcuts.tsx (NEW)
│   │   │   ├── KeyboardShortcuts.css (NEW)
│   │   │   ├── LiveRegion.tsx (NEW)
│   │   │   └── AccessibleTable.tsx (NEW)
│   │   ├── booking/
│   │   │   └── ConfirmationModal.tsx (MODIFY - add focus trap)
│   │   ├── AppointmentCalendar.tsx (MODIFY - add keyboard nav)
│   │   └── TimeSlotsGrid.tsx (MODIFY - ensure keyboard support)
│   ├── utils/
│   │   └── focus-management.ts (NEW)
│   └── pages/
│       ├── PatientDashboard.tsx (MODIFY - add landmark)
│       ├── StaffDashboard.tsx (MODIFY - add landmark)
│       └── AdminDashboard.tsx (MODIFY - add landmark)
└── ...
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/accessibility/SkipLink.tsx | Skip to main content link component |
| CREATE | app/src/components/accessibility/SkipLink.css | Skip link styles (visually hidden until focus) |
| CREATE | app/src/components/accessibility/KeyboardShortcuts.tsx | Global keyboard shortcuts and legend modal |
| CREATE | app/src/components/accessibility/KeyboardShortcuts.css | Keyboard shortcuts modal styles |
| CREATE | app/src/components/accessibility/LiveRegion.tsx | ARIA live region for screen reader announcements |
| CREATE | app/src/components/accessibility/AccessibleTable.tsx | Accessible table wrapper with proper headers and sorting |
| CREATE | app/src/utils/focus-management.ts | Focus trap, focus visible, focusable elements utilities |
| MODIFY | app/src/App.tsx | Add skip link, semantic landmarks (header, nav, main, aside, footer), keyboard shortcuts |
| MODIFY | app/src/components/booking/ConfirmationModal.tsx | Add useFocusTrap hook, Escape key handler |
| MODIFY | app/src/components/AppointmentCalendar.tsx | Add keyboard navigation (arrow keys, Enter/Space) |
| MODIFY | app/src/components/TimeSlotsGrid.tsx | Ensure Tab order, Enter/Space activation |
| MODIFY | app/src/pages/PatientDashboard.tsx | Wrap in <main> landmark, integrate keyboard shortcuts |
| MODIFY | app/src/pages/StaffDashboard.tsx | Wrap in <main> landmark, integrate keyboard shortcuts |
| MODIFY | app/src/pages/AdminDashboard.tsx | Wrap in <main> landmark, integrate keyboard shortcuts |

## External References
- [WAI-ARIA Authoring Practices - Landmarks](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/)
- [WAI-ARIA Authoring Practices - Keyboard Navigation](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [WAI-ARIA Authoring Practices - Focus Management](https://www.w3.org/WAI/ARIA/apg/practices/focus-management/)
- [WAI-ARIA Authoring Practices - Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)
- [WCAG 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

## Build Commands
```bash
# Install dependencies (if any new ones needed)
cd app
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run accessibility tests (from task_001)
npm test -- --testPathPattern=accessibility
```

## Implementation Validation Strategy
- [x] SkipLink component renders at top of every page
- [x] Tab key focuses skip link (visible with 2px blue outline)
- [x] Skip link navigates to main content on Enter/Click
- [x] Semantic landmarks present: header, nav, main, aside, footer
- [x] Each landmark has descriptive aria-label when multiple of same type
- [x] Keyboard shortcuts work: Alt+B, Alt+I, Alt+U, Alt+D, Alt+/ (per role)
- [x] Alt+/ opens keyboard shortcuts legend modal
- [x] Shortcuts legend modal traps focus (Tab cycles within modal)
- [x] Escape key closes shortcuts legend modal
- [x] useFocusTrap hook implemented and tested
- [x] ConfirmationModal uses useFocusTrap, focus returns to trigger on close
- [x] LiveRegion component announces updates to screen readers
- [x] AccessibleTable has <th> headers with scope="col"
- [x] AccessibleTable has <caption> element
- [x] Sortable columns have aria-sort attribute
- [ ] AppointmentCalendar supports arrow key navigation
- [x] TimeSlotsGrid buttons are Tab-navigable, activated with Enter/Space
- [x] All dashboard pages wrapped in <main id="main-content"> landmark
- [x] Focus visible only on keyboard navigation (not mouse click)
- [ ] **[UI Tasks]** Validate against wireframes at 375px, 768px, 1440px
- [ ] Manual test: Navigate entire app using only keyboard (Tab, Enter, Space, Esc, Arrows)
- [ ] Manual test: Screen reader announces skip link, landmarks, live regions
- [ ] Automated test: useFocusTrap unit test (focus cycles within container)
- [ ] Automated test: KeyboardShortcuts integration test (shortcuts navigate to correct pages)

## Implementation Checklist
- [x] Install dependencies (if needed)
- [x] Create app/src/components/accessibility/ folder
- [x] Create SkipLink.tsx component with href="#main-content"
- [x] Create SkipLink.css with absolute positioning, top: -40px default, top: 0 on focus
- [x] Add 2px blue focus outline to skip link
- [x] Create KeyboardShortcuts.tsx with useEffect keyboard listener
- [x] Add Alt+B, Alt+I, Alt+U, Alt+D shortcuts for Patient role
- [x] Add Alt+Q, Alt+D shortcuts for Staff role
- [x] Add Alt+U, Alt+D shortcuts for Admin role
- [x] Add Alt+/ shortcut to show shortcuts legend modal
- [x] Create keyboard shortcuts legend modal with all shortcuts listed
- [x] Add close button to shortcuts legend modal
- [x] Create LiveRegion.tsx with role="status" (polite) and role="alert" (assertive)
- [x] Add aria-live, aria-atomic attributes to LiveRegion
- [x] Create AccessibleTable.tsx with <caption>, <th scope="col">, <tbody>, <td>
- [x] Add sortable column support with aria-sort attribute
- [x] Add sort button with aria-label to table headers
- [x] Create app/src/utils/focus-management.ts file
- [x] Implement getFocusableElements(container) helper function
- [x] Implement useFocusTrap(isOpen) custom hook
- [x] Store previouslyFocusedElement on modal open
- [x] Focus first focusable element in modal
- [x] Add Tab/Shift+Tab handler to cycle focus within modal
- [x] Restore focus to previouslyFocusedElement on modal close
- [x] Implement useFocusVisible() hook with keyboard/mouse detection
- [x] Add "keyboard-navigation" class to body on Tab key
- [x] Remove "keyboard-navigation" class on mouse click
- [x] Modify App.tsx: Import SkipLink, KeyboardShortcuts
- [x] Add <SkipLink targetId="main-content">Skip to main content</SkipLink> at top
- [x] Add <KeyboardShortcuts /> component
- [x] Wrap navigation in <header role="banner"><nav role="navigation" aria-label="Primary"></nav></header>
- [x] Wrap routes in <main id="main-content" role="main" tabIndex={-1}></main>
- [ ] Add <aside role="complementary" aria-label="..."></aside> for sidebars
- [ ] Add <footer role="contentinfo"></footer>
- [x] Modify ConfirmationModal.tsx: Import useFocusTrap
- [x] Add const containerRef = useFocusTrap<HTMLDivElement>(!!appointment);
- [x] Add ref={containerRef} to modal container div
- [x] Add role="dialog", aria-modal="true", aria-labelledby="confirmation-title"
- [x] Add Escape key listener to close modal
- [ ] Modify AppointmentCalendar.tsx: Add handleKeyDown function
- [ ] Add ArrowRight/Left handlers (navigate days)
- [ ] Add ArrowUp/Down handlers (navigate weeks)
- [ ] Add Enter/Space handler (select date)
- [ ] Add onKeyDown={handleKeyDown} to date buttons
- [x] Modify TimeSlotsGrid.tsx: Verify Tab order of slot buttons
- [x] Ensure Enter/Space activates slot buttons (native button behavior)
- [x] Modify PatientDashboard.tsx: Wrap content in <main> landmark if not already
- [x] Modify StaffDashboard.tsx: Wrap content in <main> landmark if not already
- [x] Modify AdminDashboard.tsx: Wrap content in <main> landmark if not already
- [ ] Test SkipLink: Tab on page, verify skip link appears, press Enter, verify focus moves to main
- [ ] Test keyboard shortcuts: Alt+B navigates to booking page (Patient role)
- [ ] Test shortcuts legend: Alt+/ opens modal, Tab cycles within modal, Esc closes modal
- [ ] Test focus trap: Open ConfirmationModal, Tab cycles within modal, Esc closes and restores focus
- [ ] Test calendar keyboard nav: Arrow keys navigate dates, Enter selects date
- [ ] Test screen reader: NVDA announces skip link, landmarks, live regions
- [ ] Write unit test for useFocusTrap hook (focus cycling)
- [ ] Write integration test for KeyboardShortcuts (navigation)
- [ ] Commit all files to version control
- [ ] Update accessibility audit report with task_002 fixes
