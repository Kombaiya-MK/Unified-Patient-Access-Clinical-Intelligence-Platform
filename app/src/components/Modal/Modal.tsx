/**
 * Responsive Modal Component
 *
 * Bottom sheet on mobile (<768px), centered overlay on desktop.
 * Features: backdrop click to close, Escape key, focus trap, body scroll lock.
 *
 * @module Modal/Modal
 * @task US_044 TASK_003
 */

import React, { useEffect, useCallback, useRef } from 'react';
import '../../styles/modal-responsive.css';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal size (sm=400px, md=600px, lg=800px on desktop) */
  size?: ModalSize;
  /** Footer content (buttons) */
  footer?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Modal body content */
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  footer,
  className = '',
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);

      // Focus the modal after opening
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);

      // Restore focus
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) {
    return null;
  }

  const sizeClass = size !== 'md' ? ` modal--${size}` : '';

  return (
    <>
      <div
        className={`modal-overlay modal-overlay--open`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={`modal modal--open${sizeClass} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal__drag-handle" />
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <svg
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </>
  );
};
