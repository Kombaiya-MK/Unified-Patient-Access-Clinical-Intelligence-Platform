/**
 * Queue Management Page
 * 
 * Main page for staff queue management (SCR-009).
 * Displays today's appointment queue with filters, sortable table,
 * live refresh indicator, and loading/error/empty states.
 * 
 * @module QueueManagementPage
 * @created 2026-03-31
 * @task US_020 TASK_001
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQueueData } from '../hooks/useQueueData';
import { useQueueActions } from '../hooks/useQueueActions';
import { useWebSocket } from '../hooks/useWebSocket';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { QueueFilters } from '../components/queue/QueueFilters';
import { QueueTable } from '../components/queue/QueueTable';
import { RealtimeNotification } from '../components/queue/RealtimeNotification';
import '../components/queue/QueueActions.css';
import './QueueManagementPage.css';

/**
 * Derive user initials from display name
 */
const getUserInitials = (name?: string): string => {
  if (!name) {
    return 'U';
  }
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
};

/**
 * Page header bar with logo, title, avatar, and logout
 */
const QueuePageHeader: React.FC<{
  initials: string;
  onLogout: () => void;
}> = ({ initials, onLogout }) => (
  <header className="queue-page__header" role="banner">
    <div className="queue-page__header-left">
      <span className="queue-page__logo">UPACI</span>
      <span className="queue-page__header-title">Queue Management</span>
    </div>
    <div className="queue-page__header-right">
      <div
        className="queue-page__avatar"
        role="button"
        aria-label="User menu"
        tabIndex={0}
      >
        {initials}
      </div>
      <button onClick={onLogout} className="queue-page__logout-btn">
        Logout
      </button>
    </div>
  </header>
);

/**
 * Queue content area: renders loading, error, empty, or table state
 */
const QueueContent: React.FC<{
  loading: boolean;
  error: string | null;
  appointments: ReturnType<typeof useQueueData>['appointments'];
  sort: ReturnType<typeof useQueueData>['sort'];
  setSort: ReturnType<typeof useQueueData>['setSort'];
  totalCount: number;
  updatingId: string | null;
  onStatusUpdate: (appointmentId: string, newStatus: import('../types/queue.types').QueueStatus, version: number) => void;
}> = ({ loading, error, appointments, sort, setSort, totalCount, updatingId, onStatusUpdate }) => {
  if (loading) {
    return (
      <div className="queue-page__state" role="status" aria-label="Loading queue data">
        <div className="queue-page__spinner" />
        <p>Loading queue data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="queue-page__state queue-page__state--error" role="alert">
        <p className="queue-page__error-text">Failed to load queue data</p>
        <p className="queue-page__error-detail">{error}</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="queue-page__state queue-page__state--empty" role="status">
        <p className="queue-page__empty-text">No appointments found</p>
        <p className="queue-page__empty-detail">
          {totalCount > 0
            ? 'Try adjusting your filters to see more results.'
            : 'There are no appointments scheduled for today.'}
        </p>
      </div>
    );
  }

  return (
    <QueueTable
      appointments={appointments}
      sort={sort}
      onSort={setSort}
      totalCount={totalCount}
      updatingId={updatingId}
      onStatusUpdate={onStatusUpdate}
    />
  );
};

/**
 * Queue Management Page Component
 * 
 * Staff-only page displaying today's patient queue with:
 * - Breadcrumb navigation
 * - Page header with live indicator
 * - Filter controls (search, status, provider, department)
 * - Sortable queue table (desktop) / card grid (mobile)
 * - Loading, error, and empty states
 */
export const QueueManagementPage: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    appointments,
    loading,
    error,
    filters,
    setFilters,
    sort,
    setSort,
    totalCount,
    providers,
    departments,
    resetFilters,
  } = useQueueData();

  const { updateStatus, updatingId, conflict, error: actionError, successMessage, clearError, clearSuccess } = useQueueActions();
  const { connected, lastUpdate } = useWebSocket();

  const shortcuts = useMemo(() => [
    {
      key: 'ctrl+k',
      handler: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[aria-label="Search patients by name"]');
        searchInput?.focus();
      },
      description: 'Focus search',
    },
    {
      key: 'escape',
      handler: () => {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement) {
          active.blur();
        }
        resetFilters();
      },
      description: 'Clear filters',
    },
  ], [resetFilters]);

  useKeyboardShortcuts(shortcuts);

  const handleStatusUpdate = async (appointmentId: string, newStatus: import('../types/queue.types').QueueStatus, version: number) => {
    await updateStatus(appointmentId, newStatus, version);
  };

  const initials = getUserInitials(user?.name);

  return (
    <div className="queue-page">
      <QueuePageHeader initials={initials} onLogout={logout} />

      <main className="queue-page__main" role="main">
        {/* Breadcrumb */}
        <nav className="queue-page__breadcrumb" aria-label="Breadcrumb">
          <Link to="/staff/dashboard">Dashboard</Link>
          <span className="queue-page__breadcrumb-separator" aria-hidden="true">›</span>
          <span aria-current="page">Queue Management</span>
        </nav>

        {/* Page Header */}
        <div className="queue-page__page-header">
          <div>
            <h1 className="queue-page__title">Queue Management</h1>
          </div>
          <div className="queue-page__live-indicator" aria-live="polite">
            <span className={`queue-page__live-dot ${connected ? '' : 'queue-page__live-dot--disconnected'}`} aria-hidden="true" />
            <span>{connected ? 'Live — Real-time' : 'Live — Auto-refreshing'}</span>
          </div>
        </div>

        {/* Real-time Notification Banner */}
        <RealtimeNotification lastUpdate={lastUpdate} />

        {/* Success Toast */}
        {successMessage && (
          <div className="queue-success-toast" role="status">
            <span className="queue-success-toast__text">{successMessage}</span>
            <button className="queue-success-toast__dismiss" onClick={clearSuccess} aria-label="Dismiss success message">✕</button>
          </div>
        )}

        {/* Conflict Alert */}
        {conflict && (
          <div className="queue-conflict-alert" role="alert">
            <span className="queue-conflict-alert__text">
              Conflict: {conflict.message}. Updated by {conflict.updatedBy} to {conflict.currentStatus}.
            </span>
            <button className="queue-conflict-alert__dismiss" onClick={clearError} aria-label="Dismiss conflict alert">✕</button>
          </div>
        )}

        {/* Action Error Alert */}
        {actionError && (
          <div className="queue-conflict-alert" role="alert">
            <span className="queue-conflict-alert__text">{actionError}</span>
            <button className="queue-conflict-alert__dismiss" onClick={clearError} aria-label="Dismiss error alert">✕</button>
          </div>
        )}

        {/* Filters */}
        <QueueFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
          providers={providers}
          departments={departments}
        />

        {/* Queue Data Display */}
        <QueueContent
          loading={loading}
          error={error}
          appointments={appointments}
          sort={sort}
          setSort={setSort}
          totalCount={totalCount}
          updatingId={updatingId}
          onStatusUpdate={handleStatusUpdate}
        />
      </main>
    </div>
  );
};
