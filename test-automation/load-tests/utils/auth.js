import http from 'k6/http';
import { check } from 'k6';

/**
 * Authenticate against /api/auth/login and return a JWT token.
 *
 * @param {string} baseUrl  - API base URL (e.g. http://localhost:3001)
 * @param {string} email    - User email
 * @param {string} password - User password
 * @returns {string} JWT access token
 */
export function login(baseUrl, email, password) {
  const payload = JSON.stringify({ email, password });
  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(`${baseUrl}/api/auth/login`, payload, params);

  check(res, {
    'login status 200': (r) => r.status === 200,
    'login returns token': (r) => {
      try {
        const body = r.json();
        return !!(body.token || (body.data && body.data.token));
      } catch {
        return false;
      }
    },
  });

  try {
    const body = res.json();
    return body.token || (body.data && body.data.token) || '';
  } catch {
    return '';
  }
}

/**
 * Build common authorization headers.
 *
 * @param {string} token - JWT token
 * @returns {object} Headers with Authorization and Content-Type
 */
export function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}
