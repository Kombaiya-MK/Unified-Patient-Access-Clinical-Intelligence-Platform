# Task - TASK_003: Frontend AI Chat Interface with Real-Time Summary Panel

## Requirement Reference
- User Story: [us_025]
- Story Location: [.propel/context/tasks/us_025/us_025.md]
- Acceptance Criteria:
    - AC1: Chat interface with AI avatar, greeting by name, first question displayed
    - AC2: Type response and submit, AI validates and asks follow-ups, display in summary panel, <3s latency
- Edge Case:
    - EC1: AI asks clarifying questions for ambiguous responses
    - EC3: Display "AI temporarily unavailable" when circuit breaker opens, show manual form option

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-007 |
| **UXR Requirements** | UXR-003 (Error recovery), UXR-101 (WCAG AA), UXR-201 (Mobile-first), UXR-401 (Loading <200ms), AIR-R01 (Response <3s) |
| **Design Tokens** | .propel/context/docs/designsystem.md#chat, #colors, #typography |

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
| **AI Impact** | Yes (client-side UI for AI interaction) |
| **AIR Requirements** | AIR-001, AIR-R01 (display within 3s) |
| **AI Pattern** | Chat UI for conversational intake |
| **Prompt Template Path** | N/A (backend handles prompts) |
| **Guardrails Config** | Client-side input validation (max 500 chars per message) |
| **Model Provider** | N/A (backend integration) |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create AIPatientIntakePage with two-panel layout: left side = chat interface (conversation thread, message bubbles, input box with Send button), right side = real-time data summary panel (organized by category: Demographics, Chief Complaint, Symptoms, Medical History, Medications, Allergies). On mount, call POST /api/intake/ai/start to initialize conversation and display greeting. User types in multiline textarea (max 500 chars with counter), clicks Send or presses Enter to submit. Display "AI is thinking..." with animated dots during API call. Append user message (right-aligned blue bubble) and AI response (left-aligned gray bubble with avatar icon) to conversation thread. Update summary panel in real-time as data extracted. Show progress indicator "60% Complete - 4 of 10 sections" at top. Add ARIA live region for screen readers. Implement auto-scroll to latest message. Handle loading state <200ms for typing indicators (UXR-401).

## Dependent Tasks
- TASK_002: Backend AI Intake API Endpoints (provides POST /start, POST /message endpoints)
- US_026: Manual intake form structure (for data field definitions)

## Impacted Components
- **CREATE** app/src/pages/AIPatientIntakePage.tsx - Main page with two-panel layout
- **CREATE** app/src/components/intake/AIChatInterface.tsx - Left panel - chat conversation thread
- **CREATE** app/src/components/intake/MessageBubble.tsx - Individual message component (user/AI styling)
- **CREATE** app/src/components/intake/ChatInputBox.tsx - Bottom input with textarea, Send button, character counter
- **CREATE** app/src/components/intake/DataSummaryPanel.tsx - Right panel - real-time extracted data display
- **CREATE** app/src/components/intake/ProgressIndicator.tsx - Top progress bar showing completion %
- **CREATE** app/src/hooks/useAIConversation.ts - Custom hook for conversation state and API calls
- **CREATE** app/src/types/aiIntake.types.ts - Frontend types for messages and extracted data
- **MODIFY** app/src/App.tsx - Add route /intake/ai

## Implementation Plan
1. **Create aiIntake.types.ts**: Define Message interface (id, role: 'user' | 'assistant', content: string, timestamp: Date), ExtractedIntakeData interface matching backend schema (chief_complaint, symptoms, medical_history, medications, allergies, etc.), ConversationState interface (conversationId, messages: Message[], extractedData: Partial<ExtractedIntakeData>, isLoading: boolean)
2. **Create useAIConversation hook**: useState for conversation state, useEffect on mount calls POST /api/intake/ai/start to initialize, sendMessage function calls POST /api/intake/ai/message with optimistic UI update (add user message immediately), on response append AI message and update extractedData, return { conversation, sendMessage, isLoading, error }
3. **Create MessageBubble.tsx**: Render message bubble with conditional styling - user messages blue background right-aligned, AI messages gray background left-aligned with avatar icon, timestamp below message in small gray text, use CSS flexbox for alignment
4. **Create ChatInputBox.tsx**: Multiline textarea with rows={3}, maxLength={500}, character counter "{count}/500" below, Send button (primary style, disabled when empty or loading), keyboard shortcut Enter to send (Shift+Enter for new line), clear textarea after send
5. **Create AIChatInterface.tsx**: Scrollable container (max-height with overflow-y auto), map conversation.messages to MessageBubble components, display "AI is thinking..." with animated dots when isLoading=true, useRef for scroll container and useEffect to auto-scroll to bottom on new message, ARIA live region with aria-live="polite" for screen reader announcements
6. **Create DataSummaryPanel.tsx**: Display extracted data organized by sections (Chief Complaint, Symptoms, Medical History, etc.), each section shows label + value or "Not provided yet" in gray, highlight newly updated fields with subtle animation, display in card layout with borders
7. **Create ProgressIndicator.tsx**: Calculate completion % based on filled required fields (count fields in extractedData / total required fields * 100), display progress bar with percentage text "60% Complete - 4 of 10 sections", use CSS linear-gradient for progress bar fill
8. **Create AIPatientIntakePage.tsx**: Two-column CSS Grid layout (60% chat / 40% summary on desktop, single column on mobile), render ProgressIndicator at top, AIChatInterface on left, DataSummaryPanel on right, handle error state by displaying "AI temporarily unavailable" with "Switch to Manual Form" button

**Focus on how to implement**: Layout uses CSS Grid: `grid-template-columns: 1fr 400px` for desktop. Auto-scroll: `scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })`. Optimistic UI: add user message to state immediately before API call, on error remove it. Typing indicator: render `<div className="typing-indicator"><span>.</span><span>.</span><span>.</span></div>` with CSS animation when isLoading. Character counter: `{message.length}/500` updates on onChange. ARIA live region: `<div role="status" aria-live="polite" aria-atomic="true">{latestMessage}</div>` for accessibility. Progress: `const progress = Math.round((Object.values(extractedData).filter(v => v).length / REQUIRED_FIELDS_COUNT) * 100)`. Mobile responsive: stack panels vertically using media query `@media (max-width: 768px)`.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── (AIPatientIntakePage.tsx to be created)
│   ├── components/
│   │   ├── intake/
│   │   │   └── (AIChatInterface.tsx, MessageBubble.tsx, ChatInputBox.tsx, DataSummaryPanel.tsx, ProgressIndicator.tsx to be created)
│   │   └── common/
│   │       └── Button.tsx (existing)
│   ├── hooks/
│   │   └── (useAIConversation.ts to be created)
│   ├── types/
│   │   └── (aiIntake.types.ts to be created)
│   └── App.tsx (to be modified)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/AIPatientIntakePage.tsx | Main page with two-panel layout, progress indicator at top |
| CREATE | app/src/components/intake/AIChatInterface.tsx | Conversation thread with auto-scroll and typing indicator |
| CREATE | app/src/components/intake/MessageBubble.tsx | Individual message bubble with user/AI styling |
| CREATE | app/src/components/intake/ChatInputBox.tsx | Textarea input with character counter and Send button |
| CREATE | app/src/components/intake/DataSummaryPanel.tsx | Right panel showing extracted data by category |
| CREATE | app/src/components/intake/ProgressIndicator.tsx | Progress bar showing completion percentage |
| CREATE | app/src/hooks/useAIConversation.ts | Hook managing conversation state and API calls |
| CREATE | app/src/types/aiIntake.types.ts | TypeScript interfaces for messages and extracted data |
| MODIFY | app/src/App.tsx | Add route /intake/ai for AIPatientIntakePage |

## External References
- **React Chat UI**: https://github.com/chatscope/chat-ui-kit-react - Chat interface patterns
- **CSS Grid Layout**: https://css-tricks.com/snippets/css/complete-guide-grid/ - Two-column grid layout
- **React Auto Scroll**: https://stackoverflow.com/questions/37620694/how-to-scroll-to-bottom-in-react - Scroll to bottom on new message
- **ARIA Live Regions**: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions - Screen reader announcements
- **CSS Animations**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations - Typing indicator dots animation
- **React Hooks**: https://react.dev/reference/react - useEffect, useRef for scroll management

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for AI chat components)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Greeting message displays on page load with patient's first name
- [x] User can type message, see character counter update
- [x] Send button disabled when textarea empty
- [x] User message appears immediately (optimistic UI)
- [x] "AI is thinking..." displays during API call
- [x] AI response appears within 3s (p95 latency)
- [x] Conversation auto-scrolls to latest message
- [x] Data summary panel updates in real-time as fields extracted
- [x] Progress indicator shows correct completion percentage
- [x] ARIA live region announces new messages for screen readers
- [x] Mobile layout stacks panels vertically
- [x] Error state displays "AI temporarily unavailable" with manual form option

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html during implementation
- [ ] Create aiIntake.types.ts (export Message interface with id/role/content/timestamp, ExtractedIntakeData with chief_complaint/symptoms/medical_history/medications/allergies/pain_level/duration, ConversationState with conversationId/messages/extractedData/isLoading/error)
- [ ] Create useAIConversation.ts hook (useState for ConversationState, useEffect to call POST /api/intake/ai/start on mount, sendMessage async function: optimistically add user message, POST /api/intake/ai/message, on response append AI message and update extractedData, return {conversation, sendMessage, isLoading, error})
- [ ] Create MessageBubble.tsx component (props: message: Message, render div with conditional className based on role, user messages: .message--user with background blue, text-align right; AI messages: .message--ai with avatar icon, background gray, text-align left; timestamp in small text)
- [ ] Create ChatInputBox.tsx component (textarea with value/onChange, maxLength 500, character counter span, Send button onClick calls onSend(message) prop, disabled when empty or loading, onKeyPress Enter submits unless Shift held)
- [ ] Create AIChatInterface.tsx component (props: conversation, isLoading, scrollable div with ref, map messages to MessageBubble, conditional render "AI is thinking..." with animated dots when isLoading, useEffect to auto-scroll: scrollRef.current?.scrollTo({top: scrollHeight, behavior: 'smooth'}), ARIA live region div)
- [ ] Create DataSummaryPanel.tsx component (props: extractedData: Partial<ExtractedIntakeData>, render sections: Chief Complaint, Symptoms, Medical History, Medications, Allergies, each with label and value or "Not provided yet", use card layout with borders, highlight new updates with CSS transition)
- [ ] Create ProgressIndicator.tsx component (props: extractedData, calculate filled = Object.values(extractedData).filter(v => v).length, total = REQUIRED_FIELDS_COUNT, percentage = Math.round(filled/total*100), render progress bar div with width: {percentage}%, text "{percentage}% Complete - {filled} of {total} sections")
- [ ] Create AIPatientIntakePage.tsx page (CSS Grid layout: grid-template-columns: 1fr 400px on desktop, 1fr on mobile, render ProgressIndicator at top spanning full width, AIChatInterface in left column with ChatInputBox at bottom, DataSummaryPanel in right column, useAIConversation hook, handle error with fallback UI "Switch to Manual Form" button)
- [ ] Modify App.tsx (add <Route path="/intake/ai" element={<AIPatientIntakePage />} />, ensure protected route with patient authentication)
