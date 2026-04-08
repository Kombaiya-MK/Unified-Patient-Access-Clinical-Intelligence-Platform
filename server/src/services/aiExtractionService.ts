/**
 * AI Document Extraction Service
 * Uses OpenAI GPT-4 and Vision API to extract structured data from documents.
 * @module services/aiExtractionService
 * @task US_029 TASK_002
 */

import fs from 'fs';
import { ExtractedData, ExtractionResult } from '../types/extraction.types';
import { EXTRACTION_CONFIG, EXTRACTION_FIELDS } from '../config/extraction.config';
import { buildExtractionPrompt } from '../prompts/document-extraction-prompt';
import { extractTextFromFile, isImageFile, isTextExtractable } from './textExtractionService';
import { openAICircuitBreaker } from './openai/circuitBreakerService';
import { queueForRetry } from './fallback/extraction-fallback.service';
import logger from '../utils/logger';

export async function extractDataFromDocument(
  filePath: string,
  mimeType: string,
  documentType: string,
  documentId?: number,
): Promise<ExtractionResult> {
  if (!openAICircuitBreaker.isAllowed()) {
    // Queue for later processing if document ID is available
    if (documentId) {
      const jobType = isImageFile(mimeType) ? 'ocr_extraction' : 'data_extraction';
      await queueForRetry(documentId, jobType);
    }
    throw new Error('OpenAI service is temporarily unavailable. Document queued for later processing.');
  }

  const prompt = buildExtractionPrompt(documentType);

  let rawResponse: string;

  if (isImageFile(mimeType)) {
    rawResponse = await callOpenAIVision(filePath, prompt);
  } else if (isTextExtractable(mimeType)) {
    const text = await extractTextFromFile(filePath, mimeType);
    rawResponse = await callOpenAIText(text, prompt);
  } else {
    throw new Error(`Unsupported file type for extraction: ${mimeType}`);
  }

  const extractedData = parseExtractionResponse(rawResponse);
  const { confidence, fieldConfidences } = calculateConfidence(extractedData);
  const needsReview = confidence < EXTRACTION_CONFIG.confidenceThreshold;

  return { extractedData, confidence, fieldConfidences, needsReview };
}

async function callOpenAIVision(filePath: string, prompt: string): Promise<string> {
  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const imageBuffer = await fs.promises.readFile(filePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = filePath.split('.').pop()?.toLowerCase() || 'jpeg';
    const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user' as const,
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64Image}` } },
          ] as unknown as string,
        },
      ],
      max_tokens: 4096,
    });

    openAICircuitBreaker.recordSuccess();
    return response.choices[0]?.message?.content || '{}';
  } catch (error) {
    openAICircuitBreaker.recordFailure();
    logger.error('OpenAI Vision API call failed', { error });
    throw error;
  }
}

async function callOpenAIText(text: string, prompt: string): Promise<string> {
  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text.substring(0, 15000) }, // Limit input length
      ],
      max_tokens: 4096,
    });

    openAICircuitBreaker.recordSuccess();
    return response.choices[0]?.message?.content || '{}';
  } catch (error) {
    openAICircuitBreaker.recordFailure();
    logger.error('OpenAI Text API call failed', { error });
    throw error;
  }
}

function parseExtractionResponse(raw: string): ExtractedData {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    const parsed = JSON.parse(jsonStr);

    return {
      patient_name: parsed.patient_name ?? null,
      date_of_birth: parsed.date_of_birth ?? null,
      document_date: parsed.document_date ?? null,
      diagnosed_conditions: Array.isArray(parsed.diagnosed_conditions) ? parsed.diagnosed_conditions : [],
      prescribed_medications: Array.isArray(parsed.prescribed_medications) ? parsed.prescribed_medications : [],
      lab_test_results: Array.isArray(parsed.lab_test_results) ? parsed.lab_test_results : [],
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
      provider_name: parsed.provider_name ?? null,
      facility_name: parsed.facility_name ?? null,
    };
  } catch (error) {
    logger.error('Failed to parse extraction response', { error, raw: raw.substring(0, 500) });
    return {
      patient_name: null,
      date_of_birth: null,
      document_date: null,
      diagnosed_conditions: [],
      prescribed_medications: [],
      lab_test_results: [],
      allergies: [],
      provider_name: null,
      facility_name: null,
    };
  }
}

function calculateConfidence(data: ExtractedData): { confidence: number; fieldConfidences: Record<string, number> } {
  const fieldConfidences: Record<string, number> = {};
  let filledCount = 0;

  for (const field of EXTRACTION_FIELDS) {
    const value = data[field as keyof ExtractedData];
    let fieldScore = 0;

    if (value === null || value === undefined) {
      fieldScore = 0;
    } else if (Array.isArray(value)) {
      fieldScore = value.length > 0 ? 0.95 : 0;
    } else if (typeof value === 'string' && value.trim().length > 0) {
      fieldScore = 0.95;
    }

    fieldConfidences[field] = fieldScore;
    if (fieldScore > 0) filledCount++;
  }

  const confidence = filledCount / EXTRACTION_FIELDS.length;
  return { confidence, fieldConfidences };
}
