import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { isSafeUrl } from "@repo/shared/server";
import axios from "axios";
import * as crypto from "crypto";

export type WebhookHttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OutgoingWebhookOptions {
  organizationId: string;
  executionId?: string;
  jobId?: string;
  webhookId?: string;
  endpointUrl: string;
  secret?: string;
  method?: WebhookHttpMethod | string;
  headers?: Record<string, string>;
  payload: any;
  timeoutMs?: number;
  idempotencyKey?: string;
}

const SUPPORTED_METHODS: WebhookHttpMethod[] = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  async dispatchOutgoingWebhook(options: OutgoingWebhookOptions): Promise<any> {
    const {
      organizationId,
      executionId,
      jobId,
      endpointUrl,
      secret,
      headers = {},
      payload,
      timeoutMs,
      idempotencyKey,
    } = options;

    const method = this.normalizeMethod(options.method);
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Dealio-Automation-WorkflowEngine/1.0",
      ...headers,
    };

    const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);

    if (secret) {
      const signature = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
      requestHeaders["X-Workflow-Signature"] = `sha256=${signature}`;
    }

    if (idempotencyKey) {
      requestHeaders["Idempotency-Key"] = idempotencyKey;
      requestHeaders["X-Workflow-Delivery"] = idempotencyKey;
    }

    if (!(await isSafeUrl(endpointUrl))) {
      const errorMessage = `Webhook dispatch blocked: URL '${endpointUrl}' failed SSRF security validation.`;
      this.logger.warn(errorMessage);
      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId,
          executionId,
          jobId,
          action: "WEBHOOK_DISPATCH_BLOCKED",
          level: "ERROR",
          details: {
            endpointUrl,
            method,
            idempotencyKey,
            error: errorMessage,
          },
        },
      });
      throw new Error(errorMessage);
    }

    const hasRequestBody = method !== "GET" && method !== "HEAD";
    const effectiveTimeout =
      typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : 10000;

    const startTime = Date.now();
    try {
      const response = await axios.request({
        url: endpointUrl,
        method,
        headers: requestHeaders,
        timeout: effectiveTimeout,
        ...(hasRequestBody
          ? { data: payloadString }
          : {
              params:
                payload && typeof payload === "object" && !Array.isArray(payload)
                  ? payload
                  : undefined,
            }),
      });

      const durationMs = Date.now() - startTime;
      const result = {
        status: response.status,
        statusText: response.statusText,
        durationMs,
        data: response.data,
      };

      // Create audit log
      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId,
          executionId,
          jobId,
          action: "WEBHOOK_DISPATCHED",
          level: "INFO",
          details: {
            endpointUrl,
            method,
            idempotencyKey,
            status: response.status,
            durationMs,
          },
        },
      });

      return {
        success: true,
        method,
        ...result,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error.response ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message;

      this.logger.error(`Failed to dispatch outgoing webhook to ${endpointUrl}: ${errorMessage}`);

      // Create error audit log
      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId,
          executionId,
          jobId,
          action: "WEBHOOK_DISPATCH_FAILED",
          level: "ERROR",
          details: {
            endpointUrl,
            method,
            idempotencyKey,
            error: errorMessage,
            durationMs,
          },
        },
      });

      throw new Error(`Webhook dispatch failed: ${errorMessage}`);
    }
  }

  private normalizeMethod(method?: string): WebhookHttpMethod {
    const normalized = String(method || "POST").toUpperCase() as WebhookHttpMethod;
    return SUPPORTED_METHODS.includes(normalized) ? normalized : "POST";
  }

  verifyIncomingSignature(secret: string, payload: string, signature: string): boolean {
    if (!secret || !signature) return false;

    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const cleanSignature = signature.replace(/^sha256=/, "");

    // Timing safe comparison after SHA-256 pre-hashing
    const expectedHash = crypto.createHash("sha256").update(expectedSignature).digest();
    const actualHash = crypto.createHash("sha256").update(cleanSignature).digest();

    return crypto.timingSafeEqual(expectedHash, actualHash);
  }
}
