/**
 * TableScrollContainer Component
 *
 * Horizontal scroll wrapper for wide tables on tablet/desktop.
 * Shows CSS-gradient scroll shadows to indicate more content
 * in overflow direction.
 *
 * @module Tables/TableScrollContainer
 * @task US_044 TASK_004
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface TableScrollContainerProps {
  /** Table content */
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

export const TableScrollContainer: React.FC<TableScrollContainerProps> = ({
  children,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const updateShadows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateShadows();
    const el = scrollRef.current;
    if (!el) {
      return undefined;
    }

    el.addEventListener('scroll', updateShadows, { passive: true });
    const observer = new ResizeObserver(updateShadows);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateShadows);
      observer.disconnect();
    };
  }, [updateShadows]);

  const shadowClasses = [
    'table-scroll-container',
    showLeftShadow ? 'table-scroll-container--shadow-left' : '',
    showRightShadow ? 'table-scroll-container--shadow-right' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={shadowClasses}>
      <div ref={scrollRef} className="table-scroll-container__inner">
        {children}
      </div>
    </div>
  );
};
