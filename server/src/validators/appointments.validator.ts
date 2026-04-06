/**
 * Appointment Validators
 * 
 * Joi validation schemas for appointment booking API endpoints.
 * Validates request bodies to ensure data integrity and security.
 * 
 * @module appointments.validator
 * @created 2026-03-18
 * @task US_013 TASK_002
 */

import Joi from 'joi';

/**
 * Validation schema for booking an appointment
 * 
 * Required: slotId (UUID)
 * Optional: notes (max 500 characters)
 */
export const bookAppointmentSchema = Joi.object({
  slotId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Slot ID must be a valid UUID',
      'any.required': 'Slot ID is required',
    }),
  
  notes: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Notes cannot exceed 500 characters',
    }),
});

/**
 * Validation schema for joining waitlist
 * 
 * Required: preferredDate, departmentId
 * Optional: slotId, providerId, notes
 */
export const joinWaitlistSchema = Joi.object({
  slotId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .optional()
    .messages({
      'string.guid': 'Slot ID must be a valid UUID',
    }),
  
  preferredDate: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Preferred date must be a valid date',
      'date.format': 'Preferred date must be in ISO 8601 format (YYYY-MM-DD)',
      'date.min': 'Preferred date cannot be in the past',
      'any.required': 'Preferred date is required',
    }),
  
  departmentId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Department ID must be a valid UUID',
      'any.required': 'Department ID is required',
    }),
  
  providerId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .optional()
    .messages({
      'string.guid': 'Provider ID must be a valid UUID',
    }),
  
  notes: Joi.string()
    .max(1000)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters',
    }),
});

/**
 * Validation schema for query parameters when fetching slots
 * 
 * All parameters optional
 */
export const getSlotsQuerySchema = Joi.object({
  departmentId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .optional()
    .messages({
      'string.guid': 'Department ID must be a valid UUID',
    }),
  
  providerId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .optional()
    .messages({
      'string.guid': 'Provider ID must be a valid UUID',
    }),
  
  date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Date must be a valid date',
      'date.format': 'Date must be in ISO 8601 format (YYYY-MM-DD)',
    }),
  
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO 8601 format (YYYY-MM-DD)',
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO 8601 format (YYYY-MM-DD)',
      'date.min': 'End date must be after start date',
    }),
});

/**
 * Validation schema for canceling an appointment
 */
export const cancelAppointmentSchema = Joi.object({
  appointmentId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Appointment ID must be a valid UUID',
      'any.required': 'Appointment ID is required',
    }),
  
  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Cancellation reason cannot exceed 500 characters',
    }),
});

/**
 * Validation schema for rescheduling an appointment
 * 
 * Required: newSlotId (UUID)
 * Optional: syncCalendar (boolean), calendarProvider (enum)
 * 
 * Business Rules:
 * - New slot must be different from current slot (validated in service)
 * - Slot must be available (validated in service)
 * - Cannot reschedule within 2 hours (validated in service)
 * - Max 3 reschedules per appointment (validated in service)
 * 
 * @task US_014 TASK_002
 */
export const rescheduleAppointmentSchema = Joi.object({
  newSlotId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'New slot ID must be a valid UUID',
      'any.required': 'New slot ID is required',
    }),
  
  syncCalendar: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'Sync calendar must be a boolean value',
    }),
  
  calendarProvider: Joi.string()
    .valid('google', 'outlook')
    .optional()
    .messages({
      'any.only': 'Calendar provider must be either "google" or "outlook"',
    }),
});

/**
 * Middleware to validate request body against a schema
 * 
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: Joi.ValidationErrorItem) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace request body with validated value (strips unknown fields)
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate query parameters against a schema
 * 
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: Joi.ValidationErrorItem) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace query with validated value (Express 5: req.query is a getter, so shadow it)
    Object.defineProperty(req, 'query', { value, writable: true, configurable: true });
    next();
  };
};
