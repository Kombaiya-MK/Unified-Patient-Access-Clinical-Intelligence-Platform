/**
 * TimeSlotsGrid Component
 * 
 * Grid display of available time slots with 30-minute intervals.
 * Shows availability status with color coding and allows slot selection.
 * 
 * @module TimeSlotsGrid
 * @created 2026-03-18
 * @task US_013 TASK_001
 */

import React, { useMemo } from 'react';
import { format, parseISO, isAfter, addHours, isValid } from 'date-fns';
import type { Slot } from '../types/appointment.types';
import './TimeSlotsGrid.css';

/**
 * Safely parse a time string that may be ISO datetime or bare HH:MM:SS
 */
const safeParseSlotTime = (timeStr: string, fallbackDate?: Date | null): Date => {
  // Try ISO format first (e.g. "2026-04-03T08:00:00")
  const parsed = parseISO(timeStr);
  if (isValid(parsed)) {
    return parsed;
  }

  // Bare time string (e.g. "08:00:00") — combine with fallback date
  if (/^\d{2}:\d{2}/.test(timeStr) && fallbackDate) {
    const dateStr = format(fallbackDate, 'yyyy-MM-dd');
    const combined = parseISO(`${dateStr}T${timeStr}`);
    if (isValid(combined)) {
      return combined;
    }
  }

  return new Date(timeStr);
};

interface TimeSlotsGridProps {
  /** Array of available slots for the selected date */
  slots: Slot[];
  /** Currently selected slot ID */
  selectedSlotId: string | null;
  /** Callback when slot is selected */
  onSlotSelect: (slot: Slot) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Selected date for context */
  selectedDate: Date | null;
}

/**
 * Time slots grid with availability indicators
 * 
 * Features:
 * - 30-minute time slot intervals
 * - Visual status: Available (green), Booked (gray), Selected (blue)
 * - Keyboard navigation (Tab, Enter, Space)
 * - WCAG 2.2 AA compliant (4.5:1 contrast, ARIA labels)
 * - Responsive grid layout
 * - Same-day booking restrictions (>2 hours from now)
 * 
 * @example
 * ```tsx
 * <TimeSlotsGrid
 *   slots={availableSlots}
 *   selectedSlotId={selectedSlot?.id}
 *   onSlotSelect={setSelectedSlot}
 *   selectedDate={selectedDate}
 * />
 * ```
 */
export const TimeSlotsGrid: React.FC<TimeSlotsGridProps> = ({
  slots,
  selectedSlotId,
  onSlotSelect,
  isLoading = false,
  selectedDate,
}) => {
  /**
   * Check if slot is within same-day restriction (< 2 hours from now)
   */
  const isTooSoon = (slotStartTime: string): boolean => {
    const slotTime = safeParseSlotTime(slotStartTime, selectedDate);
    if (!isValid(slotTime)) return true;
    const twoHoursFromNow = addHours(new Date(), 2);
    return !isAfter(slotTime, twoHoursFromNow);
  };

  /**
   * Group slots by time for easier rendering
   * Key: time string (e.g., "09:00 AM")
   * Value: slot or null if not available
   */
  const slotsByTime = useMemo(() => {
    const grouped = new Map<string, Slot | null>();

    slots.forEach((slot) => {
      try {
        const parsed = safeParseSlotTime(slot.startTime, selectedDate);
        if (isValid(parsed)) {
          const timeKey = format(parsed, 'h:mm a');
          grouped.set(timeKey, slot);
        }
      } catch {
        // Skip slots with unparseable times
      }
    });

    return grouped;
  }, [slots]);

  /**
   * Get slot status class name
   */
  const getSlotClassName = (slot: Slot | null): string => {
    const classes = ['time-slot'];

    if (!slot || !slot.isAvailable) {
      classes.push('slot-booked');
      return classes.join(' ');
    }

    // Check same-day restriction
    if (isTooSoon(slot.startTime)) {
      classes.push('slot-booked');
      return classes.join(' ');
    }

    if (slot.id === selectedSlotId) {
      classes.push('slot-selected');
    } else {
      classes.push('slot-available');
    }

    return classes.join(' ');
  };

  /**
   * Get slot button label for accessibility
   */
  const getSlotAriaLabel = (slot: Slot | null, timeString: string): string => {
    if (!slot) {
      return `${timeString} - Not available`;
    }

    if (!slot.isAvailable) {
      return `${timeString} - Already booked`;
    }

    if (isTooSoon(slot.startTime)) {
      return `${timeString} - Too soon to book (requires 2 hours advance notice)`;
    }

    if (slot.id === selectedSlotId) {
      return `${timeString} - Selected`;
    }

    return `${timeString} - Available, select this time`;
  };

  /**
   * Handle slot selection
   */
  const handleSlotClick = (slot: Slot | null) => {
    if (!slot || !slot.isAvailable || isTooSoon(slot.startTime)) {
      return;
    }

    onSlotSelect(slot);
  };

  /**
   * Handle keyboard interaction
   */
  const handleKeyDown = (
    e: React.KeyboardEvent,
    slot: Slot | null
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSlotClick(slot);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="time-slots-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="time-slot slot-skeleton" aria-hidden="true">
            <div className="skeleton-shimmer"></div>
          </div>
        ))}
      </div>
    );
  }

  // No date selected
  if (!selectedDate) {
    return (
      <div className="time-slots-empty">
        <p>Select a date to view available time slots</p>
      </div>
    );
  }

  // No slots available
  if (slots.length === 0) {
    return (
      <div className="time-slots-empty">
        <p>No appointments available for this date</p>
        <p className="text-muted">
          Try selecting a different date or adjusting your filters
        </p>
      </div>
    );
  }

  // Render time slots
  const timeSlots = Array.from(slotsByTime.entries());

  return (
    <div className="time-slots-container">
      <div className="time-slots-header">
        <h3>Available Times</h3>
        <span className="slots-date">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </span>
      </div>

      <div className="time-slots-grid" role="group" aria-label="Available time slots">
        {timeSlots.map(([timeString, slot]) => {
          const isDisabled = !slot || !slot.isAvailable || isTooSoon(slot.startTime);
          const className = getSlotClassName(slot);
          const ariaLabel = getSlotAriaLabel(slot, timeString);

          return (
            <button
              key={timeString}
              type="button"
              className={className}
              onClick={() => handleSlotClick(slot)}
              onKeyDown={(e) => handleKeyDown(e, slot)}
              disabled={isDisabled}
              aria-label={ariaLabel}
              aria-pressed={slot?.id === selectedSlotId}
              tabIndex={isDisabled ? -1 : 0}
            >
              <span className="slot-time">{timeString}</span>
              {slot && slot.id === selectedSlotId && (
                <span className="slot-badge">Selected</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="time-slots-legend">
        <div className="legend-item">
          <span className="legend-indicator available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator booked"></span>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator selected"></span>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotsGrid;
