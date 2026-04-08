/**
 * ChatInputBox Component
 * 
 * File: app/src/components/intake/ChatInputBox.tsx
 * Task: US_025 TASK_003 - Frontend AI Chat Interface
 * 
 * Text input with send button for AI intake chat.
 * 500 character max, disabled while loading.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ChatInputBoxProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  maxLength?: number;
}

export const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  onSend,
  isLoading,
  maxLength = 500,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || isLoading) return;
    onSend(trimmed);
    setText('');
  }, [text, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      className="chat-input-box"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
      }}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxLength))}
        onKeyDown={handleKeyDown}
        placeholder="Type your response..."
        disabled={isLoading}
        rows={1}
        aria-label="Chat message input"
        style={{
          flex: 1,
          padding: '10px 14px',
          border: '1px solid #d1d5db',
          borderRadius: '12px',
          fontSize: '14px',
          lineHeight: '1.4',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          maxHeight: '100px',
          overflow: 'auto',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <button
          onClick={handleSend}
          disabled={isLoading || text.trim().length === 0}
          aria-label="Send message"
          style={{
            padding: '10px 16px',
            backgroundColor: isLoading || text.trim().length === 0 ? '#9ca3af' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isLoading || text.trim().length === 0 ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          {text.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};
