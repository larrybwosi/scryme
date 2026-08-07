import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class WebhookService {
  constructor(
    @InjectQueue("webhooks") private readonly webhookQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async dispatch(event: string, organizationId: string, payload: any) {
    const subscriptions = await this.prisma.client.webhookSubscription.findMany(
      {
        where: {
          organizationId,
          isActive: true,
          events: { has: event },
        },
      },
    );

    // OPTIMIZATION (Bolt ⚡): Parallelizing BullMQ enqueue operations with Promise.all
    // instead of awaiting them sequentially inside a loop. This reduces latency from O(N) sequential blocking waits to flat O(1).
    await Promise.all(
      subscriptions.map((sub) =>
        this.webhookQueue.add(
          "deliver",
          {
            subscriptionId: sub.id,
            event,
            payload,
            url: sub.url,
            secret: sub.secret,
          },
          {
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
          },
        ),
      ),
    );
  }

  async createLog(subscriptionId: string, event: string, payload: any) {
    return this.prisma.client.webhookLog.create({
      data: {
        subscriptionId,
        event,
        payload,
        status: "PENDING",
      },
    });
  }

  async updateLog(logId: string, data: any) {
    return this.prisma.client.webhookLog.update({
      where: { id: logId },
      data,
    });
  }

  generateSignature(payload: any, secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");
  }
}
