/**
 * OpenAI Service
 * 
 * File: server/src/services/openai/openAiService.ts
 * Task: US_025 TASK_001 - Backend OpenAI Integration
 * 
 * Handles communication with OpenAI API for AI-assisted patient intake.
 * Includes PII redaction, circuit breaker, and context management.
 */
import logger from '../../utils/logger';
import { getOpenAIConfig, TOTAL_INTAKE_SECTIONS } from '../../config/openai.config';
import { openAICircuitBreaker } from './circuitBreakerService';
import { gpt4IntakeBreaker } from '../../config/circuit-breaker.config';
import { getIntakeFallbackResponse } from '../fallback/ai-intake-fallback.service';
import { redactPii } from './piiRedactionService';
import {
  loadContext,
  createContext,
  addMessage,
  mergeExtractedData,
  getExtractedFieldsSummary,
  saveContext,
} from './conversationContextService';
import type {
  ConversationContext,
  ConversationMessage,
  AIIntakeResponse,
  ExtractedIntakeData,
  IntakeProgress,
  ValidationResult,
} from '../../types/aiIntake.types';

/** Fallback response when OpenAI is unavailable */
const FALLBACK_MESSAGE = 'I apologize, but the AI assistant is temporarily unavailable. ' +
  'Please switch to manual intake mode to continue.';

/**
 * Initialize a new AI intake conversation
 */
export async function startConversation(
  conversationId: number,
  patientId: number,
  appointmentId?: number,
): Promise<AIIntakeResponse> {
  const context = createContext(conversationId, patientId, appointmentId);

  const greetingMessage: ConversationMessage = {
    role: 'assistant',
    content: 'Hello! I\'m here to help collect your intake information before your appointment. ' +
      'I\'ll ask you a few questions about your health. Let\'s start — what brings you in today? ' +
      'Please describe your main concern or symptoms.',
    timestamp: new Date().toISOString(),
  };

  // Add system prompt and greeting
  const systemMessage: ConversationMessage = {
    role: 'system',
    content: getOpenAIConfig()?.systemPrompt || 'You are a medical intake assistant.',
    timestamp: new Date().toISOString(),
  };

  context.messages.push(systemMessage, greetingMessage);
  await saveContext(context);

  return {
    conversationId,
    message: greetingMessage,
    extractedData: {},
    validationResults: [],
    progress: calculateProgress({}),
    contextFields: [],
  };
}

/**
 * Process a patient message through OpenAI
 */
export async function processMessage(
  conversationId: number,
  userMessageText: string,
): Promise<AIIntakeResponse> {
  // Load context
  let context = await loadContext(conversationId);
  if (!context) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  // Add user message to context
  const userMessage: ConversationMessage = {
    role: 'user',
    content: userMessageText,
    timestamp: new Date().toISOString(),
  };
  context = await addMessage(context, userMessage);

  // Check circuit breakers (legacy + opossum per-service)
  if (!openAICircuitBreaker.isAllowed() || !gpt4IntakeBreaker.opened === false) {
    // Use structured fallback response
    const fb = getIntakeFallbackResponse();
    logger.warn('OpenAI intake circuit breaker is open, returning fallback');
    const fallbackMessage: ConversationMessage = {
      role: 'assistant',
      content: fb.message,
      timestamp: new Date().toISOString(),
    };
    context = await addMessage(context, fallbackMessage);

    return {
      conversationId,
      message: fallbackMessage,
      extractedData: context.extractedData,
      validationResults: [],
      progress: calculateProgress(context.extractedData),
      contextFields: Object.keys(context.extractedData).filter(
        (k) => context!.extractedData[k] !== undefined,
      ),
    };
  }

  // Call OpenAI with PII-redacted messages
  try {
    const aiResponse = await callOpenAI(context);
    openAICircuitBreaker.recordSuccess();

    // Parse AI response
    const parsed = parseAIResponse(aiResponse);

    // Merge extracted data
    if (parsed.extractedData) {
      context = mergeExtractedData(context, parsed.extractedData);
    }

    // Add assistant message
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: parsed.message,
      timestamp: new Date().toISOString(),
      isCritical: hasCriticalInfo(parsed.extractedData),
    };
    context = await addMessage(context, assistantMessage);

    const activeFields = Object.keys(context.extractedData).filter(
      (k) => context!.extractedData[k] !== undefined && context!.extractedData[k] !== null,
    );

    return {
      conversationId,
      message: assistantMessage,
      extractedData: context.extractedData,
      validationResults: parsed.validationIssues || [],
      progress: calculateProgress(context.extractedData),
      contextFields: activeFields,
    };
  } catch (error) {
    openAICircuitBreaker.recordFailure();
    logger.error('OpenAI API call failed', { conversationId, error });

    const errorMessage: ConversationMessage = {
      role: 'assistant',
      content: FALLBACK_MESSAGE,
      timestamp: new Date().toISOString(),
    };
    context = await addMessage(context, errorMessage);

    return {
      conversationId,
      message: errorMessage,
      extractedData: context.extractedData,
      validationResults: [],
      progress: calculateProgress(context.extractedData),
      contextFields: Object.keys(context.extractedData).filter(
        (k) => context!.extractedData[k] !== undefined,
      ),
    };
  }
}

/**
 * Call OpenAI API with conversation context
 */
async function callOpenAI(context: ConversationContext): Promise<string> {
  const config = getOpenAIConfig();
  if (!config) {
    throw new Error('OpenAI not configured');
  }

  // Build messages with PII redaction (skip system messages from redaction)
  const messages = context.messages.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: m.role === 'user' ? redactPii(m.content) : m.content,
  }));

  // Add extracted fields context to avoid re-asking
  const fieldsSummary = getExtractedFieldsSummary(context);
  if (fieldsSummary) {
    messages.push({
      role: 'system',
      content: fieldsSummary,
    });
  }

  // Dynamic import OpenAI to allow graceful failure
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: config.apiKey });

  const response = await client.chat.completions.create({
    model: config.model,
    messages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
  });

  return response.choices[0]?.message?.content || '{}';
}

/**
 * Parse AI response JSON
 */
function parseAIResponse(responseText: string): {
  message: string;
  extractedData: Partial<ExtractedIntakeData>;
  validationIssues: ValidationResult[];
} {
  try {
    const parsed = JSON.parse(responseText);
    return {
      message: parsed.message || 'Could you please tell me more?',
      extractedData: parsed.extractedData || {},
      validationIssues: (parsed.validationIssues || []).map((v: Record<string, unknown>) => ({
        isValid: v.isValid !== false,
        field: String(v.field || ''),
        originalValue: String(v.originalValue || ''),
        suggestedValue: v.suggestedValue ? String(v.suggestedValue) : undefined,
        confidence: typeof v.confidence === 'number' ? v.confidence : 1,
        clarificationQuestion: v.clarificationQuestion ? String(v.clarificationQuestion) : undefined,
      })),
    };
  } catch {
    logger.warn('Failed to parse AI response as JSON, using raw text');
    return {
      message: responseText || 'Could you please tell me more?',
      extractedData: {},
      validationIssues: [],
    };
  }
}

/**
 * Calculate intake progress based on extracted data
 */
function calculateProgress(data: ExtractedIntakeData): IntakeProgress {
  const completed: string[] = [];

  if (data.chiefComplaint) completed.push('chief_complaint');
  if (data.symptoms?.length || data.symptomOnset || data.painLevel !== undefined) {
    completed.push('symptom_details');
  }
  if (data.medications !== undefined) completed.push('medications');
  if (data.allergies !== undefined) completed.push('allergies');
  if (data.medicalHistory !== undefined) completed.push('medical_history');
  if (data.familyHistory !== undefined) completed.push('family_history');
  if (data.emergencyContact?.name) completed.push('emergency_contact');

  return {
    completedSections: completed,
    totalSections: TOTAL_INTAKE_SECTIONS,
    percentComplete: Math.round((completed.length / TOTAL_INTAKE_SECTIONS) * 100),
  };
}

/**
 * Check if extracted data contains critical medical info
 */
function hasCriticalInfo(data?: Partial<ExtractedIntakeData>): boolean {
  if (!data) return false;
  return !!(data.medications?.length || data.allergies?.length || data.medicalHistory?.length);
}

/**
 * Get conversation context (for external use)
 */
export async function getConversationContext(
  conversationId: number,
): Promise<ConversationContext | null> {
  return loadContext(conversationId);
}
