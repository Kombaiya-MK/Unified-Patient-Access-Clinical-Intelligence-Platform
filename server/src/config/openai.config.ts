/**
 * OpenAI Configuration
 * 
 * File: server/src/config/openai.config.ts
 * Task: US_025 TASK_001 - Backend OpenAI Integration
 */
import config from './env';
import logger from '../utils/logger';
import type { OpenAIConfig } from '../types/aiIntake.types';

const AI_INTAKE_SYSTEM_PROMPT = `You are a medical intake assistant for a healthcare clinic. Your role is to collect patient intake information through a friendly, professional conversation.

GUIDELINES:
1. Ask one question at a time in a conversational tone.
2. Collect these sections in order: chief complaint, symptom details (onset, duration, severity), current medications, allergies, relevant medical history, family history, and emergency contact.
3. Validate responses when possible (e.g., pain scale 1-10, date formats).
4. If a response is ambiguous, ask a clarifying question.
5. Summarize collected information periodically.
6. Never provide medical diagnoses or treatment advice.
7. If the patient reports an emergency, advise calling 911 immediately.
8. Be empathetic and patient-friendly in tone.
9. Extract structured data from natural language responses.

OUTPUT FORMAT:
Respond with a JSON object containing:
- "message": Your conversational response to the patient
- "extractedData": Object with any new data extracted from the patient's message
- "nextSection": The next section to ask about (or null if complete)
- "progress": Array of completed sections
- "validationIssues": Array of any validation concerns with the response`;

/**
 * Build OpenAI configuration from environment
 */
export function getOpenAIConfig(): OpenAIConfig | null {
  if (!config.openai) {
    logger.warn('OpenAI not configured. AI intake features will be unavailable.');
    return null;
  }

  return {
    apiKey: config.openai.apiKey,
    model: config.openai.model,
    maxTokens: config.openai.maxTokens,
    temperature: 0.3,
    systemPrompt: AI_INTAKE_SYSTEM_PROMPT,
  };
}

/** Intake sections for progress tracking */
export const INTAKE_SECTIONS = [
  'chief_complaint',
  'symptom_details',
  'medications',
  'allergies',
  'medical_history',
  'family_history',
  'emergency_contact',
] as const;

export const TOTAL_INTAKE_SECTIONS = INTAKE_SECTIONS.length;

export default getOpenAIConfig;
