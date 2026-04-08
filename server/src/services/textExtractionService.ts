/**
 * Text Extraction Service
 * Extracts text content from PDF and DOCX files.
 * @module services/textExtractionService
 * @task US_029 TASK_002
 */

import fs from 'fs';
import logger from '../utils/logger';

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPdf(filePath);
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDocx(filePath);
  }

  throw new Error(`Unsupported file type for text extraction: ${mimeType}`);
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const buffer = await fs.promises.readFile(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  } catch (error) {
    logger.error('PDF text extraction failed', { filePath, error });
    throw new Error('Failed to extract text from PDF');
  }
}

async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    logger.error('DOCX text extraction failed', { filePath, error });
    throw new Error('Failed to extract text from DOCX');
  }
}

export function isImageFile(mimeType: string): boolean {
  return ['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType);
}

export function isTextExtractable(mimeType: string): boolean {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ].includes(mimeType);
}
