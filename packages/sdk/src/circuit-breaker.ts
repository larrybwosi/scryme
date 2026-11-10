/**
 * In-Memory Circuit Breaker for Resilient Outage Protection
 */

import { CircuitBreakerError } from "./errors";

export interface CircuitBreakerOptions {
  enabled?: boolean;
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxAttempts?: number;
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  public enabled: boolean;
  public failureThreshold: number;
  public resetTimeoutMs: number;
  public halfOpenMaxAttempts: number;

  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenAttempts: number = 0;

  constructor(options: CircuitBreakerOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts ?? 2;
  }

  public getState(): CircuitState {
    if (!this.enabled) return "CLOSED";

    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        this.halfOpenAttempts = 0;
      }
    }
    return this.state;
  }

  public checkHealth(): void {
    const currentState = this.getState();
    if (currentState === "OPEN") {
      const remainingMs = Math.max(0, this.resetTimeoutMs - (Date.now() - this.lastFailureTime));
      throw new CircuitBreakerError(
        `Circuit breaker is OPEN. Fast-failing requests to protect downstream service. Cooldown remaining: ${remainingMs}ms`,
        remainingMs
      );
    }
    if (currentState === "HALF_OPEN") {
      if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        throw new CircuitBreakerError(
          "Circuit breaker is HALF_OPEN testing recovery limit reached. Fast-failing concurrent requests.",
          this.resetTimeoutMs
        );
      }
      this.halfOpenAttempts++;
    }
  }

  public recordSuccess(): void {
    if (!this.enabled) return;

    if (this.state === "HALF_OPEN") {
      this.reset();
    } else {
      this.failureCount = 0;
    }
  }

  public recordFailure(isServerError: boolean): void {
    if (!this.enabled) return;
    if (!isServerError) return;

    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      return;
    }

    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  public reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenAttempts = 0;
  }
}
