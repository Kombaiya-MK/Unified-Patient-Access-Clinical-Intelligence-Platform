/**
 * Intake Data Mapper Utility
 * 
 * File: app/src/utils/intakeDataMapper.ts
 * Task: US_025 TASK_004 - Frontend Manual Form Switch
 * 
 * Maps data between AI conversation extracted data and manual form fields,
 * enabling seamless switching between AI and manual intake modes.
 */
import type { ExtractedIntakeData, ManualIntakeDraftData } from '../types/aiIntake.types';

/**
 * Map AI extracted data to manual form shape
 */
export function aiDataToManualForm(data: ExtractedIntakeData): ManualIntakeDraftData {
  return {
    chiefComplaint: data.chiefComplaint || '',
    medicalHistory: data.medicalHistory || [],
    medications: data.medications || [],
    allergies: data.allergies || [],
    familyHistory: data.familyHistory || [],
    emergencyContact: data.emergencyContact || undefined,
    additionalNotes: buildNotesFromAIData(data),
  };
}

/**
 * Map manual form data to AI extracted data shape
 */
export function manualFormToAIData(form: ManualIntakeDraftData): ExtractedIntakeData {
  return {
    chiefComplaint: form.chiefComplaint || undefined,
    medicalHistory: form.medicalHistory?.length ? form.medicalHistory : undefined,
    medications: form.medications?.length ? form.medications : undefined,
    allergies: form.allergies?.length ? form.allergies : undefined,
    familyHistory: form.familyHistory?.length ? form.familyHistory : undefined,
    emergencyContact: form.emergencyContact || undefined,
  };
}

/**
 * Build additional notes from extra AI data
 */
function buildNotesFromAIData(data: ExtractedIntakeData): string {
  const notes: string[] = [];

  if (data.symptoms?.length) {
    notes.push(`Symptoms: ${data.symptoms.join(', ')}`);
  }
  if (data.symptomOnset) {
    notes.push(`Symptom onset: ${data.symptomOnset}`);
  }
  if (data.symptomDuration) {
    notes.push(`Duration: ${data.symptomDuration}`);
  }
  if (data.painLevel !== undefined) {
    notes.push(`Pain level: ${data.painLevel}/10`);
  }

  return notes.join('\n');
}

/**
 * Get list of incomplete sections for targeted AI questioning
 */
export function getIncompleteSections(data: ManualIntakeDraftData): string[] {
  const incomplete: string[] = [];
  if (!data.chiefComplaint || data.chiefComplaint.trim().length < 10) incomplete.push('chief_complaint');
  if (!data.medications || data.medications.length === 0) incomplete.push('medications');
  if (!data.allergies || data.allergies.length === 0) incomplete.push('allergies');
  if (!data.medicalHistory || data.medicalHistory.length === 0) incomplete.push('medical_history');
  if (!data.familyHistory || data.familyHistory.length === 0) incomplete.push('family_history');
  if (!data.emergencyContact?.name) incomplete.push('emergency_contact');
  return incomplete;
}
