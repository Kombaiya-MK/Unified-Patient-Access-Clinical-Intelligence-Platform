/**
 * Queue Table Component
 * 
 * Sortable data table for the queue management page.
 * Desktop view shows a full table; mobile (<768px) shows card grid.
 * Sortable headers toggle ASC/DESC on click.
 * 
 * @module QueueTable
 * @created 2026-03-31
 * @task US_020 TASK_001
 */

import React from 'react';
import { QueueTableRow } from './QueueTableRow';
import { QueueMobileCard } from './QueueMobileCard';
import type {
  QueueAppointment,
  QueueSortConfig,
  QueueSortField,
  QueueStatus,
} from '../../types/queue.types';
import './QueueTable.css';

/**
 * Resolve aria-sort value for a sortable column header
 */
const getAriaSortValue = (
  field: QueueSortField,
  sort: QueueSortConfig,
): 'ascending' | 'descending' | 'none' => {
  if (sort.field !== field) {
    return 'none';
  }
  return sort.direction === 'asc' ? 'ascending' : 'descending';
};

interface QueueTableProps {
  /** Filtered and sorted appointments */
  appointments: QueueAppointment[];
  /** Current sort configuration */
  sort: QueueSortConfig;
  /** Callback to toggle sort on a field */
  onSort: (field: QueueSortField) => void;
  /** Total count of appointments (unfiltered) */
  totalCount: number;
  /** ID of currently updating appointment */
  updatingId: string | null;
  /** Callback for status update */
  onStatusUpdate: (appointmentId: string, newStatus: QueueStatus, version: number) => void;
}

/**
 * Sort indicator arrow for column headers
 */
const SortIndicator: React.FC<{ field: QueueSortField; sort: QueueSortConfig }> = ({
  field,
  sort,
}) => {
  if (sort.field !== field) {
    return <span className="queue-sort-icon queue-sort-icon--inactive" aria-hidden="true">⇅</span>;
  }
  return (
    <span className="queue-sort-icon" aria-hidden="true">
      {sort.direction === 'asc' ? '↑' : '↓'}
    </span>
  );
};

/**
 * Queue Table Component
 * 
 * Renders the queue as a sortable HTML table on desktop and
 * a card grid on mobile using CSS media queries.
 */
export const QueueTable: React.FC<QueueTableProps> = ({
  appointments,
  sort,
  onSort,
  totalCount,
  updatingId,
  onStatusUpdate,
}) => {
  return (
    <div className="queue-table-container">
      <div className="queue-table__header-bar">
        <h2 className="queue-table__title">Today's Queue</h2>
        <span className="queue-table__count-badge">
          {appointments.length} IN QUEUE
        </span>
      </div>

      {/* Desktop Table View */}
      <div className="queue-table__desktop">
        <table className="queue-table" aria-label="Patient queue" aria-live="polite">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Patient ID</th>
              <th scope="col">Patient</th>
              <th
                scope="col"
                className="queue-table__sortable"
                onClick={() => onSort('appointmentTime')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort('appointmentTime'); } }}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSortValue('appointmentTime', sort)}
              >
                Appointment Time
                <SortIndicator field="appointmentTime" sort={sort} />
              </th>
              <th scope="col">Type</th>
              <th scope="col">Department</th>
              <th
                scope="col"
                className="queue-table__sortable"
                onClick={() => onSort('status')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort('status'); } }}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSortValue('status', sort)}
              >
                Status
                <SortIndicator field="status" sort={sort} />
              </th>
              <th scope="col">Intake Status</th>
              <th scope="col">Wait Time</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment, index) => (
              <QueueTableRow
                key={appointment.id}
                appointment={appointment}
                index={index}
                isUpdating={updatingId === appointment.id}
                onStatusUpdate={onStatusUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="queue-table__mobile">
        {appointments.map((appointment) => (
          <QueueMobileCard
            key={appointment.id}
            appointment={appointment}
            isUpdating={updatingId === appointment.id}
            onStatusUpdate={onStatusUpdate}
          />
        ))}
      </div>

      {/* Footer with count */}
      <div className="queue-table__footer">
        <span className="queue-table__showing">
          Showing {appointments.length} of {totalCount} patients
        </span>
      </div>
    </div>
  );
};
