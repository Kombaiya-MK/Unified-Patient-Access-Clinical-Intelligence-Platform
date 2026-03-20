import bcrypt from 'bcrypt';
import logger from './logger';

/**
 * Password Hashing Utilities using bcrypt
 * 
 * Security Features:
 * - 10 salt rounds (2^10 = 1024 iterations)
 * - Automatic salt generation
 * - Timing-attack resistant comparison
 * 
 * OWASP Recommendations:
 * - Use bcrypt for password storage (not plain SHA-256)
 * - Minimum 10 salt rounds for production
 * - Never store plain-text passwords
 */

/**
 * Salt rounds for bcrypt hashing
 * Higher = more secure but slower
 * 10 rounds = ~100ms per hash (recommended minimum)
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password using bcrypt
 * @param plainPassword - The plain-text password to hash
 * @returns Promise<string> - The bcrypt hashed password
 * @throws Error if hashing fails
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  try {
    if (!plainPassword || plainPassword.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    // Generate salt and hash in one operation
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    logger.debug('Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Password hashing failed:', errorMessage);
    throw new Error(`Failed to hash password: ${errorMessage}`);
  }
};

/**
 * Compare a plain-text password with a bcrypt hash
 * Uses constant-time comparison to prevent timing attacks
 * @param plainPassword - The plain-text password to verify
 * @param hashedPassword - The bcrypt hashed password from database
 * @returns Promise<boolean> - true if passwords match, false otherwise
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    if (!plainPassword || !hashedPassword) {
      logger.warn('Password comparison called with empty values');
      return false;
    }

    // bcrypt.compare uses constant-time comparison internally
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    if (isMatch) {
      logger.debug('Password comparison: match found');
    } else {
      logger.debug('Password comparison: no match');
    }

    return isMatch;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Password comparison failed:', errorMessage);
    // Return false on error to prevent authentication bypass
    return false;
  }
};

/**
 * Validate password strength
 * Enforces minimum security requirements
 * @param password - The password to validate
 * @returns { valid: boolean, errors: string[] }
 */
export const validatePasswordStrength = (
  password: string,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Maximum length check (bcrypt has 72 character limit)
  if (password.length > 72) {
    errors.push('Password must be less than 72 characters');
  }

  // Complexity checks (at least one of each)
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common password check (basic list)
  const commonPasswords = [
    'password',
    'password123',
    '12345678',
    'qwerty',
    'abc123',
    'letmein',
  ];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
};
