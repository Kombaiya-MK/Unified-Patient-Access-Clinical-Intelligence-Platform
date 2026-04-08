/**
 * Merge Timeline
 * SVG-based timeline visualization of merge events on a patient profile.
 * @module components/patient/MergeTimeline
 * @task US_030 TASK_004
 */

import React from 'react';
import type { MergeLogEntry } from '../../types/document.types';

interface MergeTimelineProps {
  mergeHistory: MergeLogEntry[];
}

const DOT_RADIUS = 6;
const LINE_HEIGHT = 80;
const LEFT_MARGIN = 30;

export const MergeTimeline: React.FC<MergeTimelineProps> = ({ mergeHistory }) => {
  if (mergeHistory.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
        No merge history available
      </p>
    );
  }

  const sorted = [...mergeHistory].sort(
    (a, b) => new Date(a.merge_timestamp).getTime() - new Date(b.merge_timestamp).getTime(),
  );

  const svgHeight = sorted.length * LINE_HEIGHT + 20;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" height={svgHeight} viewBox={`0 0 500 ${svgHeight}`}>
        {sorted.map((entry, idx) => {
          const y = idx * LINE_HEIGHT + 20;
          const hasConflicts = entry.conflicts_detected.length > 0;

          return (
            <g key={entry.id}>
              {/* Connecting line */}
              {idx < sorted.length - 1 && (
                <line
                  x1={LEFT_MARGIN}
                  y1={y + DOT_RADIUS}
                  x2={LEFT_MARGIN}
                  y2={y + LINE_HEIGHT - DOT_RADIUS}
                  stroke="#d1d5db"
                  strokeWidth={2}
                />
              )}

              {/* Timeline dot */}
              <circle
                cx={LEFT_MARGIN}
                cy={y}
                r={DOT_RADIUS}
                fill={hasConflicts ? '#f59e0b' : '#22c55e'}
                stroke="#fff"
                strokeWidth={2}
              />

              {/* Date label */}
              <text x={LEFT_MARGIN + 16} y={y - 4} fontSize={11} fill="#6b7280">
                {new Date(entry.merge_timestamp).toLocaleString()}
              </text>

              {/* Merge summary */}
              <text x={LEFT_MARGIN + 16} y={y + 14} fontSize={12} fill="#111827" fontWeight="500">
                {entry.source_documents.length} documents merged
                {hasConflicts ? ` (${entry.conflicts_detected.length} conflicts)` : ''}
              </text>

              {/* Algorithm version */}
              <text x={LEFT_MARGIN + 16} y={y + 30} fontSize={10} fill="#9ca3af">
                {entry.performed_by === 'system' ? 'Auto-merge' : 'Manual'} &middot; v{entry.algorithm_version}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
