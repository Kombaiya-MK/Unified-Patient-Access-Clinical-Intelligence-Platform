/**
 * TableCard Component
 *
 * Mobile card layout for a single table row, displaying data
 * as stacked key-value pairs. Touch-friendly with adequate
 * spacing (≥8px between cards, ≥44px action targets).
 *
 * @module Tables/TableCard
 * @task US_044 TASK_004
 */

import React from 'react';
import type { ColumnDefinition } from './table.types';

interface TableCardProps<T> {
  /** Row data object */
  row: T;
  /** Column definitions for key-value display */
  columns: ColumnDefinition<T>[];
  /** Optional custom card renderer */
  renderCard?: (row: T) => React.ReactNode;
  /** Optional row actions */
  actions?: (row: T) => React.ReactNode;
  /** Row index for key generation */
  index: number;
}

export function TableCard<T>({ row, columns, renderCard, actions, index }: TableCardProps<T>) {
  if (renderCard) {
    return (
      <div className="table-card" data-row-index={index}>
        {renderCard(row)}
      </div>
    );
  }

  return (
    <div className="table-card" data-row-index={index}>
      <dl className="table-card__fields">
        {columns
          .filter((col) => !col.hideOnMobile)
          .map((col) => {
            const value = col.render
              ? col.render(row)
              : String((row as Record<string, unknown>)[col.accessor as string] ?? '');

            return (
              <div className="table-card__field" key={String(col.accessor)}>
                <dt className="table-card__label">{col.header}</dt>
                <dd className="table-card__value">{value}</dd>
              </div>
            );
          })}
      </dl>
      {actions && (
        <div className="table-card__actions">
          {actions(row)}
        </div>
      )}
    </div>
  );
}
