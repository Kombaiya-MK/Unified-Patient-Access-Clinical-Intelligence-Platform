/**
 * useCircuitBreakerStatus Hook Unit Tests
 *
 * Verifies REST fetch, WebSocket subscription, and error handling.
 *
 * @task US_041 TASK_002 (BUG_CB_BACKEND_001)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockGetStatus = vi.fn();
vi.mock('../../src/services/circuit-breaker.service', () => ({
  getCircuitBreakerStatus: (...args: unknown[]) => mockGetStatus(...args),
}));

vi.mock('../../src/utils/storage/tokenStorage', () => ({
  getToken: () => 'test-token',
}));

// Stub WebSocket globally
const mockWs = { onmessage: null as any, onclose: null as any, onerror: null as any, close: vi.fn() };
vi.stubGlobal('WebSocket', vi.fn(() => mockWs));

// eslint-disable-next-line import/first
import { useCircuitBreakerStatus } from '../../src/hooks/useCircuitBreakerStatus';

beforeEach(() => {
  vi.clearAllMocks();
  mockWs.onmessage = null;
  mockWs.close = vi.fn();
});

describe('useCircuitBreakerStatus', () => {
  it('fetches initial status on mount', async () => {
    const data = [
      { service: 'ai-intake', model: 'gpt-4-turbo', state: 'closed', failureRate: 0, lastStateChange: new Date().toISOString(), errorCount: 0, successCount: 10 },
    ];
    mockGetStatus.mockResolvedValue(data);

    const { result } = renderHook(() => useCircuitBreakerStatus());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.statuses).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockGetStatus.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCircuitBreakerStatus());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to fetch circuit breaker status');
    expect(result.current.statuses).toEqual([]);
  });

  it('computes hasOpenCircuits and openServices', async () => {
    const data = [
      { service: 'ai-intake', model: 'gpt-4-turbo', state: 'open', failureRate: 80, lastStateChange: new Date().toISOString(), errorCount: 8, successCount: 2 },
      { service: 'medical-coding', model: 'gpt-4-turbo', state: 'closed', failureRate: 0, lastStateChange: new Date().toISOString(), errorCount: 0, successCount: 50 },
    ];
    mockGetStatus.mockResolvedValue(data);

    const { result } = renderHook(() => useCircuitBreakerStatus());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasOpenCircuits).toBe(true);
    expect(result.current.openServices).toEqual(['ai-intake']);
  });

  it('opens WebSocket connection with token', async () => {
    mockGetStatus.mockResolvedValue([]);
    renderHook(() => useCircuitBreakerStatus());

    expect(WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('token=test-token'),
    );
  });
});
