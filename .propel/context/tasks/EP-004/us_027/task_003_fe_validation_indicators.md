# Task - TASK_003: Frontend Validation Indicators and Context Display

## Requirement Reference
- User Story: [us_027]
- Story Location: [.propel/context/tasks/us_027/us_027.md]
- Acceptance Criteria:
    - AC1: Display validation feedback in real-time with green checkmarks for validated responses
    - AC1: Show clarification messages with yellow info icon when needed
    - AC1: Display active context indicator in chat footer
- Edge Case:
    - EC3: Show "Validating..." indicator during network latency, allow patient to continue typing

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-007 (AI Mode with validation indicators) |
| **UXR Requirements** | AIR-R01 (Response <3s), UXR-401 (Loading <200ms for typing indicators) |
| **Design Tokens** | .propel/context/docs/designsystem.md#icons, #colors |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference the wireframe file/URL during UI implementation
- **MUST** match layout, spacing, typography, and colors from the wireframe
- **MUST** implement all states shown in wireframe (default, hover, focus, error, loading)
- **MUST** validate implementation against wireframe at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify pixel-perfect alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | CSS Modules | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes (displaying AI validation results) |
| **AIR Requirements** | AIR-005, AIR-R01 |
| **AI Pattern** | Visual feedback for AI validations |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A (UI layer) |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Enhance AI chat interface from US_025 TASK_003 with real-time validation indicators. Add green checkmark icon next to user messages after successful validation (appears 200ms after AI response). Add yellow info icon with "Needs clarification" tooltip for messages with validation issues or clarifying questions. Display context indicator in chat footer showing active context fields "Remembering: chief complaint, allergies, medications" with subtle gray text. Show "Validating..." text with spinner next to user message during API call (up to 3s). Add visual states: pending (gray), validated (green), needs clarification (yellow/orange). Allow patient to continue typing while validation in progress (non-blocking UX). Update data summary panel in real-time as validation confirms extracted fields.

## Dependent Tasks
- TASK_002: Backend Real-Time Validation Service (provides validation results in API response)
- US_025 TASK_003: Frontend AI Chat Interface (base chat UI to enhance)

## Impacted Components
- **MODIFY** app/src/components/intake/MessageBubble.tsx - Add validation indicator icons
- **CREATE** app/src/components/intake/ValidationIndicator.tsx - Green checkmark, yellow info icon, pending spinner
- **CREATE** app/src/components/intake/ContextIndicator.tsx - Chat footer showing active context
- **CREATE** app/src/components/intake/ClarificationBadge.tsx - Yellow badge for clarification messages
- **MODIFY** app/src/hooks/useAIConversation.ts - Handle validation results from API response
- **MODIFY** app/src/types/aiIntake.types.ts - Add ValidationState, ValidationResult types
- **MODIFY** app/src/components/intake/DataSummaryPanel.tsx - Highlight newly validated fields

## Implementation Plan
1. **Modify aiIntake.types.ts**: Add ValidationState enum ('pending' | 'validated' | 'needs_clarification' | 'error'), Message interface add validationState, validationConfidence number, isClarification boolean
2. **Create ValidationIndicator.tsx**: Component accepting validationState prop, render based on state - pending: gray CircularProgress spinner, validated: green CheckCircleIcon, needs_clarification: yellow InfoIcon with tooltip, error: red ErrorIcon, position absolute top-right of message bubble, fade in animation 200ms
3. **Create ContextIndicator.tsx**: Display in chat footer below input box, extract active context fields from conversation.extractedData, render "Remembering: {fields.join(', ')}" in small gray text (12px), max 3 fields shown with "+2 more" if exceed, hover tooltip shows all fields, icon: brain or memory icon
4. **Create ClarificationBadge.tsx**: Yellow/orange badge with "Clarification needed" text, info icon, appears on AI messages that contain clarifying questions, slightly larger than validation indicator for visibility
5. **Modify MessageBubble.tsx**: Add ValidationIndicator component to user messages, initially render with state='pending', update to 'validated' when API returns success, position indicator top-right corner of bubble, for AI messages with clarifications add ClarificationBadge at bottom
6. **Modify useAIConversation hook**: After sendMessage API call, parse response.validationResults array, update message validationState based on results (isValid=true → 'validated', isValid=false → 'needs_clarification'), update extractedData with validated fields, trigger re-render to show indicators
7. **Modify DataSummaryPanel**: Add highlight animation (yellow glow) to newly validated fields, fade animation lasts 1 second, show confidence score next to field if < 0.9 ("90% confident"), add checkmark icon next to high-confidence fields
8. **Add Loading State Management**: While API call in progress, show "Validating..." text below user message with animated ellipsis, disable send button if previous message still validating (prevent spam), queue messages if user types during validation (send after validation completes)

**Focus on how to implement**: Validation indicator positioning: `position: absolute; top: 8px; right: 8px;` in message bubble. Icon libraries: Material-UI icons or react-icons. Fade animation: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .indicator { animation: fadeIn 200ms; }`. Context extraction: `Object.keys(conversation.extractedData).filter(k => conversation.extractedData[k]).slice(0, 3).join(', ')`. Tooltip: use native `title` attribute or custom Tooltip component. Highlight animation: `@keyframes glow { 0%, 100% { box-shadow: 0 0 5px transparent; } 50% { box-shadow: 0 0 10px rgba(255, 255, 0, 0.5); } }`. Non-blocking validation: message immediately added to state, validation state updated asynchronously. Message queue: `const [pendingMessages, setPendingMessages] = useState<string[]>([])`, process queue when validation completes.

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── intake/
│   │   │   ├── AIChatInterface.tsx (US_025 TASK_003)
│   │   │   ├── MessageBubble.tsx (US_025 TASK_003, to be modified)
│   │   │   ├── DataSummaryPanel.tsx (US_025 TASK_003, to be modified)
│   │   │   └── (ValidationIndicator.tsx, ContextIndicator.tsx, ClarificationBadge.tsx to be created)
│   │   └── common/
│   │       └── Tooltip.tsx (may exist or create)
│   ├── hooks/
│   │   └── useAIConversation.ts (US_025 TASK_003, to be modified)
│   └── types/
│       └── aiIntake.types.ts (US_025, to be modified)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/intake/ValidationIndicator.tsx | Green checkmark, yellow info, pending spinner, error icon based on validation state |
| CREATE | app/src/components/intake/ContextIndicator.tsx | Chat footer showing "Remembering: [fields]" with active context |
| CREATE | app/src/components/intake/ClarificationBadge.tsx | Yellow badge for messages needing clarification |
| MODIFY | app/src/components/intake/MessageBubble.tsx | Add ValidationIndicator to user messages, ClarificationBadge to AI clarifications |
| MODIFY | app/src/hooks/useAIConversation.ts | Parse validation results from API, update message states asynchronously |
| MODIFY | app/src/types/aiIntake.types.ts | Add ValidationState enum, validationState/validationConfidence to Message interface |
| MODIFY | app/src/components/intake/DataSummaryPanel.tsx | Highlight newly validated fields with glow animation, show confidence scores |

## External References
- **Material-UI Icons**: https://mui.com/material-ui/material-icons/ - CheckCircleIcon, InfoIcon, ErrorIcon
- **React Icons**: https://react-icons.github.io/react-icons/ - Alternative icon library
- **CSS Animations**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations - Fade in, glow effects
- **Tooltip Components**: https://react-spectrum.adobe.com/react-aria/useTooltip.html - Accessible tooltips
- **Loading States**: https://www.nngroup.com/articles/progress-indicators/ - UX best practices for loading

## Build Commands
- Install dependencies: `npm install @mui/icons-material@^5.15.0` (if using Material-UI icons)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for validation indicator components)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Green checkmark appears within 200ms after successful validation
- [x] Yellow info icon displays for messages needing clarification
- [x] Context indicator shows active fields in chat footer
- [x] "Validating..." text displays during API call (pending state)
- [x] Patient can continue typing while validation in progress
- [x] Data summary panel highlights newly validated fields with animation
- [x] Confidence scores display for low-confidence validations (<90%)
- [x] Tooltips work on hover for clarification messages
- [x] Animation performance: no jank, smooth transitions at 60fps

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html during implementation
- [ ] Install dependencies: npm install @mui/icons-material@^5.15.0 (or use existing icon library)
- [ ] Modify aiIntake.types.ts (add ValidationState type: 'pending' | 'validated' | 'needs_clarification' | 'error'; modify Message interface add validationState?: ValidationState, validationConfidence?: number, isClarification?: boolean)
- [ ] Create ValidationIndicator.tsx component (props: validationState, switch on state: pending → CircularProgress gray, validated → CheckCircle green, needs_clarification → InfoIcon yellow, error → ErrorIcon red, position absolute top-right, CSS fade in animation 200ms)
- [ ] Create ContextIndicator.tsx component (props: extractedData object, extract filled keys, render "Remembering: {keys.slice(0,3).join(', ')}" with brain icon, small gray text 12px, if keys.length > 3 show "+{keys.length - 3} more" with tooltip on hover listing all)
- [ ] Create ClarificationBadge.tsx component (yellow/orange badge with "Clarification needed" text and info icon, slightly larger than validation indicator, positioned at bottom of AI message bubble)
- [ ] Modify MessageBubble.tsx (add ValidationIndicator to user messages with validationState prop from message.validationState, add ClarificationBadge to AI messages where message.isClarification = true, add "Validating..." text below user message when validationState='pending')
- [ ] Modify useAIConversation.ts sendMessage (optimistically add message with validationState='pending', after API response parse response.validationResults, update message validationState based on isValid, update extractedData with validated fields, trigger re-render)
- [ ] Modify DataSummaryPanel.tsx (track previous extractedData in useRef, compare with current to detect new fields, add highlight animation to new fields: @keyframes glow with yellow box-shadow, display confidence score if validationConfidence < 0.9: "{value} (90%)", add checkmark icon for high-confidence fields)
- [ ] Add loading state management (show "Validating..." with animated ellipsis: <span className="dots">...</span> with CSS animation, allow user to continue typing during validation: dont disable input, queue messages if rapid typing: store in pendingMessages state array, send next message after validation completes)
