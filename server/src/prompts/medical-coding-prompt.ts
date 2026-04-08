/**
 * Medical Coding Prompt Template
 * @module prompts/medical-coding-prompt
 * @description OpenAI prompt for ICD-10/CPT code generation
 * @epic EP-006
 * @story US-032
 */

export function buildMedicalCodingPrompt(
  clinicalNotes: string,
  chiefComplaint?: string,
  diagnoses?: string[],
  procedures?: string[]
): string {
  const diagnosisList = diagnoses?.length
    ? `\nDIAGNOSES:\n${diagnoses.map((d, i) => `${i + 1}. ${d}`).join('\n')}`
    : '';

  const procedureList = procedures?.length
    ? `\nPROCEDURES:\n${procedures.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    : '';

  return `You are a certified medical coding specialist with expertise in ICD-10-CM and CPT coding.

Analyze the following clinical documentation and generate appropriate medical codes.

Return a JSON response with this exact structure:
{
  "icd10_codes": [
    {
      "code": "ICD-10-CM code (e.g., J06.9)",
      "description": "Official code description",
      "confidence": 0.0-1.0,
      "source_text": "relevant text from clinical notes",
      "reasoning": "brief explanation of why this code applies"
    }
  ],
  "cpt_codes": [
    {
      "code": "CPT code (e.g., 99213)",
      "description": "Official code description",
      "confidence": 0.0-1.0,
      "source_text": "relevant text from clinical notes",
      "reasoning": "brief explanation of why this code applies"
    }
  ],
  "reasoning": "overall coding rationale summary",
  "confidence_overall": 0.0-1.0
}

Coding Guidelines:
1. Use the most specific ICD-10-CM code available (code to highest level of specificity)
2. Include all relevant diagnosis codes supported by documentation
3. Assign CPT codes for documented procedures and evaluation/management services
4. Confidence should reflect how well the documentation supports each code
5. Do NOT code conditions that are "rule out" or "suspected" unless documented as confirmed
6. Follow official ICD-10-CM and CPT coding guidelines

${chiefComplaint ? `CHIEF COMPLAINT: ${chiefComplaint}\n` : ''}
CLINICAL NOTES:
${clinicalNotes}
${diagnosisList}
${procedureList}

Return ONLY valid JSON. Do not include any text outside the JSON object.`;
}
