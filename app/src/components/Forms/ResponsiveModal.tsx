/**
 * ResponsiveModal Component
 *
 * Automatically switches between BottomSheet on mobile and
 * centered Modal on desktop/tablet using the useBreakpoint hook.
 *
 * Mobile (<768px): slide-up BottomSheet from bottom
 * Desktop/Tablet (≥768px): centered overlay Modal
 *
 * @module Forms/ResponsiveModal
 * @task US_044 TASK_003
 */

import React from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { BottomSheet } from './BottomSheet';
import { Modal } from '../Modal/Modal';

type ModalSize = 'sm' | 'md' | 'lg';

interface ResponsiveModalProps {
  /** Whether the modal/sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Title text */
  title: string;
  /** Modal size on desktop (sm=400px, md=600px, lg=800px) */
  size?: ModalSize;
  /** Footer content (action buttons) */
  footer?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Content */
  children: React.ReactNode;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  footer,
  className = '',
  children,
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        footer={footer}
        className={className}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={footer}
      className={className}
    >
      {children}
    </Modal>
  );
};
