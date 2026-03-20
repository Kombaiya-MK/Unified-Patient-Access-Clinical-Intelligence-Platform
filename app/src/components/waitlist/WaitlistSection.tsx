/**
 * Waitlist Section Component
 * 
 * Dashboard section displaying user's active waitlist entries.
 * Shows list of WaitlistCard components with loading and empty states.
 * 
 * Features:
 * - Grid layout for waitlist cards
 * - Loading skeleton
 * - Empty state with helpful message
 * - Refresh button
 * - Active entries only (filters out cancelled/scheduled/expired)
 * - Accessible with ARIA labels
 * - WCAG 2.2 AA compliant
 * 
 * @module WaitlistSection
 * @created 2026-03-19
 * @task US_015 TASK_003
 */

import React from 'react';
import { useWaitlist, filterActiveEntries } from '../../hooks/useWaitlist';
import { WaitlistCard } from './WaitlistCard';
import './WaitlistSection.css';

/**
 * WaitlistSection Props
 */
export interface WaitlistSectionProps {
  /** Optional callback after successful operations */
  onUpdate?: () => void;
}

/**
 * Bell Icon Component
 */
const BellIcon: React.FC = () => (
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
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/**
 * Refresh Icon Component
 */
const RefreshIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

/**
 * Empty Inbox Icon Component
 */
const EmptyInboxIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC = () => (
  <div className="waitlist-section-loading">
    <div className="waitlist-skeleton-card"></div>
    <div className="waitlist-skeleton-card"></div>
  </div>
);

/**
 * Waitlist Section Component
 * 
 * @example
 * ```tsx
 * <WaitlistSection onUpdate={handleRefresh} />
 * ```
 */
export const WaitlistSection: React.FC<WaitlistSectionProps> = ({ onUpdate }) => {
  const { entries, refresh, loading } = useWaitlist();

  // Filter to show only active entries (waiting or contacted)
  const activeEntries = filterActiveEntries(entries);

  /**
   * Handle refresh button click
   */
  const handleRefresh = async () => {
    await refresh();
    onUpdate?.();
  };

  return (
    <section className="waitlist-section" aria-labelledby="waitlist-section-title">
      <div className="waitlist-section-header">
        <div className="waitlist-section-title-wrapper">
          <BellIcon />
          <h2 id="waitlist-section-title">My Waitlist</h2>
          {activeEntries.length > 0 && (
            <span className="waitlist-section-count" aria-label={`${activeEntries.length} active waitlist entries`}>
              {activeEntries.length}
            </span>
          )}
        </div>
        <button
          className="waitlist-section-refresh"
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh waitlist entries"
          title="Refresh waitlist"
        >
          <RefreshIcon />
        </button>
      </div>

      <div className="waitlist-section-content">
        {loading && entries.length === 0 ? (
          <LoadingSkeleton />
        ) : activeEntries.length > 0 ? (
          <div className="waitlist-section-grid" role="list">
            {activeEntries.map((entry) => (
              <div key={entry.id} role="listitem">
                <WaitlistCard entry={entry} onCancelSuccess={handleRefresh} />
              </div>
            ))}
          </div>
        ) : (
          <div className="waitlist-section-empty">
            <EmptyInboxIcon />
            <h3>No Active Waitlist Entries</h3>
            <p>
              When you join a waitlist for a fully booked appointment slot,
              it will appear here. We'll notify you if the slot becomes available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default WaitlistSection;
