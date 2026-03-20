# Task - TASK_003_BE_PII_REDACTION_MIDDLEWARE

## Requirement Reference
- User Story: US_011  
- Story Location: `.propel/context/tasks/us_011/us_011.md`
- Acceptance Criteria:
    - AC1: PII-redacted details in audit logs (replace names/emails/SSNs with patient_id/user_id)
- Edge Cases:
    - PII redaction enforcement: Middleware intercepts all audit log writes, applies redaction rules before INSERT

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Backend data processing - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | TypeScript | 5.3.x |
| Backend | crypto | Built-in |
| Database | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Data sanitization only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement PII redaction middleware that automatically sanitizes sensitive personal information before writing to audit logs. Detect and redact: personally identifiable names, email addresses, SSN/national IDs, phone numbers, credit card numbers, medical record numbers, dates of birth (keep year only). Replace with entity references (patient_id, user_id) or masked values. Implement pattern-based detection (regex for SSN, email, phone) and field-based redaction (known PII fields like 'email', 'ssn', 'name'). Create redaction configuration for customizable rules. Ensure audit logs remain useful for compliance tracking while protecting PHI/PII per HIPAA requirements.

## Dependent Tasks
- US_011 TASK_001: Audit logging service must exist

## Impacted Components
**Modified:**
- server/src/services/auditLogger.ts (Integrate PII redaction before INSERT)

**New:**
- server/src/middleware/piiRedaction.ts (Core PII redaction service)
- server/src/config/piiRules.ts (Redaction rules configuration)
- server/src/types/pii.types.ts (PIIField enum, RedactionRule interface)
- server/src/utils/patternDetector.ts (Regex patterns for SSN, email, phone, credit card)
- server/src/utils/fieldRedactor.ts (Field-based redaction logic)
- server/tests/unit/piiRedaction.test.ts (Unit tests for redaction)
- server/docs/PII_REDACTION.md (PII redaction documentation)

## Implementation Plan
1. **PII Patterns**: Define regex patterns for SSN (XXX-XX-XXXX), email (\S+@\S+\.\S+), phone ((XXX) XXX-XXXX), credit card (XXXX-XXXX-XXXX-XXXX)
2. **Field Mapping**: Map field names to redaction strategy (email → masked email, ssn → [REDACTED], name → user_id)
3. **Redaction Modes**: MASK (partial: a***@example.com), REDACT ([REDACTED]), REFERENCE (replace with ID), HASH (SHA-256 hash)
4. **Deep Object Scan**: Recursively scan nested objects and arrays for PII fields
5. **Pattern Detection**: Apply regex patterns to all string values, redact matches
6. **Field Detection**: Check object keys against PII field list, apply field-specific redaction
7. **Preserve Context**: Keep entity IDs (patient_id, user_id, appointment_id) for audit traceability
8. **Whitelist**: Allow certain fields to pass through (timestamps, status codes, resource_type)
9. **Integration**: Call redaction service in auditLogger.logAudit() before INSERT
10. **Testing**: Comprehensive tests for all PII patterns and field types
11. **Configuration**: Make redaction rules configurable via environment or config file
12. **Documentation**: Document what gets redacted, examples, how to add new rules

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend API
│   ├── src/
│   │   └── services/
│   │       └── auditLogger.ts  # Audit logging service (US_011 TASK_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/types/pii.types.ts | PIIField enum, RedactionMode enum, RedactionRule interface |
| CREATE | server/src/config/piiRules.ts | Redaction rules configuration (patterns, fields, modes) |
| CREATE | server/src/utils/patternDetector.ts | Regex patterns for SSN, email, phone, credit card, MRN |
| CREATE | server/src/utils/fieldRedactor.ts | Field-based redaction logic |
| CREATE | server/src/middleware/piiRedaction.ts | Main PII redaction service with redactObject() method |
| MODIFY | server/src/services/auditLogger.ts | Integrate piiRedaction.redactObject() before INSERT |
| CREATE | server/tests/unit/piiRedaction.test.ts | Unit tests for all redaction scenarios |
| CREATE | server/docs/PII_REDACTION.md | PII redaction documentation |

> 1 modified file, 7 new files created

## External References
- [HIPAA Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/index.html)
- [PII Definition (NIST)](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-122.pdf)
- [PHI Identifiers (HIPAA)](https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html)
- [Data Masking Best Practices](https://owasp.org/www-community/data_masking)
- [Regex for SSN/Email/Phone](https://regex101.com/)

## Build Commands
```bash
# Start development server
cd server
npm run dev

# Test PII redaction (create user with email/SSN)
TOKEN="<admin-jwt-token>"
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "ssn": "123-45-6789",
    "phone": "(555) 123-4567",
    "date_of_birth": "1990-03-15"
  }'

# Check audit log - verify PII redacted
psql -U upaci_user -d upaci -c "
SELECT details FROM audit_logs 
WHERE action_type = 'CREATE' AND resource_type = 'user' 
ORDER BY created_at DESC 
LIMIT 1;
"
# Expected details JSON:
# {
#   "request_body": {
#     "email": "j***@example.com",         -- Masked
#     "first_name": "[REDACTED]",          -- Redacted
#     "last_name": "[REDACTED]",           -- Redacted
#     "ssn": "[REDACTED]",                 -- Redacted
#     "phone": "[REDACTED]",               -- Redacted
#     "date_of_birth": "1990",             -- Year only
#     "user_id": 123                       -- Reference preserved
#   },
#   "status_code": 201
# }

# Test pattern detection (SSN in free text)
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "notes": "Patient SSN is 987-65-4321, call (555) 987-6543"
  }'

# Check audit log - verify pattern-based redaction
psql -U upaci_user -d upaci -c "
SELECT details->'request_body'->'notes' FROM audit_logs 
WHERE action_type = 'CREATE' AND resource_type = 'appointment' 
ORDER BY created_at DESC 
LIMIT 1;
"
# Expected: "Patient SSN is [REDACTED], call [REDACTED]"

# Test nested object redaction
curl -X POST http://localhost:3001/api/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "emergency_contact": {
        "name": "Bob Smith",
        "phone": "555-111-2222"
      }
    }
  }'

# Check nested redaction
psql -U upaci_user -d upaci -c "
SELECT details FROM audit_logs 
WHERE action_type = 'CREATE' AND resource_type = 'patient' 
ORDER BY created_at DESC 
LIMIT 1;
"
# Expected: All nested PII fields redacted

# Test whitelist (timestamps, IDs preserved)
curl -X GET http://localhost:3001/api/patients/1 \
  -H "Authorization: Bearer $TOKEN"

# Check audit - verify whitelisted fields preserved
psql -U upaci_user -d upaci -c "
SELECT details FROM audit_logs 
WHERE action_type = 'READ' AND resource_type = 'patient' 
ORDER BY created_at DESC 
LIMIT 1;
"
# Expected: patient_id, created_at, updated_at preserved (not redacted)

# Run unit tests
npm test -- piiRedaction.test.ts
```

## Implementation Validation Strategy
- [ ] PII patterns defined: SSN, email, phone, credit card, MRN
- [ ] Field mapping configured: Known PII fields mapped to redaction mode
- [ ] Redaction modes implemented: MASK, REDACT, REFERENCE, HASH
- [ ] Deep scan works: Nested objects and arrays redacted
- [ ] Pattern detection: Regex matches in free text redacted
- [ ] Field detection: Object keys matching PII fields redacted
- [ ] Email masking: john.doe@example.com → j***@example.com
- [ ] SSN redaction: 123-45-6789 → [REDACTED]
- [ ] Phone redaction: (555) 123-4567 → [REDACTED]
- [ ] Name redaction: First/last names → [REDACTED]
- [ ] Date of birth: Full date → year only (1990-03-15 → 1990)
- [ ] Entity IDs preserved: patient_id, user_id, appointment_id not redacted
- [ ] Whitelist working: Timestamps, status codes pass through
- [ ] Integration complete: auditLogger calls redaction before INSERT
- [ ] No PII in audit_logs: Manual review confirms no PHI/PII stored

## Implementation Checklist

### Type Definitions (server/src/types/pii.types.ts)
- [ ] Define PIIField enum: EMAIL, SSN, PHONE, CREDIT_CARD, NAME, ADDRESS, DATE_OF_BIRTH, MEDICAL_RECORD_NUMBER
- [ ] Define RedactionMode enum: MASK, REDACT, REFERENCE, HASH, YEAR_ONLY
- [ ] Define RedactionRule interface: { field: PIIField | string, mode: RedactionMode, pattern?: RegExp, replacement?: string }
- [ ] Define RedactionConfig interface: { rules: RedactionRule[], whitelist: string[], enablePatternDetection: boolean }
- [ ] Export all types

### Pattern Detector (server/src/utils/patternDetector.ts)
- [ ] Define SSN pattern: /\b\d{3}-\d{2}-\d{4}\b/g
- [ ] Define email pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
- [ ] Define phone pattern: /\b(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g
- [ ] Define credit card pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
- [ ] Define MRN pattern: /\b(MRN|mrn):?\s*[A-Z0-9]{6,}\b/gi
- [ ] Implement detectAndRedact(text: string): string
- [ ] Apply all patterns sequentially, replace matches with [REDACTED]
- [ ] Return sanitized text
- [ ] Export detectAndRedact and patterns

### Field Redactor (server/src/utils/fieldRedactor.ts)
- [ ] Import RedactionMode, PIIField
- [ ] Implement redactByMode(value: any, mode: RedactionMode): any
- [ ] MASK: For emails: mask middle characters (john.doe@ex.com → j***@ex.com)
- [ ] MASK: For strings: mask middle 50% (JohnDoe → J***e)
- [ ] REDACT: Return '[REDACTED]'
- [ ] REFERENCE: Not applicable at field level (handled by caller)
- [ ] HASH: Return crypto.createHash('sha256').update(String(value)).digest('hex').substring(0, 16)
- [ ] YEAR_ONLY: Extract year from date: new Date(value).getFullYear()
- [ ] Implement redactField(key: string, value: any, rules: RedactionRule[]): any
- [ ] Find matching rule for key
- [ ] If match: Apply redaction mode
- [ ] If no match: Return value unchanged
- [ ] Export functions

### PII Rules Configuration (server/src/config/piiRules.ts)
- [ ] Import types
- [ ] Define piiRules: RedactionRule[] = [
- [ ]   { field: 'email', mode: RedactionMode.MASK },
- [ ]   { field: 'ssn', mode: RedactionMode.REDACT },
- [ ]   { field: 'social_security_number', mode: RedactionMode.REDACT },
- [ ]   { field: 'phone', mode: RedactionMode.REDACT },
- [ ]   { field: 'phone_number', mode: RedactionMode.REDACT },
- [ ]   { field: 'first_name', mode: RedactionMode.REDACT },
- [ ]   { field: 'last_name', mode: RedactionMode.REDACT },
- [ ]   { field: 'name', mode: RedactionMode.REDACT },
- [ ]   { field: 'full_name', mode: RedactionMode.REDACT },
- [ ]   { field: 'address', mode: RedactionMode.REDACT },
- [ ]   { field: 'street_address', mode: RedactionMode.REDACT },
- [ ]   { field: 'date_of_birth', mode: RedactionMode.YEAR_ONLY },
- [ ]   { field: 'dob', mode: RedactionMode.YEAR_ONLY },
- [ ]   { field: 'credit_card', mode: RedactionMode.REDACT },
- [ ]   { field: 'medical_record_number', mode: RedactionMode.HASH },
- [ ]   { field: 'mrn', mode: RedactionMode.HASH }
- [ ] ]
- [ ] Define whitelist: string[] = ['id', 'user_id', 'patient_id', 'appointment_id', 'department_id', 'created_at', 'updated_at', 'timestamp', 'status', 'status_code', 'method', 'path', 'action_type', 'resource_type', 'resource_id']
- [ ] Export piiRules and whitelist

### PII Redaction Service (server/src/middleware/piiRedaction.ts)
- [ ] Import all utilities, types, config
- [ ] Implement redactValue(value: any, key: string): any
- [ ] If value is null/undefined: return value
- [ ] If key in whitelist: return value
- [ ] If typeof value === 'string': Apply pattern detection, then field redaction
- [ ] const detected = detectAndRedact(value)
- [ ] const redacted = redactField(key, detected, piiRules)
- [ ] return redacted
- [ ] If typeof value === 'object': recursively call redactObject(value)
- [ ] Otherwise: return value
- [ ] Implement redactObject(obj: any): any
- [ ] If obj is null/undefined: return obj
- [ ] If Array.isArray(obj): return obj.map((item, idx) => redactValue(item, `item_${idx}`))
- [ ] If typeof obj === 'object':
- [ ] const redacted = {}
- [ ] For each key in obj:
- [ ]   redacted[key] = redactValue(obj[key], key)
- [ ] return redacted
- [ ] Otherwise: return obj
- [ ] Export { redactObject, redactValue }

### Modify Audit Logger (server/src/services/auditLogger.ts)
- [ ] Import { redactObject } from piiRedaction
- [ ] In logAudit() method, before INSERT:
- [ ] Apply redaction to details field: const redactedDetails = redactObject(entry.details || {})
- [ ] Use redactedDetails in INSERT instead of original entry.details
- [ ] Ensure all logXXX methods use logAudit (inherits redaction automatically)

### Unit Tests (server/tests/unit/piiRedaction.test.ts)
- [ ] Test: "redacts email with MASK mode" → john.doe@example.com becomes j***@example.com
- [ ] Test: "redacts SSN with REDACT mode" → 123-45-6789 becomes [REDACTED]
- [ ] Test: "redacts phone number with REDACT mode" → (555) 123-4567 becomes [REDACTED]
- [ ] Test: "redacts credit card number" → 1234-5678-9012-3456 becomes [REDACTED]
- [ ] Test: "redacts first_name and last_name" → John Doe becomes [REDACTED] [REDACTED]
- [ ] Test: "converts date_of_birth to year only" → 1990-03-15 becomes 1990
- [ ] Test: "preserves whitelisted fields" → patient_id, created_at unchanged
- [ ] Test: "detects SSN in free text" → "SSN is 123-45-6789" becomes "SSN is [REDACTED]"
- [ ] Test: "detects email in free text" → "Email: test@ex.com" becomes "Email: [REDACTED]"
- [ ] Test: "redacts nested objects" → { user: { email: "test@ex.com" } } redacted
- [ ] Test: "redacts arrays" → [{ email: "a@ex.com" }, { email: "b@ex.com" }] both redacted
- [ ] Test: "hashes MRN field" → MRN: ABC12345 becomes 16-char hash
- [ ] Test: "handles null and undefined values"
- [ ] Test: "handles non-object primitives"

### Documentation (server/docs/PII_REDACTION.md)
- [ ] Document PII redaction purpose (HIPAA compliance)
- [ ] List 18 HIPAA PHI identifiers and how each is handled
- [ ] Document redaction modes (MASK, REDACT, REFERENCE, HASH, YEAR_ONLY) with examples
- [ ] Document pattern detection for free text
- [ ] Document field-based detection for structured data
- [ ] Document whitelist (non-PII fields preserved for audit traceability)
- [ ] Provide examples: Before and after redaction
- [ ] Document how to add new PII rules (modify piiRules.ts)
- [ ] Document testing strategy (unit tests, manual verification)
- [ ] Document performance considerations (redaction runs on every audit log)

### Validation and Testing
- [ ] Start server: npm run dev
- [ ] Create user with PII: POST /api/users with email, SSN, phone
- [ ] Check audit log: Verify email masked, SSN/phone/name redacted
- [ ] Test pattern detection: Include SSN in notes field, verify redacted
- [ ] Test nested objects: Include emergency_contact with PII, verify redacted
- [ ] Test whitelist: Verify patient_id, timestamps preserved
- [ ] Test date of birth: Verify full date converted to year only
- [ ] Query audit_logs: SELECT * FROM audit_logs; manually check for PII leakage
- [ ] Run unit tests: npm test -- piiRedaction.test.ts → all pass
- [ ] Performance test: Create 1000 audit logs, measure overhead (<1ms per log)
