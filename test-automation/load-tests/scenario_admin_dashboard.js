import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders } from './utils/auth.js';
import { BASE_URL, THRESHOLDS, STAGES, CREDENTIALS } from './config.js';

/**
 * Scenario: Admin Dashboard Flow
 *
 * Simulates 20 concurrent admin users performing:
 *   1. Login
 *   2. Fetch real-time metrics
 *   3. Fetch operational KPIs
 *   4. Fetch chart data
 *   5. Export metrics CSV
 *
 * NFR targets:
 *   - p95 < 500 ms (NFR-PERF01)
 *   - Error rate < 0.1 %
 */
export const options = {
  stages: STAGES.admin,
  thresholds: THRESHOLDS,
  tags: { scenario: 'admin_dashboard' },
};

export default function () {
  // ── Step 1: Authenticate ──────────────────────────────────
  const token = login(BASE_URL, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  if (!token) {
    sleep(1);
    return;
  }

  const headers = authHeaders(token);

  // ── Step 2: Fetch real-time metrics ───────────────────────
  const realtimeRes = http.get(`${BASE_URL}/api/admin/metrics/realtime`, headers);

  check(realtimeRes, {
    'realtime status 200': (r) => r.status === 200,
    'realtime has data': (r) => {
      try { return !!r.json().data; } catch { return false; }
    },
  });

  sleep(1);

  // ── Step 3: Fetch operational KPIs ────────────────────────
  const kpiRes = http.get(`${BASE_URL}/api/admin/metrics/kpis`, headers);

  check(kpiRes, {
    'kpis status 200': (r) => r.status === 200,
  });

  sleep(1);

  // ── Step 4: Fetch chart data ──────────────────────────────
  const chartRes = http.get(
    `${BASE_URL}/api/admin/metrics/chart-data?startDate=2026-03-01&endDate=2026-04-03`,
    headers,
  );

  check(chartRes, {
    'chart-data status 200': (r) => r.status === 200,
  });

  sleep(1);

  // ── Step 5: Fetch system health ───────────────────────────
  const healthRes = http.get(`${BASE_URL}/api/admin/metrics/system-health`, headers);

  check(healthRes, {
    'system-health status 200': (r) => r.status === 200,
  });

  sleep(1);

  // ── Step 6: Export CSV ────────────────────────────────────
  const csvRes = http.post(
    `${BASE_URL}/api/admin/metrics/export`,
    JSON.stringify({ startDate: '2026-03-01', endDate: '2026-04-03' }),
    headers,
  );

  check(csvRes, {
    'csv export status 200': (r) => r.status === 200,
  });

  sleep(3);
}
