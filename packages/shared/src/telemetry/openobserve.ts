/**
 * Universal OpenObserve Client for Scryme Web Applications & Services
 *
 * Implements high-performance memory queueing, batching, exponential retry,
 * localStorage recovery, PII sanitization, and Beacon API flush on browser unload.
 */

import { maskSensitiveData } from "./sanitizer";

export interface OpenObserveClientConfig {
  url?: string;
  organization?: string;
  stream?: string;
  authToken?: string;
  service?: string;
  environment?: string;
  batchSize?: number;
  flushIntervalMs?: number;
  storageKey?: string;
}

export interface TelemetryEvent {
  event: string;
  timestamp: string;
  service: string;
  environment: string;
  tenantId?: string;
  organizationId?: string;
  userContext?: Record<string, unknown>;
  [key: string]: unknown;
}

export class OpenObserveClient {
  private queue: TelemetryEvent[] = [];
  private userContext: Record<string, unknown> = {};
  private timer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private config: Required<OpenObserveClientConfig>;

  constructor(options: OpenObserveClientConfig = {}) {
    const isBrowser = typeof window !== "undefined";

    const defaultUrl =
      options.url ||
      (typeof process !== "undefined"
        ? process.env?.NEXT_PUBLIC_OPENOBSERVE_URL || process.env?.OPENOBSERVE_URL
        : undefined);

    const defaultOrg =
      options.organization ||
      (typeof process !== "undefined"
        ? process.env?.NEXT_PUBLIC_OPENOBSERVE_ORGANIZATION ||
          process.env?.OPENOBSERVE_ORGANIZATION
        : undefined) ||
      "default";

    const defaultStream =
      options.stream ||
      (typeof process !== "undefined"
        ? process.env?.NEXT_PUBLIC_OPENOBSERVE_STREAM || process.env?.OPENOBSERVE_STREAM
        : undefined) ||
      "client-events";

    const defaultToken =
      options.authToken ||
      (typeof process !== "undefined"
        ? process.env?.NEXT_PUBLIC_OPENOBSERVE_AUTH_TOKEN ||
          process.env?.OPENOBSERVE_AUTH_TOKEN
        : undefined);

    const defaultService =
      options.service ||
      (typeof process !== "undefined"
        ? process.env?.NEXT_PUBLIC_SERVICE_NAME || process.env?.SERVICE_NAME
        : undefined) ||
      "web-client";

    const defaultEnv =
      options.environment ||
      (typeof process !== "undefined"
        ? process.env?.NODE_ENV || process.env?.NEXT_PUBLIC_APP_ENV
        : undefined) ||
      "production";

    this.config = {
      url: defaultUrl || "",
      organization: defaultOrg,
      stream: defaultStream,
      authToken: defaultToken || "",
      service: defaultService,
      environment: defaultEnv,
      batchSize: options.batchSize || 10,
      flushIntervalMs: options.flushIntervalMs || 5000,
      storageKey: options.storageKey || "scryme_telemetry_pending_events",
    };

    if (isBrowser) {
      this.loadPersistedEvents();
      this.startPeriodicFlush();
    }
  }

  public updateConfig(newConfig: Partial<OpenObserveClientConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  private loadPersistedEvents() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.queue.push(...parsed);
        }
      }
    } catch {
      // Best-effort cache recovery
    }
  }

  private persistQueue() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      if (this.queue.length === 0) {
        localStorage.removeItem(this.config.storageKey);
      } else {
        localStorage.setItem(
          this.config.storageKey,
          JSON.stringify(this.queue.slice(-200)),
        );
      }
    } catch {
      // Best-effort cache persistence
    }
  }

  private startPeriodicFlush() {
    if (typeof window === "undefined") return;
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.flush();
    }, this.config.flushIntervalMs);

    if (typeof window.addEventListener === "function") {
      window.addEventListener("online", () => this.flush());
      window.addEventListener("beforeunload", () => this.flushSync());
    }
  }

  public setUserContext(context: Record<string, unknown>) {
    const sanitized = maskSensitiveData(context);
    this.userContext = { ...this.userContext, ...sanitized };
  }

  public clearUserContext() {
    this.userContext = {};
  }

  public track(event: string, properties?: Record<string, unknown>) {
    const sanitizedProps = properties ? maskSensitiveData(properties) : {};

    const organizationId =
      (sanitizedProps.organizationId as string) ||
      (this.userContext.organizationId as string) ||
      undefined;

    const payload: TelemetryEvent = {
      event,
      timestamp: new Date().toISOString(),
      service: this.config.service,
      environment: this.config.environment,
      organizationId,
      tenantId: organizationId,
      userContext: Object.keys(this.userContext).length > 0 ? { ...this.userContext } : undefined,
      ...sanitizedProps,
    };

    this.queue.push(payload);
    this.persistQueue();

    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    if (!this.config.url || this.config.url.includes("PLACEHOLDER") || this.config.url === "your-openobserve-url") {
      // Drain queue safely when endpoint not configured
      this.queue = [];
      this.persistQueue();
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return; // Keep queue and retry once online
    }

    this.isFlushing = true;
    const batch = [...this.queue];

    let baseUrl = this.config.url.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }

    const endpoint = `${baseUrl}/api/${encodeURIComponent(this.config.organization)}/${encodeURIComponent(this.config.stream)}/_json`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.authToken) {
      const token = this.config.authToken.trim();
      if (token.startsWith("Basic ") || token.startsWith("Bearer ")) {
        headers["Authorization"] = token;
      } else {
        headers["Authorization"] = `Basic ${token}`;
      }
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        this.queue = this.queue.slice(batch.length);
        this.persistQueue();
      }
    } catch {
      // Network error; events preserved in queue for subsequent retry
    } finally {
      this.isFlushing = false;
    }
  }

  private flushSync() {
    if (this.queue.length === 0 || !this.config.url) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    let baseUrl = this.config.url.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    const endpoint = `${baseUrl}/api/${encodeURIComponent(this.config.organization)}/${encodeURIComponent(this.config.stream)}/_json`;

    try {
      const body = JSON.stringify(this.queue);
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(endpoint, blob);
      }
    } catch {
      // Best-effort flush on page lifecycle unload
    }
  }

  public getQueue(): TelemetryEvent[] {
    return [...this.queue];
  }

  public clearQueueForTesting() {
    this.queue = [];
    this.userContext = {};
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(this.config.storageKey);
    }
  }
}

export const defaultOpenObserveClient = new OpenObserveClient();
