/**
 * useAIConversation Hook
 * 
 * File: app/src/hooks/useAIConversation.ts
 * Task: US_025 TASK_003 - Frontend AI Chat Interface
 * 
 * Custom hook managing AI intake conversation state, API calls,
 * validation results, and mode switching.
 */
import { useState, useCallback, useRef } from 'react';
import { getToken } from '../utils/storage/tokenStorage';
import type {
  ConversationMessage,
  ExtractedIntakeData,
  IntakeProgress,
  ValidationResult,
  AIIntakeResponse,
} from '../types/aiIntake.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UseAIConversationReturn {
  messages: ConversationMessage[];
  extractedData: ExtractedIntakeData;
  progress: IntakeProgress;
  conversationId: number | null;
  isLoading: boolean;
  error: string | null;
  contextFields: string[];
  startConversation: (patientId: number, appointmentId?: number) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  submitConversation: (intakeMode?: string) => Promise<{ documentId: number } | null>;
  clearError: () => void;
}

export function useAIConversation(): UseAIConversationReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedIntakeData>({});
  const [progress, setProgress] = useState<IntakeProgress>({
    completedSections: [],
    totalSections: 7,
    percentComplete: 0,
  });
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextFields, setContextFields] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || body.error || `Request failed (${response.status})`);
    }

    return response.json();
  }, []);

  const startConversation = useCallback(
    async (patientId: number, appointmentId?: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFetch(`${API_BASE_URL}/intake/ai/start`, {
          method: 'POST',
          body: JSON.stringify({ patientId, appointmentId }),
        });

        const data: AIIntakeResponse = result.data;
        setConversationId(data.conversationId);
        setMessages([data.message]);
        setExtractedData(data.extractedData);
        setProgress(data.progress);
        setContextFields(data.contextFields);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start conversation';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [apiFetch],
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!conversationId) {
        setError('No active conversation');
        return;
      }

      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      // Add user message optimistically
      const userMsg: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        validationState: 'pending',
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFetch(`${API_BASE_URL}/intake/ai/message`, {
          method: 'POST',
          body: JSON.stringify({ conversationId, message }),
          signal: abortRef.current.signal,
        });

        const data: AIIntakeResponse = result.data;

        // Update user message validation state and add assistant response
        setMessages((prev) => {
          const updated = [...prev];
          // Update last user message validation
          const lastUserIdx = updated.length - 1;
          if (updated[lastUserIdx]?.role === 'user') {
            const hasIssues = data.validationResults.some((v: ValidationResult) => !v.isValid);
            updated[lastUserIdx] = {
              ...updated[lastUserIdx],
              validationState: hasIssues ? 'needs_clarification' : 'validated',
              validationResults: data.validationResults,
            };
          }
          // Add assistant message
          updated.push({
            ...data.message,
            isClarification: data.validationResults.some((v: ValidationResult) =>
              v.clarificationQuestion,
            ),
          });
          return updated;
        });

        setExtractedData(data.extractedData);
        setProgress(data.progress);
        setContextFields(data.contextFields);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message2 = err instanceof Error ? err.message : 'Failed to send message';
        setError(message2);

        // Mark user message as error
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'user') {
            updated[lastIdx] = { ...updated[lastIdx], validationState: 'error' };
          }
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, apiFetch],
  );

  const submitConversation = useCallback(
    async (intakeMode: string = 'ai'): Promise<{ documentId: number } | null> => {
      if (!conversationId) {
        setError('No active conversation');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFetch(`${API_BASE_URL}/intake/ai/submit`, {
          method: 'POST',
          body: JSON.stringify({ conversationId, intakeMode }),
        });

        return result.data;
      } catch (err) {
        const message3 = err instanceof Error ? err.message : 'Failed to submit';
        setError(message3);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, apiFetch],
  );

  return {
    messages,
    extractedData,
    progress,
    conversationId,
    isLoading,
    error,
    contextFields,
    startConversation,
    sendMessage,
    submitConversation,
    clearError,
  };
}
