/**
 * CollapsibleSection Component
 *
 * Accordion-style collapsible section for long forms on mobile.
 * Expand/collapse with smooth max-height animation,
 * chevron icon rotation, accessible aria-expanded button.
 *
 * Unlike the generic Accordion that takes an items array,
 * CollapsibleSection wraps a single form section inline.
 *
 * @module Forms/CollapsibleSection
 * @task US_044 TASK_003
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import '../../styles/form-responsive.css';

interface CollapsibleSectionProps {
  /** Section title displayed in the header */
  title: string;
  /** Whether the section starts expanded */
  defaultOpen?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Section content (form fields) */
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  className = '',
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(defaultOpen ? 'none' : '0px');

  const sectionId = `collapsible-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const panelId = `${sectionId}-panel`;
  const headerId = `${sectionId}-header`;

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
      // After transition completes, set to 'none' for dynamic content
      const timer = setTimeout(() => {
        setMaxHeight('none');
      }, 300);
      return () => clearTimeout(timer);
    }
    setMaxHeight('0px');
    return undefined;
  }, [isOpen]);

  return (
    <div className={`collapsible-section ${className}`}>
      <button
        id={headerId}
        className="collapsible-section__header"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        type="button"
      >
        <span className="collapsible-section__title">{title}</span>
        <svg
          className={`collapsible-section__chevron${isOpen ? ' collapsible-section__chevron--open' : ''}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        id={panelId}
        ref={contentRef}
        className={`collapsible-section__panel${isOpen ? ' collapsible-section__panel--open' : ''}`}
        role="region"
        aria-labelledby={headerId}
        style={{ maxHeight, overflow: isOpen && maxHeight === 'none' ? 'visible' : 'hidden' }}
      >
        <div className="collapsible-section__content">
          {children}
        </div>
      </div>
    </div>
  );
};
