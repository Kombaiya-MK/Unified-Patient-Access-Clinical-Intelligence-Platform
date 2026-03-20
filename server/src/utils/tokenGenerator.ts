import jwt from 'jsonwebtoken';
import config from '../config/env';
import logger from './logger';
import { JwtPayload } from '../types/auth.types';

/**
 * JWT Token Generation and Verification Utilities
 * 
 * Security Features:
 * - HS256 algorithm (HMAC with SHA-256)
 * - 15-minute token expiry (900 seconds)
 * - Secure secret key from environment
 * - Token validation with signature verification
 * 
 * Token Structure:
 * Header: { alg: "HS256", typ: "JWT" }
 * Payload: { userId, email, role, iat, exp }
 * Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
 */

/**
 * Token expiry duration: 15 minutes (900 seconds)
 * Per AC3: JWT token expires after 15 minutes
 */
const TOKEN_EXPIRY_SECONDS = 900; // 15 minutes

/**
 * Generate a signed JWT token
 * @param payload - User identification data (userId, email, role)
 * @returns Signed JWT token string
 * @throws Error if token generation fails
 */
export const signToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  try {
    if (!config.jwt.secret || config.jwt.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    // Sign token with HS256 algorithm
    // JWT library will automatically add iat and exp based on expiresIn option
    const token = jwt.sign(payload, config.jwt.secret, {
      algorithm: 'HS256',
      expiresIn: TOKEN_EXPIRY_SECONDS,
    });

    logger.debug('JWT token generated successfully', {
      userId: payload.userId,
      role: payload.role,
      expiresIn: TOKEN_EXPIRY_SECONDS,
    });

    return token;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('JWT token generation failed:', errorMessage);
    throw new Error(`Failed to generate token: ${errorMessage}`);
  }
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded payload if valid, null if invalid/expired
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    if (!token || token.trim().length === 0) {
      logger.debug('Token verification failed: empty token');
      return null;
    }

    // Verify signature and expiry
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    logger.debug('Token verified successfully', {
      userId: decoded.userId,
      role: decoded.role,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Token verification failed: token expired', {
        expiredAt: error.expiredAt,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug('Token verification failed: invalid token', {
        error: error.message,
      });
    } else {
      logger.error('Token verification error:', error);
    }

    return null;
  }
};

/**
 * Decode a JWT token WITHOUT verification
 * Use only for inspection, not for authentication
 * @param token - JWT token string to decode
 * @returns Decoded payload (unverified), null if invalid format
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded || typeof decoded !== 'object') {
      logger.debug('Token decoding failed: invalid format');
      return null;
    }

    return decoded;
  } catch (error) {
    logger.debug('Token decoding error:', error);
    return null;
  }
};

/**
 * Get token expiry time remaining in seconds
 * @param token - JWT token string
 * @returns Seconds until expiry, 0 if expired, -1 if invalid
 */
export const getTokenExpiryRemaining = (token: string): number => {
  try {
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return -1;
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;

    return remaining > 0 ? remaining : 0;
  } catch (error) {
    logger.debug('Error calculating token expiry:', error);
    return -1;
  }
};

/**
 * Check if a token is expired
 * @param token - JWT token string
 * @returns true if expired, false if still valid
 */
export const isTokenExpired = (token: string): boolean => {
  const remaining = getTokenExpiryRemaining(token);
  return remaining === 0 || remaining === -1;
};

/**
 * Refresh token logic (for future use)
 * Generates a new token with the same payload but new expiry
 * @param oldToken - Expired or soon-to-expire token
 * @returns New token with extended expiry, null if old token is invalid
 */
export const refreshToken = (oldToken: string): string | null => {
  try {
    // Decode without verification (old token might be expired)
    const decoded = decodeToken(oldToken);

    if (!decoded) {
      logger.debug('Token refresh failed: invalid token');
      return null;
    }

    // Generate new token with same user data
    const newToken = signToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    logger.debug('Token refreshed successfully', {
      userId: decoded.userId,
    });

    return newToken;
  } catch (error) {
    logger.error('Token refresh error:', error);
    return null;
  }
};

export default {
  signToken,
  verifyToken,
  decodeToken,
  getTokenExpiryRemaining,
  isTokenExpired,
  refreshToken,
};
