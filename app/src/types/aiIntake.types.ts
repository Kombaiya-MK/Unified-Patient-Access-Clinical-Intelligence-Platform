/**
 * AI Intake Types (Frontend)
 * 
 * File: app/src/types/aiIntake.types.ts
 * Task: US_025 TASK_003 - Frontend AI Chat Interface
 * 
 * Type definitions for AI-assisted patient intake on the frontend.
 */

export type MessageRole = 'system' | 'assistant' | 'user';
export type ConversationStatus = 'active' | 'completed' | 'abandoned' | 'switched_to_manual';
export type IntakeMode = 'ai' | 'manual' | 'hybrid';
export type ValidationState = 'pending' | 'validated' | 'needs_clarification' | 'error';

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
  validationState?: ValidationState;
  validationResults?: ValidationResult[];
  isClarification?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  field: string;
  originalValue: string;
  suggestedValue?: string;
  confidence: number;
  clarificationQuestion?: string;
}

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

export interface MedicationEntry {
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface AllergyEntry {
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface EmergencyContact {
  name: string;
  relationship?: string;
  phone?: string;
}

export interface IntakeProgress {
  completedSections: string[];
  totalSections: number;
  percentComplete: number;
}

export interface AIIntakeResponse {
  conversationId: number;
  message: ConversationMessage;
  extractedData: ExtractedIntakeData;
  validationResults: ValidationResult[];
  progress: IntakeProgress;
  contextFields: string[];
}

export interface ManualIntakeDraftData {
  chiefComplaint?: string;
  medicalHistory?: string[];
  medications?: MedicationEntry[];
  allergies?: AllergyEntry[];
  familyHistory?: string[];
  emergencyContact?: EmergencyContact;
  additionalNotes?: string;
}

export interface DraftSaveResponse {
  draftId: number;
  lastSavedAt: string;
}
