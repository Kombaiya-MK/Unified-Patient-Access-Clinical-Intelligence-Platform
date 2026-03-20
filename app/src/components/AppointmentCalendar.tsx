/**
 * AppointmentCalendar Component
 * 
 * Calendar component for selecting appointment dates with visual indicators
 * for date availability. Uses react-calendar with custom styling and
 * accessibility features.
 * 
 * @module AppointmentCalendar
 * @created 2026-03-18
 * @task US_013 TASK_001
 */

import React, { useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AppointmentCalendar.css';

interface AppointmentCalendarProps {
  /** Currently selected date */
  selectedDate: Date | null;
  /** Callback when date is selected */
  onDateSelect: (date: Date) => void;
  /** Array of dates with available slots (YYYY-MM-DD format) */
  availableDates?: string[];
  /** Minimum selectable date (defaults to today) */
  minDate?: Date;
  /** Maximum selectable date (defaults to 3 months from now) */
  maxDate?: Date;
}

/**
 * Calendar component with availability highlighting
 * 
 * Features:
 * - Highlights dates with available slots (green border)
 * - Shows selected date (blue background)
 * - Disables past dates
 * - Keyboard navigation (Arrow keys, Enter)
 * - WCAG 2.2 AA compliant
 * 
 * @example
 * ```tsx
 * <AppointmentCalendar
 *   selectedDate={selectedDate}
 *   onDateSelect={setSelectedDate}
 *   availableDates={['2026-03-20', '2026-03-21']}
 * />
 * ```
 */
export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  selectedDate,
  onDateSelect,
  availableDates = [],
  minDate = new Date(),
  maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
}) => {
  // Convert available dates array to Set for O(1) lookup
  const availableDatesSet = useMemo(() => {
    return new Set(availableDates);
  }, [availableDates]);

  /**
   * Format date to YYYY-MM-DD for comparison
   */
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  /**
   * Check if date has available slots
   */
  const isDateAvailable = (date: Date): boolean => {
    return availableDatesSet.has(formatDate(date));
  };

  /**
   * Custom tile content - add dot indicator for available dates
   */
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    if (isDateAvailable(date)) {
      return (
        <div className="availability-indicator" aria-label="Available slots" />
      );
    }

    return null;
  };

  /**
   * Custom tile class names for styling
   */
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const classes: string[] = [];

    // Highlight available dates
    if (isDateAvailable(date)) {
      classes.push('available-date');
    }

    // Highlight selected date
    if (selectedDate && formatDate(date) === formatDate(selectedDate)) {
      classes.push('selected-date');
    }

    return classes.join(' ');
  };

  /**
   * Disable dates that are in the past or have no availability
   */
  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;

    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Don't disable dates without slots - allow clicking to show "no slots" message
    return false;
  };

  /**
   * Handle date selection
   */
  const handleDateChange = (value: unknown) => {
    if (value instanceof Date) {
      onDateSelect(value);
    }
  };

  return (
    <div className="appointment-calendar-container" role="application" aria-label="Appointment calendar">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        minDate={minDate}
        maxDate={maxDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
        locale="en-US"
        calendarType="gregory"
        // Navigation
        showNeighboringMonth={false}
        // Formatting
        formatShortWeekday={(locale, date) =>
          date.toLocaleDateString(locale, { weekday: 'narrow' })
        }
      />
      
      <div className="calendar-legend" role="list" aria-label="Calendar legend">
        <div className="legend-item" role="listitem">
          <span className="legend-dot available" aria-label="Available"></span>
          <span>Available Slots</span>
        </div>
        <div className="legend-item" role="listitem">
          <span className="legend-dot selected" aria-label="Selected"></span>
          <span>Selected Date</span>
        </div>
        <div className="legend-item" role="listitem">
          <span className="legend-dot unavailable" aria-label="Unavailable"></span>
          <span>No Slots</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
