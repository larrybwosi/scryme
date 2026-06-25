import { Injectable, Logger } from "@nestjs/common";
import { env } from "@repo/env/nest";

@Injectable()
export class OpenObserveService {
  private readonly logger = new Logger(OpenObserveService.name);
  private readonly isConfigured: boolean;

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
    }
  }

  async log(data: Record<string, any>) {
    if (!this.isConfigured) return;

    try {
      const url = `${env.OPENOBSERVE_URL}/api/${env.OPENOBSERVE_ORG}/${env.OPENOBSERVE_STREAM}/_json`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${env.OPENOBSERVE_TOKEN}`,
        },
        body: JSON.stringify([
          {
            _timestamp: new Date().getTime() * 1000, // OpenObserve expects microseconds
            ...data,
          },
        ]),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to send log to OpenObserve: ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      this.logger.error("Error sending log to OpenObserve", error);
    }
  }

  async logAuthFailure(details: {
    ip: string;
    userAgent: string;
    reason: string;
    path: string;
    method: string;
    headers?: Record<string, any>;
    correlationId?: string;
  }) {
    await this.log({
      type: "AUTH_FAILURE",
      severity: "error",
      ...details,
    });
  }

  async logAuthSuccess(details: {
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
    await this.log({
      type: "AUTH_SUCCESS",
      severity: "info",
      ...details,
    });
  }

  async logException(
    error: any,
    details: {
      path: string;
      method: string;
      ip: string;
      correlationId?: string;
    },
  ) {
    await this.log({
      type: "UNHANDLED_EXCEPTION",
      severity: "error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...details,
    });
  }
}
