import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { CUSTOMERMATES_QUEUE_NAME, type CustomermatesJobData } from "../customermates-job.types";
import { PrismaService } from "@/prisma/prisma.service";
import { CUSTOMERMATES_DEFINITION_SLUG, getSettings } from "../../domain/customermates-context";
import { CustomermatesBackfillService } from "../../application/customermates-backfill.service";
import { CustomermatesFailedService } from "../../application/customermates-failed.service";

@Injectable()
export class CustomermatesScheduler {
  private readonly logger = new Logger(CustomermatesScheduler.name);

  constructor(
    @InjectQueue(CUSTOMERMATES_QUEUE_NAME) private readonly queue: Queue<CustomermatesJobData>,
    private readonly prisma: PrismaService,
    private readonly backfill: CustomermatesBackfillService,
    private readonly failed: CustomermatesFailedService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runPendingJobs() {
    const integrations = await this.prisma.client.organizationIntegration.findMany({
      where: {
        isActive: true,
        integrationDefinition: { slug: CUSTOMERMATES_DEFINITION_SLUG },
      },
      select: { organizationId: true, settings: true },
    });

    for (const integration of integrations) {
      const settings = getSettings(integration.settings);
      if (settings.backfillPending) await this.backfill.queuePending(integration.organizationId);
      if (settings.retryPending) await this.failed.retryPending(integration.organizationId);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runNightlyJobs() {
    this.logger.log("Queueing Customermates nightly reconciliation and retention");
    await this.queue.add(
      "reconcile",
      { organizationId: "system", source: "reconcile" },
      { attempts: 2, backoff: { type: "exponential", delay: 60000 }, removeOnComplete: true },
    );
    await this.queue.add(
      "cleanup",
      { organizationId: "system", source: "reconcile" },
      { attempts: 2, backoff: { type: "exponential", delay: 60000 }, removeOnComplete: true },
    );
  }
}
