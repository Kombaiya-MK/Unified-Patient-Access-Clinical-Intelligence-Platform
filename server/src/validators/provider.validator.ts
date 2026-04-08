/**
 * Provider Management Validators
 *
 * Joi validation schemas for admin provider management API endpoints.
 *
 * @module provider.validator
 * @task US_036 TASK_003
 */

import Joi from 'joi';

const TIME_REGEX = /^\d{2}:\d{2}$/;

export const createProviderSchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    'any.required': 'User ID is required',
  }),
  specialty: Joi.string().max(100).required().messages({
    'any.required': 'Specialty is required',
  }),
  license_number: Joi.string().max(50).optional().allow('', null),
  department_assignments: Joi.array()
    .items(
      Joi.object({
        department_id: Joi.number().integer().positive().required(),
        primary_department: Joi.boolean().required(),
      }),
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one department assignment is required',
      'any.required': 'Department assignments are required',
    }),
  weekly_schedule: Joi.array()
    .items(
      Joi.object({
        day_of_week: Joi.number().integer().min(0).max(6).required(),
        start_time: Joi.string().pattern(TIME_REGEX).required().messages({
          'string.pattern.base': 'Start time must be in HH:MM format',
        }),
        end_time: Joi.string().pattern(TIME_REGEX).required().messages({
          'string.pattern.base': 'End time must be in HH:MM format',
        }),
      }),
    )
    .optional()
    .default([]),
});

export const updateProviderSchema = Joi.object({
  specialty: Joi.string().max(100).optional(),
  license_number: Joi.string().max(50).optional().allow('', null),
  department_assignments: Joi.array()
    .items(
      Joi.object({
        department_id: Joi.number().integer().positive().required(),
        primary_department: Joi.boolean().required(),
      }),
    )
    .min(1)
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const scheduleEntrySchema = Joi.object({
  day_of_week: Joi.number().integer().min(0).max(6).required(),
  start_time: Joi.string().pattern(TIME_REGEX).required(),
  end_time: Joi.string().pattern(TIME_REGEX).required(),
  is_available: Joi.boolean().optional().default(true),
});

export const updateScheduleSchema = Joi.object({
  schedule: Joi.array().items(scheduleEntrySchema).required(),
});

export const blockedTimeSchema = Joi.object({
  blocked_date: Joi.date().iso().required().messages({
    'any.required': 'Blocked date is required',
  }),
  start_time: Joi.string().pattern(TIME_REGEX).required().messages({
    'string.pattern.base': 'Start time must be in HH:MM format',
  }),
  end_time: Joi.string().pattern(TIME_REGEX).required().messages({
    'string.pattern.base': 'End time must be in HH:MM format',
  }),
  reason: Joi.string().max(500).required().messages({
    'any.required': 'Reason is required',
  }),
});

export const listProvidersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  department_id: Joi.number().integer().positive().optional(),
  specialty: Joi.string().max(100).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});
