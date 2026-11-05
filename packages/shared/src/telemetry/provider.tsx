"use client";

import React, { useEffect } from "react";
import {
  setTelemetryContext,
  trackTelemetryError,
  trackTelemetryEvent,
  TELEMETRY_EVENTS,
  defaultOpenObserveClient,
} from "./index";

export interface TelemetryProviderProps {
  service: string;
  organizationId?: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  children?: React.ReactNode;
}

/**
 * Enterprise Telemetry Provider
 *
 * Automatically captures global unhandled window errors, unhandled promise rejections,
 * attaches contextual tenant metadata, and records application initialization.
 */
export function TelemetryProvider({
  service,
  organizationId,
  userId,
  userEmail,
  role,
  children,
}: TelemetryProviderProps) {
  useEffect(() => {
    // 1. Configure OpenObserve Client with service identity
    defaultOpenObserveClient.updateConfig({ service });

    // 2. Set multi-tenant contextual identity
    setTelemetryContext({
      service,
      organizationId,
      userId,
      userEmail,
      role,
    });

    // 3. Record app initialization
    trackTelemetryEvent(TELEMETRY_EVENTS.APP_INITIALIZED, {
      screenResolution:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : undefined,
    });

    // 4. Attach window error handlers
    const handleError = (event: ErrorEvent) => {
      trackTelemetryError(event.error || event.message, {
        source: "window.onerror",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackTelemetryError(event.reason || "Unhandled Promise Rejection", {
        source: "window.onunhandledrejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [service, organizationId, userId, userEmail, role]);

  return <>{children}</>;
}
