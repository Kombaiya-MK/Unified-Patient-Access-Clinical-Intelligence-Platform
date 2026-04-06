/**
 * AI Intake Types
 * 
 * File: server/src/types/aiIntake.types.ts
 * Task: US_025 TASK_001 - Backend OpenAI Integration
 * 
 * Type definitions for AI-assisted patient intake conversations,
 * context management, and PII redaction.
 */

/** Role of the message sender in a conversation */
export type MessageRole = 'system' | 'assistant' | 'user';

/** Status of an AI intake conversation */
export type ConversationStatus = 'active' | 'completed' | 'abandoned' | 'switched_to_manual';

/** Mode of patient intake */
export type IntakeMode = 'ai' | 'manual' | 'hybrid';

/** Validation state for a message */
export type ValidationState = 'pending' | 'validated' | 'needs_clarification' | 'error';

/** A single message in the conversation */
export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
  isCritical?: boolean;
  validationState?: ValidationState;
  validationResults?: ValidationResult[];
}

/** Extracted data fields from the conversation */
export interface ExtractedIntakeData {
  chiefComplaint?: string;
  symptoms?: string[];
  symptomOnset?: string;
  symptomDuration?: string;
  painLevel?: number;
  medications?: MedicationEntry[];
  allergies?: AllergyEntry[];
  medicalHistory?: string[];
  familyHistory?: string[];
  emergencyContact?: EmergencyContact;
  [key: string]: unknown;
}

/** A single medication entry */
export interface MedicationEntry {
  name: string;
  dosage?: string;
  frequency?: string;
}

/** A single allergy entry */
export interface AllergyEntry {
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

/** Emergency contact details */
export interface EmergencyContact {
  name: string;
  relationship?: string;
  phone?: string;
}

/** Full conversation context stored in Redis */
export interface ConversationContext {
  conversationId: number;
  patientId: number;
  appointmentId?: number;
  messages: ConversationMessage[];
  extractedData: ExtractedIntakeData;
  tokenCount: number;
  summaryGenerated: boolean;
  criticalInfoTags: string[];
  lastUpdated: string;
}

/** Redis-stored context (serializable) */
export interface RedisConversationContext {
  conversationId: number;
  messages: ConversationMessage[];
  extractedData: ExtractedIntakeData;
  tokenCount: number;
  lastUpdated: string;
  summaryGenerated: boolean;
  criticalInfoTags: string[];
}

/** Request to start a new AI intake conversation */
export interface StartConversationRequest {
  patientId: number;
  appointmentId?: number;
}

/** Request to send a message in the conversation */
export interface SendMessageRequest {
  conversationId: number;
  message: string;
}

/** Response from the AI intake API */
export interface AIIntakeResponse {
  conversationId: number;
  message: ConversationMessage;
  extractedData: ExtractedIntakeData;
  validationResults: ValidationResult[];
  progress: IntakeProgress;
  contextFields: string[];
}

/** Intake progress tracking */
export interface IntakeProgress {
  completedSections: string[];
  totalSections: number;
  percentComplete: number;
}

/** Submit conversation for clinical document creation */
export interface SubmitConversationRequest {
  conversationId: number;
  intakeMode: IntakeMode;
}

/** Circuit breaker state */
export type CircuitState = 'closed' | 'open' | 'half-open';

/** Circuit breaker configuration */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxAttempts: number;
}

/** PII pattern definition */
export interface PiiPattern {
  name: string;
  regex: RegExp;
  replacement: string;
}

/** OpenAI service configuration */
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

/** Validation result for a single field */
export interface ValidationResult {
  isValid: boolean;
  field: string;
  originalValue: string;
  suggestedValue?: string;
  confidence: number;
  clarificationQuestion?: string;
}

/** Validation rule definition */
export interface ValidationRule {
  field: string;
  validator: (value: string) => ValidationResult;
  errorMessage: string;
}

/** Manual intake draft data */
export interface ManualIntakeDraftData {
  chiefComplaint?: string;
  medicalHistory?: string[];
  medications?: MedicationEntry[];
  allergies?: AllergyEntry[];
  familyHistory?: string[];
  emergencyContact?: EmergencyContact;
  additionalNotes?: string;
}

/** Draft save request */
export interface SaveDraftRequest {
  appointmentId?: number;
  patientId: number;
  draftData: ManualIntakeDraftData;
}

/** Draft submit request */
export interface SubmitDraftRequest {
  draftId: number;
  intakeMode: IntakeMode;
}
