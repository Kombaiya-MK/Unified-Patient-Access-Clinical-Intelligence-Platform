/**
 * Department Management Validators
 *
 * Joi validation schemas for admin department management API endpoints.
 *
 * @module department.validator
 * @task US_036 TASK_002
 */

import Joi from 'joi';

const TIME_REGEX = /^\d{2}:\d{2}$/;

const dayHoursSchema = Joi.object({
  open: Joi.string().pattern(TIME_REGEX).required().messages({
    'string.pattern.base': 'Open time must be in HH:MM format',
  }),
  close: Joi.string().pattern(TIME_REGEX).required().messages({
    'string.pattern.base': 'Close time must be in HH:MM format',
  }),
  is_open: Joi.boolean().required(),
});

const operatingHoursSchema = Joi.object({
  monday: dayHoursSchema.required(),
  tuesday: dayHoursSchema.required(),
  wednesday: dayHoursSchema.required(),
  thursday: dayHoursSchema.required(),
  friday: dayHoursSchema.required(),
  saturday: dayHoursSchema.required(),
  sunday: dayHoursSchema.required(),
}).custom((value, helpers) => {
  const days = Object.keys(value);
  for (const day of days) {
    const { open, close, is_open } = value[day];
    if (is_open && open >= close) {
      return helpers.error('any.custom', {
        message: `${day}: open time must be before close time`,
      });
    }
  }
  return value;
});

export const createDepartmentSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Department name is required',
    'any.required': 'Department name is required',
  }),
  code: Joi.string().min(1).max(20).uppercase().required().messages({
    'string.min': 'Department code is required',
    'any.required': 'Department code is required',
  }),
  description: Joi.string().max(500).optional().allow('', null),
  operating_hours: operatingHoursSchema.optional(),
  location: Joi.string().max(200).optional().allow('', null),
  phone_number: Joi.string().max(20).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  code: Joi.string().min(1).max(20).uppercase().optional(),
  description: Joi.string().max(500).optional().allow('', null),
  operating_hours: operatingHoursSchema.optional(),
  location: Joi.string().max(200).optional().allow('', null),
  phone_number: Joi.string().max(20).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const listDepartmentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('active', 'inactive').optional(),
});
