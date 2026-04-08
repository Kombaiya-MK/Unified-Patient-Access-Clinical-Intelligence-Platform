/**
 * SwipeableRow Component
 *
 * Wraps a child element (e.g. queue mobile card) with horizontal
 * swipe gesture support. Swiping reveals action buttons underneath:
 *   - Swipe left  → reveals "Check In" (green) on the right
 *   - Swipe right → reveals "No-Show" (red) on the left
 *
 * Uses transform: translateX() for performant GPU-accelerated animation.
 * Triggers the action callback when swipe distance exceeds the threshold (80px).
 * Destructive-direction swipe (default: right/No-Show) requires tap-to-confirm.
 * First-use peek animation reveals action panels briefly for discoverability.
 *
 * @module Gestures/SwipeableRow
 * @task US_044 TASK_007, BUG_TASK007_SWIPE_UX
 */

import React, { useRef, useState, useCallback } from 'react';
import '../../styles/touch-interactions.css';

const PEEK_STORAGE_KEY = 'swipe_peek_shown';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold: number;
  disabled: boolean;
  destructiveDirection: 'left' | 'right';
}

interface SwipeRowState {
  deltaX: number;
  swiping: boolean;
  triggered: boolean;
  confirming: boolean;
  confirmAction: () => void;
  cancelConfirm: () => void;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

function useSwipeRow(config: SwipeConfig): SwipeRowState {
  const { onSwipeLeft, onSwipeRight, threshold, disabled, destructiveDirection } = config;
  const startX = useRef(0);
  const startY = useRef(0);
  const [deltaX, setDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const verticalLocked = useRef(false);
  const pendingCallback = useRef<(() => void) | null>(null);

  const resetState = useCallback(() => {
    setSwiping(false);
    setDeltaX(0);
    setTriggered(false);
    setConfirming(false);
    pendingCallback.current = null;
  }, []);

  const confirmAction = useCallback(() => {
    if (pendingCallback.current) {
      pendingCallback.current();
    }
    resetState();
  }, [resetState]);

  const cancelConfirm = useCallback(() => {
    resetState();
  }, [resetState]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || confirming) {
        return;
      }
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      verticalLocked.current = false;
      setTriggered(false);
      setSwiping(true);
    },
    [disabled, confirming],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || verticalLocked.current || confirming) {
        return;
      }
      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      if (Math.abs(dy) > 40 && Math.abs(dx) < 20) {
        verticalLocked.current = true;
        resetState();
        return;
      }
      if (dx < 0 && !onSwipeLeft) {
        return;
      }
      if (dx > 0 && !onSwipeRight) {
        return;
      }
      setDeltaX(Math.max(-150, Math.min(150, dx)));
    },
    [disabled, confirming, onSwipeLeft, onSwipeRight, resetState],
  );

  const handleDestructiveSwipe = useCallback(() => {
    const callback = deltaX > 0 ? onSwipeRight : onSwipeLeft;
    if (!callback) {
      return;
    }
    pendingCallback.current = callback;
    setConfirming(true);
    setSwiping(false);
    setDeltaX(destructiveDirection === 'right' ? 120 : -120);
  }, [deltaX, onSwipeRight, onSwipeLeft, destructiveDirection]);

  const handleNonDestructiveSwipe = useCallback(() => {
    setTriggered(true);
    if (deltaX < 0) {
      onSwipeLeft?.();
    } else {
      onSwipeRight?.();
    }
    resetState();
  }, [deltaX, onSwipeLeft, onSwipeRight, resetState]);

  const onTouchEnd = useCallback(() => {
    if (disabled || verticalLocked.current || confirming) {
      resetState();
      return;
    }
    if (Math.abs(deltaX) < threshold) {
      resetState();
      return;
    }

    const isDestructive =
      (destructiveDirection === 'right' && deltaX > 0) ||
      (destructiveDirection === 'left' && deltaX < 0);

    if (isDestructive) {
      handleDestructiveSwipe();
    } else {
      handleNonDestructiveSwipe();
    }
  }, [disabled, confirming, deltaX, threshold, destructiveDirection, handleDestructiveSwipe, handleNonDestructiveSwipe, resetState]);

  return {
    deltaX,
    swiping,
    triggered,
    confirming,
    confirmAction,
    cancelConfirm,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftActionLabel?: string;
  rightActionLabel?: string;
  threshold?: number;
  disabled?: boolean;
  destructiveDirection?: 'left' | 'right';
}

const SwipeActionPanel: React.FC<{
  side: 'left' | 'right';
  visible: boolean;
  label: string;
}> = ({ side, visible, label }) => (
  <div
    className={`swipeable-row__action swipeable-row__action--${side}${visible ? ' swipeable-row__action--visible' : ''}`}
    aria-hidden={!visible}
  >
    <span className="swipeable-row__action-label">{label}</span>
  </div>
);

function buildContentClass(swiping: boolean, triggered: boolean, peek: boolean): string {
  return [
    'swipeable-row__content',
    swiping ? 'swipeable-row__content--swiping' : '',
    triggered ? 'swipeable-row__content--triggered' : '',
    peek ? 'swipeable-row__content--peek' : '',
  ].filter(Boolean).join(' ');
}

let peekClaimedRef = false;

function shouldShowPeek(disabled: boolean): boolean {
  if (disabled || peekClaimedRef) {
    return false;
  }
  try {
    if (localStorage.getItem(PEEK_STORAGE_KEY)) {
      return false;
    }
  } catch {
    return false;
  }
  if (typeof window !== 'undefined') {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mql.matches) {
      return false;
    }
  }
  peekClaimedRef = true;
  return true;
}

function usePeekAnimation(disabled: boolean): [boolean, () => void] {
  const [showPeek, setShowPeek] = useState(() => shouldShowPeek(disabled));

  const onAnimationEnd = useCallback(() => {
    setShowPeek(false);
    try {
      localStorage.setItem(PEEK_STORAGE_KEY, '1');
    } catch {
      /* storage full or blocked — safe to ignore */
    }
  }, []);

  return [showPeek, onAnimationEnd];
}

const ConfirmButton: React.FC<{
  direction: 'left' | 'right';
  label: string;
  onConfirm: () => void;
}> = ({ direction, label, onConfirm }) => (
  <button
    type="button"
    className={`swipeable-row__confirm-tap swipeable-row__confirm-tap--${direction}`}
    onClick={onConfirm}
    aria-label={`Confirm ${label}`}
  >
    Tap to confirm
  </button>
);

function getAriaLabel(confirming: boolean): string {
  if (confirming) {
    return 'Tap the action panel to confirm, or tap the card to cancel';
  }
  return 'Swipe left to check in, swipe right to mark no-show (requires confirmation)';
}

function handleEscapeKey(cancelConfirm: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancelConfirm();
    }
  };
}

interface ContentProps {
  className: string;
  style: React.CSSProperties | undefined;
  onClick: (() => void) | undefined;
  onKeyDown: ((e: React.KeyboardEvent) => void) | undefined;
  role: string | undefined;
  tabIndex: number | undefined;
  'aria-label': string | undefined;
  onAnimationEnd: (() => void) | undefined;
}

function buildContentProps(
  swiping: boolean,
  triggered: boolean,
  showPeek: boolean,
  confirming: boolean,
  transform: string | undefined,
  cancelConfirm: () => void,
  onPeekEnd: () => void,
): ContentProps {
  return {
    className: buildContentClass(swiping, triggered, showPeek),
    style: transform ? { transform } : undefined,
    onClick: confirming ? cancelConfirm : undefined,
    onKeyDown: confirming ? handleEscapeKey(cancelConfirm) : undefined,
    role: confirming ? 'button' : undefined,
    tabIndex: confirming ? 0 : undefined,
    'aria-label': confirming ? 'Cancel swipe action' : undefined,
    onAnimationEnd: showPeek ? onPeekEnd : undefined,
  };
}

function shouldShowConfirm(confirming: boolean, direction: 'left' | 'right', hasCallback: boolean): boolean {
  return confirming && direction === 'right' && hasCallback;
}

function getTransform(swiping: boolean, confirming: boolean, deltaX: number): string | undefined {
  if (swiping || confirming) {
    return `translateX(${deltaX}px)`;
  }
  return undefined;
}

const LeftActions: React.FC<{
  onSwipeRight: (() => void) | undefined;
  deltaX: number;
  confirming: boolean;
  destructiveDirection: 'left' | 'right';
  leftActionLabel: string;
  confirmAction: () => void;
}> = ({ onSwipeRight, deltaX, confirming, destructiveDirection, leftActionLabel, confirmAction }) => {
  if (!onSwipeRight) {
    return null;
  }
  return (
    <>
      <SwipeActionPanel side="left" visible={deltaX > 20 || confirming} label={leftActionLabel} />
      {shouldShowConfirm(confirming, destructiveDirection, true) && (
        <ConfirmButton direction="left" label={leftActionLabel} onConfirm={confirmAction} />
      )}
    </>
  );
};

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActionLabel = 'No-Show',
  rightActionLabel = 'Check In',
  threshold = 80,
  disabled = false,
  destructiveDirection = 'right',
}) => {
  const swipeState = useSwipeRow({ onSwipeLeft, onSwipeRight, threshold, disabled, destructiveDirection });
  const [showPeek, onPeekEnd] = usePeekAnimation(disabled);
  const transform = getTransform(swipeState.swiping, swipeState.confirming, swipeState.deltaX);
  const contentProps = buildContentProps(
    swipeState.swiping, swipeState.triggered, showPeek,
    swipeState.confirming, transform, swipeState.cancelConfirm, onPeekEnd,
  );

  return (
    <div className="swipeable-row" aria-label={getAriaLabel(swipeState.confirming)}>
      <LeftActions
        onSwipeRight={onSwipeRight}
        deltaX={swipeState.deltaX}
        confirming={swipeState.confirming}
        destructiveDirection={destructiveDirection}
        leftActionLabel={leftActionLabel}
        confirmAction={swipeState.confirmAction}
      />
      {onSwipeLeft && (
        <SwipeActionPanel side="right" visible={swipeState.deltaX < -20} label={rightActionLabel} />
      )}
      <div
        {...contentProps}
        onTouchStart={swipeState.handlers.onTouchStart}
        onTouchMove={swipeState.handlers.onTouchMove}
        onTouchEnd={swipeState.handlers.onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
