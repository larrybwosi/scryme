import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { WebhookService } from "../services/webhook.service";
import { PrismaService } from "@/prisma/prisma.service";
import { isSafeUrl } from "@repo/shared/server";

@Processor("webhooks")
export class WebhookProcessor extends WorkerHost {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === "deliver") {
      const { subscriptionId, event, payload, url, secret, headers: customHeaders } = job.data;

      // @security Validate URL to prevent SSRF
      if (!(await isSafeUrl(url))) {
        const log = await this.webhookService.createLog(
          subscriptionId,
          event,
          payload,
        );
        await this.webhookService.updateLog(log.id, {
          error: "Insecure webhook URL blocked (SSRF protection)",
          status: "FAILED",
        });
        throw new Error("Insecure webhook URL blocked");
      }

      const log = await this.webhookService.createLog(
        subscriptionId,
        event,
        payload,
      );
      const signature = secret ? this.webhookService.generateSignature(payload, secret) : "";

      try {
        const dispatchHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "Dealio-WebhookEngine/1.0",
          "X-Dealio-Event": event,
          ...(signature && {
            "X-Dealio-Signature": signature,
            "X-Hub-Signature-256": `sha256=${signature}`,
          }),
          ...(customHeaders || {}),
        };

        const response = await fetch(url, {
          method: "POST",
          headers: dispatchHeaders,
          body: typeof payload === "string" ? payload : JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });

        const responseBody = await response.text();

        await this.webhookService.updateLog(log.id, {
          responseStatus: response.status,
          responseBody: responseBody.substring(0, 1000),
          status: response.ok ? "SUCCESS" : "FAILED",
          attemptCount: job.attemptsMade + 1,
        });

        if (!response.ok) {
          throw new Error(`Delivery failed with status ${response.status}`);
        }
      } catch (error: any) {
        await this.webhookService.updateLog(log.id, {
          error: error.message,
          status:
            job.attemptsMade + 1 >= (job.opts.attempts || 1)
              ? "FAILED"
              : "RETRYING",
          attemptCount: job.attemptsMade + 1,
        });
        throw error;
      }
    }
  }
}
