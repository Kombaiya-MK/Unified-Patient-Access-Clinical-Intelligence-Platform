/**
 * TableRow Component
 *
 * Standard HTML table row for desktop rendering.
 * Maps column definitions to `<td>` cells with proper alignment.
 *
 * @module Tables/TableRow
 * @task US_044 TASK_004
 */

import React from 'react';
import type { ColumnDefinition } from './table.types';

interface TableRowProps<T> {
  /** Row data object */
  row: T;
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Row index */
  index: number;
  /** Optional row actions */
  actions?: (row: T) => React.ReactNode;
  /** Whether column is hidden on tablet */
  isTablet?: boolean;
}

export function TableRow<T>({ row, columns, index, actions, isTablet }: TableRowProps<T>) {
  return (
    <tr data-row-index={index}>
      {columns
        .filter((col) => !(isTablet && col.hideOnTablet))
        .map((col) => {
          const value = col.render
            ? col.render(row)
            : String((row as Record<string, unknown>)[col.accessor as string] ?? '');

          return (
            <td
              key={String(col.accessor)}
              className={col.align ? `table-cell--${col.align}` : undefined}
            >
              {value}
            </td>
          );
        })}
      {actions && (
        <td className="table-cell--actions">
          {actions(row)}
        </td>
      )}
    </tr>
  );
}
