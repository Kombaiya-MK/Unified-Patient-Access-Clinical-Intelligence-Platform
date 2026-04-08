/**
 * Document Extraction Prompt Template
 * @module prompts/document-extraction-prompt
 * @task US_029 TASK_002
 */

export function buildExtractionPrompt(documentType: string): string {
  return `You are a medical document extraction assistant. Extract structured data from the following ${documentType}. Return ONLY a valid JSON object with these fields:

{
  "patient_name": "string or null",
  "date_of_birth": "YYYY-MM-DD string or null",
  "document_date": "YYYY-MM-DD string or null",
  "diagnosed_conditions": ["array of condition strings"],
  "prescribed_medications": [{"name": "string", "dosage": "string", "frequency": "string"}],
  "lab_test_results": [{"test_name": "string", "value": "string", "unit": "string", "reference_range": "string or null"}],
  "allergies": ["array of allergy strings"],
  "provider_name": "string or null",
  "facility_name": "string or null"
}

Rules:
- If a field is not present in the document, use null for strings or empty array for arrays.
- Be precise and extract only factual information visible in the document.
- For dates, always use YYYY-MM-DD format.
- For medications, include dosage with units (e.g., "500mg") and frequency (e.g., "twice daily").
- For lab results, include the reference range when available.
- Do not infer or guess information that is not explicitly stated.`;
}

export default buildExtractionPrompt;
