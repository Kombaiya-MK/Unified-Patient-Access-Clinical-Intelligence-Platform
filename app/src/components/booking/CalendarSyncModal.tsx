/**
 * Calendar Sync Modal Component
 * 
 * Modal for OAuth provider selection when syncing appointments to calendar.
 * Shows on first appointment booking to allow user to choose Google or Outlook.
 * 
 * Features:
 * - OAuth provider selection (Google Calendar or Microsoft Outlook)
 * - Initiates OAuth flow on provider selection
 * - Option to skip calendar sync
 * - Responsive modal design
 * - Accessible with ARIA labels
 * - Design tokens from designsystem.md (Google: white + logo, Outlook: #0078D4)
 * 
 * @module CalendarSyncModal
 * @created 2026-03-20
 * @task US_017 TASK_001
 */

import React, { useState } from 'react';
import './CalendarSyncModal.css';

/**
 * Calendar Sync Modal Props
 */
export interface CalendarSyncModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when provider is selected */
  onProviderSelect: (provider: 'google' | 'outlook') => Promise<void>;
  /** Callback when user skips sync */
  onSkip: () => void;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Google Icon Component
 */
const GoogleIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * Outlook Icon Component
 */
const OutlookIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4" />
    <path
      d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
      fill="white"
    />
  </svg>
);

/**
 * Calendar Sync Modal Component
 * 
 * Prompts user to sync appointment to their calendar on first booking.
 * Initiates OAuth flow for selected provider (Google or Outlook).
 * 
 * @example
 * ```tsx
 * const [showCalendarModal, setShowCalendarModal] = useState(true);
 * 
 * const handleProviderSelect = async (provider: 'google' | 'outlook') => {
 *   // Initiate OAuth flow
 *   const response = await fetch(`/api/calendar/${provider}/auth`);
 *   const { authUrl } = await response.json();
 *   window.location.href = authUrl;
 * };
 * 
 * <CalendarSyncModal
 *   isOpen={showCalendarModal}
 *   onProviderSelect={handleProviderSelect}
 *   onSkip={() => setShowCalendarModal(false)}
 *   onClose={() => setShowCalendarModal(false)}
 * />
 * ```
 */
export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onProviderSelect,
  onSkip,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook' | null>(null);

  if (!isOpen) return null;

  /**
   * Handle provider selection and OAuth initiation
   */
  const handleProviderClick = async (provider: 'google' | 'outlook') => {
    setLoading(true);
    setSelectedProvider(provider);
    
    try {
      await onProviderSelect(provider);
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      setLoading(false);
      setSelectedProvider(null);
      // Error is handled by parent component
    }
  };

  /**
   * Handle skip action
   */
  const handleSkip = () => {
    onSkip();
    onClose();
  };

  /**
   * Handle backdrop click to close
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="calendar-sync-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-sync-title"
    >
      <div className="calendar-sync-modal">
        {/* Close Button */}
        {!loading && (
          <button
            className="calendar-sync-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="calendar-sync-modal-header">
          <div className="calendar-sync-modal-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 id="calendar-sync-title" className="calendar-sync-modal-title">
            Sync to Calendar?
          </h2>
          <p className="calendar-sync-modal-description">
            Never miss an appointment. Sync your bookings to Google Calendar or Microsoft Outlook.
          </p>
        </div>

        {/* Provider Buttons */}
        <div className="calendar-sync-modal-providers">
          <button
            className={`calendar-sync-provider-button google ${selectedProvider === 'google' && loading ? 'loading' : ''}`}
            onClick={() => handleProviderClick('google')}
            disabled={loading}
            aria-label="Sync with Google Calendar"
            type="button"
          >
            <GoogleIcon />
            <span>Google Calendar</span>
            {selectedProvider === 'google' && loading && (
              <div className="spinner" aria-hidden="true" />
            )}
          </button>

          <button
            className={`calendar-sync-provider-button outlook ${selectedProvider === 'outlook' && loading ? 'loading' : ''}`}
            onClick={() => handleProviderClick('outlook')}
            disabled={loading}
            aria-label="Sync with Microsoft Outlook"
            type="button"
          >
            <OutlookIcon />
            <span>Microsoft Outlook</span>
            {selectedProvider === 'outlook' && loading && (
              <div className="spinner" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Skip Button */}
        {!loading && (
          <div className="calendar-sync-modal-footer">
            <button
              className="calendar-sync-skip-button"
              onClick={handleSkip}
              type="button"
            >
              Skip for now
            </button>
            <p className="calendar-sync-modal-note">
              You can enable calendar sync anytime from your settings.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="calendar-sync-modal-loading">
            <p>Redirecting to authorization page...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSyncModal;
