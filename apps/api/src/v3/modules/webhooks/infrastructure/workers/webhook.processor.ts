import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhookService } from '../services/webhook.service';
import { PrismaService } from '@/prisma/prisma.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly prisma: PrismaService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'deliver') {
      const { subscriptionId, event, payload, url, secret } = job.data;

      const log = await this.webhookService.createLog(subscriptionId, event, payload);
      const signature = this.webhookService.generateSignature(payload, secret);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Dealio-Signature': signature,
            'X-Dealio-Event': event,
          },
          body: JSON.stringify(payload),
        });

        const responseBody = await response.text();

        await this.webhookService.updateLog(log.id, {
          responseStatus: response.status,
          responseBody: responseBody.substring(0, 1000),
          status: response.ok ? 'SUCCESS' : 'FAILED',
          attemptCount: job.attemptsMade + 1,
        });

        if (!response.ok) {
          throw new Error(`Delivery failed with status ${response.status}`);
        }
      } catch (error: any) {
        await this.webhookService.updateLog(log.id, {
          error: error.message,
          status: job.attemptsMade + 1 >= (job.opts.attempts || 1) ? 'FAILED' : 'RETRYING',
          attemptCount: job.attemptsMade + 1,
        });
        throw error;
      }
    }
  }
}
