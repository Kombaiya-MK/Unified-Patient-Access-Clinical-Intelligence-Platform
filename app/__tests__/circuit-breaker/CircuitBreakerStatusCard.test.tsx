/**
 * CircuitBreakerStatusCard Unit Tests
 *
 * Verifies colour-coded badges, failure rate bar, and onViewLogs callback.
 *
 * @task US_041 TASK_002 (BUG_CB_BACKEND_001)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CircuitBreakerStatusCard } from '../../src/components/circuit-breaker/CircuitBreakerStatusCard';
import type { CircuitBreakerStatus } from '../../src/types/circuit-breaker.types';

function makeStatus(overrides: Partial<CircuitBreakerStatus> = {}): CircuitBreakerStatus {
  return {
    service: 'ai-intake',
    model: 'gpt-4-turbo',
    state: 'closed',
    failureRate: 0,
    lastStateChange: new Date().toISOString(),
    errorCount: 0,
    successCount: 100,
    ...overrides,
  };
}

describe('CircuitBreakerStatusCard', () => {
  it('renders service label', () => {
    render(<CircuitBreakerStatusCard status={makeStatus()} onViewLogs={() => {}} />);
    expect(screen.getByText('AI Intake')).toBeInTheDocument();
  });

  it('renders "Closed" badge for closed state', () => {
    render(<CircuitBreakerStatusCard status={makeStatus({ state: 'closed' })} onViewLogs={() => {}} />);
    expect(screen.getByText(/Closed/)).toBeInTheDocument();
  });

  it('renders "Half-Open" badge for half-open state', () => {
    render(<CircuitBreakerStatusCard status={makeStatus({ state: 'half-open' })} onViewLogs={() => {}} />);
    expect(screen.getByText(/Half-Open/)).toBeInTheDocument();
  });

  it('renders "Open" badge for open state', () => {
    render(<CircuitBreakerStatusCard status={makeStatus({ state: 'open' })} onViewLogs={() => {}} />);
    expect(screen.getByText(/Open/)).toBeInTheDocument();
  });

  it('displays failure rate percentage', () => {
    render(<CircuitBreakerStatusCard status={makeStatus({ failureRate: 42.5 })} onViewLogs={() => {}} />);
    expect(screen.getByText('42.5%')).toBeInTheDocument();
  });

  it('calls onViewLogs when View Logs button is clicked', () => {
    const onViewLogs = vi.fn();
    render(<CircuitBreakerStatusCard status={makeStatus()} onViewLogs={onViewLogs} />);
    fireEvent.click(screen.getByText('View Logs'));
    expect(onViewLogs).toHaveBeenCalledOnce();
  });

  it('has accessible region role with service and state info', () => {
    render(<CircuitBreakerStatusCard status={makeStatus({ state: 'open' })} onViewLogs={() => {}} />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', expect.stringContaining('AI Intake'));
    expect(region).toHaveAttribute('aria-label', expect.stringContaining('Open'));
  });
});

describe('CircuitBreakerStatusCard Accessibility', () => {
  it('has no axe accessibility violations in closed state', async () => {
    const { container } = render(
      <CircuitBreakerStatusCard status={makeStatus({ state: 'closed' })} onViewLogs={() => {}} />,
    );
    const { expectNoA11yViolations } = await import('../../src/utils/accessibility-testing');
    await expectNoA11yViolations(container);
  });

  it('has no axe accessibility violations in open state', async () => {
    const { container } = render(
      <CircuitBreakerStatusCard status={makeStatus({ state: 'open', failureRate: 75 })} onViewLogs={() => {}} />,
    );
    const { expectNoA11yViolations } = await import('../../src/utils/accessibility-testing');
    await expectNoA11yViolations(container);
  });
});
