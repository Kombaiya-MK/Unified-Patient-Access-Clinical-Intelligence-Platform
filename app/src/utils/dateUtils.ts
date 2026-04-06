/**
 * Date Utility Functions
 *
 * Helpers for appointment time checks used by no-show workflow.
 *
 * @module dateUtils
 * @created 2026-04-01
 * @task US_024 TASK_003, TASK_004
 */

/**
 * Check if an appointment time is more than 30 minutes in the past.
 * Used to determine if "Mark No-Show" button should be enabled.
 */
export function isPastThirtyMinutes(appointmentTime: string | Date): boolean {
  const appointmentDate = new Date(appointmentTime);
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return appointmentDate < thirtyMinutesAgo;
}

/**
 * Check if a no-show marking timestamp is within the 2-hour undo window.
 * Returns true if the undo action is still available.
 */
export function isWithinUndoWindow(markedAt: string | Date): boolean {
  const markedDate = new Date(markedAt);
  const twoHoursLater = markedDate.getTime() + 2 * 60 * 60 * 1000;
  return Date.now() < twoHoursLater;
}

/**
 * Get remaining undo time as a human-readable string.
 * Returns null if undo window has expired.
 */
export function getUndoTimeRemaining(markedAt: string | Date): string | null {
  const markedDate = new Date(markedAt);
  const expiresAt = markedDate.getTime() + 2 * 60 * 60 * 1000;
  const remaining = expiresAt - Date.now();

  if (remaining <= 0) return null;

  const minutes = Math.floor(remaining / 60000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m left`;
  }
  return `${minutes}m left`;
}
