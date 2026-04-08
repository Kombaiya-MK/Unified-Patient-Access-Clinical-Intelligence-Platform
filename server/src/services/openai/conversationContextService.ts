/**
 * Conversation Context Service
 * 
 * File: server/src/services/openai/conversationContextService.ts
 * Task: US_025 TASK_001 / US_027 TASK_001
 * 
 * Manages conversation context with Redis storage, token counting,
 * and automatic summarization when context exceeds limits.
 */
import logger from '../../utils/logger';
import redisClient from '../../utils/redisClient';
import type {
  ConversationContext,
  ConversationMessage,
  ExtractedIntakeData,
} from '../../types/aiIntake.types';

const REDIS_KEY_PREFIX = 'intake:context:';
const CONTEXT_TTL_SECONDS = 86400; // 24 hours
const MAX_TOKEN_ESTIMATE = 10000;
const KEEP_RECENT_EXCHANGES = 5;

/**
 * Estimate token count for a string (rough: ~4 chars per token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Build Redis key for a conversation
 */
function buildKey(conversationId: number): string {
  return `${REDIS_KEY_PREFIX}${conversationId}`;
}

/**
 * Load conversation context from Redis (fallback to empty context)
 */
export async function loadContext(conversationId: number): Promise<ConversationContext | null> {
  try {
    const data = await redisClient.get(buildKey(conversationId));
    if (data) {
      return JSON.parse(data) as ConversationContext;
    }
  } catch (error) {
    logger.warn('Failed to load context from Redis, returning null', { conversationId, error });
  }
  return null;
}

/**
 * Save conversation context to Redis with TTL
 */
export async function saveContext(context: ConversationContext): Promise<void> {
  try {
    const key = buildKey(context.conversationId);
    const serialized = JSON.stringify(context);
    await redisClient.set(key, serialized, { ttl: CONTEXT_TTL_SECONDS });
  } catch (error) {
    logger.warn('Failed to save context to Redis', { conversationId: context.conversationId, error });
  }
}

/**
 * Delete conversation context from Redis
 */
export async function deleteContext(conversationId: number): Promise<void> {
  try {
    await redisClient.del(buildKey(conversationId));
  } catch (error) {
    logger.warn('Failed to delete context from Redis', { conversationId, error });
  }
}

/**
 * Create a new empty conversation context
 */
export function createContext(
  conversationId: number,
  patientId: number,
  appointmentId?: number,
): ConversationContext {
  return {
    conversationId,
    patientId,
    appointmentId,
    messages: [],
    extractedData: {},
    tokenCount: 0,
    summaryGenerated: false,
    criticalInfoTags: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Check if a field has already been extracted (avoid re-asking)
 */
export function isFieldExtracted(context: ConversationContext, field: string): boolean {
  const value = context.extractedData[field];
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Get list of already-extracted fields for AI prompt context
 */
export function getExtractedFieldsSummary(context: ConversationContext): string {
  const fields: string[] = [];
  const data = context.extractedData;

  if (data.chiefComplaint) fields.push(`Chief Complaint: ${data.chiefComplaint}`);
  if (data.symptoms?.length) fields.push(`Symptoms: ${data.symptoms.join(', ')}`);
  if (data.medications?.length) fields.push(`Medications: ${data.medications.map(m => m.name).join(', ')}`);
  if (data.allergies?.length) fields.push(`Allergies: ${data.allergies.map(a => a.allergen).join(', ')}`);
  if (data.medicalHistory?.length) fields.push(`Medical History: ${data.medicalHistory.join(', ')}`);
  if (data.emergencyContact?.name) fields.push(`Emergency Contact: ${data.emergencyContact.name}`);

  return fields.length > 0
    ? `Patient has already provided: ${fields.join('; ')}. Do not re-ask these.`
    : '';
}

/**
 * Add a message to context and handle summarization if needed
 */
export async function addMessage(
  context: ConversationContext,
  message: ConversationMessage,
): Promise<ConversationContext> {
  context.messages.push(message);
  context.tokenCount += estimateTokens(message.content);
  context.lastUpdated = new Date().toISOString();

  // Tag critical messages (medications, allergies, chronic conditions)
  if (message.isCritical) {
    context.criticalInfoTags.push(`msg_${context.messages.length - 1}`);
  }

  // Summarize if token count exceeds limit
  if (context.tokenCount > MAX_TOKEN_ESTIMATE) {
    context = summarizeContext(context);
  }

  // Persist to Redis
  await saveContext(context);
  return context;
}

/**
 * Summarize older messages to reduce token count
 * Keeps the last N exchanges and critical messages
 */
function summarizeContext(context: ConversationContext): ConversationContext {
  const messages = context.messages;
  if (messages.length <= KEEP_RECENT_EXCHANGES * 2 + 1) {
    return context; // Not enough to summarize
  }

  // Keep system messages, critical messages, and recent exchanges
  const systemMessages = messages.filter((m) => m.role === 'system');
  const criticalMessages = messages.filter((m) => m.isCritical);
  const recentMessages = messages.slice(-(KEEP_RECENT_EXCHANGES * 2));

  // Build summary of older non-critical messages
  const olderMessages = messages.slice(
    systemMessages.length,
    messages.length - KEEP_RECENT_EXCHANGES * 2,
  );
  const olderNonCritical = olderMessages.filter((m) => !m.isCritical);

  if (olderNonCritical.length === 0) {
    return context;
  }

  const summaryContent = olderNonCritical
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role}: ${m.content.substring(0, 100)}`)
    .join(' | ');

  const summaryMessage: ConversationMessage = {
    role: 'system',
    content: `[CONVERSATION SUMMARY] Previous exchanges covered: ${summaryContent}`,
    timestamp: new Date().toISOString(),
    isCritical: false,
  };

  // Reconstruct messages
  const criticalSet = new Set(criticalMessages);
  const recentSet = new Set(recentMessages);
  const olderCritical = olderMessages.filter((m) => criticalSet.has(m) && !recentSet.has(m));

  context.messages = [...systemMessages, summaryMessage, ...olderCritical, ...recentMessages];
  context.tokenCount = context.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  context.summaryGenerated = true;

  logger.info('Context summarized', {
    conversationId: context.conversationId,
    newTokenCount: context.tokenCount,
    messagesReduced: messages.length - context.messages.length,
  });

  return context;
}

/**
 * Merge new extracted data into existing context
 */
export function mergeExtractedData(
  context: ConversationContext,
  newData: Partial<ExtractedIntakeData>,
): ConversationContext {
  const merged = { ...context.extractedData };

  for (const [key, value] of Object.entries(newData)) {
    if (value === undefined || value === null) continue;

    // For arrays, merge unique entries
    if (Array.isArray(value) && Array.isArray(merged[key])) {
      const existing = merged[key] as unknown[];
      const combined = [...existing, ...value.filter((v: unknown) => !existing.includes(v))];
      (merged as Record<string, unknown>)[key] = combined;
    } else {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  context.extractedData = merged;
  return context;
}
