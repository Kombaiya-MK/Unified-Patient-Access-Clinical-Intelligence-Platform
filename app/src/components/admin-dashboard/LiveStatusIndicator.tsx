/**
 * Live Status Indicator Component
 *
 * Shows real-time connection status and last updated timestamp.
 *
 * @module LiveStatusIndicator
 * @task US_039 TASK_002
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface LiveStatusIndicatorProps {
  lastUpdated: Date | null;
}

export const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({ lastUpdated }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        backgroundColor: '#10b981',
        animation: 'pulse 2s infinite',
      }} />
      <span style={{ fontSize: 12, color: '#6b7280' }}>
        Live{lastUpdated ? ` · Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}` : ''}
      </span>
    </div>
  );
};
