# Task - TASK_004_FE_COMPONENT_MODAL_ACCESSIBILITY

## Requirement Reference
- User Story: US_043
- Story Location: .propel/context/tasks/us_043/us_043.md
- Acceptance Criteria:
    - Supports screen readers (NVDA, JAWS, VoiceOver) with ARIA labels on all buttons, inputs, and dynamic content regions
    - Provides alt text for all images with meaningful descriptions (decorative images marked aria-hidden="true")
    - Supports focus management in modals and dialogs (focus trapped within modal, returns to trigger element on close)
- Edge Case:
    - How are complex widgets like calendar pickers made accessible? (Use semantic date inputs as fallback, calendar has arrow key navigation + Enter to select)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A (applies to ALL screens with modals/components) |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | ALL wireframes (modal/component patterns) |
| **Screen Spec** | figma_spec.md (ALL screens) |
| **UXR Requirements** | UXR-102 (Screen readers), UXR-103 (Keyboard navigation) |
| **Design Tokens** | designsystem.md#components |

> **Wireframe Details:**
> - **Modal dialogs**: role="dialog", aria-modal="true", aria-labelledby for title, focus trap, Escape closes
> - **Tooltips**: role="tooltip", aria-describedby, triggered on hover/focus, dismissible with Escape
> - **Dropdowns**: role="menu"/"listbox", aria-expanded, arrow keys navigate, Enter selects
> - **Images**: All functional images have alt text, decorative images have alt="" or aria-hidden="true"

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** validate modal structure matches wireframe (header, content, footer)
- **MUST** ensure interactive components have proper ARIA roles
- **MUST** validate at breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.x |
| Frontend | TypeScript | 5.x |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive) |

## Task Overview
Implement accessible patterns for interactive components and modals: (1) Update all modal components with proper ARIA attributes (role="dialog", aria-modal="true", aria-labelledby), integrate useFocusTrap() from task_002, Escape key closes modal, focus returns to trigger, (2) Create AccessibleTooltip component with role="tooltip", aria-describedby linking tooltip to trigger, show on hover + focus, hide on Escape/blur, timeout after 5 seconds, (3) Create AccessibleDropdown with role="listbox", aria-expanded, arrow keys for navigation, Enter/Space to select, typeahead search, close on Escape, (4) Add alt text to all images: functional images get descriptive alt, decorative images get alt="" or aria-hidden="true", complex images (charts) get longdesc or aria-describedby linking to detailed description, (5) Make calendar picker accessible: native date input fallback, custom calendar has grid role, arrow keys navigate dates, Enter selects, month/year selectors are accessible selects, (6) Update notification toasts with role="alert"/"status", aria-live regions, dismissible with Escape or X button, auto-dismiss after 5s with pause on hover/focus, (7) Ensure all icon buttons have aria-label ("Close", "Edit", "Delete"), text alternatives for icon-only actions, (8) Add loading spinners with role="status", aria-live="polite", aria-label="Loading...".

## Dependent Tasks
- task_002_fe_core_accessibility_features.md (useFocusTrap hook)

## Impacted Components
- app/src/components/booking/ConfirmationModal.tsx (MODIFY - add ARIA attributes)
- app/src/components/modals/* (MODIFY - all modals)
- app/src/components/accessibility/AccessibleTooltip.tsx (NEW)
- app/src/components/accessibility/AccessibleDropdown.tsx (NEW)
- app/src/components/AppointmentCalendar.tsx (MODIFY - add grid role, keyboard nav)
- app/src/components/notifications/Toast.tsx (MODIFY - add ARIA live regions)
- All image tags in components (MODIFY - add alt text)
- All icon buttons (MODIFY - add aria-label)

## Implementation Plan
1. **Update ConfirmationModal with ARIA**:
   ```typescript
   <div 
     ref={containerRef}
     role="dialog"
     aria-modal="true"
     aria-labelledby="modal-title"
     aria-describedby="modal-description"
   >
     <h2 id="modal-title">Confirmation</h2>
     <div id="modal-description">Your appointment is confirmed</div>
     <button onClick={onClose} aria-label="Close confirmation modal">×</button>
   </div>
   ```

2. **Create AccessibleTooltip**:
   ```typescript
   interface AccessibleTooltipProps {
     trigger: React.ReactNode;
     content: string;
     position?: 'top' | 'bottom' | 'left' | 'right';
   }
   
   export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
     trigger,
     content,
     position = 'top',
   }) => {
     const [show, setShow] = useState(false);
     const tooltipId = useId();
     const timeoutRef = useRef<NodeJS.Timeout>();
     
     const handleShow = () => {
       setShow(true);
       timeoutRef.current = setTimeout(() => setShow(false), 5000);
     };
     
     const handleHide = () => {
       setShow(false);
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
     };
     
     return (
       <div className="tooltip-container">
         <div
           onMouseEnter={handleShow}
           onMouseLeave={handleHide}
           onFocus={handleShow}
           onBlur={handleHide}
           aria-describedby={show ? tooltipId : undefined}
         >
           {trigger}
         </div>
         {show && (
           <div
             id={tooltipId}
             role="tooltip"
             className={`tooltip tooltip-${position}`}
           >
             {content}
           </div>
         )}
       </div>
     );
   };
   ```

3. **Create AccessibleDropdown**:
   ```typescript
   export const AccessibleDropdown: React.FC<DropdownProps> = ({
     options,
     value,
     onChange,
     label,
   }) => {
     const [isOpen, setIsOpen] = useState(false);
     const [focusedIndex, setFocusedIndex] = useState(0);
     const dropdownId = useId();
     
     const handleKeyDown = (e: React.KeyboardEvent) => {
       switch (e.key) {
         case 'ArrowDown':
           e.preventDefault();
           setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
           break;
         case 'ArrowUp':
           e.preventDefault();
           setFocusedIndex((prev) => Math.max(prev - 1, 0));
           break;
         case 'Enter':
         case ' ':
           e.preventDefault();
           onChange(options[focusedIndex].value);
           setIsOpen(false);
           break;
         case 'Escape':
           e.preventDefault();
           setIsOpen(false);
           break;
       }
     };
     
     return (
       <div className="dropdown">
         <button
           aria-haspopup="listbox"
           aria-expanded={isOpen}
           aria-labelledby={dropdownId}
           onClick={() => setIsOpen(!isOpen)}
         >
           {label}
         </button>
         {isOpen && (
           <ul
             role="listbox"
             aria-labelledby={dropdownId}
             onKeyDown={handleKeyDown}
           >
             {options.map((opt, idx) => (
               <li
                 key={opt.value}
                 role="option"
                 aria-selected={value === opt.value}
                 className={idx === focusedIndex ? 'focused' : ''}
                 onClick={() => {
                   onChange(opt.value);
                   setIsOpen(false);
                 }}
               >
                 {opt.label}
               </li>
             ))}
           </ul>
         )}
       </div>
     );
   };
   ```

4. **Add Alt Text Pattern**:
   ```typescript
   // Functional image (action/information)
   <img src="user-avatar.jpg" alt="User profile picture" />
   
   // Decorative image
   <img src="decoration.png" alt="" aria-hidden="true" />
   
   // Complex image (chart)
   <img 
     src="chart.png" 
     alt="Monthly appointment trends" 
     aria-describedby="chart-description"
   />
   <div id="chart-description" className="sr-only">
     Bar chart showing appointment volume increasing from 100 in January to 250 in December.
   </div>
   ```

5. **Make Calendar Accessible**:
   ```typescript
   <div role="grid" aria-label="Calendar">
     <div role="row">
       <div role="columnheader">Sun</div>
       <div role="columnheader">Mon</div>
       {/* ... */}
     </div>
     <div role="row">
       <button 
         role="gridcell" 
         aria-label="March 1, 2026"
         onClick={() => selectDate(new Date(2026, 2, 1))}
       >
         1
       </button>
       {/* ... */}
     </div>
   </div>
   ```

6. **Update Toast Notifications**:
   ```typescript
   <div
     role={severity === 'error' ? 'alert' : 'status'}
     aria-live={severity === 'error' ? 'assertive' : 'polite'}
     aria-atomic="true"
     className={`toast toast-${severity}`}
   >
     <span>{message}</span>
     <button onClick={onClose} aria-label="Dismiss notification">×</button>
   </div>
   ```

7. **Add Icon Button Labels**:
   ```typescript
   // Before (inaccessible)
   <button onClick={handleEdit}><EditIcon /></button>
   
   // After (accessible)
   <button onClick={handleEdit} aria-label="Edit appointment">
     <EditIcon aria-hidden="true" />
   </button>
   ```

8. **Add Loading Spinner**:
   ```typescript
   <div role="status" aria-live="polite" aria-label="Loading...">
     <svg className="spinner" aria-hidden="true">
       {/* spinner SVG */}
     </svg>
     <span className="sr-only">Loading...</span>
   </div>
   ```

## Current Project State
```
app/src/components/
├── accessibility/
│   ├── AccessibleTooltip.tsx (NEW)
│   └── AccessibleDropdown.tsx (NEW)
├── booking/
│   └── ConfirmationModal.tsx (MODIFY)
├── modals/ (MODIFY all)
├── AppointmentCalendar.tsx (MODIFY)
└── notifications/
    └── Toast.tsx (MODIFY)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/accessibility/AccessibleTooltip.tsx | Tooltip with role="tooltip and ARIA |
| CREATE | app/src/components/accessibility/AccessibleDropdown.tsx | Dropdown with listbox role and keyboard nav |
| MODIFY | app/src/components/booking/ConfirmationModal.tsx | Add dialog role, aria-modal, aria-labelledby |
| MODIFY | app/src/components/modals/* | Add ARIA attributes to all modals |
| MODIFY | app/src/components/AppointmentCalendar.tsx | Add grid role and keyboard navigation |
| MODIFY | app/src/components/notifications/Toast.tsx | Add role="alert"/"status", aria-live |
| MODIFY | All components with images | Add alt text or aria-hidden="true" |
| MODIFY | All icon buttons | Add aria-label |

## External References
- [WAI-ARIA Authoring Practices - Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WAI-ARIA Authoring Practices - Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
- [WAI-ARIA Authoring Practices - Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
- [WCAG 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)

## Build Commands
```bash
cd app
npm run dev
npm test -- --testPathPattern=components
```

## Implementation Validation Strategy
- [x] All modals have role="dialog", aria-modal="true", aria-labelledby
- [x] Modal focus trapped, Escape closes, focus returns to trigger
- [x] Tooltips have role="tooltip", shown on hover+focus, dismissed on Escape
- [x] Dropdowns have listbox role, arrow keys navigate, Enter selects
- [ ] All functional images have descriptive alt text
- [ ] All decorative images have alt="" or aria-hidden="true"
- [ ] Calendar has grid role, arrow keys navigate, Enter selects
- [x] Toasts have role="alert"/"status", aria-live regions
- [ ] All icon buttons have aria-label
- [x] Loading spinners have role="status", aria-label
- [ ] **[UI Tasks]** Validate at 375px, 768px, 1440px breakpoints
- [ ] Screen reader test: NVDA announces modals, tooltips, toasts correctly
- [x] Keyboard test: Navigate dropdown with arrows, select with Enter

## Implementation Checklist
- [x] Create AccessibleTooltip.tsx with role="tooltip"
- [x] Add show/hide on hover + focus
- [x] Add 5s timeout and Escape dismissal
- [x] Create AccessibleDropdown.tsx with role="listbox"
- [x] Add arrow key navigation and Enter selection
- [x] Add typeahead search functionality
- [x] Modify ConfirmationModal: add role="dialog", aria-modal="true"
- [x] Add aria-labelledby and aria-describedby to modal
- [x] Ensure Escape closes modal
- [ ] Audit all images, add alt text or alt=""
- [ ] Mark decorative images with aria-hidden="true"
- [ ] Update calendar with role="grid"
- [ ] Add role="columnheader" to weekday headers
- [ ] Add role="gridcell" to date buttons
- [ ] Add arrow key navigation to calendar
- [x] Modify Toast component: add role="alert"/"status"
- [x] Add aria-live="assertive"/"polite" based on severity
- [x] Add dismiss button with aria-label
- [ ] Audit all icon buttons, add aria-label
- [ ] Mark icons with aria-hidden="true" when labeled
- [x] Test modal focus trap with Tab key
- [x] Test tooltip dismissal with Escape
- [x] Test dropdown navigation with arrow keys
- [ ] Test calendar navigation with arrow keys
- [ ] Test toast dismissal with Escape
- [ ] Run screen reader test on all components
- [ ] Write unit tests for new components
- [ ] Commit all changes to version control
