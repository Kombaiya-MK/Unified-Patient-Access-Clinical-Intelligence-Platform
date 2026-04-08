/**
 * AI Intake Service
 * 
 * File: server/src/services/aiIntakeService.ts
 * Task: US_025 TASK_002 - Backend AI Intake API Endpoints
 * 
 * Business logic for AI-assisted patient intake conversations.
 * Coordinates between database, OpenAI service, and context management.
 */
import { pool } from '../config/database';
import logger from '../utils/logger';
import { ApiError } from '../types';
import {
  startConversation,
  processMessage,
  getConversationContext,
} from './openai/openAiService';
import { deleteContext, loadContext } from './openai/conversationContextService';
import type {
  ConversationStatus,
  IntakeMode,
  AIIntakeResponse,
  ExtractedIntakeData,
} from '../types/aiIntake.types';

/**
 * Create a new AI intake conversation
 */
export async function createConversation(
  patientId: number,
  userId: number,
  appointmentId?: number,
): Promise<AIIntakeResponse> {
  // Resolve patient profile ID — patientId may be a user_id or a profile_id
  let profileId: number = patientId;
  const patientCheck = await pool.query(
    'SELECT id FROM patient_profiles WHERE id = $1',
    [patientId],
  );
  if (patientCheck.rows.length === 0) {
    // Try looking up by user_id instead
    const userCheck = await pool.query(
      'SELECT id FROM patient_profiles WHERE user_id = $1',
      [patientId],
    );
    if (userCheck.rows.length === 0) {
      throw new ApiError(404, 'Patient not found');
    }
    profileId = Number(userCheck.rows[0].id);
  }

  // Check for existing active conversation
  const activeCheck = await pool.query(
    `SELECT id FROM conversations 
     WHERE patient_id = $1 AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [profileId],
  );

  if (activeCheck.rows.length > 0) {
    // Return existing active conversation
    const existingId = activeCheck.rows[0].id;
    logger.info('Returning existing active conversation', { conversationId: existingId, patientId: profileId });
    const context = await getConversationContext(existingId);
    if (context) {
      const lastMessage = context.messages.filter((m) => m.role === 'assistant').pop();
      return {
        conversationId: existingId,
        message: lastMessage || {
          role: 'assistant',
          content: 'Welcome back! Let\'s continue where we left off.',
          timestamp: new Date().toISOString(),
        },
        extractedData: context.extractedData,
        validationResults: [],
        progress: {
          completedSections: [],
          totalSections: 7,
          percentComplete: 0,
        },
        contextFields: Object.keys(context.extractedData),
      };
    }
  }

  // Create new conversation record in database
  const result = await pool.query(
    `INSERT INTO conversations (patient_id, appointment_id, started_by_user_id, status, intake_mode)
     VALUES ($1, $2, $3, 'active', 'ai')
     RETURNING id`,
    [profileId, appointmentId || null, userId],
  );

  const conversationId = Number(result.rows[0].id);
  logger.info('New AI intake conversation created', { conversationId, patientId: profileId });

  // Initialize AI conversation with greeting
  return startConversation(conversationId, profileId, appointmentId);
}

/**
 * Send a message in an existing conversation
 */
export async function sendMessage(
  conversationId: number,
  message: string,
  _userId: number,
): Promise<AIIntakeResponse> {
  // Verify conversation exists and is active
  const convResult = await pool.query(
    `SELECT id, patient_id, appointment_id, status
     FROM conversations WHERE id = $1`,
    [conversationId],
  );

  if (convResult.rows.length === 0) {
    throw new ApiError(404, 'Conversation not found');
  }

  const conv = convResult.rows[0];
  if (conv.status !== 'active') {
    throw new ApiError(400, `Conversation is ${conv.status}, cannot send messages`);
  }

  // Validate message length
  if (!message || message.trim().length === 0) {
    throw new ApiError(400, 'Message cannot be empty');
  }
  if (message.length > 2000) {
    throw new ApiError(400, 'Message exceeds 2000 character limit');
  }

  // Process through OpenAI
  const response = await processMessage(conversationId, message.trim());

  // Update conversation in database
  await pool.query(
    `UPDATE conversations
     SET messages = $1, extracted_data = $2, token_count = $3, updated_at = NOW()
     WHERE id = $4`,
    [
      JSON.stringify(response.extractedData),
      JSON.stringify(response.extractedData),
      0,
      conversationId,
    ],
  );

  return response;
}

/**
 * Get a conversation by ID
 */
export async function getConversation(
  conversationId: number,
): Promise<{
  id: number;
  patientId: number;
  appointmentId: number | null;
  status: ConversationStatus;
  intakeMode: IntakeMode;
  extractedData: ExtractedIntakeData;
  startedAt: string;
}> {
  const result = await pool.query(
    `SELECT id, patient_id, appointment_id, status, intake_mode,
            extracted_data, started_at
     FROM conversations WHERE id = $1`,
    [conversationId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Conversation not found');
  }

  const row = result.rows[0];
  return {
    id: Number(row.id),
    patientId: Number(row.patient_id),
    appointmentId: row.appointment_id ? Number(row.appointment_id) : null,
    status: row.status,
    intakeMode: row.intake_mode,
    extractedData: row.extracted_data || {},
    startedAt: row.started_at,
  };
}

/**
 * Submit a completed conversation to create a clinical document
 */
export async function submitConversation(
  conversationId: number,
  userId: number,
  intakeMode: IntakeMode = 'ai',
): Promise<{ documentId: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get conversation
    const convResult = await client.query(
      `SELECT id, patient_id, appointment_id, extracted_data, messages
       FROM conversations WHERE id = $1 AND status = 'active'`,
      [conversationId],
    );

    if (convResult.rows.length === 0) {
      throw new ApiError(404, 'Active conversation not found');
    }

    const conv = convResult.rows[0];

    // Load full context from Redis for conversation history
    const context = await loadContext(conversationId);
    const conversationHistory = context?.messages || [];

    // Create clinical document
    const docResult = await client.query(
      `INSERT INTO clinical_documents (
        patient_id, appointment_id, created_by_user_id,
        document_type, title, content, document_date,
        conversation_history, intake_mode, ai_validation_score,
        metadata
      ) VALUES ($1, $2, $3, 'clinical_note', 'AI Intake Assessment',
        $4, CURRENT_DATE, $5, $6, $7, $8)
      RETURNING id`,
      [
        conv.patient_id,
        conv.appointment_id,
        userId,
        buildIntakeContent(conv.extracted_data || {}),
        JSON.stringify(conversationHistory),
        intakeMode,
        95.0, // Default AI validation score
        JSON.stringify({ source: 'ai_intake', conversationId }),
      ],
    );

    const documentId = Number(docResult.rows[0].id);

    // Update conversation status
    await client.query(
      `UPDATE conversations SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [conversationId],
    );

    await client.query('COMMIT');

    // Clean up Redis context
    await deleteContext(conversationId);

    logger.info('AI intake conversation submitted', { conversationId, documentId });
    return { documentId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Build clinical document content from extracted data
 */
function buildIntakeContent(data: ExtractedIntakeData): string {
  const sections: string[] = [];

  if (data.chiefComplaint) {
    sections.push(`CHIEF COMPLAINT:\n${data.chiefComplaint}`);
  }
  if (data.symptoms?.length) {
    sections.push(`SYMPTOMS:\n${data.symptoms.join(', ')}`);
  }
  if (data.symptomOnset) {
    sections.push(`SYMPTOM ONSET: ${data.symptomOnset}`);
  }
  if (data.painLevel !== undefined) {
    sections.push(`PAIN LEVEL: ${data.painLevel}/10`);
  }
  if (data.medications?.length) {
    const meds = data.medications
      .map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}${m.frequency ? ` - ${m.frequency}` : ''}`)
      .join('\n');
    sections.push(`CURRENT MEDICATIONS:\n${meds}`);
  }
  if (data.allergies?.length) {
    const allergies = data.allergies
      .map((a) => `${a.allergen}${a.reaction ? ` - ${a.reaction}` : ''}${a.severity ? ` (${a.severity})` : ''}`)
      .join('\n');
    sections.push(`ALLERGIES:\n${allergies}`);
  }
  if (data.medicalHistory?.length) {
    sections.push(`MEDICAL HISTORY:\n${data.medicalHistory.join('\n')}`);
  }
  if (data.familyHistory?.length) {
    sections.push(`FAMILY HISTORY:\n${data.familyHistory.join('\n')}`);
  }
  if (data.emergencyContact?.name) {
    const ec = data.emergencyContact;
    sections.push(
      `EMERGENCY CONTACT:\n${ec.name}${ec.relationship ? ` (${ec.relationship})` : ''}${ec.phone ? ` - ${ec.phone}` : ''}`,
    );
  }

  return sections.join('\n\n');
}
