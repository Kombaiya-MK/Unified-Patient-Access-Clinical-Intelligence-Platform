/**
 * PII Redaction Middleware
 * 
 * File: server/src/middleware/piiRedaction.ts
 * Purpose: Main PII redaction service - orchestrates field and pattern redaction
 * Task: US_011 TASK_003 - Backend PII Redaction Middleware
 * 
 * Features:
 * - Deep object scanning (recursive)
 * - Field-based redaction
 * - Pattern-based redaction (regex)
 * - Multiple redaction modes
 * - Preserves entity IDs
 * - HIPAA-compliant PII/PHI protection
 */

import {
  PIIRedactionContext,
  PIIRedactionStats,
  RedactionMode,
  DEFAULT_PII_REDACTION_CONFIG,
} from '../types/pii.types';
import { PII_CONFIG } from '../config/piiRules';
import { detectAndRedactPatterns } from '../utils/patternDetector';
import { redactFieldValue, extractEntityReferences } from '../utils/fieldRedactor';
import logger from '../utils/logger';

/**
 * Redact PII from any data structure
 * Main entry point for PII redaction
 * 
 * @param data - Data to redact (object, array, string, etc.)
 * @param context - Redaction context (optional)
 * @returns Redacted data
 */
export function redactPII(
  data: any,
  context: PIIRedactionContext = DEFAULT_PII_REDACTION_CONFIG
): any {
  const startTime = Date.now();
  
  // Merge with default config
  const config: PIIRedactionContext = {
    ...DEFAULT_PII_REDACTION_CONFIG,
    ...context,
  };
  
  // Initialize statistics
  const stats: PIIRedactionStats = {
    totalFields: 0,
    redactedFields: 0,
    patternsDetected: 0,
    modeBreakdown: {} as Record<RedactionMode, number>,
  };
  
  // Perform redaction
  const redacted = redactObject(data, config, stats, 0);
  
  // Calculate duration
  stats.duration = Date.now() - startTime;
  
  // Log statistics in development
  if (PII_CONFIG.isDevelopment) {
    logger.debug('PII redaction completed', {
      totalFields: stats.totalFields,
      redactedFields: stats.redactedFields,
      patternsDetected: stats.patternsDetected,
      duration: stats.duration,
      modeBreakdown: stats.modeBreakdown,
    });
  }
  
  return redacted;
}

/**
 * Recursively redact PII from an object
 * 
 * @param data - Data to redact
 * @param config - Redaction configuration
 * @param stats - Statistics tracker
 * @param currentDepth - Current recursion depth
 * @returns Redacted data
 */
function redactObject(
  data: any,
  config: PIIRedactionContext,
  stats: PIIRedactionStats,
  currentDepth: number
): any {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Check max depth
  if (currentDepth >= (config.maxDepth || 10)) {
    logger.warn('PII redaction max depth reached', { currentDepth });
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => redactObject(item, config, stats, currentDepth + 1));
  }
  
  // Handle strings (pattern detection)
  if (typeof data === 'string') {
    stats.totalFields++;
    
    if (config.enablePatternDetection !== false) {
      const original = data;
      const redacted = detectAndRedactPatterns(data);
      
      if (redacted !== original) {
        stats.patternsDetected++;
        return redacted;
      }
    }
    
    return data;
  }
  
  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }
  
  // Handle objects
  const redacted: Record<string, any> = {};
  
  // Preserve entity IDs if configured
  if (config.preserveIds) {
    const references = extractEntityReferences(data);
    Object.assign(redacted, references);
  }
  
  // Process each field
  for (const [key, value] of Object.entries(data)) {
    stats.totalFields++;
    
    // Skip if already added (from entity references)
    if (key in redacted) {
      continue;
    }
    
    // Check whitelist
    if (config.whitelist && config.whitelist.includes(key)) {
      redacted[key] = value;
      continue;
    }
    
    // Field-based redaction
    if (config.enableFieldDetection !== false) {
      const result = redactFieldValue(key, value, config.whitelist || []);
      
      if (result.detected) {
        // Field redacted
        stats.redactedFields++;
        
        // Track mode usage
        if (!stats.modeBreakdown[result.mode]) {
          stats.modeBreakdown[result.mode] = 0;
        }
        stats.modeBreakdown[result.mode]++;
        
        // If value is object/array, still recurse
        if (typeof result.redactedValue === 'object' && result.redactedValue !== null) {
          redacted[key] = redactObject(result.redactedValue, config, stats, currentDepth + 1);
        } else {
          redacted[key] = result.redactedValue;
        }
        
        continue;
      }
    }
    
    // Recurse into nested objects/arrays
    if (typeof value === 'object' && value !== null) {
      redacted[key] = redactObject(value, config, stats, currentDepth + 1);
    } else if (typeof value === 'string') {
      // Apply pattern detection to string values
      if (config.enablePatternDetection !== false) {
        const original = value;
        const redactedValue = detectAndRedactPatterns(value);
        
        if (redactedValue !== original) {
          stats.patternsDetected++;
          redacted[key] = redactedValue;
        } else {
          redacted[key] = value;
        }
      } else {
        redacted[key] = value;
      }
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

/**
 * Redact PII from audit log entry
 * Specialized function for audit logs that preserves audit trail structure
 * 
 * @param entry - Audit log entry
 * @returns Redacted audit log entry
 */
export function redactAuditLogEntry(entry: any): any {
  // Whitelist audit-specific fields
  const auditWhitelist = [
    'id',
    'user_id',
    'action',
    'action_type',
    'table_name',
    'resource_type',
    'record_id',
    'resource_id',
    'ip_address', // Keep for security tracking
    'user_agent',
    'timestamp',
    'created_at',
    'status',
    'status_code',
    'method',
    'path',
    'duration',
  ];
  
  return redactPII(entry, {
    ...DEFAULT_PII_REDACTION_CONFIG,
    whitelist: auditWhitelist,
    preserveIds: true,
  });
}

/**
 * Redact PII from request body
 * For logging HTTP request bodies
 * 
 * @param body - Request body
 * @returns Redacted request body
 */
export function redactRequestBody(body: any): any {
  return redactPII(body, {
    ...DEFAULT_PII_REDACTION_CONFIG,
    enablePatternDetection: true,
    enableFieldDetection: true,
    preserveIds: true,
  });
}

/**
 * Redact PII from error messages
 * Removes PII from error messages before logging
 * 
 * @param errorMessage - Error message
 * @returns Redacted error message
 */
export function redactErrorMessage(errorMessage: string): string {
  if (!errorMessage || typeof errorMessage !== 'string') return errorMessage;
  
  // Apply pattern detection to error messages
  return detectAndRedactPatterns(errorMessage);
}

/**
 * Check if data contains PII
 * Quick check without redaction
 * 
 * @param data - Data to check
 * @returns True if PII detected
 */
export function containsPII(data: any): boolean {
  if (!data) return false;
  
  // Check for PII field names
  if (typeof data === 'object' && !Array.isArray(data)) {
    const piiFieldNames = [
      'email',
      'first_name',
      'last_name',
      'ssn',
      'phone',
      'address',
      'credit_card',
      'password',
    ];
    
    for (const field of piiFieldNames) {
      if (field in data) return true;
    }
  }
  
  // Check for PII patterns in strings
  if (typeof data === 'string') {
    // Quick regex checks
    if (/@\w+\.\w+/.test(data)) return true; // Email
    if (/\d{3}-\d{2}-\d{4}/.test(data)) return true; // SSN
    if (/\(\d{3}\)\s*\d{3}-\d{4}/.test(data)) return true; // Phone
  }
  
  return false;
}

/**
 * Batch redact multiple objects
 * Efficient for processing multiple records
 * 
 * @param items - Array of items to redact
 * @param context - Redaction context
 * @returns Array of redacted items
 */
export function batchRedactPII(
  items: any[],
  context: PIIRedactionContext = DEFAULT_PII_REDACTION_CONFIG
): any[] {
  if (!Array.isArray(items)) return items;
  
  const startTime = Date.now();
  
  const redacted = items.map(item => redactPII(item, context));
  
  const duration = Date.now() - startTime;
  
  logger.info(`Batch PII redaction completed`, {
    itemCount: items.length,
    duration,
    avgPerItem: Math.round(duration / items.length),
  });
  
  return redacted;
}

/**
 * Create custom redaction context
 * Helper to create customized redaction configurations
 * 
 * @param overrides - Configuration overrides
 * @returns Custom redaction context
 */
export function createRedactionContext(
  overrides: Partial<PIIRedactionContext>
): PIIRedactionContext {
  return {
    ...DEFAULT_PII_REDACTION_CONFIG,
    ...overrides,
  };
}

/**
 * Validate redacted data
 * Ensures redaction was successful
 * 
 * @param original - Original data
 * @param redacted - Redacted data
 * @returns Validation result
 */
export function validateRedactedData(original: any, redacted: any): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Null/undefined checks
  if (redacted === null || redacted === undefined) {
    if (original !== null && original !== undefined) {
      issues.push('Redacted data is null/undefined but original was not');
    }
    return { valid: issues.length === 0, issues };
  }
  
  // Type checks
  if (typeof original !== typeof redacted) {
    issues.push(`Type mismatch: original is ${typeof original}, redacted is ${typeof redacted}`);
  }
  
  // Check for leaked PII in strings
  if (typeof redacted === 'string') {
    // Email pattern
    if (/@[^\s]+\.[^\s]+/.test(redacted) && !redacted.includes('***')) {
      issues.push('Possible unredacted email in string');
    }
    
    // SSN pattern
    if (/\d{3}-\d{2}-\d{4}/.test(redacted)) {
      issues.push('Possible unredacted SSN in string');
    }
    
    // Phone pattern
    if (/\(\d{3}\)\s*\d{3}-\d{4}/.test(redacted)) {
      issues.push('Possible unredacted phone in string');
    }
    
    // Credit card pattern
    if (/\b(?:\d{4}[-\s]){3}\d{4}\b/.test(redacted)) {
      issues.push('Possible unredacted credit card in string');
    }
  }
  
  // Check objects for PII field names
  if (typeof redacted === 'object' && !Array.isArray(redacted)) {
    const piiFields = ['ssn', 'social_security_number', 'password', 'secret', 'api_key', 'token'];
    
    for (const field of piiFields) {
      if (field in redacted && typeof redacted[field] === 'string') {
        if (redacted[field] !== '[REDACTED]' && !redacted[field].includes('***')) {
          issues.push(`Field '${field}' may not be properly redacted`);
        }
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Express middleware for PII redaction
 * Can be used to automatically redact request/response bodies
 * 
 * @param options - Middleware options
 * @returns Express middleware function
 */
export function piiRedactionMiddleware(options: {
  redactRequest?: boolean;
  redactResponse?: boolean;
  context?: PIIRedactionContext;
} = {}) {
  const {
    redactRequest = true,
    redactResponse = false,
    context = DEFAULT_PII_REDACTION_CONFIG,
  } = options;
  
  return (req: any, res: any, next: any) => {
    // Redact request body
    if (redactRequest && req.body) {
      req._originalBody = req.body;
      req.body = redactPII(req.body, context);
    }
    
    // Intercept response
    if (redactResponse) {
      const originalJson = res.json.bind(res);
      
      res.json = function (data: any) {
        const redactedData = redactPII(data, context);
        return originalJson(redactedData);
      };
    }
    
    next();
  };
}

export default {
  redactPII,
  redactAuditLogEntry,
  redactRequestBody,
  redactErrorMessage,
  containsPII,
  batchRedactPII,
  createRedactionContext,
  validateRedactedData,
  piiRedactionMiddleware,
};
