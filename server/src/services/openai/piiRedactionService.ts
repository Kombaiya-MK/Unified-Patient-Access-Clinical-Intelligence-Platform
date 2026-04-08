/**
 * PII Redaction Service
 * 
 * File: server/src/services/openai/piiRedactionService.ts
 * Task: US_025 TASK_001 - Backend OpenAI Integration
 * 
 * Redacts personally identifiable information before sending
 * conversation data to OpenAI. HIPAA compliance requirement.
 */
import logger from '../../utils/logger';
import type { PiiPattern } from '../../types/aiIntake.types';

/** PII patterns to detect and redact */
const PII_PATTERNS: PiiPattern[] = [
  {
    name: 'SSN',
    regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    replacement: '[REDACTED-SSN]',
  },
  {
    name: 'Phone',
    regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '[REDACTED-PHONE]',
  },
  {
    name: 'Email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: '[REDACTED-EMAIL]',
  },
  {
    name: 'DOB',
    regex: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g,
    replacement: '[REDACTED-DOB]',
  },
  {
    name: 'CreditCard',
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    replacement: '[REDACTED-CC]',
  },
  {
    name: 'MRN',
    regex: /\b(?:MRN|mrn|Medical Record)[\s#:]*\d{5,10}\b/gi,
    replacement: '[REDACTED-MRN]',
  },
  {
    name: 'Address',
    regex: /\b\d{1,5}\s+[A-Za-z]+(?:\s+[A-Za-z]+)*\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Rd|Road|Ct|Court|Pl|Place|Way)\b/gi,
    replacement: '[REDACTED-ADDRESS]',
  },
];

/**
 * Redact PII from text before sending to OpenAI
 * @param text - Text potentially containing PII
 * @returns Text with PII redacted
 */
export function redactPii(text: string): string {
  let redacted = text;
  let redactedCount = 0;

  for (const pattern of PII_PATTERNS) {
    const matches = redacted.match(pattern.regex);
    if (matches) {
      redactedCount += matches.length;
      redacted = redacted.replace(pattern.regex, pattern.replacement);
    }
  }

  if (redactedCount > 0) {
    logger.info(`PII redaction: ${redactedCount} pattern(s) redacted from text`);
  }

  return redacted;
}

/**
 * Check if text contains PII patterns
 * @param text - Text to check
 * @returns true if PII is detected
 */
export function containsPii(text: string): boolean {
  return PII_PATTERNS.some((pattern) => {
    // Reset lastIndex for global regex patterns
    pattern.regex.lastIndex = 0;
    return pattern.regex.test(text);
  });
}

/**
 * Redact PII from an array of conversation messages (content field only)
 * @param messages - Array of message objects
 * @returns Messages with PII redacted from content
 */
export function redactMessagesForAI(
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  return messages.map((msg) => ({
    ...msg,
    content: msg.role === 'user' ? redactPii(msg.content) : msg.content,
  }));
}
