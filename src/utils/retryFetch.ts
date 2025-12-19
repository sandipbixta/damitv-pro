/**
 * Retry fetch utility with exponential backoff
 * Improves reliability by automatically retrying failed requests
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
  retryOn?: (error: Error, response?: Response) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 15000,
  retryOn: (error, response) => {
    // Retry on network errors
    if (!response) return true;
    // Retry on 5xx server errors
    if (response.status >= 500) return true;
    // Retry on 429 (rate limit)
    if (response.status === 429) return true;
    return false;
  },
};

/**
 * Calculates delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff: 1s, 2s, 4s, etc.
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Wraps fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function retryFetch<T = any>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const config = { ...defaultOptions, ...retryOptions };
  let lastError: Error | null = null;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, config.timeout);
      lastResponse = response;

      if (response.ok) {
        const data = await response.json();
        return data as T;
      }

      // Check if we should retry this response
      if (!config.retryOn(new Error(`HTTP ${response.status}`), response)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Log retry attempt
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay);
        console.log(`🔄 Retry ${attempt + 1}/${config.maxRetries} for ${url} in ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!config.retryOn(lastError, lastResponse)) {
        throw lastError;
      }

      // If this is a timeout/abort, don't retry
      if (lastError.name === 'AbortError') {
        throw new Error(`Request timeout after ${config.timeout}ms`);
      }

      // Log retry attempt
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay);
        console.log(`🔄 Retry ${attempt + 1}/${config.maxRetries} for ${url} in ${Math.round(delay)}ms (${lastError.message})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Simple retry wrapper for any async function
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'timeout'> = {}
): Promise<T> {
  const config = {
    maxRetries: options.maxRetries ?? 3,
    baseDelay: options.baseDelay ?? 1000,
    maxDelay: options.maxDelay ?? 10000,
    retryOn: options.retryOn ?? (() => true),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!config.retryOn(lastError)) {
        throw lastError;
      }

      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay);
        console.log(`🔄 Retry ${attempt + 1}/${config.maxRetries} in ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export default retryFetch;
