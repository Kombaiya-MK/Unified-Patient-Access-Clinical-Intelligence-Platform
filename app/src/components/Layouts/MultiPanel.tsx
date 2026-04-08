/**
 * MultiPanel Layout Component
 *
 * Desktop: 2-column CSS Grid (40% list, 60% detail).
 * Tablet/Mobile: Single column stack.
 *
 * @module Layouts/MultiPanel
 * @task US_044 TASK_008
 */

import React from 'react';
import '../../styles/multi-panel-layout.css';

interface MultiPanelProps {
  /** Left panel content (list view) */
  left: React.ReactNode;
  /** Right panel content (detail view) */
  right: React.ReactNode;
  /** Left panel heading */
  leftTitle?: string;
  /** Right panel heading */
  rightTitle?: string;
  /** Additional CSS class */
  className?: string;
}

export const MultiPanel: React.FC<MultiPanelProps> = ({
  left,
  right,
  leftTitle,
  rightTitle,
  className = '',
}) => {
  return (
    <div className={`multi-panel ${className}`}>
      <section className="multi-panel__left" aria-label={leftTitle || 'List panel'}>
        {leftTitle && (
          <div className="multi-panel__header">
            <h2 className="multi-panel__title">{leftTitle}</h2>
          </div>
        )}
        {left}
      </section>
      <section className="multi-panel__right" aria-label={rightTitle || 'Detail panel'}>
        {rightTitle && (
          <div className="multi-panel__header">
            <h2 className="multi-panel__title">{rightTitle}</h2>
          </div>
        )}
        {right}
      </section>
    </div>
  );
};
