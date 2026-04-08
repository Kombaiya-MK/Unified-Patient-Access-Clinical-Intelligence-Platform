import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders } from './utils/auth.js';
import { BASE_URL, THRESHOLDS, STAGES, CREDENTIALS } from './config.js';

/**
 * Scenario: Document Upload Flow
 *
 * Simulates 50 concurrent patients performing:
 *   1. Login
 *   2. Upload a PDF document (multipart/form-data)
 *   3. Poll extraction job status until complete
 *   4. View extraction results
 *
 * NFR targets:
 *   - p95 < 500 ms (NFR-PERF01)
 *   - Error rate < 0.1 %
 */
export const options = {
  stages: STAGES.upload,
  thresholds: THRESHOLDS,
  tags: { scenario: 'document_upload' },
};

/**
 * Generate a small synthetic PDF-like binary payload.
 * Real k6 tests can use open() for actual files; here we use a
 * minimal buffer so the test runs without external fixtures.
 */
function syntheticPdf() {
  // Minimal PDF header (not a valid PDF but enough for multipart upload testing)
  const header = '%PDF-1.4 synthetic load test document\n%%EOF';
  return header;
}

export default function () {
  // ── Step 1: Authenticate ──────────────────────────────────
  const token = login(BASE_URL, CREDENTIALS.patient.email, CREDENTIALS.patient.password);
  if (!token) {
    sleep(1);
    return;
  }

  const headers = authHeaders(token);

  // ── Step 2: Upload document ───────────────────────────────
  const uploadPayload = {
    file: http.file(syntheticPdf(), 'medical-history.pdf', 'application/pdf'),
    documentType: 'Medical History',
    description: 'Load test document upload',
  };

  const uploadRes = http.post(`${BASE_URL}/api/documents/upload`, uploadPayload, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: 'upload' },
  });

  check(uploadRes, {
    'upload status 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  let docId = null;
  try {
    const body = uploadRes.json();
    docId = body.id || (body.data && body.data.id) || null;
  } catch {
    // ignore parse error
  }

  sleep(2);

  // ── Step 3: Poll extraction status ────────────────────────
  if (docId) {
    const maxPolls = 5;
    for (let i = 0; i < maxPolls; i++) {
      const statusRes = http.get(`${BASE_URL}/api/documents/${docId}/status`, headers);

      check(statusRes, {
        'poll status 200': (r) => r.status === 200,
      });

      try {
        const body = statusRes.json();
        const status = body.status || (body.data && body.data.status) || '';
        if (status === 'completed' || status === 'extracted') {
          break;
        }
      } catch {
        // continue polling
      }

      sleep(2);
    }
  }

  sleep(1);

  // ── Step 4: View extraction results ───────────────────────
  if (docId) {
    const resultRes = http.get(`${BASE_URL}/api/documents/${docId}`, headers);

    check(resultRes, {
      'result status 200': (r) => r.status === 200,
    });
  }

  sleep(3);
}
