/**
 * TouchTargetValidator Component (Dev Tool)
 *
 * Scans all interactive elements on the page and highlights any
 * whose bounding box is smaller than 44x44px with a red dashed
 * outline + size label. Only renders in development mode.
 *
 * Usage: Mount once in App.tsx during development:
 *   {import.meta.env.DEV && <TouchTargetValidator />}
 *
 * @module TouchTargets/TouchTargetValidator
 * @task US_044 TASK_007
 */

import { useEffect, useCallback, type FC } from 'react';

const MIN_TARGET_SIZE = 44;
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"], [role="tab"], [tabindex]';
const VIOLATION_CLASS = 'touch-target-violation';

export const TouchTargetValidator: FC = () => {
  const validate = useCallback(() => {
    // Remove old violations
    document.querySelectorAll(`.${VIOLATION_CLASS}`).forEach((el) => {
      el.classList.remove(VIOLATION_CLASS);
      el.removeAttribute('data-touch-violation');
    });

    const elements = document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR);

    elements.forEach((el) => {
      // Skip hidden elements
      if (el.offsetParent === null && el.tagName !== 'BODY') {
        return;
      }

      const rect = el.getBoundingClientRect();
      const tooSmall =
        rect.width < MIN_TARGET_SIZE || rect.height < MIN_TARGET_SIZE;

      if (tooSmall) {
        el.classList.add(VIOLATION_CLASS);
        el.setAttribute(
          'data-touch-violation',
          `${Math.round(rect.width)}×${Math.round(rect.height)}px`,
        );
      }
    });
  }, []);

  useEffect(() => {
    // Only run in development
    if (!import.meta.env.DEV) {
      return;
    }

    // Run after initial render
    const timer = setTimeout(validate, 500);

    // Re-validate on resize and DOM mutations
    const resizeObserver = new ResizeObserver(validate);
    resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(validate);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();

      // Clean up violation classes
      document.querySelectorAll(`.${VIOLATION_CLASS}`).forEach((el) => {
        el.classList.remove(VIOLATION_CLASS);
        el.removeAttribute('data-touch-violation');
      });
    };
  }, [validate]);

  return null;
};
