import { Injectable, Logger } from "@nestjs/common";
import { env } from "@repo/env";

@Injectable()
export class OpenObserveService {
  private readonly logger = new Logger(OpenObserveService.name);
  private readonly isConfigured: boolean;
  private readonly url: string = "";

  constructor() {
    this.isConfigured = !!(
      env.OPENOBSERVE_URL &&
      env.OPENOBSERVE_ORG &&
      env.OPENOBSERVE_STREAM &&
      env.OPENOBSERVE_TOKEN
    );

    if (!this.isConfigured) {
      this.logger.warn(
        "OpenObserve is not configured. Logging to OpenObserve will be skipped.",
      );
    } else {
      // Clean up potential trailing slashes from the base URL configuration
      const baseUrl = env.OPENOBSERVE_URL.replace(/\/$/, "");
      this.url = `${baseUrl}/api/${env.OPENOBSERVE_ORG}/${env.OPENOBSERVE_STREAM}/_json`;
    }
  }

  async log(data: Record<string, any>) {
    if (!this.isConfigured) return;

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Assumes OPENOBSERVE_TOKEN is already the base64 encoded string of 'user:pass'
          Authorization: `Basic ${env.OPENOBSERVE_TOKEN}`,
        },
        body: JSON.stringify([
          {
            _timestamp: Date.now() * 1000, // microsecond epoch conversion
            ...data,
          },
        ]),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to send log to OpenObserve: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      this.logger.error(
        "Unexpected exception while sending log to OpenObserve",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // Fire-and-forget patterns (Notice the dropped 'await' so we don't block main threads)
  logAuthFailure(details: {
    ip: string;
    userAgent: string;
    reason: string;
    path: string;
    method: string;
    headers?: Record<string, any>;
    correlationId?: string;
  }) {
    this.log({
      type: "AUTH_FAILURE",
      severity: "error",
      ...details,
    }).catch(err =>
      this.logger.error("AuthFailure trace capture broke down", err?.stack),
    );
  }

  logAuthSuccess(details: {
    ip: string;
    userAgent: string;
    path: string;
    method: string;
    authType: string;
    organizationId?: string;
    deviceId?: string;
    memberId?: string;
    correlationId?: string;
  }) {
    this.log({
      type: "AUTH_SUCCESS",
      severity: "info",
      ...details,
    }).catch(err =>
      this.logger.error("AuthSuccess trace capture broke down", err?.stack),
    );
  }

  logException(
    error: any,
    details: {
      path: string;
      method: string;
      ip: string;
      correlationId?: string;
    },
  ) {
    this.log({
      type: "UNHANDLED_EXCEPTION",
      severity: "error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...details,
    }).catch(err =>
      this.logger.error("Exception mapping pipeline broke down", err?.stack),
    );
  }
}
