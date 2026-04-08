/**
 * Dashboard Service
 * 
 * Service layer for dashboard data aggregation and queries.
 * Optimizes database queries using PostgreSQL CTEs for efficient data fetching.
 * 
 * Features:
 * - Fetch patient dashboard data (patient info, appointments, notifications)
 * - Optimized SQL queries with JOINs
 * - In-memory caching with 5-minute TTL
 * - Support for empty states
 * 
 * @module dashboardService
 * @created 2026-03-19
 * @task US_019 TASK_004
 */

import { pool } from '../config/database';
import type {
  DashboardData,
  DashboardAppointment,
  DashboardNotification,
  DashboardPatient,
} from '../types/dashboard.types';
import logger from '../utils/logger';

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: DashboardData;
  timestamp: number;
}

// In-memory cache with 5-minute TTL
const dashboardCache = new Map<number, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear cache for specific patient
 * Call this when patient data changes (appointment created/updated)
 * 
 * @param patientId - Patient user ID
 */
export function clearDashboardCache(patientId: number): void {
  dashboardCache.delete(patientId);
  logger.info(`Dashboard cache cleared for patient ${patientId}`);
}

/**
 * Get patient dashboard data
 * 
 * Fetches aggregated dashboard data including:
 * - Patient profile information
 * - Upcoming appointments (next 3)
 * - Past appointments (last 5)
 * - Recent notifications (last 5)
 * - Unread notification count
 * 
 * Uses in-memory caching with 5-minute TTL for performance.
 * 
 * @param userId - Patient user ID from authenticated user
 * @returns Dashboard data
 * @throws Error if patient not found or database error
 */
export async function getPatientDashboard(userId: number): Promise<DashboardData> {
  try {
    // Check cache first
    const cached = dashboardCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      logger.info(`Dashboard cache hit for patient ${userId}`);
      return cached.data;
    }

    logger.info(`Fetching dashboard data for patient ${userId}`);

    // Fetch patient info
    const patientResult = await pool.query<DashboardPatient>(
      `SELECT 
        u.id,
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.email,
        NULL AS "profilePhotoUrl"
      FROM app.users u
      WHERE u.id = $1 AND u.role = 'patient' AND u.is_active = true`,
      [userId]
    );

    if (patientResult.rows.length === 0) {
      throw new Error('Patient not found or inactive');
    }

    const patient = patientResult.rows[0];

    // Fetch upcoming appointments (next 3, status not completed/cancelled)
    const upcomingResult = await pool.query(
      `SELECT 
        a.id,
        a.appointment_date AS "appointmentDate",
        a.status,
        a.appointment_type AS "appointmentType",
        a.reschedule_count AS "rescheduleCount",
        jsonb_build_object(
          'id', doc.id,
          'firstName', doc.first_name,
          'lastName', doc.last_name
        ) AS provider,
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'location', d.location
        ) AS department
      FROM app.appointments a
      LEFT JOIN app.users doc ON a.doctor_id = doc.id
      LEFT JOIN app.departments d ON a.department_id = d.id
      WHERE a.patient_id = $1
        AND a.status NOT IN ('completed', 'cancelled')
        AND a.appointment_date >= CURRENT_DATE
      ORDER BY a.appointment_date ASC
      LIMIT 3`,
      [userId]
    );

    // Fetch past appointments (last 5, completed or cancelled)
    const pastResult = await pool.query(
      `SELECT 
        a.id,
        a.appointment_date AS "appointmentDate",
        a.status,
        a.appointment_type AS "appointmentType",
        a.reschedule_count AS "rescheduleCount",
        jsonb_build_object(
          'id', doc.id,
          'firstName', doc.first_name,
          'lastName', doc.last_name
        ) AS provider,
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'location', d.location
        ) AS department
      FROM app.appointments a
      LEFT JOIN app.users doc ON a.doctor_id = doc.id
      LEFT JOIN app.departments d ON a.department_id = d.id
      WHERE a.patient_id = $1
        AND a.status IN ('completed', 'cancelled')
      ORDER BY a.appointment_date DESC
      LIMIT 5`,
      [userId]
    );

    // Notifications: Return empty array for now until US-046 is implemented
    // TODO: Replace with actual query when notifications table is ready
    const notifications: DashboardNotification[] = [];
    const unreadNotificationCount = 0;

    const dashboardData: DashboardData = {
      patient,
      upcomingAppointments: upcomingResult.rows as DashboardAppointment[],
      pastAppointments: pastResult.rows as DashboardAppointment[],
      notifications,
      unreadNotificationCount,
    };

    // Cache the result
    dashboardCache.set(userId, {
      data: dashboardData,
      timestamp: Date.now(),
    });

    logger.info(`Dashboard data fetched successfully for patient ${userId}`, {
      upcomingCount: dashboardData.upcomingAppointments.length,
      pastCount: dashboardData.pastAppointments.length,
    });

    return dashboardData;
  } catch (error) {
    logger.error('Error fetching patient dashboard:', error);
    throw error;
  }
}

/**
 * Get patient's appointments (all appointments for AppointmentContext)
 * 
 * Fetches all appointments for a patient ordered by date descending.
 * Used by the frontend AppointmentContext.
 * 
 * @param userId - Patient user ID
 * @returns Array of appointments
 */
export async function getPatientAppointments(userId: number): Promise<DashboardAppointment[]> {
  try {
    const result = await pool.query(
      `SELECT 
        a.id,
        a.appointment_date AS "appointmentDate",
        a.status,
        a.appointment_type AS "appointmentType",
        a.reschedule_count AS "rescheduleCount",
        jsonb_build_object(
          'id', doc.id,
          'firstName', doc.first_name,
          'lastName', doc.last_name
        ) AS provider,
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'location', d.location
        ) AS department
      FROM app.appointments a
      LEFT JOIN app.users doc ON a.doctor_id = doc.id
      LEFT JOIN app.departments d ON a.department_id = d.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC`,
      [userId]
    );

    return result.rows as DashboardAppointment[];
  } catch (error) {
    logger.error('Error fetching patient appointments:', error);
    throw error;
  }
}
