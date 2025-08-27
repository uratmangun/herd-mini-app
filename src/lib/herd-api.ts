/**
 * Utility functions for interacting with Herd Trails API
 * All API calls include the required Herd-Trail-App-Id header
 */

const HERD_API_BASE = 'https://trails-api.herd.eco/v1';
const HERD_TRAIL_APP_ID = process.env.NEXT_PUBLIC_HERD_TRAIL_APP_ID || '0198e901-43fa-7800-97c5-a331b77852dd';

// Trail IDs from the guides
export const TRAIL_IDS = {
  CROWDFUND_CREATION: '0198e8eb-9669-7497-adb0-ebd5ca9ebffb',
  CROWDFUND_CREATION_VERSION: '0198e8eb-9675-7703-908f-0afa1c81eee2',
  DONATION_REFUND: '0198e8eb-654b-71f4-aa0e-dc6990d57363',
  DONATION_REFUND_VERSION: '0198e8eb-6556-7671-aecb-3165333a1e34',
} as const;

interface HerdApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Base function for making API calls to Herd with proper headers
 */
async function herdApiCall(endpoint: string, options: HerdApiOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`${HERD_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Herd-Trail-App-Id': HERD_TRAIL_APP_ID,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Herd API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get trail metadata including steps and input requirements
 */
export async function getTrailMetadata(trailId: string, versionId: string) {
  return herdApiCall(`/trails/${trailId}/versions/${versionId}`);
}

/**
 * Get evaluation data (transaction calldata) for a trail step
 */
export async function getStepEvaluation(
  trailId: string,
  versionId: string,
  stepNumber: number,
  userInputs: Record<string, any>,
  walletAddress: string
) {
  return herdApiCall(
    `/trails/${trailId}/versions/${versionId}/steps/${stepNumber}/evaluations`,
    {
      method: 'POST',
      body: {
        userInputs,
        walletAddress,
      },
    }
  );
}

/**
 * Submit execution after transaction is sent
 */
export async function submitExecution(
  trailId: string,
  versionId: string,
  data: {
    nodeId: string;
    transactionHash: string;
    walletAddress: string;
    execution: { type: 'latest' | 'new' | 'manual'; executionId?: string };
  }
) {
  return herdApiCall(`/trails/${trailId}/versions/${versionId}/executions`, {
    method: 'POST',
    body: data,
  });
}

/**
 * Query execution history for a trail
 */
export async function getExecutionHistory(
  trailId: string,
  versionId: string,
  walletAddresses?: string[]
) {
  return herdApiCall(
    `/trails/${trailId}/versions/${versionId}/executions/query`,
    {
      method: 'POST',
      body: {
        walletAddresses: walletAddresses || [],
      },
    }
  );
}

/**
 * Read data from a trail's read nodes
 */
export async function readTrailData(
  trailId: string,
  versionId: string,
  nodeId: string,
  walletAddress: string = '0x0000000000000000000000000000000000000000'
) {
  return herdApiCall(
    `/trails/${trailId}/versions/${versionId}/reads/${nodeId}`,
    {
      method: 'POST',
      body: {
        walletAddress,
      },
    }
  );
}

/**
 * Utility function to create user inputs for trail evaluation
 */
export function createUserInputs(
  nodeId: string,
  inputs: Record<string, any>
): Record<string, any> {
  const userInputs: Record<string, any> = {};
  userInputs[nodeId] = {};

  Object.entries(inputs).forEach(([key, value]) => {
    userInputs[nodeId][key] = { value: String(value) };
  });

  return userInputs;
}

/**
 * Rate limiting utility - ensures we don't call APIs too frequently
 */
let lastApiCall = 0;
const MIN_INTERVAL = 5000; // 5 seconds as recommended

export function enforceRateLimit(): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    if (timeSinceLastCall < MIN_INTERVAL) {
      const delay = MIN_INTERVAL - timeSinceLastCall;
      setTimeout(() => {
        lastApiCall = Date.now();
        resolve();
      }, delay);
    } else {
      lastApiCall = now;
      resolve();
    }
  });
}

/**
 * Error handling utility for Herd API responses
 */
export function handleHerdApiError(error: any) {
  if (error.message?.includes('Herd API error')) {
    // API returned an error status
    console.error('Herd API Error:', error.message);
    return `API Error: ${error.message}`;
  } else if (error.message?.includes('Failed to fetch')) {
    // Network error
    console.error('Network Error:', error.message);
    return 'Network error. Please check your connection.';
  } else {
    // Other errors
    console.error('Unexpected Error:', error);
    return 'An unexpected error occurred.';
  }
}
