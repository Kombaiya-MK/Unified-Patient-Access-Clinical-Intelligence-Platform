import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders } from './utils/auth.js';
import { BASE_URL, THRESHOLDS, STAGES, CREDENTIALS } from './config.js';
import { randomFutureDate, randomDepartmentId, randomReason } from './utils/data-generator.js';

/**
 * Scenario: Appointment Booking Flow
 *
 * Simulates 100 concurrent patients performing:
 *   1. Login
 *   2. Search available slots
 *   3. Book an appointment
 *   4. Fetch my appointments
 *
 * NFR targets:
 *   - p95 < 500 ms (NFR-PERF01)
 *   - Error rate < 0.1 %
 *   - 100 concurrent users sustained for 13 min (NFR-PERF02)
 */
export const options = {
  stages: STAGES.booking,
  thresholds: THRESHOLDS,
  tags: { scenario: 'booking_flow' },
};

export default function () {
  // ── Step 1: Authenticate ──────────────────────────────────
  const token = login(BASE_URL, CREDENTIALS.patient.email, CREDENTIALS.patient.password);
  if (!token) {
    console.error('Login failed – skipping iteration');
    sleep(1);
    return;
  }

  const headers = authHeaders(token);
  const date = randomFutureDate();
  const deptId = randomDepartmentId();

  // ── Step 2: Search available slots ────────────────────────
  const slotsRes = http.get(
    `${BASE_URL}/api/appointments/slots?date=${date}&departmentId=${deptId}`,
    headers,
  );

  check(slotsRes, {
    'slots status 200': (r) => r.status === 200,
  });

  sleep(1);

  // ── Step 3: Book appointment ──────────────────────────────
  let slots = [];
  try {
    const body = slotsRes.json();
    slots = body.slots || body.data || [];
  } catch {
    slots = [];
  }

  if (slots.length > 0) {
    const slot = slots[0];
    const bookPayload = JSON.stringify({
      slotId: slot.id,
      departmentId: deptId,
      appointmentDate: `${date}T${slot.startTime || '09:00'}:00Z`,
      reason: randomReason(),
    });

    const bookRes = http.post(`${BASE_URL}/api/appointments`, bookPayload, headers);

    check(bookRes, {
      'booking status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
  }

  sleep(2);

  // ── Step 4: Fetch my appointments ─────────────────────────
  const myRes = http.get(`${BASE_URL}/api/appointments/my-appointments`, headers);

  check(myRes, {
    'my-appointments status 200': (r) => r.status === 200,
  });

  sleep(3);
}
