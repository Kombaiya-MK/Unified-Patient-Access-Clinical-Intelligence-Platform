/**
 * Responsive Card Component
 *
 * Content container: full-width mobile, CSS Grid desktop.
 * Supports elevated/flat/interactive variants per designsystem.md §2.4.
 *
 * @module Card/Card
 * @task US_044 TASK_003
 */

import React from 'react';
import '../../styles/form-responsive.css';

type CardVariant = 'elevated' | 'flat' | 'interactive';

interface CardProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Card title (renders header) */
  title?: string;
  /** Header action buttons */
  headerActions?: React.ReactNode;
  /** Footer action buttons */
  actions?: React.ReactNode;
  /** Click handler (interactive variant) */
  onClick?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Card content */
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  title,
  headerActions,
  actions,
  onClick,
  className = '',
  children,
}) => {
  const classes = [
    'card',
    `card--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  const isInteractive = variant === 'interactive' || !!onClick;

  const Element = isInteractive ? 'button' : 'div';
  const interactiveProps = isInteractive
    ? { onClick, type: 'button' as const, className: `${classes} card--interactive` }
    : { className: classes };

  return (
    <Element {...interactiveProps}>
      {title && (
        <div className="card__header">
          <h3 className="card__title">{title}</h3>
          {headerActions}
        </div>
      )}
      <div className="card__content">{children}</div>
      {actions && <div className="card__actions">{actions}</div>}
    </Element>
  );
};

interface CardGridProps {
  /** Additional CSS class */
  className?: string;
  children: React.ReactNode;
}

export const CardGrid: React.FC<CardGridProps> = ({ className = '', children }) => {
  return <div className={`card-grid ${className}`}>{children}</div>;
};
