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

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import { AppointmentProvider } from './context/AppointmentContext';
import { WaitlistProvider } from './context/WaitlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute, UnauthorizedPage } from './components/auth/ProtectedRoute';
import { Header } from './components/Navigation/Header';
import { Sidebar } from './components/Navigation/Sidebar';
import { MobileMenu } from './components/Navigation/MobileMenu';
import { BottomNav } from './components/Navigation/BottomNav';
import { NotificationPopupStack } from './components/notifications/NotificationPopup';
import { KeyboardShortcuts } from './components/accessibility/KeyboardShortcuts';
import { useFocusVisible } from './utils/focus-management';
import { useNotifications as useNotificationsHook } from './hooks/useNotifications';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AppointmentBookingPage } from './pages/AppointmentBookingPage';
import { QueueManagementPage } from './pages/QueueManagementPage';
import { StaffBookingPage } from './pages/StaffBookingPage';
import { AIPatientIntakePage } from './pages/AIPatientIntakePage';
import { ManualIntakePage } from './pages/ManualIntakePage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { ClinicalDataReviewPage } from './pages/ClinicalDataReviewPage';
import AuditLogsPage from './pages/AuditLogsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { DepartmentProviderManagement } from './pages/DepartmentProviderManagement';
import { AdminMetricsDashboard } from './pages/AdminMetricsDashboard';
import { AccessibilityStatementPage } from './pages/AccessibilityStatementPage';
import navStyles from './components/Navigation/navigation.module.css';
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

/**
 * Connects the popup stack to the NotificationContext.
 * Only renders when user is authenticated to prevent 401 redirect on public routes.
 */
function NotificationPopupConnector() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;

  return <AuthenticatedNotificationPopups />;
}

function AuthenticatedNotificationPopups() {
  const { popups, dismissPopup, acknowledge } = useNotificationsHook();
  return (
    <NotificationPopupStack
      popups={popups}
      onDismiss={dismissPopup}
      onAcknowledge={acknowledge}
    />
  );
}

/**
 * Layout wrapper for authenticated routes.
 * Renders responsive Header, Sidebar, MobileMenu, and BottomNav.
 */
function AuthenticatedLayout() {
  useFocusVisible();

  return (
    <div className={navStyles.appLayout}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <KeyboardShortcuts />
      <Header />
      <div className={navStyles.appBody}>
        <Sidebar />
        <main id="main-content" className={navStyles.appContent} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <MobileMenu />
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
        <NavigationProvider>
        <AppointmentProvider>
          <WaitlistProvider>
              <NotificationPopupConnector />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/accessibility-statement" element={<AccessibilityStatementPage />} />

                {/* Authenticated Routes with Navigation Layout */}
                <Route element={<AuthenticatedLayout />}>

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

              {/* Protected Routes - Admin Audit Logs (US-011) */}
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Admin User Management (US-035) */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Admin Department & Provider Management (US-036) */}
              <Route
                path="/admin/departments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DepartmentProviderManagement />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Admin Metrics Dashboard (US-039) */}
              <Route
                path="/admin/metrics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminMetricsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - AI Intake */}
              <Route
                path="/intake/ai"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'staff', 'doctor', 'admin']}>
                    <AIPatientIntakePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Manual Intake */}
              <Route
                path="/intake/manual"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'staff', 'doctor', 'admin']}>
                    <ManualIntakePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Document Upload */}
              <Route
                path="/documents/upload/:patientId"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'staff', 'doctor', 'admin']}>
                    <DocumentUploadPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Clinical Data Review (SCR-010) */}
              <Route
                path="/clinical-review/:patientId"
                element={
                  <ProtectedRoute allowedRoles={['staff', 'doctor', 'admin']}>
                    <ClinicalDataReviewPage />
                  </ProtectedRoute>
                }
              />

                </Route>

              {/* Fallback Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </WaitlistProvider>
        </AppointmentProvider>
        </NavigationProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
