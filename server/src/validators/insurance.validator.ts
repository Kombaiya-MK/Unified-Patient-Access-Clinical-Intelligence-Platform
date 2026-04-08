/**
 * Insurance Verification Validator
 *
 * Joi schemas for insurance verification endpoints.
 *
 * @module insurance.validator
 * @task US_037 TASK_002
 */

import Joi from 'joi';

export const manualVerifySchema = Joi.object({
  appointmentId: Joi.number().integer().positive().required(),
});

export const getVerificationSchema = Joi.object({
  patientId: Joi.number().integer().positive().required(),
});

export const getVerificationHistorySchema = Joi.object({
  patientId: Joi.number().integer().positive().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
