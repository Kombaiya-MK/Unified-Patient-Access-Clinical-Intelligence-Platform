/**
 * ML Configuration
 *
 * Configuration for the no-show risk prediction model.
 *
 * @module ml-config
 * @task US_038 TASK_002
 */

export const mlConfig = {
  thresholds: {
    low: 20,   // < 20% = low risk
    high: 50,  // > 50% = high risk, 20-50% = medium
  },
  defaults: {
    newPatientRisk: 15,  // Baseline risk for new patients
    minRisk: 5,          // Minimum risk floor for perfect attendance
  },
  weights: {
    previousNoshowRate: 40,
    recency: 15,
    dayOfWeek: 10,
    timeOfDay: 5,
    leadTime: 10,
    insuranceIssue: 15,
    age: 5,
  },
};
