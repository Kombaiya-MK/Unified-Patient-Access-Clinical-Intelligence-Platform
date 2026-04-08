/**
 * ResponsiveTable Component
 *
 * Main responsive table that switches between card layout on mobile
 * (<768px) and traditional HTML table on tablet/desktop (≥768px).
 *
 * Features:
 * - Mobile: stacked key-value card layout via TableCard
 * - Tablet: traditional table with horizontal scroll + shadows
 * - Desktop: full table with all columns visible
 * - Sortable column headers
 * - Column visibility rules (hideOnMobile, hideOnTablet)
 * - Touch-friendly card spacing (≥8px gap)
 * - WCAG 2.2 AA accessible
 *
 * @module Tables/ResponsiveTable
 * @task US_044 TASK_004
 */

import React, { useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { TableCard } from './TableCard';
import { TableRow } from './TableRow';
import { TableScrollContainer } from './TableScrollContainer';
import '../../styles/responsive-table.css';

import type { ColumnDefinition } from './table.types';

export type { ColumnDefinition };

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: string;
  direction: SortDirection;
}

interface ResponsiveTableProps<T> {
  /** Data array */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Unique key accessor for each row */
  keyAccessor: keyof T | ((row: T) => string);
  /** Optional custom card template for mobile */
  renderCard?: (row: T) => React.ReactNode;
  /** Optional row actions column */
  actions?: (row: T) => React.ReactNode;
  /** Current sort configuration */
  sort?: SortConfig;
  /** Sort change handler */
  onSort?: (field: string) => void;
  /** Table caption for accessibility */
  caption?: string;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS class */
  className?: string;
}

function getRowKey<T>(row: T, keyAccessor: keyof T | ((row: T) => string)): string {
  if (typeof keyAccessor === 'function') {
    return keyAccessor(row);
  }
  return String(row[keyAccessor]);
}

function SortIndicator({ field, sort }: { field: string; sort?: SortConfig }) {
  if (!sort || sort.field !== field) {
    return <span className="rt-sort-icon rt-sort-icon--inactive" aria-hidden="true">⇅</span>;
  }
  return (
    <span className="rt-sort-icon" aria-hidden="true">
      {sort.direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function getAriaSortValue(field: string, sort?: SortConfig): 'ascending' | 'descending' | 'none' {
  if (!sort || sort.field !== field) {
    return 'none';
  }
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyAccessor,
  renderCard,
  actions,
  sort,
  onSort,
  caption,
  loading,
  emptyMessage = 'No data available',
  className = '',
}: ResponsiveTableProps<T>) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  const handleSort = useCallback(
    (field: string) => {
      if (onSort) {
        onSort(field);
      }
    },
    [onSort]
  );

  if (loading) {
    return (
      <div className={`rt-container ${className}`} role="status" aria-label="Loading table data">
        <div className="rt-loading">
          <div className="rt-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`rt-container ${className}`} role="status">
        <div className="rt-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Mobile: card layout
  if (isMobile) {
    return (
      <div className={`rt-container rt-container--cards ${className}`} role="list" aria-label={caption}>
        {data.map((row, index) => (
          <TableCard
            key={getRowKey(row, keyAccessor)}
            row={row}
            columns={columns}
            renderCard={renderCard}
            actions={actions}
            index={index}
          />
        ))}
      </div>
    );
  }

  // Tablet / Desktop: table layout with scroll container
  const visibleColumns = columns.filter((col) => !(isTablet && col.hideOnTablet));

  return (
    <div className={`rt-container ${className}`}>
      <TableScrollContainer>
        <table className="rt-table" aria-label={caption}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={String(col.accessor)}
                  scope="col"
                  className={[
                    col.sortable ? 'rt-th--sortable' : '',
                    col.align ? `rt-th--${col.align}` : '',
                  ].filter(Boolean).join(' ') || undefined}
                  onClick={col.sortable ? () => handleSort(String(col.accessor)) : undefined}
                  onKeyDown={
                    col.sortable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSort(String(col.accessor));
                          }
                        }
                      : undefined
                  }
                  tabIndex={col.sortable ? 0 : undefined}
                  aria-sort={col.sortable ? getAriaSortValue(String(col.accessor), sort) : undefined}
                >
                  {col.header}
                  {col.sortable && <SortIndicator field={String(col.accessor)} sort={sort} />}
                </th>
              ))}
              {actions && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <TableRow
                key={getRowKey(row, keyAccessor)}
                row={row}
                columns={visibleColumns}
                index={index}
                actions={actions}
                isTablet={isTablet}
              />
            ))}
          </tbody>
        </table>
      </TableScrollContainer>
    </div>
  );
}
