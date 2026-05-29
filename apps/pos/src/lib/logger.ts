/**
 * Enterprise Logger Utility
 *
 * Wraps @tauri-apps/plugin-log to provide a consistent, structured logging
 * API across the frontend. All logs are persisted to the backend log file.
 */
import { debug as tauriDebug, info as tauriInfo, warn as tauriWarn, error as tauriError } from '@tauri-apps/plugin-log';
import { invoke } from '@tauri-apps/api/core';
import * as Sentry from '@sentry/browser';
import { type, version, arch, platform } from '@tauri-apps/plugin-os';

// ============================================================
// System Metadata Cache
// ============================================================
let systemMetadata: Record<string, unknown> | null = null;

function getSystemMetadata() {
  if (systemMetadata) return systemMetadata;
  try {
    // These functions from @tauri-apps/plugin-os are synchronous
    systemMetadata = {
      os: type(),
      version: version(),
      arch: arch(),
      platform: platform(),
    };
  } catch (e) {
    systemMetadata = { error: 'Failed to fetch system metadata' };
  }
  return systemMetadata;
}

// ============================================================
// Public Logger API
// ============================================================

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    const metadata = getSystemMetadata();
    const fullContext = { ...metadata, ...context, timestamp: new Date().toISOString() };
    const formatted = `${message} | ${JSON.stringify(fullContext)}`;
    tauriDebug(formatted).catch(() => {});
  },

  info: (message: string, context?: Record<string, unknown>) => {
    const metadata = getSystemMetadata();
    const fullContext = { ...metadata, ...context, timestamp: new Date().toISOString() };
    const formatted = `${message} | ${JSON.stringify(fullContext)}`;
    tauriInfo(formatted).catch(() => {});

    // Add breadcrumb to Sentry for better context on future errors
    Sentry.addBreadcrumb({
      category: 'log',
      message: message,
      level: 'info',
      data: fullContext,
    });
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    const metadata = getSystemMetadata();
    const fullContext = { ...metadata, ...context, timestamp: new Date().toISOString() };
    const formatted = `${message} | ${JSON.stringify(fullContext)}`;
    tauriWarn(formatted).catch(() => {});

    Sentry.addBreadcrumb({
      category: 'log',
      message: message,
      level: 'warning',
      data: fullContext,
    });
  },

  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const metadata = getSystemMetadata();
    const errStr = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error ?? '');
    const fullContext = { ...metadata, ...context, error: errStr, timestamp: new Date().toISOString() };
    const formatted = `${message} | ${JSON.stringify(fullContext)}`;
    tauriError(formatted).catch(() => {});

    // Report to Sentry
    Sentry.captureException(error instanceof Error ? error : new Error(String(error ?? message)), {
      extra: { context_msg: message, ...fullContext },
    });
  },
};

// ============================================================
// Audit Trail
// ============================================================

export interface AuditOptions {
  action: string;
  level?: 'INFO' | 'WARNING' | 'CRITICAL';
  actorId?: string;
  actorName?: string;
  locationId?: string;
  details?: Record<string, unknown>;
}

/**
 * Write a structured audit event to the backend audit trail.
 * This is the primary API for tracking user-initiated actions.
 */
export async function writeAudit(opts: AuditOptions): Promise<void> {
  try {
    await invoke('write_audit_log', {
      action: opts.action,
      level: opts.level ?? 'INFO',
      actorId: opts.actorId ?? null,
      actorName: opts.actorName ?? null,
      locationId: opts.locationId ?? null,
      deviceId: null,
      details: opts.details ?? null,
    });
  } catch (e) {
    // Best-effort — don't break the app if audit writing fails
    logger.warn(`[Audit] Failed to write audit event: ${opts.action}`, {
      error: String(e),
    });
  }
}

// ============================================================
// Global Error Capture
// ============================================================

/**
 * Call this once on app startup to automatically log
 * unhandled promise rejections and window errors to file.
 */
export function setupGlobalErrorCapture(): void {
  window.addEventListener('unhandledrejection', event => {
    logger.error('[Unhandled Promise Rejection]', event.reason);
  });

  window.addEventListener('error', event => {
    logger.error('[Uncaught Error]', event.error ?? event.message);
  });
}
