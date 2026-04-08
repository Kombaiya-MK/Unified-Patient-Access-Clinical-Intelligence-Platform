/**
 * BottomSheet Component
 *
 * Mobile-only bottom sheet container with slide-up animation.
 * Features: translateY(100%) -> translateY(0), backdrop overlay,
 * close on backdrop click, drag handle, body scroll lock.
 *
 * @module Forms/BottomSheet
 * @task US_044 TASK_003
 */

import React, { useEffect, useCallback, useRef } from 'react';
import '../../styles/bottom-sheet.css';

interface BottomSheetProps {
  /** Whether the bottom sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Sheet title */
  title: string;
  /** Footer content (action buttons) */
  footer?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Sheet content */
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  footer,
  className = '',
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
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

      requestAnimationFrame(() => {
        sheetRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
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

  return (
    <>
      <div
        className="bottom-sheet-overlay bottom-sheet-overlay--open"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`bottom-sheet bottom-sheet--open ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="bottom-sheet__drag-handle" />
        <div className="bottom-sheet__header">
          <h2 className="bottom-sheet__title">{title}</h2>
          <button
            className="bottom-sheet__close"
            onClick={onClose}
            aria-label="Close"
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
        <div className="bottom-sheet__body">
          {children}
        </div>
        {footer && (
          <div className="bottom-sheet__footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};
