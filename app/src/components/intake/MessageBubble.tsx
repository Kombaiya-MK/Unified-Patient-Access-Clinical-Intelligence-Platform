/**
 * MessageBubble Component
 * 
 * File: app/src/components/intake/MessageBubble.tsx
 * Task: US_025 TASK_003 - Frontend AI Chat Interface
 * 
 * Renders a single chat message bubble with validation indicator.
 */
import React from 'react';
import type { ConversationMessage } from '../../types/aiIntake.types';
import { ValidationIndicator } from './ValidationIndicator';
import { ClarificationBadge } from './ClarificationBadge';

interface MessageBubbleProps {
  message: ConversationMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null;

  return (
    <div
      className={`message-bubble-wrapper ${isUser ? 'message-user' : 'message-assistant'}`}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        padding: '0 16px',
      }}
    >
      <div
        className="message-bubble"
        style={{
          position: 'relative',
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          backgroundColor: isUser ? '#2563eb' : '#f3f4f6',
          color: isUser ? '#ffffff' : '#1f2937',
          fontSize: '14px',
          lineHeight: '1.5',
          wordBreak: 'break-word',
        }}
      >
        {message.content}

        {/* Validation indicator for user messages */}
        {isUser && message.validationState && (
          <div style={{ position: 'absolute', top: '4px', right: '-28px' }}>
            <ValidationIndicator state={message.validationState} />
          </div>
        )}

        {/* Clarification badge for AI messages */}
        {!isUser && message.isClarification && (
          <div style={{ marginTop: '8px' }}>
            <ClarificationBadge />
          </div>
        )}
      </div>
    </div>
  );
};
