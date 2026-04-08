/**
 * useKeyboardShortcuts Hook
 *
 * Registers global keyboard shortcuts via keydown listener.
 * Prevents default browser actions for registered combos.
 * Ignores events when focus is inside input/textarea/select.
 *
 * @module hooks/useKeyboardShortcuts
 * @task US_044 TASK_008
 */

import { useEffect, useCallback, useRef } from 'react';

interface ShortcutDefinition {
  /** Key combination, e.g. 'ctrl+n', 'ctrl+k', 'escape' */
  key: string;
  /** Action callback */
  handler: () => void;
  /** Description shown in tooltip */
  description: string;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return target.isContentEditable;
}

function matchesShortcut(e: KeyboardEvent, key: string): boolean {
  const parts = key.toLowerCase().split('+');
  const mainKey = parts[parts.length - 1];
  const needsCtrl = parts.includes('ctrl');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt');

  if (needsCtrl !== (e.ctrlKey || e.metaKey)) {
    return false;
  }
  if (needsShift !== e.shiftKey) {
    return false;
  }
  if (needsAlt !== e.altKey) {
    return false;
  }
  return e.key.toLowerCase() === mainKey;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]): void {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isEditableTarget(e.target)) {
      if (e.key !== 'Escape') {
        return;
      }
    }

    for (const shortcut of shortcutsRef.current) {
      if (matchesShortcut(e, shortcut.key)) {
        e.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export type { ShortcutDefinition };
