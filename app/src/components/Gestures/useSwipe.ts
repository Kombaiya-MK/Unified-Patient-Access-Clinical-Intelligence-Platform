/**
 * useSwipe Hook
 *
 * Detects horizontal swipe gestures via Touch Events API.
 * Returns swipe state (direction, distance, swiping flag) and
 * ref-attaching event handlers for touch targets.
 *
 * @example
 *   const { handlers, state } = useSwipe({
 *     threshold: 80,
 *     onSwipeLeft: () => handleCheckIn(),
 *     onSwipeRight: () => handleNoShow(),
 *   });
 *   return <div {...handlers}>...</div>;
 *
 * @module Gestures/useSwipe
 * @task US_044 TASK_007
 */

import { useRef, useCallback, useState } from 'react';

export interface SwipeState {
  direction: 'left' | 'right' | null;
  deltaX: number;
  swiping: boolean;
}

interface UseSwipeOptions {
  /** Minimum horizontal distance (px) to trigger a swipe action (default: 80) */
  threshold?: number;
  /** Minimum vertical tolerance — ignore if vertical exceeds this (default: 40) */
  verticalTolerance?: number;
  /** Called when swipe left exceeds threshold */
  onSwipeLeft?: () => void;
  /** Called when swipe right exceeds threshold */
  onSwipeRight?: () => void;
  /** Called on every move with current deltaX */
  onSwiping?: (deltaX: number) => void;
  /** Called when swipe ends without reaching threshold */
  onSwipeCancel?: () => void;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useSwipe(options: UseSwipeOptions = {}): {
  handlers: SwipeHandlers;
  state: SwipeState;
  reset: () => void;
} {
  const {
    threshold = 80,
    verticalTolerance = 40,
    onSwipeLeft,
    onSwipeRight,
    onSwiping,
    onSwipeCancel,
  } = options;

  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false);

  const [state, setState] = useState<SwipeState>({
    direction: null,
    deltaX: 0,
    swiping: false,
  });

  const reset = useCallback(() => {
    setState({ direction: null, deltaX: 0, swiping: false });
    locked.current = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    locked.current = false;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      // If vertical movement dominates, abandon the horizontal swipe
      if (!locked.current && Math.abs(dy) > verticalTolerance) {
        reset();
        locked.current = true;
        return;
      }

      // Lock into horizontal once past a small dead zone
      if (!locked.current && Math.abs(dx) > 10) {
        locked.current = false; // stay tracking
      }

      if (locked.current) {
        return;
      }

      let direction: 'left' | 'right' | null = null;
      if (dx < -10) {
        direction = 'left';
      } else if (dx > 10) {
        direction = 'right';
      }

      setState({ direction, deltaX: dx, swiping: true });
      onSwiping?.(dx);
    },
    [verticalTolerance, onSwiping, reset],
  );

  const onTouchEnd = useCallback(() => {
    if (locked.current) {
      reset();
      return;
    }

    const { deltaX } = state;

    if (Math.abs(deltaX) >= threshold) {
      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    } else {
      onSwipeCancel?.();
    }

    reset();
  }, [state, threshold, onSwipeLeft, onSwipeRight, onSwipeCancel, reset]);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    state,
    reset,
  };
}
