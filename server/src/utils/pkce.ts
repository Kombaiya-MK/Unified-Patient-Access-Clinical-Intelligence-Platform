/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * 
 * Implements OAuth 2.0 PKCE extension (RFC 7636) for enhanced security.
 * PKCE prevents authorization code interception attacks in public clients.
 * 
 * Flow:
 * 1. Generate code_verifier (random 43-128 character string)
 * 2. Generate code_challenge (SHA256 hash of verifier, base64url-encoded)
 * 3. Send code_challenge in authorization request
 * 4. Send code_verifier in token exchange request
 * 5. Provider verifies: SHA256(code_verifier) === code_challenge
 * 
 * @module pkce
 * @created 2026-03-20
 * @task US_017 TASK_002
 */

import crypto from 'crypto';

/**
 * Convert Buffer to base64url encoding (RFC 4648)
 * 
 * Base64url encoding:
 * - Replace + with -
 * - Replace / with _
 * - Remove padding (=)
 * 
 * @param buffer - Buffer to encode
 * @returns Base64url-encoded string
 */
const base64URLEncode = (buffer: Buffer): string => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Generate cryptographically secure code verifier for PKCE
 * 
 * Per RFC 7636:
 * - Length: 43-128 characters
 * - Character set: [A-Z][a-z][0-9]-._~
 * - Minimum entropy: 32 bytes (256 bits)
 * 
 * Implementation:
 * - Generates 32 random bytes (256 bits)
 * - Base64url-encodes to 43 characters
 * 
 * @returns Code verifier string (43 characters)
 * 
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * // Example output: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
 * ```
 */
export const generateCodeVerifier = (): string => {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  return verifier;
};

/**
 * Generate code challenge from code verifier
 * 
 * Per RFC 7636:
 * - Method: S256 (SHA-256)
 * - Challenge = BASE64URL(SHA256(ASCII(code_verifier)))
 * 
 * @param verifier - Code verifier string
 * @returns Code challenge string (base64url-encoded SHA-256 hash)
 * 
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * const challenge = generateCodeChallenge(verifier);
 * // Provider will verify: SHA256(verifier) === challenge
 * ```
 */
export const generateCodeChallenge = (verifier: string): string => {
  const hash = crypto
    .createHash('sha256')
    .update(verifier)
    .digest();
  
  const challenge = base64URLEncode(hash);
  return challenge;
};

/**
 * Generate both code verifier and challenge
 * Convenience function for OAuth flow initialization
 * 
 * @returns Object with verifier and challenge
 * 
 * @example
 * ```typescript
 * const { verifier, challenge } = generatePKCEPair();
 * // Store verifier in session
 * req.session.codeVerifier = verifier;
 * // Send challenge in authorization URL
 * authUrl.searchParams.append('code_challenge', challenge);
 * authUrl.searchParams.append('code_challenge_method', 'S256');
 * ```
 */
export const generatePKCEPair = (): { verifier: string; challenge: string } => {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  
  return { verifier, challenge };
};

/**
 * Validate code verifier format
 * 
 * Per RFC 7636:
 * - Length: 43-128 characters
 * - Character set: [A-Z][a-z][0-9]-._~
 * 
 * @param verifier - Code verifier to validate
 * @returns True if valid, false otherwise
 */
export const isValidCodeVerifier = (verifier: string): boolean => {
  if (!verifier || typeof verifier !== 'string') {
    return false;
  }
  
  const length = verifier.length;
  if (length < 43 || length > 128) {
    return false;
  }
  
  // RFC 7636: unreserved characters [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
  const validChars = /^[A-Za-z0-9\-._~]+$/;
  return validChars.test(verifier);
};

/**
 * Timing-safe comparison of code verifier and challenge
 * Prevents timing attacks during verification
 * 
 * @param verifier - Code verifier from session
 * @param expectedChallenge - Code challenge from authorization request
 * @returns True if verifier matches challenge
 */
export const verifyPKCEChallenge = (
  verifier: string,
  expectedChallenge: string
): boolean => {
  if (!isValidCodeVerifier(verifier)) {
    return false;
  }
  
  const actualChallenge = generateCodeChallenge(verifier);
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(actualChallenge),
    Buffer.from(expectedChallenge)
  );
};

export default {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCEPair,
  isValidCodeVerifier,
  verifyPKCEChallenge,
};
