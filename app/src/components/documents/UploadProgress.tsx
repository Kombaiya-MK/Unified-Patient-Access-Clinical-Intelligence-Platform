/**
 * Upload Progress Component
 * Shows upload progress bars with percentage, speed, ETA, and cancel.
 * @module components/documents/UploadProgress
 * @task US_028 TASK_003
 */

import React from 'react';
import type { UploadProgressInfo } from '../../types/document.types';
import { formatFileSize, formatSpeed, formatEta } from '../../utils/formatFileSize';

interface UploadProgressProps {
  progressItems: Record<string, UploadProgressInfo>;
  onCancel: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ progressItems, onCancel }) => {
  const items = Object.values(progressItems);
  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
        Uploading ({items.length} files)
      </h3>
      {items.map((item) => (
        <div
          key={item.uploadId}
          style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            marginBottom: 8,
            backgroundColor: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.status === 'completed' && <span style={{ color: '#22c55e' }}>✓</span>}
              {item.status === 'failed' && <span style={{ color: '#ef4444' }}>✕</span>}
              {item.status === 'uploading' && <span style={{ color: '#3b82f6' }}>⏳</span>}
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {item.status === 'completed' ? 'Uploaded' : item.status === 'failed' ? 'Failed' : `${item.percentage}%`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: '#6b7280' }}>
              {item.status === 'uploading' && (
                <>
                  <span>{formatSpeed(item.speed)}</span>
                  <span>{formatEta(item.eta)}</span>
                  <button
                    onClick={onCancel}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}
                    aria-label="Cancel upload"
                  >
                    ✕
                  </button>
                </>
              )}
              {item.status === 'completed' && (
                <span>{formatFileSize(item.total)}</span>
              )}
            </div>
          </div>
          <div style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${item.percentage}%`,
                backgroundColor: item.status === 'failed' ? '#ef4444' : item.status === 'completed' ? '#22c55e' : '#3b82f6',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {item.error && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>⚠️ {item.error}</p>
          )}
        </div>
      ))}
    </div>
  );
};
