import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { loginRateLimiter, registerRateLimiter } from '../middleware/loginRateLimiter';
import { applyProgressiveDelay } from '../utils/progressiveDelay';
import { validateRequest } from '../middleware/validation.middleware';
import { LoginDTOSchema } from '../schemas/loginDTO.schema';

const router = Router();

/**
 * Authentication Routes
 * 
 * Public Routes:
 * - POST /api/auth/login - User login
 * 
 * Protected Routes (require authentication):
 * - POST /api/auth/logout - User logout
 * - GET /api/auth/me - Get current user info
 * - POST /api/auth/verify - Verify token validity
 */

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get JWT token
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { success: true, token: string, expiresIn: number, user: {...} }
 * 
 * AC1: Valid credentials submitted, JWT token generated with 15-minute expiry
 *      containing user ID, role, email, stored in Redis
 * 
 * Security Layers:
 * 1. loginRateLimiter - Max 5 failed attempts per 15 minutes per IP
 * 2. applyProgressiveDelay - Exponential backoff delays (1s, 2s, 4s, 8s)
 * 3. authController.login - Password validation, brute force tracking
 */
router.post(
  '/login',
  loginRateLimiter,
  applyProgressiveDelay,
  validateRequest(LoginDTOSchema),
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate token
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @returns { success: true, message: "Logged out successfully" }
 * 
 * AC4: User logs out, JWT token invalidated in Redis, client-side token cleared
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user info
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @returns { success: true, data: { userId, email, role, iat, exp } }
 * 
 * AC2: Valid JWT token, authentication middleware validates token and grants access
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify if current token is valid
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @returns { success: true, message: "Token is valid", expiresAt: ISO timestamp }
 * 
 * AC3: JWT token expires after 15 minutes, system returns 401 Unauthorized if expired
 */
router.post('/verify', authenticate, authController.verifyToken);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (patient)
 * @access  Public
 * @status  To be implemented in US_010 (User Registration)
 * 
 * Security: Rate limited to 5 attempts per 15 minutes
 */
router.post('/register', registerRateLimiter, (_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Registration endpoint - To be implemented in US_010',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @status  To be implemented in future user story
 */
router.post('/refresh', (_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Token refresh endpoint - To be implemented in future user story',
    timestamp: new Date().toISOString(),
  });
});

export default router;

