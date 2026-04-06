/**
 * App Component
 * 
 * Root application component with routing and authentication.
 * Wraps the app with AuthProvider for global auth state management
 * and QueryClientProvider for React Query data fetching.
 * Implements protected routes for role-based access control.
 * 
 * @module App
 * @created 2026-03-18
 * @task US_012 TASK_001, TASK_003; US_013 TASK_001
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';
import { WaitlistProvider } from './context/WaitlistContext';
import { ProtectedRoute, UnauthorizedPage } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AppointmentBookingPage } from './pages/AppointmentBookingPage';
import { QueueManagementPage } from './pages/QueueManagementPage';
import { StaffBookingPage } from './pages/StaffBookingPage';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppointmentProvider>
          <WaitlistProvider>
            <div className="app">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
              
              {/* Protected Routes - Patient */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected Routes - Appointments (Patient access) */}
              <Route
                path="/appointments/book"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <AppointmentBookingPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected Routes - Staff */}
              <Route
                path="/staff/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['staff', 'admin']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected Routes - Doctor */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected Routes - Staff Queue Management */}
              <Route
                path="/staff/queue"
                element={
                  <ProtectedRoute allowedRoles={['staff', 'admin']}>
                    <QueueManagementPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected Routes - Staff Booking */}
              <Route
                path="/staff/appointments/book"
                element={
                  <ProtectedRoute allowedRoles={['staff', 'admin']}>
                    <StaffBookingPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected Routes - Admin */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Fallback Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
          </WaitlistProvider>
        </AppointmentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
