/**
 * AIFallbackAlert Unit Tests
 *
 * Verifies the alert renders when active and hides when inactive.
 *
 * @task US_041 TASK_002 (BUG_CB_BACKEND_001)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIFallbackAlert } from '../../src/components/circuit-breaker/AIFallbackAlert';

describe('AIFallbackAlert', () => {
  it('renders nothing when isActive is false', () => {
    const { container } = render(<AIFallbackAlert service="ai-intake" isActive={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders alert when isActive is true for ai-intake', () => {
    render(<AIFallbackAlert service="ai-intake" isActive={true} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('AI Chat Unavailable')).toBeInTheDocument();
  });

  it('renders correct message for document-extraction', () => {
    render(<AIFallbackAlert service="document-extraction" isActive={true} />);
    expect(screen.getByText('Processing Delayed')).toBeInTheDocument();
  });

  it('renders correct message for medical-coding', () => {
    render(<AIFallbackAlert service="medical-coding" isActive={true} />);
    expect(screen.getByText('AI Coding Unavailable')).toBeInTheDocument();
  });

  it('renders correct message for medication-conflicts', () => {
    render(<AIFallbackAlert service="medication-conflicts" isActive={true} />);
    expect(screen.getByText('Using Basic Validation')).toBeInTheDocument();
  });
});
