import redisClientManager from './redisClient';
import logger from './logger';
import { pool } from '../config/database';
import { BruteForceRecord, DistributedAttackDetection } from '../types/rateLimiter.types';

/**
 * Brute Force Detection Utility
 * 
 * Features:
 * - Track failed login attempts by email address
 * - Detect distributed attacks (same email, multiple IPs)
 * - Account lockout after threshold
 * - Audit logging for security events
 * 
 * Redis Keys:
 * - failed_login:email:{email} - Failed attempt counter
 * - failed_login:ips:{email} - Set of IPs that failed for this email
 * 
 * Thresholds:
 * - 10 failed attempts = account locked for 1 hour
 * - 3+ unique IPs = distributed attack alert
 */

/**
 * TTL for email-based failed login tracking (1 hour = 3600 seconds)
 */
const EMAIL_FAILED_LOGIN_TTL = 3600;

/**
 * Account lockout threshold (failed attempts)
 */
const ACCOUNT_LOCKOUT_THRESHOLD = 10;

/**
 * Distributed attack threshold (unique IPs)
 */
const DISTRIBUTED_ATTACK_THRESHOLD = 3;

/**
 * Track a failed login attempt
 * Increments counter and adds IP to set
 * @param email - Email address attempted
 * @param ip - IP address making the attempt
 * @returns Updated failed attempts count
 */
export const trackFailedLogin = async (
  email: string,
  ip: string,
): Promise<number> => {
  try {
    if (!redisClientManager.isAvailable) {
      logger.warn('Redis unavailable - cannot track failed login');
      return 0;
    }

    const emailKey = `failed_login:email:${email}`;
    const ipSetKey = `failed_login:ips:${email}`;

    // Get current count
    const currentCountStr = await redisClientManager.get(emailKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    const newCount = currentCount + 1;

    // Increment email-based counter
    await redisClientManager.set(emailKey, String(newCount), {
      ttl: EMAIL_FAILED_LOGIN_TTL,
      namespace: '',
    });

    // Add IP to set (Redis SET to store unique IPs)
    // Note: Since we're using a simplified Redis client, we'll store as comma-separated string
    const currentIPs = await redisClientManager.get(ipSetKey);
    let ipSet: Set<string>;

    if (currentIPs) {
      ipSet = new Set(currentIPs.split(','));
    } else {
      ipSet = new Set();
    }

    ipSet.add(ip);

    await redisClientManager.set(ipSetKey, Array.from(ipSet).join(','), {
      ttl: EMAIL_FAILED_LOGIN_TTL,
      namespace: '',
    });

    logger.info('Failed login tracked', {
      email,
      ip,
      attempts: newCount,
      uniqueIPs: ipSet.size,
    });

    // Check for distributed attack
    if (ipSet.size >= DISTRIBUTED_ATTACK_THRESHOLD) {
      await logDistributedAttack(email, Array.from(ipSet), newCount);
    }

    // Check for account lockout
    if (newCount >= ACCOUNT_LOCKOUT_THRESHOLD) {
      await logAccountLockout(email, newCount);
    }

    return newCount;
  } catch (error) {
    logger.error('Error tracking failed login', { email, ip, error });
    return 0;
  }
};

/**
 * Check if an account is locked due to too many failed attempts
 * @param email - Email address to check
 * @returns true if account is locked, false otherwise
 */
export const checkAccountLocked = async (email: string): Promise<boolean> => {
  try {
    if (!redisClientManager.isAvailable) {
      return false;
    }

    const emailKey = `failed_login:email:${email}`;
    const attemptsStr = await redisClientManager.get(emailKey);

    if (!attemptsStr) {
      return false;
    }

    const attempts = parseInt(attemptsStr, 10);
    return attempts >= ACCOUNT_LOCKOUT_THRESHOLD;
  } catch (error) {
    logger.error('Error checking account locked', { email, error });
    return false;
  }
};

/**
 * Get failed login count for an email
 * @param email - Email address
 * @returns Number of failed attempts
 */
export const getFailedLoginCount = async (email: string): Promise<number> => {
  try {
    if (!redisClientManager.isAvailable) {
      return 0;
    }

    const emailKey = `failed_login:email:${email}`;
    const attemptsStr = await redisClientManager.get(emailKey);

    return attemptsStr ? parseInt(attemptsStr, 10) : 0;
  } catch (error) {
    logger.error('Error getting failed login count', { email, error });
    return 0;
  }
};

/**
 * Reset failed login tracking for an email
 * Called on successful login
 * @param email - Email address to reset
 */
export const resetFailedLogins = async (email: string): Promise<void> => {
  try {
    if (!redisClientManager.isAvailable) {
      return;
    }

    const emailKey = `failed_login:email:${email}`;
    const ipSetKey = `failed_login:ips:${email}`;

    await redisClientManager.del(emailKey);
    await redisClientManager.del(ipSetKey);

    logger.info('Failed logins reset', { email });
  } catch (error) {
    logger.error('Error resetting failed logins', { email, error });
  }
};

/**
 * Get distributed attack detection information
 * @param email - Email address to check
 * @returns Attack detection result
 */
export const getDistributedAttackInfo = async (
  email: string,
): Promise<DistributedAttackDetection> => {
  try {
    if (!redisClientManager.isAvailable) {
      return {
        email,
        uniqueIPs: 0,
        totalAttempts: 0,
        timeWindow: '1 hour',
        isDistributed: false,
        ipAddresses: [],
      };
    }

    const emailKey = `failed_login:email:${email}`;
    const ipSetKey = `failed_login:ips:${email}`;

    const attemptsStr = await redisClientManager.get(emailKey);
    const ipsStr = await redisClientManager.get(ipSetKey);

    const totalAttempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    const ipAddresses = ipsStr ? ipsStr.split(',') : [];
    const uniqueIPs = ipAddresses.length;

    return {
      email,
      uniqueIPs,
      totalAttempts,
      timeWindow: '1 hour',
      isDistributed: uniqueIPs >= DISTRIBUTED_ATTACK_THRESHOLD,
      ipAddresses,
    };
  } catch (error) {
    logger.error('Error getting distributed attack info', { email, error });
    return {
      email,
      uniqueIPs: 0,
      totalAttempts: 0,
      timeWindow: '1 hour',
      isDistributed: false,
      ipAddresses: [],
    };
  }
};

/**
 * Log distributed attack to audit logs
 * @param email - Email being targeted
 * @param ips - List of attacking IPs
 * @param attempts - Total failed attempts
 */
const logDistributedAttack = async (
  email: string,
  ips: string[],
  attempts: number,
): Promise<void> => {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_id,
        action,
        ip_address,
        user_agent,
        table_name,
        record_id,
        old_values,
        new_values,
        created_at
      ) VALUES (
        NULL,
        'DISTRIBUTED_ATTACK',
        $1,
        'System',
        'users',
        NULL,
        NULL,
        $2,
        NOW()
      )
    `;

    const metadata = {
      email,
      uniqueIPs: ips.length,
      totalAttempts: attempts,
      attackingIPs: ips,
      detectedAt: new Date().toISOString(),
    };

    await pool.query(query, [ips.join(','), JSON.stringify(metadata)]);

    logger.warn('Distributed attack detected and logged', {
      email,
      uniqueIPs: ips.length,
      totalAttempts: attempts,
    });
  } catch (error) {
    logger.error('Error logging distributed attack', { email, error });
  }
};

/**
 * Log account lockout to audit logs
 * @param email - Email that was locked
 * @param attempts - Failed attempts count
 */
const logAccountLockout = async (
  email: string,
  attempts: number,
): Promise<void> => {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_id,
        action,
        ip_address,
        user_agent,
        table_name,
        record_id,
        old_values,
        new_values,
        created_at
      ) VALUES (
        NULL,
        'ACCOUNT_LOCKED',
        'System',
        'System',
        'users',
        NULL,
        NULL,
        $1,
        NOW()
      )
    `;

    const metadata = {
      email,
      failedAttempts: attempts,
      lockDuration: '1 hour',
      lockedAt: new Date().toISOString(),
    };

    await pool.query(query, [JSON.stringify(metadata)]);

    logger.warn('Account locked due to excessive failed attempts', {
      email,
      attempts,
    });
  } catch (error) {
    logger.error('Error logging account lockout', { email, error });
  }
};

/**
 * Get brute force record for an email
 * @param email - Email address
 * @returns Brute force record
 */
export const getBruteForceRecord = async (
  email: string,
): Promise<BruteForceRecord> => {
  const info = await getDistributedAttackInfo(email);
  const isLocked = await checkAccountLocked(email);

  return {
    email,
    ipAddresses: info.ipAddresses,
    failedAttempts: info.totalAttempts,
    lastAttempt: new Date(),
    isLocked,
    lockUntil: isLocked ? new Date(Date.now() + EMAIL_FAILED_LOGIN_TTL * 1000) : undefined,
  };
};

export default {
  trackFailedLogin,
  checkAccountLocked,
  getFailedLoginCount,
  resetFailedLogins,
  getDistributedAttackInfo,
  getBruteForceRecord,
};
