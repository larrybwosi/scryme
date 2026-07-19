import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Initialize Sentry client
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "https://placeholder-dsn@sentry.io/placeholder",

  sendDefaultPii: true,

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: only capture when an error occurs
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [
    Sentry.replayIntegration(),
  ],

  beforeSend(event) {
    if (event.exception && typeof window !== "undefined") {
      try {
        if (typeof posthog !== "undefined" && typeof posthog.startSessionRecording === "function") {
          posthog.startSessionRecording();
        }
      } catch (e) {
        // ignore
      }
    }
    return event;
  },
});

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-05-30",
    capture_pageview: true,
    capture_pageleave: true,
    capture_exceptions: true,
    disable_session_recording: true,
    debug: process.env.NODE_ENV === "development",
  });
}
