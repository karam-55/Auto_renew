export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export class RetryUtil {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    shouldRetry: (error: any) => {
      // Retry on network errors, 5xx errors, and timeout errors
      return (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        (error.response?.status >= 500) ||
        error.code === 'TIMEOUT' ||
        error.message?.includes('timeout') ||
        error.message?.includes('network')
      );
    },
    onRetry: () => {},
  };

  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let lastError: any;
    let currentDelay = opts.initialDelayMs;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if we should retry this error
        if (!opts.shouldRetry(error)) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt === opts.maxAttempts) {
          throw error;
        }

        // Log retry attempt
        if (opts.onRetry) {
          opts.onRetry(attempt, error);
        }

        // Wait before retrying with exponential backoff
        await this.sleep(currentDelay);
        currentDelay = Math.min(currentDelay * opts.backoffMultiplier, opts.maxDelayMs);
      }
    }

    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry wrapper for WhatsApp API calls
   */
  static async retryWhatsApp<T>(fn: () => Promise<T>): Promise<T> {
    return this.withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 2000,
      maxDelayMs: 10000,
      shouldRetry: (error: any) => {
        // Retry on rate limits (429), server errors (5xx), and network issues
        return (
          error.response?.status === 429 ||
          (error.response?.status >= 500) ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT'
        );
      },
    });
  }

  /**
   * Retry wrapper for FCM (Firebase Cloud Messaging) calls
   */
  static async retryFCM<T>(fn: () => Promise<T>): Promise<T> {
    return this.withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      shouldRetry: (error: any) => {
        // Retry on FCM-specific errors and network issues
        return (
          error.code === 'messaging/internal-error' ||
          error.code === 'messaging/server-unavailable' ||
          error.code === 'messaging/unknown-error' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT'
        );
      },
    });
  }

  /**
   * Retry wrapper for MinIO/S3 storage calls
   */
  static async retryMinIO<T>(fn: () => Promise<T>): Promise<T> {
    return this.withRetry(fn, {
      maxAttempts: 5,
      initialDelayMs: 500,
      maxDelayMs: 10000,
      shouldRetry: (error: any) => {
        // Retry on S3-specific errors and network issues
        return (
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'EPIPE' ||
          error.name === 'NetworkError' ||
          (error.$metadata?.httpStatusCode >= 500)
        );
      },
    });
  }
}
