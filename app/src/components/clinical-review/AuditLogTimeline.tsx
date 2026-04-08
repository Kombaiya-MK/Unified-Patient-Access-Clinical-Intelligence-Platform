/**
 * Audit Log Timeline Component
 * @module components/clinical-review/AuditLogTimeline
 * @description Displays profile change history with timeline
 * @epic EP-006
 * @story US-034
 * @task task_003_fe_audit_log_timeline
 */

import React, { useEffect, useState } from 'react';
import { useConflictResolution } from '../../hooks/useConflictResolution';

interface AuditLogTimelineProps {
  patientId: string;
}

interface HistoryEntry {
  version_id: string;
  changed_by: string;
  changed_at: string;
  change_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
}

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ patientId }) => {
  const { getHistory, history: rawHistory, loading } = useConflictResolution();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    getHistory(patientId);
  }, [patientId, getHistory]);

  useEffect(() => {
    if (rawHistory) {
      setHistory(rawHistory as unknown as HistoryEntry[]);
    }
  }, [rawHistory]);

  if (loading) {
    return <div style={{ padding: '1rem', color: '#6B7280' }}>Loading audit history...</div>;
  }

  if (history.length === 0) {
    return <div style={{ padding: '1rem', color: '#6B7280' }}>No profile change history available.</div>;
  }

  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Profile Change History</h3>
      <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
        {/* Timeline line */}
        <div style={{ position: 'absolute', left: '0.5rem', top: '0.5rem', bottom: '0.5rem', width: '2px', backgroundColor: '#E5E7EB' }} />

        {history.map((entry, index) => (
          <div key={entry.version_id || index} style={{ position: 'relative', marginBottom: '1rem', paddingLeft: '1rem' }}>
            {/* Timeline dot */}
            <div style={{
              position: 'absolute',
              left: '-1.125rem',
              top: '0.375rem',
              width: '0.625rem',
              height: '0.625rem',
              borderRadius: '9999px',
              backgroundColor: entry.change_type === 'conflict_resolution' ? '#2563EB' : '#6B7280',
              border: '2px solid #FFFFFF',
            }} />

            <div style={{ padding: '0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.375rem', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    backgroundColor: entry.change_type === 'conflict_resolution' ? '#DBEAFE' : '#F3F4F6',
                    color: entry.change_type === 'conflict_resolution' ? '#1E40AF' : '#6B7280',
                  }}>
                    {entry.change_type.replace(/_/g, ' ')}
                  </span>
                  {entry.field_name && (
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, marginLeft: '0.5rem' }}>{entry.field_name}</span>
                  )}
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>
                  {new Date(entry.changed_at).toLocaleString()}
                </span>
              </div>

              {(entry.old_value || entry.new_value) && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  {entry.old_value && (
                    <div style={{ color: '#991B1B', textDecoration: 'line-through' }}>− {entry.old_value}</div>
                  )}
                  {entry.new_value && (
                    <div style={{ color: '#065F46' }}>+ {entry.new_value}</div>
                  )}
                </div>
              )}

              {entry.notes && (
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.375rem', fontStyle: 'italic' }}>
                  {entry.notes}
                </div>
              )}

              <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '0.375rem' }}>
                by {entry.changed_by}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
