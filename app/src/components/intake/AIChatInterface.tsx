/**
 * AIChatInterface Component
 * 
 * File: app/src/components/intake/AIChatInterface.tsx
 * Task: US_025 TASK_003 - Frontend AI Chat Interface
 * 
 * Main chat area with message list, auto-scroll, and input box.
 */
import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInputBox } from './ChatInputBox';
import { ProgressIndicator } from './ProgressIndicator';
import { ContextIndicator } from './ContextIndicator';
import type { ConversationMessage, IntakeProgress } from '../../types/aiIntake.types';

interface AIChatInterfaceProps {
  messages: ConversationMessage[];
  progress: IntakeProgress;
  contextFields: string[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  messages,
  progress,
  contextFields,
  isLoading,
  onSendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className="ai-chat-interface"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Progress bar at top */}
      <ProgressIndicator progress={progress} />

      {/* Messages area */}
      <div
        className="messages-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 0',
        }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages
          .filter((m) => m.role !== 'system')
          .map((msg, idx) => (
            <MessageBubble key={`${msg.timestamp}-${idx}`} message={msg} />
          ))}

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              padding: '0 16px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '16px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              <span className="typing-dots">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context indicator */}
      {contextFields.length > 0 && (
        <ContextIndicator contextFields={contextFields} />
      )}

      {/* Chat input */}
      <ChatInputBox onSend={onSendMessage} isLoading={isLoading} />
    </div>
  );
};
