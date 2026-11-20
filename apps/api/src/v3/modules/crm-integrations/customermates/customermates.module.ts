import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { CUSTOMERMATES_QUEUE_NAME } from "./infrastructure/customermates-job.types";
import { CustomermatesAdminController } from "./interfaces/http/customermates-admin.controller";
import { CustomermatesWebhookController } from "./interfaces/http/customermates-webhook.controller";
import { CustomermatesBackfillService } from "./application/customermates-backfill.service";
import { CustomermatesConnectionService } from "./application/customermates-connection.service";
import { CustomermatesFailedService } from "./application/customermates-failed.service";
import { CustomermatesMetricsService } from "./application/customermates-metrics.service";
import { CustomermatesReconciliationService } from "./application/customermates-reconciliation.service";
import { CustomermatesRetentionService } from "./application/customermates-retention.service";
import { CustomermatesSyncService } from "./application/customermates-sync.service";
import { CustomermatesWebhookService } from "./application/customermates-webhook.service";
import { CustomermatesWritebackService } from "./application/customermates-writeback.service";
import { CustomermatesProcessor } from "./infrastructure/jobs/customermates.processor";
import { CustomermatesScheduler } from "./infrastructure/jobs/customermates.scheduler";

@Module({
  imports: [BullModule.registerQueue({ name: CUSTOMERMATES_QUEUE_NAME })],
  controllers: [CustomermatesAdminController, CustomermatesWebhookController],
  providers: [
    CustomermatesConnectionService,
    CustomermatesWebhookService,
    CustomermatesSyncService,
    CustomermatesWritebackService,
    CustomermatesBackfillService,
    CustomermatesFailedService,
    CustomermatesReconciliationService,
    CustomermatesRetentionService,
    CustomermatesMetricsService,
    CustomermatesProcessor,
    CustomermatesScheduler,
  ],
  exports: [CustomermatesConnectionService, CustomermatesWritebackService],
})
export class CustomermatesModule {}
