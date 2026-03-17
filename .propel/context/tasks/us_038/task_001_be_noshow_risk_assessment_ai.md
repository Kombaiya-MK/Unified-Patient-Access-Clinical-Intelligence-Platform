# Task - TASK_001_BE_NOSHOW_RISK_ASSESSMENT_AI

## Requirement Reference
- User Story: US_038
- Story Location: `.propel/context/tasks/us_038/us_038.md`
- Acceptance Criteria:
    - AC1: Calculate no-show risk score (0-100%) using logistic regression model based on patient history (no-shows/total, recency), appointment characteristics (time, day, lead time), demographics (age, distance), insurance status (+15% if issue), achieve >75% prediction accuracy (AIR-S04), classify as Low (<20%), Medium (20-50%), High (>50%), display risk badge in staff queue, show contributing factors breakdown, trigger extra reminders for high-risk
- Edge Cases:
    - New patients: Use population average risk ~15%, mark "New Patient - Baseline Risk"
    - Perfect attendance: Risk floors at 5%, "Reliable Patient" tag
    - External factors: Not in scope, show "Historical factors only" note

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Risk badges in queue + patient profile) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-009 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-staff-queue-management.html |
| **Screen Spec** | SCR-009 (Staff Queue with risk badges), SCR-011 (Patient Profile risk panel) |
| **UXR Requirements** | AIR-S04 (>75% prediction accuracy), UXR-503 (Risk indicators with severity colors), UXR-202 (Data-driven insights) |
| **Design Tokens** | Risk badges: Low green ●, Medium yellow ●●, High red ●●●, Popover: white card 300px shadow, Risk score: bold 24pt |

> **Wireframe Components:**
> - SCR-009 Staff Queue: Risk badge next to patient name, click opens popover
> - Risk popover: Numeric score (e.g., "52%"), top 3 contributing factors with icons, "Send Extra Reminder" button
> - SCR-011 Patient Profile: Appointment History panel with Risk Score column, trend graph (line chart 12 months), attendance summary (X no-shows / Y total = Z% no-show rate)
> - Admin analytics: Dashboard with risk distribution, predicted vs actual for model accuracy

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | Python | 3.11 (for ML model) |
| Backend | scikit-learn | 1.3.x (Logistic regression) |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | scikit-learn | LogisticRegression |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes |
| **AIR Requirements** | AIR-006 (Predictive analytics for no-shows), AIR-S04 (No-show prediction >75% accuracy) |
| **AI Pattern** | Logistic regression with historical data |
| **Prompt Template Path** | N/A (ML model, not LLM) |
| **Guardrails Config** | .propel/context/ml-models/noshow-risk-config.json (feature weights, thresholds) |
| **Model Provider** | scikit-learn LogisticRegression |

> **ML Model Details:**
> - Algorithm: Logistic Regression (scikit-learn)
> - Features: previous_noshow_count, total_appointments, days_since_last_noshow, appointment_hour, day_of_week (Mon=0), lead_time_days, patient_age, has_insurance_issue (binary), distance_km (if available)
> - Training: Historical appointments data (status='No Show' vs 'Completed')
> - Evaluation: 80/20 train-test split, cross-validation, precision/recall/F1 >0.75
> - Output: Probability 0.0-1.0 → convert to 0-100% risk score
> - Model persistence: Pickle file saved in server/ml-models/noshow_model.pkl
> - Retraining: Monthly batch job to update weights

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive badges) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement no-show risk assessment: (1) Python script trains logistic regression model on historical appointments data (no_shows vs completed), (2) Model uses features: previous_noshow_count, total_appointments, recency, appointment_time, day_of_week, lead_time, age, insurance_issue, (3) Save trained model to server/ml-models/noshow_model.pkl, (4) Node.js service loads model via child_process calling Python script: predict_noshow.py, (5) POST /api/risk/calculate-noshow accepts appointmentId, returns {riskScore: 0-100, category: 'low'|'medium'|'high', factors: [{factor, contribution}]}, (6) Triggered at appointment creation + daily batch job for all upcoming appointments, (7) Store risk in appointments.no_show_risk_score column, (8) Frontend NoShowRiskBadge displays color-coded indicator (green <20%, yellow 20-50%, red >50%), (9) Popover shows breakdown of contributing factors, (10) High-risk (>50%) triggers extra reminder via US_016.

## Dependent Tasks
- US_024 Task 001: No-show marking (provides training data)
- US_016 Task 001: Automated reminders (high-risk patients get extra reminders)
- US_037: Insurance verification status (risk factor)

## Impacted Components
**New:**
- server/ml-models/train_noshow_model.py (Model training script)
- server/ml-models/predict_noshow.py (Prediction script)
- server/ml-models/noshow_model.pkl (Trained model file)
- server/src/services/noshow-risk.service.ts (Risk calculation service)
- server/src/controllers/risk.controller.ts (Risk endpoints)
- server/src/routes/risk.routes.ts (POST /risk/calculate-noshow)
- server/src/jobs/risk-assessment-worker.ts (Daily batch job)
- app/src/components/NoShowRiskBadge.tsx (Risk badge + popover)
- app/src/components/RiskFactorsPopover.tsx (Factor breakdown)

**Modified:**
- server/db/schema.sql (Add no_show_risk_score, risk_category to appointments)

## Implementation Plan
1. Add columns: ALTER TABLE appointments ADD COLUMN no_show_risk_score INTEGER, ADD COLUMN risk_category VARCHAR(10)
2. Python training script (train_noshow_model.py):
   - Load historical appointments: SELECT * FROM appointments WHERE created_at < NOW() - INTERVAL '30 days'
   - Features: [noshow_count, total_appts, days_since_last_noshow, hour, day_of_week, lead_time, age, has_insurance_issue]
   - Target: (status='No Show') → 1, else 0
   - Train LogisticRegression(class_weight='balanced')
   - Evaluate: accuracy_score, classification_report
   - Save model: pickle.dump(model, 'noshow_model.pkl')
3. Prediction script (predict_noshow.py): Loads model, accepts JSON features via stdin, returns JSON {risk_score, factors_contribution}
4. Node.js service (noshow-risk.service.ts):
   - calculateRisk(appointmentId): Load appointment data, extract features, call Python script via child_process.spawn('python', ['predict_noshow.py']), parse JSON output
   - Categorize: <20% → 'low', 20-50% → 'medium', >50% → 'high'
   - Factor contributions: Return top 3 factors by weight from model coefficients
5. POST /api/risk/calculate-noshow: verifyToken, requireRole('staff'), calculateRisk, UPDATE appointments SET risk_score=$1, risk_category=$2
6. Daily batch job: SELECT appointments WHERE appointment_datetime BETWEEN NOW() AND NOW()+INTERVAL '7 days' AND risk_score IS NULL, calculate risk for each, update database
7. Trigger at appointment creation: After booking, call calculateRisk in background
8. Frontend: NoShowRiskBadge with color (green/yellow/red), click opens RiskFactorsPopover
9. Popover: Shows risk %, top 3 factors (e.g., "📅 Weekend appointment +10%"), "Send Extra Reminder" button
10. High-risk trigger: If risk >50%, call POST /api/reminders/send-extra-reminder (from US_016)

## Current Project State
```
ASSIGNMENT/
├── server/src/ (admin services exist)
├── server/ml-models/ (to be created)
└── (risk assessment to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/ml-models/train_noshow_model.py | Model training |
| CREATE | server/ml-models/predict_noshow.py | Prediction script |
| CREATE | server/ml-models/noshow_model.pkl | Trained model (generated) |
| CREATE | server/ml-models/noshow-risk-config.json | Feature config |
| CREATE | server/src/services/noshow-risk.service.ts | Risk calculation |
| CREATE | server/src/controllers/risk.controller.ts | Risk handlers |
| CREATE | server/src/routes/risk.routes.ts | Risk endpoints |
| CREATE | server/src/jobs/risk-assessment-worker.ts | Batch job |
| CREATE | app/src/components/NoShowRiskBadge.tsx | Risk badge |
| CREATE | app/src/components/RiskFactorsPopover.tsx | Factors popover |
| UPDATE | server/db/schema.sql | Add risk_score, risk_category columns |

## External References
- [scikit-learn LogisticRegression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)
- [AIR-006 Predictive Analytics](../../../.propel/context/docs/spec.md#AIR-006)
- [AIR-S04 No-Show Prediction >75%](../../../.propel/context/docs/spec.md#AIR-S04)

## Build Commands
```bash
# Install Python dependencies
pip install scikit-learn pandas psycopg2-binary

# Train model
cd server/ml-models
python train_noshow_model.py

# Start server
cd server
npm run dev

# Test risk calculation
curl -X POST http://localhost:3001/api/risk/calculate-noshow \
  -H "Authorization: Bearer <staff-token>" \
  -d '{"appointmentId": "appt-uuid"}' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: predictNoshow returns score 0.0-1.0
- [ ] Integration tests: POST /risk/calculate-noshow updates risk_score
- [ ] Python dependencies installed: pip list shows scikit-learn
- [ ] Training script runs: python train_noshow_model.py → noshow_model.pkl created
- [ ] Model accuracy: Test set accuracy >75% (AIR-S04)
- [ ] risk_score column exists: \d appointments shows column
- [ ] Risk calculation: POST /calculate-noshow → returns {riskScore: 52, category: 'high', factors: [...]}
- [ ] Risk categorization: Score 15% → category='low', 35% → 'medium', 60% → 'high'
- [ ] Factor contributions: Response includes top 3 factors (e.g., "2 no-shows in 3 months +25%")
- [ ] Batch job runs: Daily cron calculates risk for upcoming appointments
- [ ] Trigger at booking: Create appointment → risk calculated automatically
- [ ] Frontend badge: Staff queue shows green/yellow/red badge next to patient name
- [ ] Popover: Click badge → shows risk % + factors breakdown
- [ ] Extra reminder: Risk >50% → extra SMS/voice call triggered (US_016 integration)
- [ ] New patient baseline: Patient with no history → risk =15%, "New Patient - Baseline Risk"
- [ ] Perfect attendance: 0 no-shows in 20 appointments → risk =5%, "Reliable Patient" tag

## Implementation Checklist
- [ ] Install Python dependencies: `pip install scikit-learn pandas psycopg2-binary`
- [ ] Create server/ml-models/ directory
- [ ] Write train_noshow_model.py with LogisticRegression
- [ ] Write predict_noshow.py prediction script
- [ ] Train model with historical data, save noshow_model.pkl
- [ ] Validate model accuracy >75%
- [ ] Implement noshow-risk.service.ts with child_process
- [ ] Create risk.controller.ts + risk.routes.ts
- [ ] Create risk-assessment-worker.ts batch job with node-cron
- [ ] Add risk_score, risk_category columns to appointments
- [ ] Create NoShowRiskBadge.tsx + RiskFactorsPopover.tsx
- [ ] Integrate risk calculation at appointment creation
- [ ] Test risk assessment flow
- [ ] Document risk model in server/README.md
