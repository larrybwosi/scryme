import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import ClientLayout from './lib/providers';
import DynamicRenderer from './App';
import { ErrorBoundary } from './components/error-boundary';
import { setupGlobalErrorCapture } from './lib/logger';
import * as Sentry from '@sentry/browser';
import { defaultOptions } from 'tauri-plugin-sentry-api';
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react';
import { captureEvent } from 'tauri-plugin-better-posthog';
import './index.css';

// Initialize Sentry for frontend error tracking in production
if (!import.meta.env.DEV) {
  Sentry.init({
    ...defaultOptions,
    dsn: import.meta.env.VITE_PUBLIC_SENTRY_DSN,
  });
}

// Initialize PostHog
if (!import.meta.env.DEV) {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
    // debug: import.meta.env.DEV,

    // 1. Disable the incredibly noisy features
    disable_session_recording: true,
    capture_heatmaps: false,

    // 2. Keep Performance & Web Vitals enabled
    capture_performance: true,

    // --- PRIVACY MASKING (Commented out) ---
    // If you ever set `disable_session_recording: false`, uncomment these
    // to prevent recording sensitive customer/financial data in your POS:
    //
    // mask_all_text: true,               // Replaces all text on the screen with ***
    // mask_all_element_attributes: true, // Masks sensitive HTML attributes
    // ---------------------------------------

    // Route your custom events through the Rust backend, but let internal events pass
    before_send: [
      captureResult => {
        if (!captureResult) return null;

        const { event, properties } = captureResult;

        // If it is an internal PostHog event (like `$web_vitals` or `$pageview`),
        // return the result so the frontend JS sends it to the API normally.
        if (event.startsWith('$')) {
          return captureResult;
        }

        // If it is YOUR custom event, pass it to Rust via Tauri IPC
        captureEvent(event, properties).catch(console.error);

        // CRITICAL: Return `null` to stop posthog-js from sending a network request
        // for your custom event, preventing duplicate events.
        return null;
      },
    ],
  });

  Sentry.getCurrentScope().setTag('posthog_session_id', posthog.get_session_id());
}

// Capture unhandled errors and promise rejections → persisted to log files
setupGlobalErrorCapture();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <ClientLayout>
        <ErrorBoundary>
          <DynamicRenderer />
        </ErrorBoundary>
      </ClientLayout>
    </PostHogProvider>
  </StrictMode>
);
