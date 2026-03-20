/**
 * Dashboard Controller
 * 
 * HTTP request handlers for dashboard API endpoints.
 * Handles authentication, authorization, and response formatting.
 * 
 * @module dashboardController
 * @created 2026-03-19
 * @task US_019 TASK_004
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { DashboardResponse } from '../types/dashboard.types';
import { getPatientDashboard, getPatientAppointments } from '../services/dashboardService';
import logger from '../utils/logger';

/**
 * Get Patient Dashboard
 * 
 * Fetches aggregated dashboard data for the authenticated patient.
 * Returns patient info, upcoming/past appointments, and notifications.
 * 
 * @route   GET /api/patients/dashboard
 * @access  Private (Patient only)
 * 
 * @param req - Express request with authenticated user
 * @param res - Express response
 */
export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Extract user from authenticated request
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - No user found in request',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify user is a patient
    if (user.role !== 'patient') {
      res.status(403).json({
        success: false,
        error: 'Forbidden - Only patients can access dashboard',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Fetch dashboard data from service
    const dashboardData = await getPatientDashboard(user.userId);

    // Format successful response
    const response: DashboardResponse = {
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    };

    logger.info(`Dashboard data retrieved for patient ${user.userId}`);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Error in getDashboard controller:', error);

    // Handle specific error cases
    if (error instanceof Error && error.message === 'Patient not found or inactive') {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching dashboard',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get Patient Appointments
 * 
 * Fetches all appointments for the authenticated patient.
 * Used by frontend AppointmentContext to populate appointment list.
 * 
 * @route   GET /api/appointments/my
 * @access  Private (Patient only)
 * 
 * @param req - Express request with authenticated user
 * @param res - Express response
 */
export async function getMyAppointments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Fetch all appointments for the patient
    const appointments = await getPatientAppointments(user.userId);

    res.status(200).json({
      success: true,
      appointments,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Appointments retrieved for patient ${user.userId}`, {
      count: appointments.length,
    });
  } catch (error) {
    logger.error('Error in getMyAppointments controller:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching appointments',
      timestamp: new Date().toISOString(),
    });
  }
}
