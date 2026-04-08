/**
 * User Management Service
 * 
 * Business logic for admin user CRUD operations.
 * Handles user listing, creation, updating, deactivation,
 * and department lookups with audit logging.
 * 
 * @module userManagementService
 * @task US_035 TASK_001
 */

import crypto from 'crypto';
import { pool } from '../config/database';
import { hashPassword } from '../utils/passwordHash';
import { logAuditEntry } from '../utils/auditLogger';
import { AuditAction } from '../types/audit.types';
import { ApiError } from '../types';
import logger from '../utils/logger';
import redisClient from '../utils/redisClient';

/** Allowed sort columns to prevent SQL injection */
const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  email: 'u.email',
  role: 'u.role',
  last_login_at: 'u.last_login_at',
  created_at: 'u.created_at',
  first_name: 'u.first_name',
  last_name: 'u.last_name',
};

export interface GetAllUsersParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  role?: string;
  status?: string;
  search?: string;
}

/**
 * Get paginated list of users with optional filtering and sorting
 */
export async function getAllUsers(params: GetAllUsersParams) {
  const { page, limit, sortBy, sortOrder, role, status, search } = params;
  const offset = (page - 1) * limit;

  const sortColumn = ALLOWED_SORT_COLUMNS[sortBy] || 'u.created_at';
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const values: (string | boolean | number)[] = [];
  let paramIndex = 1;

  if (role) {
    conditions.push(`u.role = $${paramIndex++}`);
    values.push(role);
  }

  if (status === 'active') {
    conditions.push(`u.is_active = $${paramIndex++}`);
    values.push(true);
  } else if (status === 'inactive') {
    conditions.push(`u.is_active = $${paramIndex++}`);
    values.push(false);
  }

  if (search) {
    conditions.push(`(u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
    values.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataQuery = `
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone_number,
           u.is_active, u.last_login_at, u.created_at, u.department_id,
           d.name AS department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ${whereClause}
    ORDER BY ${sortColumn} ${direction}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  values.push(limit, offset);

  const result = await pool.query(dataQuery, values);

  return {
    users: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create a new user account
 * - Validates email uniqueness
 * - Hashes password with bcrypt
 * - Generates email verification token
 * - Logs to audit trail
 */
export async function createUser(
  data: {
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    department_id?: number;
  },
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  // Check email uniqueness
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [data.email],
  );

  if (existingUser.rows.length > 0) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Determine department_id
  const departmentId = data.role === 'patient' ? (data.department_id || null) : null;

  // Insert user
  const insertResult = await pool.query(
    `INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number,
                        department_id, is_active, is_verified, verification_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, FALSE, $8)
     RETURNING id, email, role, first_name, last_name`,
    [
      data.email,
      passwordHash,
      data.role,
      data.first_name,
      data.last_name,
      data.phone_number || null,
      departmentId,
      verificationToken,
    ],
  );

  const newUser = insertResult.rows[0];

  // Audit log
  await logAuditEntry({
    user_id: adminId,
    action: AuditAction.CREATE,
    table_name: 'users',
    record_id: String(newUser.id),
    old_values: null,
    new_values: { email: data.email, role: data.role, department_id: departmentId },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  // Send verification email (non-blocking)
  sendVerificationEmail(data.email, data.first_name, verificationToken).catch((err) => {
    logger.error('Failed to send verification email', { error: err.message, email: data.email });
  });

  logger.info('User created by admin', { userId: newUser.id, role: data.role, adminId });

  return {
    user_id: newUser.id,
    message: 'User created successfully. Verification email sent.',
  };
}

/**
 * Update an existing user's details
 * - Logs changes to audit trail
 * - Invalidates sessions on role change
 */
export async function updateUser(
  userId: number,
  data: {
    role?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    department_id?: number | null;
  },
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  // Fetch current user for comparison
  const currentResult = await pool.query(
    'SELECT id, email, role, first_name, last_name, phone_number, department_id FROM users WHERE id = $1',
    [userId],
  );

  if (currentResult.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  const currentUser = currentResult.rows[0];

  // Build dynamic UPDATE
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  let paramIndex = 1;

  if (data.role !== undefined) {
    setClauses.push(`role = $${paramIndex++}`);
    values.push(data.role);
  }
  if (data.first_name !== undefined) {
    setClauses.push(`first_name = $${paramIndex++}`);
    values.push(data.first_name);
  }
  if (data.last_name !== undefined) {
    setClauses.push(`last_name = $${paramIndex++}`);
    values.push(data.last_name);
  }
  if (data.phone_number !== undefined) {
    setClauses.push(`phone_number = $${paramIndex++}`);
    values.push(data.phone_number || null);
  }

  // Handle department_id: only set for patient role
  const effectiveRole = data.role || currentUser.role;
  if (effectiveRole === 'patient' && data.department_id !== undefined) {
    setClauses.push(`department_id = $${paramIndex++}`);
    values.push(data.department_id);
  } else if (effectiveRole !== 'patient') {
    setClauses.push(`department_id = $${paramIndex++}`);
    values.push(null);
  }

  setClauses.push(`updated_at = NOW()`);

  const updateQuery = `
    UPDATE users SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, email, role, first_name, last_name, phone_number, is_active, department_id
  `;
  values.push(userId);

  const updateResult = await pool.query(updateQuery, values);
  const updatedUser = updateResult.rows[0];

  // If role changed, invalidate sessions
  const roleChanged = data.role && data.role !== currentUser.role;
  if (roleChanged) {
    await invalidateUserSessions(userId);
    logger.info('User role changed, sessions invalidated', {
      userId,
      oldRole: currentUser.role,
      newRole: data.role,
    });
  }

  // Audit log
  await logAuditEntry({
    user_id: adminId,
    action: AuditAction.UPDATE,
    table_name: 'users',
    record_id: String(userId),
    old_values: {
      role: currentUser.role,
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      department_id: currentUser.department_id,
    },
    new_values: {
      role: updatedUser.role,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      department_id: updatedUser.department_id,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return updatedUser;
}

/**
 * Deactivate a user account (soft delete)
 * - Prevents self-deactivation
 * - Invalidates all sessions
 * - Logs to audit trail
 */
export async function deactivateUser(
  userId: number,
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  // Prevent self-deactivation
  if (userId === adminId) {
    throw new ApiError(403, 'Cannot deactivate your own account');
  }

  // Check user exists
  const userResult = await pool.query('SELECT id, email, is_active FROM users WHERE id = $1', [userId]);

  if (userResult.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  if (!userResult.rows[0].is_active) {
    throw new ApiError(400, 'User is already inactive');
  }

  // Deactivate and invalidate sessions
  await pool.query(
    'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
    [userId],
  );

  await invalidateUserSessions(userId);

  // Audit log
  await logAuditEntry({
    user_id: adminId,
    action: AuditAction.DELETE,
    table_name: 'users',
    record_id: String(userId),
    old_values: { is_active: true },
    new_values: { is_active: false },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info('User deactivated by admin', { userId, adminId });

  return { message: 'User deactivated successfully' };
}

/**
 * Get active departments for dropdown selection
 */
export async function getDepartments() {
  const result = await pool.query(
    'SELECT id, name, code, description FROM departments WHERE is_active = TRUE ORDER BY name ASC',
  );
  return result.rows;
}

/**
 * Invalidate all sessions for a user via Redis
 */
async function invalidateUserSessions(userId: number): Promise<void> {
  try {
    await redisClient.del(`session:${userId}`);
    logger.debug('User session invalidated in Redis', { userId });
  } catch (err) {
    logger.warn('Failed to invalidate sessions in Redis (non-blocking)', {
      userId,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Send verification email using nodemailer
 * Non-blocking; failures are logged but don't affect user creation
 */
async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string,
): Promise<void> {
  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Clinical Platform" <noreply@clinicalplatform.com>',
      to: email,
      subject: 'Verify Your Email - Clinical Appointment Platform',
      html: `
        <h2>Welcome, ${firstName}!</h2>
        <p>Your account has been created. Please verify your email by clicking the link below:</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    logger.info('Verification email sent', { email });
  } catch (error) {
    logger.error('Failed to send verification email', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
