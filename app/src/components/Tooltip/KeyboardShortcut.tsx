/**
 * KeyboardShortcut Tooltip Component
 *
 * Displays a tooltip with a keyboard shortcut badge on hover.
 * Example: hovering a "New Appointment" button shows "Ctrl+N".
 * Uses CSS-only tooltip — no external library required.
 *
 * @module Tooltip/KeyboardShortcut
 * @task US_044 TASK_008
 */

import React from 'react';

interface KeyboardShortcutProps {
  /** Shortcut key label (e.g. "Ctrl+N", "Esc") */
  shortcut: string;
  /** Tooltip text description */
  label?: string;
  /** Position of tooltip */
  position?: 'top' | 'bottom';
  /** Wrapped element */
  children: React.ReactNode;
}

const tooltipStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
};

function buildTipStyle(position: 'top' | 'bottom'): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 200ms ease',
    background: '#1A1A1A',
    color: '#FFFFFF',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };
  if (position === 'top') {
    base.bottom = 'calc(100% + 6px)';
  } else {
    base.top = 'calc(100% + 6px)';
  }
  return base;
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  borderRadius: '3px',
  fontSize: '11px',
  fontFamily: 'monospace',
  background: 'rgba(255, 255, 255, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  lineHeight: 1.4,
};

export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({
  shortcut,
  label,
  position = 'top',
  children,
}) => {
  const [visible, setVisible] = React.useState(false);
  const tipStyle = buildTipStyle(position);

  return (
    <span
      style={tooltipStyle}
      onMouseEnter={() => { setVisible(true); }}
      onMouseLeave={() => { setVisible(false); }}
      onFocus={() => { setVisible(true); }}
      onBlur={() => { setVisible(false); }}
    >
      {children}
      <span
        role="tooltip"
        aria-hidden={!visible}
        style={{ ...tipStyle, opacity: visible ? 1 : 0 }}
      >
        {label && <span>{label}</span>}
        <kbd style={badgeStyle}>{shortcut}</kbd>
      </span>
    </span>
  );
};
