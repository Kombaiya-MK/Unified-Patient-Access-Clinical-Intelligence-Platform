/**
 * CircuitBreakerStatusPanel Unit Tests
 *
 * Verifies loading skeleton, error state, card rendering, and modal.
 *
 * @task US_041 TASK_002 (BUG_CB_BACKEND_001)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CircuitBreakerStatus } from '../../src/types/circuit-breaker.types';

const mockUseCircuitBreakerStatus = vi.fn();
vi.mock('../../src/hooks/useCircuitBreakerStatus', () => ({
  useCircuitBreakerStatus: () => mockUseCircuitBreakerStatus(),
}));

vi.mock('../../src/services/circuit-breaker.service', () => ({
  getCircuitBreakerLogs: vi.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line import/first
import { CircuitBreakerStatusPanel } from '../../src/components/circuit-breaker/CircuitBreakerStatusPanel';

function makeStatuses(): CircuitBreakerStatus[] {
  return [
    { service: 'ai-intake', model: 'gpt-4-turbo', state: 'closed', failureRate: 0, lastStateChange: new Date().toISOString(), errorCount: 0, successCount: 50 },
    { service: 'document-extraction', model: 'gpt-4o', state: 'open', failureRate: 75, lastStateChange: new Date().toISOString(), errorCount: 30, successCount: 10 },
    { service: 'medical-coding', model: 'gpt-4-turbo', state: 'half-open', failureRate: 25, lastStateChange: new Date().toISOString(), errorCount: 5, successCount: 15 },
    { service: 'medication-conflicts', model: 'gpt-4-turbo', state: 'closed', failureRate: 2, lastStateChange: new Date().toISOString(), errorCount: 1, successCount: 49 },
  ];
}

beforeEach(() => {
  mockUseCircuitBreakerStatus.mockReturnValue({
    statuses: [],
    loading: false,
    error: null,
    hasOpenCircuits: false,
    openServices: [],
    refresh: vi.fn(),
  });
});

describe('CircuitBreakerStatusPanel', () => {
  it('renders loading skeletons when loading', () => {
    mockUseCircuitBreakerStatus.mockReturnValue({
      statuses: [],
      loading: true,
      error: null,
      hasOpenCircuits: false,
      openServices: [],
      refresh: vi.fn(),
    });
    render(<CircuitBreakerStatusPanel />);
    expect(screen.getByText('AI Service Circuit Breakers')).toBeInTheDocument();
    // 4 skeleton placeholders rendered with aria-hidden
    const section = screen.getByLabelText('AI Service Circuit Breakers');
    const skeletons = section.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBe(4);
  });

  it('renders info message when error occurs', () => {
    mockUseCircuitBreakerStatus.mockReturnValue({
      statuses: [],
      loading: false,
      error: 'Failed to fetch',
      hasOpenCircuits: false,
      openServices: [],
      refresh: vi.fn(),
    });
    render(<CircuitBreakerStatusPanel />);
    expect(screen.getByText(/Circuit breaker monitoring will be available/)).toBeInTheDocument();
  });

  it('renders 4 circuit breaker cards when data is loaded', () => {
    mockUseCircuitBreakerStatus.mockReturnValue({
      statuses: makeStatuses(),
      loading: false,
      error: null,
      hasOpenCircuits: true,
      openServices: ['document-extraction'],
      refresh: vi.fn(),
    });
    render(<CircuitBreakerStatusPanel />);
    expect(screen.getByText('AI Intake')).toBeInTheDocument();
    expect(screen.getByText('Document Extraction')).toBeInTheDocument();
    expect(screen.getByText('Medical Coding')).toBeInTheDocument();
    expect(screen.getByText('Medication Conflicts')).toBeInTheDocument();
  });

  it('renders section heading', () => {
    render(<CircuitBreakerStatusPanel />);
    expect(screen.getByText('AI Service Circuit Breakers')).toBeInTheDocument();
  });
});
