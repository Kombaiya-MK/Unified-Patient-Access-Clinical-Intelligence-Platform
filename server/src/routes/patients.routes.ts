import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

// All patient routes require authentication
router.use(authenticateToken);

// Mount dashboard routes at /api/patients/dashboard
router.use('/', dashboardRoutes);

/**
 * @route   GET /api/patients
 * @desc    Get all patients (staff/admin only)
 * @access  Private (staff, admin)
 */
router.get('/', authorizeRoles('staff', 'admin'), (_req, res) => {
  res.json({
    success: true,
    message: 'Get patients endpoint - To be implemented in US_009',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private
 */
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: `Get patient ${req.params.id} - To be implemented in US_009`,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient profile
 * @access  Private
 */
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    message: `Update patient ${req.params.id} - To be implemented in US_009`,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   POST /api/patients/:id/documents
 * @desc    Upload patient document
 * @access  Private
 */
router.post('/:id/documents', (_req, res) => {
  res.json({
    success: true,
    message: 'Upload document endpoint - To be implemented in US_040',
    timestamp: new Date().toISOString(),
  });
});

export default router;
