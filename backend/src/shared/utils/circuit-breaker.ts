export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  monitoringPeriodMs?: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeoutMs: options.resetTimeoutMs || 60000, // 1 minute
      monitoringPeriodMs: options.monitoringPeriodMs || 10000, // 10 seconds
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // After 2 successful calls in half-open state, close the circuit
      if (this.successCount >= 2) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold!) {
      this.state = CircuitState.OPEN;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs!;
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private static circuitBreakers = new Map<string, CircuitBreaker>();

  static get(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, options));
    }
    return this.circuitBreakers.get(name)!;
  }

  static reset(name: string): void {
    const cb = this.circuitBreakers.get(name);
    if (cb) {
      cb.reset();
    }
  }

  static resetAll(): void {
    this.circuitBreakers.forEach(cb => cb.reset());
  }

  static getAllStates(): Record<string, CircuitState> {
    const states: Record<string, CircuitState> = {};
    this.circuitBreakers.forEach((cb, name) => {
      states[name] = cb.getState();
    });
    return states;
  }
}

/**
 * Pre-configured circuit breakers for common services
 */
export const CircuitBreakers = {
  whatsapp: CircuitBreakerRegistry.get('whatsapp', {
    failureThreshold: 3,
    resetTimeoutMs: 120000, // 2 minutes
  }),
  fcm: CircuitBreakerRegistry.get('fcm', {
    failureThreshold: 5,
    resetTimeoutMs: 60000, // 1 minute
  }),
  minio: CircuitBreakerRegistry.get('minio', {
    failureThreshold: 3,
    resetTimeoutMs: 90000, // 1.5 minutes
  }),
  redis: CircuitBreakerRegistry.get('redis', {
    failureThreshold: 5,
    resetTimeoutMs: 30000, // 30 seconds
  }),
};
