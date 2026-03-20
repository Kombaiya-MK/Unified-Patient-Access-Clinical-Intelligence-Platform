# Task - task_002_be_patient_profile_generation_api

## Requirement Reference
- User Story: us_031
- Story Location: .propel/context/tasks/us_031/us_031.md
- Acceptance Criteria:
    - **AC-1 Data Aggregation**: System aggregates data from all ClinicalDocuments entries for patient_id, merging deduplicated data from US-030
    - **AC-1 Data Prioritization**: Prioritize most recent values for changeable fields (current medications, address), preserve historical timeline for lab results and diagnoses
    - **AC-1 Profile Structure**: Organize into sections: Demographics, Chief Complaint, Medical History with dates, Current Medications with last updated date, Allergies with severity, Lab Results with trend data, Previous Visits
    - **AC-1 Metadata**: Include confidence scores for AI-extracted fields, "Last Updated" timestamp per section, source document links for each data point
- Edge Case:
    - **No Documents**: Return only intake form data with flag `hasDocuments: false`
    - **Partial Extraction**: Include fields with confidence scores, flag low-confidence fields (<80%)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Backend API task) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Wireframe Status Legend:**
> - **N/A**: Backend API task, no UI impact

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Backend task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Framework | Express | latest |
| Database Client | pg (PostgreSQL) | latest |
| Validation | Zod / Joi | latest |

**Note**: All code, and libraries, MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (consumes AI-extracted data but no direct AI calls) |
| **AIR Requirements** | AIR-003 (Patient profile synthesis - consumes outputs) |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create RESTful API endpoint `GET /api/patients/:patientId/profile` that generates unified patient profiles by aggregating and merging data from multiple sources: ClinicalDocuments (US-029 extracted data), deduplicated records (US-030), and manual intake forms. The API implements smart data prioritization (most recent values for changeable fields like medications/address, historical timeline for lab results/diagnoses) and structures output into seven sections (Demographics, Chief Complaint, Medical History, Current Medications, Allergies, Lab Results, Previous Visits). Each data point includes metadata: source document ID, extraction confidence score (from AI extraction), and "Last Updated" timestamp. Edge cases handled: empty state when no documents uploaded (return intake-only data), partial extractions (include fields with confidence scores, flag low-confidence <80%).

## Dependent Tasks
- US-029 (Document extraction - provides ClinicalDocuments source data)
- US-030 (Deduplication - provides deduplicated records)
- task_003_be_conflict_detection_service (provides conflict metadata)
- task_004_db_patient_profiles_schema (provides database schema and aggregation functions)

## Impacted Components
- **NEW**: `server/src/routes/profile.routes.ts` - Express router for /api/patients/:patientId/profile endpoint
- **NEW**: `server/src/controllers/profile.controller.ts` - Controller handling profile generation logic
- **NEW**: `server/src/services/profileGenerationService.ts` - Core service aggregating data from multiple sources
- **NEW**: `server/src/services/dataPrioritizationService.ts` - Service implementing data prioritization rules (most recent vs historical)
- **NEW**: `server/src/utils/profileTransformer.ts` - Utility transforming raw DB data into structured profile sections
- **NEW**: `server/src/validators/profile.validator.ts` - Request validation (patientId param)
- **MODIFY**: `server/src/app.ts` - Register profile routes
- **MODIFY**: `server/src/models/PatientProfile.ts` - Add TypeScript interfaces for unified profile structure

## Implementation Plan
1. **Create profile routes**: Define `GET /api/patients/:patientId/profile` endpoint in Express router, add authentication middleware (staff-only access)
2. **Implement profile controller**: Extract patientId from request params, call profileGenerationService.generateProfile(patientId), return JSON response
3. **Build profileGenerationService**: Query ClinicalDocuments table for all documents matching patient_id, fetch deduplicated records from US-030 tables, merge intake form data
4. **Implement data prioritization**: For changeable fields (medications, address), select most recent value based on timestamp; for historical fields (lab results, diagnoses), preserve full timeline
5. **Structure profile sections**: Transform aggregated data into seven sections (Demographics, Chief Complaint, Medical History, Current Medications, Allergies, Lab Results, Previous Visits)
6. **Add metadata enrichment**: Attach source document ID, confidence score (from AI extraction), "Last Updated" timestamp per data point
7. **Integrate conflict detection**: Call task_003 conflict detection service to identify mismatches, include conflict metadata in response
8. **Handle no documents edge case**: If ClinicalDocuments query returns empty, return intake form data only with flag `{ hasDocuments: false }`
9. **Implement response caching**: Cache generated profiles in Redis with 5-minute TTL, invalidate on document upload or intake update
10. **Add error handling**: Handle missing patient (404), database errors (500), unauthorized access (403), return structured error responses

**Focus on how to implement**:
- Route definition: `router.get('/patients/:patientId/profile', authMiddleware, staffRoleCheck, profileController.getProfile)`
- Service aggregation: `const documents = await getClinicalDocuments(patientId); const deduped = await getDeduplicatedRecords(patientId); const intake = await getIntakeForm(patientId);`
- Data prioritization: `const currentMedications = medications.sort((a,b) => b.lastUpdated - a.lastUpdated)[0]; const labTimeline = labResults.sort((a,b) => a.date - b.date);`
- Profile structure: `{ demographics: { ... }, medicalHistory: [{ condition, diagnosisDate, source }], currentMedications: [{ drug, dosage, lastUpdated, source, confidence }] }`
- Conflict detection: `const conflicts = await conflictDetectionService.detectConflicts(profile); profile.conflicts = conflicts;`
- Cache implementation: `const cached = await redis.get(\`profile:\${patientId}\`); if (cached) return JSON.parse(cached); ... await redis.setex(\`profile:\${patientId}\`, 300, JSON.stringify(profile));`
- Error responses: `if (!patient) throw new NotFoundError('Patient not found'); ... res.status(404).json({ error: 'Patient not found' });`

## Current Project State
```
server/src/
├── routes/
│   └── (to create: profile.routes.ts)
├── controllers/
│   └── (to create: profile.controller.ts)
├── services/
│   └── (to create: profileGenerationService.ts, dataPrioritizationService.ts)
├── utils/
│   └── (to create: profileTransformer.ts)
├── validators/
│   └── (to create: profile.validator.ts)
├── models/
│   └── PatientProfile.ts (to modify: add profile interfaces)
└── app.ts (to modify: register routes)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/routes/profile.routes.ts | Express router: `GET /api/patients/:patientId/profile` endpoint, authentication middleware, staff role check, input validation |
| CREATE | server/src/controllers/profile.controller.ts | Controller: extract patientId, call profileGenerationService.generateProfile(), handle errors, return JSON response |
| CREATE | server/src/services/profileGenerationService.ts | Service: query ClinicalDocuments, fetch deduplicated records, merge intake data, structure into sections, enrich metadata, integrate conflict detection |
| CREATE | server/src/services/dataPrioritizationService.ts | Service: implement prioritization logic (most recent for meds/address, historical for labs/diagnoses), timestamp sorting, deduplication rules |
| CREATE | server/src/utils/profileTransformer.ts | Utility: transform raw DB records into structured sections (demographics, medications, lab results), format dates, attach metadata |
| CREATE | server/src/validators/profile.validator.ts | Validation: validate patientId param (UUID format), return 400 if invalid |
| MODIFY | server/src/app.ts | Register profile routes: `app.use('/api', profileRoutes)` after existing routes |
| MODIFY | server/src/models/PatientProfile.ts | Add TypeScript interfaces: UnifiedProfile, ProfileSection, MedicationItem, LabResult, ConflictMetadata, DataSourceInfo |

## External References
- **Express Routing**: https://expressjs.com/en/guide/routing.html (Route parameters, middleware, error handling)
- **PostgreSQL pg Library**: https://node-postgres.com/ (Query execution, parameterized queries, connection pooling)
- **Zod Validation**: https://zod.dev/ (Schema validation for patientId)
- **Redis Caching**: https://redis.io/docs/clients/nodejs/ (Cache pattern: get, setex, invalidation)
- **Node.js Error Handling**: https://nodejs.org/api/errors.html (Custom error classes, async error handling)
- **UC-003 Sequence Diagram**: .propel/context/docs/models.md#UC-003 (Clinical data aggregation workflow)
- **Design.md AIR-003**: .propel/context/docs/design.md#AIR-003 (Patient profile synthesis requirements)

## Build Commands
```bash
# Development server
cd server
npm run dev

# Run migrations (task_004 database schema)
npm run migrate

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Implementation Checklist
- [ ] Create Express route `GET /api/patients/:patientId/profile` with authentication middleware, staff role check, patientId validation
- [ ] Implement profile controller extracting patientId from params, calling profileGenerationService, returning structured JSON response with error handling
- [ ] Build profileGenerationService aggregating data: query ClinicalDocuments for patient_id, fetch deduplicated records (US-030), merge intake form data
- [ ] Implement dataPrioritizationService: select most recent values for changeable fields (medications, address), preserve historical timeline for lab results/diagnoses
- [ ] Create profileTransformer utility structuring data into 7 sections (Demographics, Chief Complaint, Medical History, Current Medications, Allergies, Lab Results, Previous Visits)
- [ ] Enrich profile with metadata: source document ID, confidence scores (from AI extraction), "Last Updated" timestamp per data point and per section
- [ ] Integrate conflict detection service (task_003) to identify mismatches, include conflict metadata in API response
- [ ] Handle edge cases: no documents (return intake-only data with `hasDocuments: false`), partial extractions (flag low-confidence fields <80%), missing patient (404 error)
