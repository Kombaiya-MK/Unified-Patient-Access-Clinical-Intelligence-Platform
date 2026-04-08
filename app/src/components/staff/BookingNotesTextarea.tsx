/**
 * BookingNotesTextarea Component
 * 
 * Textarea for internal staff notes with character counter.
 * Max 500 characters.
 * 
 * @module BookingNotesTextarea
 * @created 2026-04-01
 * @task US_023 TASK_004
 */

import React from 'react';

interface BookingNotesTextareaProps {
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Whether the textarea is disabled */
  disabled?: boolean;
}

const MAX_CHARS = 500;

export const BookingNotesTextarea: React.FC<BookingNotesTextareaProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const charCount = value.length;
  const isWarning = charCount > 400;
  const isLimit = charCount >= MAX_CHARS;

  const charCountClass = [
    'staff-booking-form__char-count',
    isLimit
      ? 'staff-booking-form__char-count--limit'
      : isWarning
        ? 'staff-booking-form__char-count--warning'
        : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="staff-booking-form__field">
      <label htmlFor="booking-notes" className="staff-booking-form__label">
        Booking Notes (Internal)
      </label>
      <textarea
        id="booking-notes"
        className="staff-booking-form__textarea"
        placeholder="Add notes about this booking (visible to staff only)"
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) {
            onChange(e.target.value);
          }
        }}
        maxLength={MAX_CHARS}
        rows={3}
        disabled={disabled}
        aria-describedby="booking-notes-count"
      />
      <div id="booking-notes-count" className={charCountClass}>
        {charCount}/{MAX_CHARS} characters
      </div>
    </div>
  );
};
