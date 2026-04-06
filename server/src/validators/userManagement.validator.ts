/**
 * User Management Validators
 * 
 * Joi validation schemas for admin user management API endpoints.
 * Validates request bodies for create, update, and query operations.
 * 
 * @module userManagement.validator
 * @task US_035 TASK_001
 */

import Joi from 'joi';

/**
 * Password complexity regex
 * Requires: min 8 chars, 1 uppercase, 1 number, 1 special char
 * OWASP compliant password policy
 */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validation schema for creating a new user
 * 
 * Required: email, password, role, first_name, last_name
 * Conditional: department_id required when role = 'patient'
 * Optional: phone_number
 */
export const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'A valid email address is required',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .min(8)
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 number, and 1 special character (@$!%*?&)',
      'any.required': 'Password is required',
    }),

  role: Joi.string()
    .valid('patient', 'doctor', 'staff', 'admin')
    .required()
    .messages({
      'any.only': 'Role must be one of: patient, doctor, staff, admin',
      'any.required': 'Role is required',
    }),

  first_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'First name is required',
      'any.required': 'First name is required',
    }),

  last_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'any.required': 'Last name is required',
    }),

  phone_number: Joi.string()
    .max(20)
    .optional()
    .allow('', null),

  department_id: Joi.number()
    .integer()
    .positive()
    .when('role', {
      is: 'patient',
      then: Joi.required().messages({
        'any.required': 'Department is required for Patient role',
      }),
      otherwise: Joi.optional().allow(null),
    }),
});

/**
 * Validation schema for updating a user
 * All fields optional; at least one must be provided
 */
export const updateUserSchema = Joi.object({
  role: Joi.string()
    .valid('patient', 'doctor', 'staff', 'admin')
    .optional()
    .messages({
      'any.only': 'Role must be one of: patient, doctor, staff, admin',
    }),

  first_name: Joi.string()
    .min(1)
    .max(100)
    .optional(),

  last_name: Joi.string()
    .min(1)
    .max(100)
    .optional(),

  phone_number: Joi.string()
    .max(20)
    .optional()
    .allow('', null),

  department_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validation schema for user list query parameters
 */
export const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('email', 'role', 'last_login_at', 'created_at', 'first_name', 'last_name')
    .default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  role: Joi.string().valid('patient', 'doctor', 'staff', 'admin').optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  search: Joi.string().max(100).optional().allow(''),
});
