/**
 * Insurance API Client
 *
 * Handles communication with external insurance eligibility APIs.
 * Supports mock mode for development via USE_MOCK_INSURANCE_API env.
 *
 * @module insuranceApiClient
 * @task US_037 TASK_002
 */

import axios from 'axios';
import { insuranceApiConfig } from '../config/insuranceApiConfig';
import logger from '../utils/logger';

export interface EligibilityRequest {
  plan: string;
  memberId: string;
  dob: string;
}

export interface EligibilityResponse {
  status: 'active' | 'inactive' | 'requires_auth';
  copay: number | null;
  deductible: number | null;
  coverageStart: string | null;
  coverageEnd: string | null;
  authNotes: string | null;
}

export class RetryableError extends Error {
  constructor(message: string, public responseCode?: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public responseCode?: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

function getMockResponse(): EligibilityResponse {
  const mockStatuses: Array<'active' | 'inactive' | 'requires_auth'> = [
    'active', 'active', 'active', 'inactive', 'requires_auth',
  ];
  const picked = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
  return {
    status: picked,
    copay: picked === 'active' ? 25.0 : null,
    deductible: picked === 'active' ? 500.0 : null,
    coverageStart: '2025-01-01',
    coverageEnd: '2025-12-31',
    authNotes: picked === 'requires_auth' ? 'Prior authorization required for specialist visits' : null,
  };
}

function mapStatus(raw: string): 'active' | 'inactive' | 'requires_auth' {
  const normalized = raw.toLowerCase().trim();
  if (normalized === 'active' || normalized === 'eligible') return 'active';
  if (normalized === 'inactive' || normalized === 'ineligible' || normalized === 'terminated') return 'inactive';
  if (normalized.includes('auth') || normalized.includes('pending')) return 'requires_auth';
  return 'inactive';
}

export async function callEligibilityAPI(request: EligibilityRequest): Promise<EligibilityResponse> {
  if (insuranceApiConfig.useMock) {
    logger.info('Using mock insurance API response');
    return getMockResponse();
  }

  try {
    const response = await axios.post(
      `${insuranceApiConfig.baseUrl}/eligibility`,
      {
        insurer: request.plan,
        memberId: request.memberId,
        dateOfBirth: request.dob,
      },
      {
        headers: {
          'X-API-Key': insuranceApiConfig.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: insuranceApiConfig.timeoutMs,
      },
    );

    return {
      status: mapStatus(response.data.eligibilityStatus),
      copay: response.data.copayAmount ?? null,
      deductible: response.data.deductibleRemaining ?? null,
      coverageStart: response.data.effectiveDate ?? null,
      coverageEnd: response.data.terminationDate ?? null,
      authNotes: response.data.authorizationRequired ? response.data.notes ?? null : null,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status && status >= 400 && status < 500) {
        throw new NonRetryableError(
          `Insurance API returned ${status}: ${error.response?.data?.message || error.message}`,
          String(status),
        );
      }
      throw new RetryableError(
        `Insurance API error: ${error.message}`,
        status ? String(status) : 'TIMEOUT',
      );
    }
    throw new RetryableError('Insurance API network error');
  }
}
