/**
 * Accordion Component
 *
 * Collapsible sections for mobile-optimized long forms.
 * Smooth max-height transition, chevron rotation, accessible keyboard support.
 *
 * @module Accordion/Accordion
 * @task US_044 TASK_003
 */

import React, { useState, useCallback } from 'react';
import '../../styles/form-responsive.css';

interface AccordionItemData {
  /** Unique identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section content */
  content: React.ReactNode;
}

interface AccordionProps {
  /** Array of accordion items */
  items: AccordionItemData[];
  /** Allow multiple sections open */
  allowMultiple?: boolean;
  /** IDs of initially open sections */
  defaultOpen?: string[];
  /** Additional CSS class */
  className?: string;
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`accordion__chevron${open ? ' accordion__chevron--open' : ''}`}
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
);

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
}) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpen));

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(id);
        }
        return next;
      });
    },
    [allowMultiple]
  );

  return (
    <div className={`accordion ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const panelId = `accordion-panel-${item.id}`;
        const headerId = `accordion-header-${item.id}`;

        return (
          <div className="accordion__item" key={item.id}>
            <button
              id={headerId}
              className="accordion__header"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              type="button"
            >
              <span>{item.title}</span>
              <ChevronIcon open={isOpen} />
            </button>
            <div
              id={panelId}
              className={`accordion__panel${isOpen ? ' accordion__panel--open' : ''}`}
              role="region"
              aria-labelledby={headerId}
            >
              <div className="accordion__content">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
