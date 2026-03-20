# Task - TASK_002_BE_NOSHOW_RISK_ML_ALGORITHM

## Requirement Reference
- User Story: US_038
- Story Location: .propel/context/tasks/us_038/us_038.md
- Acceptance Criteria:
    - System calculates no-show risk score (0-100%) based on patient history, appointment characteristics, demographics, insurance status
    - Uses logistic regression model trained on historical appointment data achieving >75% prediction accuracy (AIR-S04)
    - Triggered at appointment creation and daily batch job for all upcoming appointments
    - Stores risk score in appointments table
    - Displays top 3 contributing factors (e.g., "3 no-shows in last 6 months", "Weekend appointment", "Insurance issue")
    - Triggers automated extra reminder for high-risk patients (SMS + voice call)
    - Updates risk score after each appointment outcome
- Edge Case:
    - Brand new patients with no history: Use population average risk ~15%, mark as "New Patient - Baseline Risk"
    - External factors like weather: Not in MVP scope, show "Historical factors only" note
    - Perfect attendance history: Risk score floors at 5%, tag as "Reliable Patient"

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

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.18.x |
| Backend | TypeScript | 5.3.x |
| Backend | Python | 3.11 (ML training) |
| Backend | scikit-learn | 1.3.x |
| Backend | pandas | 2.x |
| Backend | node-cron | 3.x |
| Database | PostgreSQL | 15.x |
| AI/ML | scikit-learn LogisticRegression | 1.3.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-006 (Predictive analytics for no-shows), AIR-S04 (No-show prediction accuracy >75%) |
| **AI Pattern** | Supervised Learning (Logistic Regression) |
| **Prompt Template Path** | N/A (ML model, not LLM) |
| **Guardrails Config** | .propel/context/ml-models/noshow-risk-config.json |
| **Model Provider** | scikit-learn LogisticRegression |

> **ML Model Details:**
> - **Algorithm**: Logistic Regression with L2 regularization (class_weight='balanced')
> - **Features**: previous_noshow_count (0-100), total_appointments (1-500), days_since_last_noshow (0-365 or NULL), appointment_hour (0-23), day_of_week (0=Mon, 6=Sun), lead_time_days (0-90), patient_age (0-120), has_insurance_issue (0/1), distance_km (0-100 or NULL)
> - **Target**: is_noshow (0=completed/cancelled, 1=no_show status)
> - **Training Data**: Historical appointments from last 12 months with status='completed' or 'no_show'
> - **Validation**: 80/20 train/test split, accuracy >75%, precision/recall for class=1 (no-show) >70%
> - **Model Persistence**: Pickle format at server/ml-models/noshow_model.pkl
> - **Retraining Frequency**: Weekly via cron job (Sundays 2 AM)

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement no-show risk assessment algorithm: (1) Python training script (server/ml-models/train_noshow_model.py) trains logistic regression model on historical appointments with features: previous_noshow_count, total_appointments, recency, appointment_time, day_of_week, lead_time, age, has_insurance_issue, distance, (2) Model saved to server/ml-models/noshow_model.pkl, (3) Python prediction script (server/ml-models/predict_noshow.py) loads model and returns risk score + factor contributions via JSON, (4) Node.js service (server/src/services/noshow-risk.service.ts) calls Python script via child_process, (5) API endpoint POST /api/risk/calculate-noshow accepts appointmentId, returns {riskScore: 0-100, category: 'low'|'medium'|'high', factors: [{name, contribution}]}, (6) Daily batch job (server/src/workers/risk-assessment-worker.ts) using node-cron calculates risk for all appointments in next 7 days, (7) Trigger extra reminders for high-risk patients via notification service (US-016), (8) Model retraining script runs weekly to incorporate new appointment outcomes.

## Dependent Tasks
- US_038 - TASK_001_DB_NOSHOW_RISK_SCHEMA (database columns must exist)
- US-016 (Notification service for extra reminders)
- US-024 (No-show marking provides training data)

## Impacted Components
- server/ml-models/train_noshow_model.py - New Python training script
- server/ml-models/predict_noshow.py - New Python prediction script
- server/ml-models/noshow_model.pkl - Trained model binary
- server/ml-models/model_metadata.json - Model version, accuracy, training date
- server/src/services/noshow-risk.service.ts - New Node.js service
- server/src/controllers/risk.controller.ts - New API controller
- server/src/routes/risk.routes.ts - New API routes
- server/src/workers/risk-assessment-worker.ts - New daily batch job
- server/src/workers/model-retraining-worker.ts - New weekly retraining job
- server/src/config/ml-config.ts - ML configuration (model path, thresholds)

## Implementation Plan
1. **Python ML Setup**:
   - Install dependencies: `pip install scikit-learn pandas psycopg2-binary`
   - Create server/ml-models/ directory
   - Create requirements.txt with: scikit-learn==1.3.2, pandas==2.1.0, psycopg2-binary==2.9.9
2. **Training Script (train_noshow_model.py)**:
   - Connect to PostgreSQL: psycopg2.connect(DB_CONNECTION_STRING)
   - Query historical appointments (last 12 months): SELECT * FROM appointments WHERE created_at >= NOW() - INTERVAL '12 months' AND status IN ('completed', 'no_show')
   - For each appointment, calculate features:
     - previous_noshow_count: COUNT(*) FROM appointments WHERE patient_id=X AND status='no_show' AND created_at < current_appt_date
     - total_appointments: COUNT(*) FROM appointments WHERE patient_id=X AND created_at < current_appt_date
     - days_since_last_noshow: EXTRACT(DAYS FROM current_appt_date - MAX(appointment_date WHERE status='no_show'))
     - appointment_hour: EXTRACT(HOUR FROM appointment_date)
     - day_of_week: EXTRACT(DOW FROM appointment_date) (0=Sunday)
     - lead_time_days: EXTRACT(DAYS FROM appointment_date - created_at)
     - patient_age: EXTRACT(YEARS FROM current_date - date_of_birth)
     - has_insurance_issue: 1 if insurance_verifications.status IN ('issue', 'auth_required'), else 0
     - distance_km: Calculate from patient_profiles.address if geocoded, else NULL
   - Handle missing values: distance_km NULL → 0, days_since_last_noshow NULL → 365
   - Create target variable: is_noshow = 1 if status='no_show', else 0
   - Split data: train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
   - Train model: LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42).fit(X_train, y_train)
   - Evaluate: accuracy_score, precision_recall_fscore_support, confusion_matrix
   - Assert: accuracy > 0.75 (AIR-S04 requirement)
   - Save model: pickle.dump(model, open('noshow_model.pkl', 'wb'))
   - Save metadata: {version: '1.0', train_date: '2026-03-19', accuracy: 0.78, precision: 0.72, recall: 0.69, n_samples: 5000}
3. **Prediction Script (predict_noshow.py)**:
   - Load model: pickle.load(open('noshow_model.pkl', 'rb'))
   - Read JSON input from stdin: {"features": [3, 15, 45, 14, 5, 7, 42, 1, 5.2]}
   - Predict probability: model.predict_proba([[features]])[0][1] → risk score 0.0-1.0
   - Calculate factor contributions: model.coef_[0] * features → top 3 absolute values
   - Map factor names: ["Previous no-shows +25%", "Weekend appointment +10%", "Insurance issue +15%"]
   - Return JSON: {"risk_score": 52, "category": "high", "factors": [{"name": "...", "contribution": 25}, ...]}
   - Handle errors: Try/catch with JSON error response
4. **Node.js Service (noshow-risk.service.ts)**:
   - Function calculateRiskScore(appointmentId: string): Promise<RiskAssessment>
   - Load appointment data: SELECT * FROM appointments WHERE id=appointmentId JOIN patient_profiles ON patient_id
   - Calculate feature values (same logic as training script)
   - Call Python script: child_process.execFile('python', ['ml-models/predict_noshow.py'], {input: JSON.stringify({features})})
   - Parse stdout JSON: {risk_score, category, factors}
   - Update database: UPDATE appointments SET no_show_risk_score=X, risk_category=Y, risk_calculated_at=NOW(), risk_factors=factors WHERE id=appointmentId
   - Return RiskAssessment object
   - Handle edge cases:
     - New patient (total_appointments=0): Set risk_score=15, category='low', factors=[{name: "New Patient - Baseline Risk", contribution: 15}]
     - Perfect attendance (previous_noshow_count=0 AND total_appointments>10): Set minimum risk_score=5, add factor "Reliable Patient"
5. **API Controller (risk.controller.ts)**:
   - POST /api/risk/calculate-noshow: Accepts {appointmentId}, calls noshowRiskService.calculateRiskScore(), returns risk data
   - GET /api/risk/appointment/:appointmentId: Returns current risk data from appointments table
   - GET /api/risk/high-risk-patients: Returns list of appointments with risk_category='high' in next 7 days
   - Authorization: require('staff') middleware - only staff can access
6. **API Routes (risk.routes.ts)**:
   - router.post('/calculate-noshow', authMiddleware, staffOnlyMiddleware, riskController.calculateNoshow)
   - router.get('/appointment/:id', authMiddleware, staffOnlyMiddleware, riskController.getAppointmentRisk)
   - router.get('/high-risk-patients', authMiddleware, staffOnlyMiddleware, riskController.getHighRiskPatients)
7. **Daily Batch Job (risk-assessment-worker.ts)**:
   - Use node-cron: cron.schedule('0 2 * * *', async () => {...}) - Runs daily at 2 AM
   - Query upcoming appointments: SELECT * FROM appointments WHERE appointment_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status='confirmed'
   - Filter: Only recalculate if risk_calculated_at IS NULL OR risk_calculated_at < NOW() - INTERVAL '24 hours'
   - For each appointment: Call noshowRiskService.calculateRiskScore(appointmentId)
   - Log progress: console.log(`Calculated risk for ${count} appointments`)
   - Error handling: Try/catch per appointment, continue on failure, log errors
8. **High-Risk Reminder Integration**:
   - In calculateRiskScore(), after updating risk:
     - If risk_category='high': Call notificationService.sendExtraReminder(appointmentId, patientId, {type: 'high_risk'})
     - Extra reminder sends SMS + voice call (instead of just SMS)
9. **Model Retraining Worker (model-retraining-worker.ts)**:
   - Use node-cron: cron.schedule('0 2 * * 0', async () => {...}) - Runs weekly on Sundays at 2 AM
   - Call Python script: child_process.execFile('python', ['ml-models/train_noshow_model.py'])
   - Parse stdout for accuracy
   - If accuracy >= 0.75: Log success, update model_metadata.json
   - If accuracy < 0.75: Log warning, send alert to admin, DO NOT replace model
10. **Configuration (ml-config.ts)**:
    - Export ML_CONFIG = {modelPath: './ml-models/noshow_model.pkl', pythonPath: 'python', thresholds: {low: 20, high: 50}, features: [...], defaultRisk: {newPatient: 15, minRisk: 5}}

## Current Project State
```
server/
├── ml-models/ (to be created)
│   ├── train_noshow_model.py (to be created)
│   ├── predict_noshow.py (to be created)
│   ├── noshow_model.pkl (generated by training)
│   ├── model_metadata.json (generated by training)
│   └── requirements.txt (to be created)
├── src/
│   ├── config/
│   │   └── ml-config.ts (to be created)
│   ├── services/
│   │   ├── notification.service.ts (exists from US-016)
│   │   └── noshow-risk.service.ts (to be created)
│   ├── controllers/
│   │   └── risk.controller.ts (to be created)
│   ├── routes/
│   │   └── risk.routes.ts (to be created)
│   ├── workers/
│   │   ├── risk-assessment-worker.ts (to be created)
│   │   └── model-retraining-worker.ts (to be created)
│   └── app.ts (update to register risk routes)
└── package.json (add node-cron dependency)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/ml-models/train_noshow_model.py | Python script to train logistic regression model on historical appointments |
| CREATE | server/ml-models/predict_noshow.py | Python script to predict no-show risk from features JSON |
| CREATE | server/ml-models/requirements.txt | Python dependencies: scikit-learn, pandas, psycopg2-binary |
| CREATE | server/src/config/ml-config.ts | ML configuration: model path, thresholds, default risk values |
| CREATE | server/src/services/noshow-risk.service.ts | Node.js service calling Python ML model, calculating risk features |
| CREATE | server/src/controllers/risk.controller.ts | API controller for risk calculation endpoints |
| CREATE | server/src/routes/risk.routes.ts | Express routes for /api/risk/* endpoints |
| CREATE | server/src/workers/risk-assessment-worker.ts | Daily cron job calculating risk for upcoming appointments |
| CREATE | server/src/workers/model-retraining-worker.ts | Weekly cron job retraining ML model |
| CREATE | server/src/types/risk.types.ts | TypeScript interfaces: RiskAssessment, RiskFactor, ModelMetadata |
| MODIFY | server/src/app.ts | Register risk routes: app.use('/api/risk', riskRoutes) |
| MODIFY | server/package.json | Add node-cron@3.x dependency |
| MODIFY | server/src/services/notification.service.ts | Add sendExtraReminder() method for high-risk patients |

## External References
- [scikit-learn LogisticRegression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)
- [Node.js child_process](https://nodejs.org/api/child_process.html)
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)
- [AIR-006 Predictive Analytics](../../../.propel/context/docs/spec.md#AIR-006)
- [AIR-S04 No-Show Prediction Accuracy >75%](../../../.propel/context/docs/spec.md#AIR-S04)

## Build Commands
```bash
# Install Python dependencies
cd server/ml-models
pip install -r requirements.txt

# Train model
python train_noshow_model.py

# Test prediction script
echo '{"features": [3, 15, 45, 14, 5, 7, 42, 1, 5.2]}' | python predict_noshow.py

# Install Node.js dependencies
cd server
npm install

# Start server with workers
npm run dev

# Test risk calculation API
curl -X POST http://localhost:3001/api/risk/calculate-noshow \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "appt-uuid-123"}'

# Manual model retraining
cd server/ml-models
python train_noshow_model.py
```

## Implementation Validation Strategy
- [ ] Python dependencies installed: `pip list | grep scikit-learn`
- [ ] Training script runs: `python train_noshow_model.py` creates noshow_model.pkl
- [ ] Model accuracy >75%: Training script output shows accuracy=0.78 (AIR-S04)
- [ ] Prediction script works: `echo '{...}' | python predict_noshow.py` returns valid JSON
- [ ] Node.js service calls Python: calculateRiskScore() executes without errors
- [ ] Risk score stored: After POST /calculate-noshow, appointments.no_show_risk_score updated
- [ ] Risk categorization correct: Score 15% → 'low', 35% → 'medium', 60% → 'high'
- [ ] Factor contributions returned: Response includes top 3 factors with names and percentages
- [ ] New patient edge case: total_appointments=0 → risk=15%, category='low', factors=["New Patient - Baseline Risk"]
- [ ] Perfect attendance edge case: previous_noshow_count=0 AND total>10 → risk>=5%, factors includes "Reliable Patient"
- [ ] Daily batch job runs: node-cron executes at 2 AM, logs show "Calculated risk for X appointments"
- [ ] High-risk reminder triggered: risk_category='high' → notificationService.sendExtraReminder() called
- [ ] Weekly retraining runs: Cron executes Sundays 2 AM, model_metadata.json updated
- [ ] API authorization enforced: Non-staff users receive 403 Forbidden
- [ ] **[AI Tasks - MANDATORY]** Model accuracy validated: Test set accuracy >75%
- [ ] **[AI Tasks - MANDATORY]** Guardrails validated: Input features sanitized, output risk_score clamped 0-100
- [ ] **[AI Tasks - MANDATORY]** Fallback logic tested: Python script failure → return default risk=15%
- [ ] **[AI Tasks - MANDATORY]** Audit logging: All risk calculations logged with appointmentId, patientId, risk_score (no PII in logs)

## Implementation Checklist
- [ ] Install Python dependencies: `pip install scikit-learn pandas psycopg2-binary`
- [ ] Create server/ml-models/ directory and requirements.txt
- [ ] Write train_noshow_model.py with data loading, feature engineering, LogisticRegression training
- [ ] Implement feature calculation logic: previous_noshow_count, total_appointments, recency, etc.
- [ ] Train model with 80/20 split, assert accuracy >75%
- [ ] Save model to noshow_model.pkl and metadata to model_metadata.json
- [ ] Write predict_noshow.py: Load model, predict probability, calculate factor contributions, return JSON
- [ ] Test prediction script: `echo '{...}' | python predict_noshow.py` → valid JSON
- [ ] Create server/src/config/ml-config.ts with model path, thresholds, default risks
- [ ] Create server/src/types/risk.types.ts with RiskAssessment, RiskFactor interfaces
- [ ] Implement server/src/services/noshow-risk.service.ts with calculateRiskScore() function
- [ ] Add edge case handling: New patient (risk=15%), perfect attendance (min risk=5%)
- [ ] Call Python script via child_process.execFile(), parse JSON stdout
- [ ] Update appointments table with risk_score, risk_category, risk_calculated_at, risk_factors
- [ ] Create server/src/controllers/risk.controller.ts with POST /calculate-noshow, GET /appointment/:id, GET /high-risk-patients
- [ ] Create server/src/routes/risk.routes.ts with authMiddleware, staffOnlyMiddleware
- [ ] Register risk routes in server/src/app.ts: app.use('/api/risk', riskRoutes)
- [ ] Add node-cron dependency: `npm install node-cron @types/node-cron`
- [ ] Create server/src/workers/risk-assessment-worker.ts with daily 2 AM cron job
- [ ] Daily job: Query upcoming appointments (7 days), calculate risk if stale (>24h)
- [ ] Create server/src/workers/model-retraining-worker.ts with weekly Sunday 2 AM cron job
- [ ] Retraining job: Run train_noshow_model.py, validate accuracy, update model
- [ ] Integrate high-risk reminders: In calculateRiskScore(), if risk='high' → notificationService.sendExtraReminder()
- [ ] Update server/src/services/notification.service.ts with sendExtraReminder() method (SMS + voice call)
- [ ] Test API endpoint: POST /api/risk/calculate-noshow with valid appointmentId
- [ ] Verify risk stored: SELECT no_show_risk_score, risk_category FROM appointments WHERE id=X
- [ ] Test risk categorization: Score 15 → 'low', 35 → 'medium', 60 → 'high'
- [ ] Test factor contributions: Response includes top 3 factors with names (e.g., "Weekend appointment +10%")
- [ ] Test new patient case: Create appointment for patient with 0 prior appointments → risk=15%
- [ ] Test perfect attendance: Patient with 20 completed, 0 no-shows → risk=5%, factors includes "Reliable Patient"
- [ ] Test daily batch job: Manually trigger cron, verify risk calculated for upcoming appointments
- [ ] Test weekly retraining: Manually run Python script, verify model_metadata.json updated
- [ ] Validate AIR-S04 requirement: Model accuracy >75% documented in model_metadata.json
- [ ] **[AI Tasks - MANDATORY]** Implement input sanitization: Clamp feature values to valid ranges
- [ ] **[AI Tasks - MANDATORY]** Implement output validation: Clamp risk_score to 0-100
- [ ] **[AI Tasks - MANDATORY]** Implement fallback logic: On Python error, return default risk=15%
- [ ] **[AI Tasks - MANDATORY]** Add audit logging: Log all risk calculations with timestamp, appointmentId, risk_score
- [ ] Document ML model in server/README.md: Features, algorithm, retraining frequency, accuracy
- [ ] Commit all files to version control
