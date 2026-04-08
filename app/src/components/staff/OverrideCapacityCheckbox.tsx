/**
 * OverrideCapacityCheckbox Component
 * 
 * Checkbox with warning message for overriding slot capacity.
 * Used in staff booking form for urgent cases.
 * 
 * @module OverrideCapacityCheckbox
 * @created 2026-04-01
 * @task US_023 TASK_004
 */

import React from 'react';

interface OverrideCapacityCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox value changes */
  onChange: (checked: boolean) => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
}

export const OverrideCapacityCheckbox: React.FC<OverrideCapacityCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="override-capacity">
      <label className="override-capacity__label">
        <input
          type="checkbox"
          className="override-capacity__checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-describedby={checked ? 'override-capacity-warning' : undefined}
        />
        Override slot capacity (urgent cases only)
      </label>

      {checked && (
        <div
          id="override-capacity-warning"
          className="override-capacity__warning"
          role="alert"
        >
          <span className="override-capacity__warning-icon" aria-hidden="true">
            ⚠️
          </span>
          This will book over the provider's capacity limit
        </div>
      )}
    </div>
  );
};
