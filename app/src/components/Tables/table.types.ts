/**
 * Responsive Table Type Definitions
 *
 * Shared types for the ResponsiveTable component family.
 *
 * @module Tables/types
 * @task US_044 TASK_004
 */

export interface ColumnDefinition<T> {
  /** Unique column key / data accessor */
  accessor: keyof T | string;
  /** Column header text */
  header: string;
  /** Custom cell renderer */
  render?: (row: T) => React.ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Hide column on mobile card view */
  hideOnMobile?: boolean;
  /** Hide column on tablet (narrow table) */
  hideOnTablet?: boolean;
  /** Cell text alignment */
  align?: 'left' | 'center' | 'right';
}
