import { Router } from 'express';
import authRoutes from './auth.routes';
import appointmentsRoutes from './appointments.routes';
import patientsRoutes from './patients.routes';
import adminRoutes from './admin.routes';
import calendarRoutes from './calendar.routes';

const router = Router();

/**
 * Health check endpoint
 * @route   GET /api/health
 * @desc    Server health check
 * @access  Public
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * API version endpoint
 * @route   GET /api
 * @desc    API information
 * @access  Public
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Clinical Appointment Platform API',
    version: '1.0.0',
    documentation: '/api/docs',
    timestamp: new Date().toISOString(),
  });
});

// Register route modules
router.use('/auth', authRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/patients', patientsRoutes);
router.use('/admin', adminRoutes);
router.use('/calendar', calendarRoutes);

export default router;
