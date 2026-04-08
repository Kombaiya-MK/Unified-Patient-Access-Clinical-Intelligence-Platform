/**
 * k6 Load Test Configuration
 *
 * Central configuration for all load test scenarios.
 * Override BASE_URL with: k6 run --env BASE_URL=https://staging.example.com ...
 */

/** @type {string} Base URL for the API under test */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

/**
 * Common k6 thresholds aligned with NFR-PERF01 / NFR-PERF02.
 *
 * - http_req_duration p(95) < 500 ms
 * - http_req_failed   < 0.1 %
 * - checks pass rate   > 99 %
 */
export const THRESHOLDS = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.001'],
  checks: ['rate>0.99'],
};

/**
 * Stage profiles reused across scenarios.
 * Each scenario picks the profile matching its concurrency target.
 */
export const STAGES = {
  /** 100 VU booking flow – 2 min ramp, 13 min sustain, 2 min cool‑down */
  booking: [
    { duration: '2m', target: 50 },
    { duration: '11m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  /** 50 VU document upload flow */
  upload: [
    { duration: '1m', target: 25 },
    { duration: '12m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  /** 20 VU admin dashboard flow */
  admin: [
    { duration: '1m', target: 10 },
    { duration: '12m', target: 20 },
    { duration: '2m', target: 0 },
  ],
};

/**
 * Test credentials (should be pre‑seeded in the staging database).
 * NEVER store real production credentials here.
 */
export const CREDENTIALS = {
  patient: { email: 'loadtest.patient@example.com', password: 'Test123!' },
  staff: { email: 'loadtest.staff@example.com', password: 'Test123!' },
  admin: { email: 'loadtest.admin@example.com', password: 'Test123!' },
};
