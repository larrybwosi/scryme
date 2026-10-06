/**
 * Lightweight OpenObserve Telemetry Transport for POS App
 *
 * Batches telemetry events in memory/storage and dispatches them to OpenObserve's
 * JSON ingestion API (`/api/{organization}/{stream}/_json`) without external script dependencies.
 */

export interface OpenObserveConfig {
  url?: string;
  organization: string;
  stream: string;
  authToken?: string;
  batchSize: number;
  flushIntervalMs: number;
}

export interface OpenObserveEvent {
  event: string;
  timestamp: string;
  service: string;
  environment: string;
  userContext?: Record<string, unknown>;
  [key: string]: unknown;
}

const STORAGE_KEY = "pos_openobserve_pending_events";

class OpenObserveClient {
  private queue: OpenObserveEvent[] = [];
  private userContext: Record<string, unknown> = {};
  private timer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  private getConfig(): OpenObserveConfig {
    const envUrl =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.VITE_OPENOBSERVE_URL || import.meta.env.NEXT_PUBLIC_OPENOBSERVE_URL
        : undefined;

    const envOrg =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.VITE_OPENOBSERVE_ORGANIZATION
        : "default";

    const envStream =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.VITE_OPENOBSERVE_STREAM
        : "pos-events";

    const envToken =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.VITE_OPENOBSERVE_AUTH_TOKEN
        : undefined;

    return {
      url: envUrl,
      organization: envOrg || "default",
      stream: envStream || "pos-events",
      authToken: envToken,
      batchSize: 10,
      flushIntervalMs: 5000,
    };
  }

  constructor() {
    this.loadPersistedEvents();
    this.startPeriodicFlush();
  }

  private loadPersistedEvents() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.queue.push(...parsed);
        }
      }
    } catch {
      // Best-effort cache restoration
    }
  }

  private persistQueue() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      if (this.queue.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue.slice(-200)));
      }
    } catch {
      // Best-effort cache persistence
    }
  }

  private startPeriodicFlush() {
    if (typeof window === "undefined") return;
    if (this.timer) clearInterval(this.timer);

    const config = this.getConfig();
    this.timer = setInterval(() => {
      this.flush();
    }, config.flushIntervalMs);

    if (typeof window.addEventListener === "function") {
      window.addEventListener("online", () => this.flush());
      window.addEventListener("beforeunload", () => this.flushSync());
    }
  }

  public setUserContext(context: Record<string, unknown>) {
    this.userContext = { ...this.userContext, ...context };
  }

  public clearUserContext() {
    this.userContext = {};
  }

  public track(event: string, properties?: Record<string, unknown>) {
    const config = this.getConfig();

    const payload: OpenObserveEvent = {
      event,
      timestamp: new Date().toISOString(),
      service: "pos-app",
      environment:
        typeof import.meta !== "undefined" && import.meta.env?.MODE
          ? import.meta.env.MODE
          : "production",
      userContext: Object.keys(this.userContext).length > 0 ? { ...this.userContext } : undefined,
      ...properties,
    };

    this.queue.push(payload);
    this.persistQueue();

    if (this.queue.length >= config.batchSize) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    const config = this.getConfig();
    if (!config.url || config.url.includes("PLACEHOLDER") || config.url === "your-openobserve-url") {
      // If no OpenObserve URL is configured, drain queue so memory doesn't grow indefinitely
      this.queue = [];
      this.persistQueue();
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return; // Retry when back online
    }

    this.isFlushing = true;
    const batch = [...this.queue];

    let baseUrl = config.url.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }

    const endpoint = `${baseUrl}/api/${encodeURIComponent(config.organization)}/${encodeURIComponent(config.stream)}/_json`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.authToken) {
      const token = config.authToken.trim();
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
        // Remove dispatched batch items
        this.queue = this.queue.slice(batch.length);
        this.persistQueue();
      }
    } catch {
      // Network failure or endpoint error; queue remains for retry
    } finally {
      this.isFlushing = false;
    }
  }

  private flushSync() {
    if (this.queue.length === 0) return;
    const config = this.getConfig();
    if (!config.url || !navigator.onLine) return;

    let baseUrl = config.url.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    const endpoint = `${baseUrl}/api/${encodeURIComponent(config.organization)}/${encodeURIComponent(config.stream)}/_json`;

    try {
      const body = JSON.stringify(this.queue);
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(endpoint, blob);
      }
    } catch {
      // Best effort flush
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clearQueueForTesting() {
    this.queue = [];
    this.userContext = {};
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const openObserveClient = new OpenObserveClient();

export function trackOpenObserveEvent(event: string, properties?: Record<string, unknown>) {
  openObserveClient.track(event, properties);
}

export function setOpenObserveUserContext(context: Record<string, unknown>) {
  openObserveClient.setUserContext(context);
}

export function clearOpenObserveUserContext() {
  openObserveClient.clearUserContext();
}
