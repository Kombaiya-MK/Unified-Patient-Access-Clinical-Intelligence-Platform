/**
 * Insurance API Configuration
 *
 * Loads insurance verification API settings from environment variables.
 *
 * @module insuranceApiConfig
 * @task US_037 TASK_002
 */

export const insuranceApiConfig = {
  provider: process.env.INSURANCE_API_PROVIDER || 'availity',
  baseUrl: process.env.INSURANCE_API_BASE_URL || 'https://api.availity.com/v1',
  apiKey: process.env.INSURANCE_API_KEY || '',
  apiSecret: process.env.INSURANCE_API_SECRET || '',
  useMock: process.env.USE_MOCK_INSURANCE_API !== 'false', // default true for dev
  timeoutMs: parseInt(process.env.INSURANCE_API_TIMEOUT_MS || '30000', 10),
};
