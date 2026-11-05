/**
 * Scryme Enterprise Observability & Telemetry Framework
 *
 * Implements dual telemetry collection:
 * - OpenObserve: High-frequency operational logs, metrics, performance, and unhandled errors.
 * - OpenPanel: User journeys, navigation views, and product analytics.
 */

import { maskSensitiveData } from "./sanitizer";
import {
  OpenObserveClient,
  OpenObserveClientConfig,
  TelemetryEvent,
  defaultOpenObserveClient,
} from "./openobserve";

export * from "./sanitizer";
export * from "./openobserve";

export interface TelemetryContext {
  organizationId?: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  service?: string;
  [key: string]: unknown;
}

let activeContext: TelemetryContext = {};

/**
 * Configure global tenant and user context across telemetry dispatchers
 */
export function setTelemetryContext(context: TelemetryContext) {
  const sanitized = maskSensitiveData(context);
  activeContext = { ...activeContext, ...sanitized };
  defaultOpenObserveClient.setUserContext(activeContext);
}

/**
 * Retrieve current active telemetry context
 */
export function getTelemetryContext(): TelemetryContext {
  return { ...activeContext };
}

/**
 * Clear global telemetry context on logout / session termination
 */
export function clearTelemetryContext() {
  activeContext = {};
  defaultOpenObserveClient.clearUserContext();
}

/**
 * Standard enterprise telemetry event names
 */
export const TELEMETRY_EVENTS = {
  // Navigation & Lifecycle
  APP_INITIALIZED: "app_initialized",
  PAGE_VIEWED: "page_viewed",
  ROUTE_CHANGED: "route_changed",
  TAB_SWITCHED: "tab_switched",

  // Authentication & Security
  AUTH_SIGNIN_SUCCESS: "auth_signin_success",
  AUTH_SIGNIN_FAILED: "auth_signin_failed",
  AUTH_SIGNOUT: "auth_signout",
  AUTH_SESSION_EXPIRED: "auth_session_expired",

  // Operational & Workflows
  TASK_CREATED: "task_created",
  TASK_UPDATED: "task_updated",
  TASK_DELETED: "task_deleted",
  PROJECT_CREATED: "project_created",
  SCHEDULE_UPDATED: "schedule_updated",
  TIMESHEET_APPROVED: "timesheet_approved",

  // POS & Transactions
  SALE_INITIATED: "sale_initiated",
  SALE_COMPLETED: "sale_completed",
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_FAILED: "payment_failed",

  // System Health & Diagnostics
  CLIENT_ERROR: "client_error",
  UNHANDLED_REJECTION: "unhandled_rejection",
  API_REQUEST_FAILED: "api_request_failed",
  PERFORMANCE_METRIC: "performance_metric",
} as const;

export type TelemetryEventName =
  | (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS]
  | string;

/**
 * Track an operational telemetry event in OpenObserve (and OpenPanel if available)
 */
export function trackTelemetryEvent(
  event: TelemetryEventName,
  properties?: Record<string, unknown>,
) {
  const sanitized = properties ? maskSensitiveData(properties) : {};

  // 1. Dispatch to OpenObserve
  defaultOpenObserveClient.track(event, {
    ...activeContext,
    ...sanitized,
  });

  // 2. Dispatch to OpenPanel if present on window
  if (typeof window !== "undefined") {
    try {
      if (typeof (window as any).op === "function") {
        (window as any).op("track", {
          name: event,
          ...activeContext,
          ...sanitized,
        });
      }
    } catch {
      // Best-effort OpenPanel tracking
    }
  }
}

/**
 * Report an unhandled client error or exception to OpenObserve
 */
export function trackTelemetryError(
  error: Error | string | unknown,
  context?: Record<string, unknown>,
) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  const errorStack = error instanceof Error ? error.stack : undefined;

  trackTelemetryEvent(TELEMETRY_EVENTS.CLIENT_ERROR, {
    errorMessage,
    errorStack,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    ...context,
  });
}

/**
 * Report performance metrics (Core Web Vitals, API latency, render durations)
 */
export function trackTelemetryPerformance(
  name: string,
  durationMs: number,
  properties?: Record<string, unknown>,
) {
  trackTelemetryEvent(TELEMETRY_EVENTS.PERFORMANCE_METRIC, {
    metricName: name,
    durationMs,
    ...properties,
  });
}
