/**
 * Conflict History Panel Component
 * @module components/medications/ConflictHistoryPanel
 * @description Panel showing medication conflict check history
 * @epic EP-006
 * @story US-033
 */

import React, { useEffect, useState } from 'react';
import { useConflictCheck } from '../../hooks/useConflictCheck';
import { SeverityIndicator } from './SeverityIndicator';

interface ConflictHistoryPanelProps {
  patientId: string;
}

interface HistoryEntry {
  conflict_id: string;
  conflict_type: string;
  medications_involved: string[];
  severity_level: number;
  conflict_status: string;
  override_reason?: string;
  created_at: string;
}

export const ConflictHistoryPanel: React.FC<ConflictHistoryPanelProps> = ({ patientId }) => {
  const { getActiveConflicts } = useConflictCheck();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await getActiveConflicts(patientId);
        if (!cancelled) {
          setHistory(data as unknown as HistoryEntry[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [patientId, getActiveConflicts]);

  if (loading) {
    return <div style={{ padding: '1rem', color: '#6B7280' }}>Loading conflict history...</div>;
  }

  if (history.length === 0) {
    return <div style={{ padding: '1rem', color: '#6B7280' }}>No conflict history available.</div>;
  }

  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Conflict History</h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {history.map((entry) => (
          <div
            key={entry.conflict_id}
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              padding: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{entry.conflict_type}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>
                  {entry.medications_involved.join(' + ')}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                <SeverityIndicator level={entry.severity_level} showLabel={false} />
                <span style={{
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  backgroundColor: entry.conflict_status === 'Active' ? '#FEE2E2' : entry.conflict_status === 'Overridden' ? '#FEF3C7' : '#D1FAE5',
                  color: entry.conflict_status === 'Active' ? '#991B1B' : entry.conflict_status === 'Overridden' ? '#92400E' : '#065F46',
                }}>
                  {entry.conflict_status}
                </span>
              </div>
            </div>
            {entry.override_reason && (
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem', padding: '0.375rem', backgroundColor: '#F9FAFB', borderRadius: '0.25rem' }}>
                <strong>Override:</strong> {entry.override_reason}
              </div>
            )}
            <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '0.375rem' }}>
              {new Date(entry.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
