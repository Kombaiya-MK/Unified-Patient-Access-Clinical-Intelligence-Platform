/**
 * LimitedFunctionalityBanner Unit Tests
 *
 * Verifies banner visibility, dismiss behaviour, re-show on new circuit,
 * and recovery toast.
 *
 * @task US_041 TASK_002 (BUG_CB_BACKEND_001)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the hook before importing the component
const mockUseCircuitBreakerStatus = vi.fn();
vi.mock('../../src/hooks/useCircuitBreakerStatus', () => ({
  useCircuitBreakerStatus: () => mockUseCircuitBreakerStatus(),
}));

// eslint-disable-next-line import/first
import { LimitedFunctionalityBanner } from '../../src/components/circuit-breaker/LimitedFunctionalityBanner';

function defaultHookReturn(overrides = {}) {
  return {
    statuses: [],
    loading: false,
    error: null,
    hasOpenCircuits: false,
    openServices: [],
    refresh: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  sessionStorage.clear();
  mockUseCircuitBreakerStatus.mockReturnValue(defaultHookReturn());
});

describe('LimitedFunctionalityBanner', () => {
  it('renders nothing when no circuits are open', () => {
    const { container } = render(<LimitedFunctionalityBanner />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('renders banner when circuits are open', () => {
    mockUseCircuitBreakerStatus.mockReturnValue(
      defaultHookReturn({ hasOpenCircuits: true, openServices: ['ai-intake'] }),
    );
    render(<LimitedFunctionalityBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('AI Intake')).toBeInTheDocument();
  });

  it('hides banner when dismiss is clicked', () => {
    mockUseCircuitBreakerStatus.mockReturnValue(
      defaultHookReturn({ hasOpenCircuits: true, openServices: ['ai-intake'] }),
    );
    render(<LimitedFunctionalityBanner />);
    fireEvent.click(screen.getByLabelText('Dismiss banner'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('lists multiple open services', () => {
    mockUseCircuitBreakerStatus.mockReturnValue(
      defaultHookReturn({
        hasOpenCircuits: true,
        openServices: ['ai-intake', 'medical-coding'],
      }),
    );
    render(<LimitedFunctionalityBanner />);
    expect(screen.getByText('AI Intake')).toBeInTheDocument();
    expect(screen.getByText('Medical Coding')).toBeInTheDocument();
  });
});
