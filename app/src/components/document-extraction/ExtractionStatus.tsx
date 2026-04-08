/**
 * ExtractionStatus
 *
 * Renders an AIFallbackAlert for the document-extraction circuit breaker
 * when the service is unavailable. Used within the document upload flow.
 *
 * @module components/document-extraction/ExtractionStatus
 * @task US_041 TASK_002 (BUG_CB_BACKEND_001)
 */

import React from 'react';
import { useCircuitBreakerStatus } from '../../hooks/useCircuitBreakerStatus';
import { AIFallbackAlert } from '../circuit-breaker/AIFallbackAlert';

export const ExtractionStatus: React.FC = () => {
  const { openServices } = useCircuitBreakerStatus();
  const isOpen = openServices.includes('document-extraction');

  return <AIFallbackAlert service="document-extraction" isActive={isOpen} />;
};
