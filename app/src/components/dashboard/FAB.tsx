/**
 * FAB (Floating Action Button) Component
 *
 * Fixed-position primary action button for mobile/tablet.
 * Hidden on desktop (≥1025px) via CSS. WCAG-compliant with
 * min 56px touch target and aria-label.
 *
 * @module Dashboard/FAB
 * @task US_044 TASK_005
 */

import React from 'react';
import '../../styles/dashboard-responsive.css';

interface FABProps {
  icon: string;
  label: string;
  onClick: () => void;
  ariaLabel?: string;
}

export const FAB: React.FC<FABProps> = ({
  icon,
  label,
  onClick,
  ariaLabel,
}) => (
  <button
    className="fab"
    onClick={onClick}
    aria-label={ariaLabel || label}
    type="button"
  >
    <span className="fab__icon" aria-hidden="true">{icon}</span>
    <span className="fab__label">{label}</span>
  </button>
);
