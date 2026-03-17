# Task - TASK_001_FE_AI_CHAT_INTERFACE

## Requirement Reference
- User Story: US_025
- Story Location: `.propel/context/tasks/us_025/us_025.md`
- Acceptance Criteria:
    - AC1: Chat interface with AI assistant greeting patient by name, asks chief complaint first
    - AC2: Type response → AI validates → asks follow-up questions, displays in summary panel, <3s response latency (AIR-R01)
    - AC3: "Switch to Manual Form" → seamless transition, data pre-filled
- Edge Cases:
    - Offensive input: Professional response "I'm here to help with medical information. Let's focus on your health concerns."
    - OpenAI failure: "AI temporarily unavailable" → auto-switch to manual form

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-007 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-intake-form.html |
| **Screen Spec** | SCR-007 (AI mode: chat interface left, summary panel right) |
| **UXR Requirements** | UXR-003 (Error recovery with conversation preservation), UXR-501 (Real-time validation), AIR-R01 (<3s latency) |
| **Design Tokens** | AI message: #F5F5F5 bg, Patient message: #007BFF bg + white text, Summary panel: white card with #E3F2FD header, Progress bar: #4CAF50 green |

> **Wireframe Components:**
> - Chat interface (left 60%): Conversation thread, AI avatar (bot icon), patient messages right-aligned, AI messages left-aligned, timestamps, input box (bottom, multiline, max 500 chars), Send button
> - Summary panel (right 40%): Real-time summary organized by category (Demographics, Chief Complaint, Medical History, Medications, Allergies), checkmarks for completed sections
> - Mode toggle: Top-right "Switch to Manual Form" button
> - Progress bar: Top "60% Complete - 6 of 10 sections" with colored segments
> - Loading: "AI is thinking..." with animated dots

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | OpenAI | gpt-4-turbo |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-001 (OpenAI integration), AIR-005 (PII redaction), AIR-006 (Data residency), AIR-007 (Human review), AIR-R01 (<3s latency), AIR-R02 (<10K tokens), AIR-R03 (>98% accuracy) |
| **AI Pattern** | Conversational intake with structured extraction |
| **Prompt Template Path** | .propel/context/prompts/intake-conversation-starter.md, intake-followup-generator.md |
| **Guardrails Config** | .propel/context/prompts/intake-guardrails.json (profanity filter, PII redaction, medical scope) |
| **Model Provider** | OpenAI GPT-4 Turbo (gpt-4-turbo-preview) |

> **AI Integration Details:**
> - Model: gpt-4-turbo-preview for nuanced medical conversation
> - Context window: Max 10K tokens (AIR-R02), truncate old messages if exceeded
> - Streaming: Use streaming API for <3s first token (AIR-R01)
> - PII redaction: Before OpenAI call, redact SSN/insurance numbers (AIR-005)
> - Circuit breaker: On failure, fallback to manual form (US_041)

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement AI conversational intake UI: (1) AIChatInterface component with message thread, (2) Displays AI greeting "Hi [name], I'll help gather your medical information. What brings you in today?", (3) Patient types response → POST /api/intake/chat → AI responds <3s, (4) IntakeSummaryPanel shows extracted data in real-time (categories: Demographics, Chief Complaint, Medical History, etc.), (5) "Switch to Manual Form" button → navigates to manual form with pre-filled data, (6) Progress indicator at top (e.g., "60% Complete - 6 of 10 sections"), (7) ARIA live regions for screen readers, (8) Loading indicator "AI is thinking..." during API call, (9) Error handling: Display "AI temporarily unavailable" + auto-switch on failure.

## Dependent Tasks
- US_025 Task 002: OpenAI integration backend API (POST /api/intake/chat)
- US_026 Task 001: Manual intake form (fallback destination)

## Impacted Components
**New:**
- app/src/components/AIChatInterface.tsx (Chat UI with message thread)
- app/src/components/IntakeSummaryPanel.tsx (Right sidebar with extracted data)
- app/src/components/ChatMessage.tsx (Individual message bubble)
- app/src/hooks/useIntakeChat.ts (POST /intake/chat mutation)
- app/src/pages/IntakeAI.tsx (Page container with chat + summary)

**Modified:**
- app/src/types/intake.types.ts (Add ChatMessage, IntakeSummary types)

## Implementation Plan
1. Create ChatMessage type: { id, role: 'ai'|'patient', content, timestamp, category }
2. Create IntakeSummary type: { demographics: {...}, chiefComplaint, medicalHistory, medications, allergies, surgeries, familyHistory }
3. Implement AIChatInterface: Message list (auto-scroll to bottom), input box (multiline, max 500 chars), Send button (disabled during loading)
4. Implement useIntakeChat hook: POST /api/intake/chat with { message, conversationId, context }, returns { aiResponse, extractedData, progress }
5. Render AI greeting: useEffect on mount → display greeting with patient first name
6. Message bubbles: AI messages left-aligned (light gray bg), patient messages right-aligned (blue bg, white text)
7. Summary panel: Displays extractedData grouped by category, checkmarks for completed sections, updates in real-time
8. Progress bar: Calculate completion (count non-null categories / 10 total), display percentage + "X of 10 sections"
9. Switch to Manual: Button navigates to /intake/manual with state={intakeSummary}
10. ARIA live regions: Announce new AI messages for screen readers
11. Error handling: API failure → display error + "Switch to Manual Form" auto-trigger after 10s

## Current Project State
```
ASSIGNMENT/app/src/
├── pages/ (dashboard exists)
├── components/ (booking components exist)
└── (AI intake components to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/AIChatInterface.tsx | Chat UI component |
| CREATE | app/src/components/IntakeSummaryPanel.tsx | Right sidebar summary |
| CREATE | app/src/components/ChatMessage.tsx | Message bubble component |
| CREATE | app/src/hooks/useIntakeChat.ts | Chat mutation hook |
| CREATE | app/src/pages/IntakeAI.tsx | AI intake page |
| UPDATE | app/src/types/intake.types.ts | Add chat/summary types |

## External References
- [React Chat UI Patterns](https://www.npmjs.com/package/react-chat-elements)
- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [AIR-R01 Response Latency <3s](../../../.propel/context/docs/spec.md#AIR-R01)
- [UXR-003 Error Recovery](../../../.propel/context/docs/spec.md#UXR-003)

## Build Commands
```bash
cd app
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: ChatMessage component renders AI vs patient styles correctly
- [ ] Integration tests: Send message → AI response appears <3s
- [ ] Chat interface renders: Navigate to /intake/ai → see chat UI
- [ ] AI greeting displays: Page loads → "Hi [name], I'll help gather your medical information..."
- [ ] Message sending: Type message → click Send → appears in conversation thread
- [ ] AI response: After sending → see "AI is thinking..." → response appears <3s
- [ ] Summary updates: AI extracts data → summary panel updates in real-time
- [ ] Progress indicator: As sections filled → progress bar increments (e.g., 30%, 60%, 90%)
- [ ] Auto-scroll: New message → chat scrolls to bottom automatically
- [ ] Character limit: Type 501 chars → display "500 max" warning
- [ ] Switch to manual: Click button → navigate to manual form with pre-filled data
- [ ] Error handling: Simulate API failure → display error → auto-switch to manual after 10s
- [ ] ARIA announcements: Screen reader announces new AI messages
- [ ] Responsive: Test mobile (375px) → summary panel moves below chat, 100% width
- [ ] WCAG AA: Keyboard Tab/Enter navigation, 4.5:1 contrast on messages

## Implementation Checklist
- [ ] Create intake.types.ts with ChatMessage + IntakeSummary types
- [ ] Implement ChatMessage.tsx component
- [ ] Implement AIChatInterface.tsx with message list + input
- [ ] Implement IntakeSummaryPanel.tsx with category sections
- [ ] Implement useIntakeChat.ts hook
- [ ] Create IntakeAI.tsx page container
- [ ] Add routing: /intake/ai → IntakeAI page
- [ ] Test chat flow end-to-end
- [ ] Validate WCAG AA compliance
- [ ] Document AI intake UI in app/README.md
