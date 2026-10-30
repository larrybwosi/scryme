"use client";

import React, { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      posthogKey &&
      !posthogKey.includes("PLACEHOLDER") &&
      posthogKey !== "your-posthog-key"
    ) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
      });
    }
  }, [posthogKey, posthogHost]);

  if (
    !posthogKey ||
    posthogKey.includes("PLACEHOLDER") ||
    posthogKey === "your-posthog-key"
  ) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

/**
 * Standardized helper for capturing cross-app telemetry events.
 */
export function captureAnalyticsEvent(
  eventName: string,
  properties?: Record<string, any>,
) {
  if (typeof window !== "undefined" && (window as any).posthog) {
    try {
      posthog.capture(eventName, properties);
    } catch (e) {
      console.warn("[Analytics] Failed to dispatch PostHog event:", e);
    }
  }
}

/**
 * Standardized helper for identifying authenticated users.
 */
export function identifyUser(
  userId: string,
  userProperties?: Record<string, any>,
) {
  if (typeof window !== "undefined" && (window as any).posthog) {
    try {
      posthog.identify(userId, userProperties);
    } catch (e) {
      console.warn("[Analytics] Failed to identify user in PostHog:", e);
    }
  }
}
