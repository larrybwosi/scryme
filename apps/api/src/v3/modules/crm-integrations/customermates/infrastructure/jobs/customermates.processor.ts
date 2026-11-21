import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { CUSTOMERMATES_QUEUE_NAME, type CustomermatesJobData } from "../customermates-job.types";
import { CustomermatesBackfillService } from "../../application/customermates-backfill.service";
import { CustomermatesFailedService } from "../../application/customermates-failed.service";
import { CustomermatesReconciliationService } from "../../application/customermates-reconciliation.service";
import { CustomermatesRetentionService } from "../../application/customermates-retention.service";
import { CustomermatesSyncService } from "../../application/customermates-sync.service";
import { CustomermatesWritebackService } from "../../application/customermates-writeback.service";

@Processor(CUSTOMERMATES_QUEUE_NAME)
export class CustomermatesProcessor extends WorkerHost {
  private readonly logger = new Logger(CustomermatesProcessor.name);

  constructor(
    private readonly sync: CustomermatesSyncService,
    private readonly writeback: CustomermatesWritebackService,
    private readonly backfill: CustomermatesBackfillService,
    private readonly failed: CustomermatesFailedService,
    private readonly reconciliation: CustomermatesReconciliationService,
    private readonly retention: CustomermatesRetentionService,
  ) {
    super();
  }

  async process(job: Job<CustomermatesJobData>): Promise<unknown> {
    const data = job.data || ({} as CustomermatesJobData);
    this.logger.log(
      `Customermates job ${job.name} organization=${data.organizationId || "none"} event=${data.eventId || job.id}`,
    );

    switch (job.name) {
      case "apply-event":
        if (!data.integrationId || !data.eventId) return { applied: false };
        return this.sync.applyEvent(data.organizationId, data.integrationId, data.eventId);
      case "writeback":
        return this.writeback.applyWriteback(data, job.attemptsMade);
      case "backfill-page":
        return this.backfill.runPage(data);
      case "retry-failed":
        return this.failed.retry(data.organizationId, data.eventIds);
      case "reconcile":
        return this.reconciliation.runAll();
      case "cleanup":
        return this.retention.cleanup();
      default:
        return { ignored: true };
    }
  }
}
