import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WorkflowHandlers } from "./handlers/workflow-handlers";

@Injectable()
export class AutomationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationWorkerService.name);
  private workerTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private concurrencyLimit = 5;
  private pollIntervalMs = 1000;
  private workerId = `worker_${Math.random().toString(36).substring(2, 9)}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowHandlers: WorkflowHandlers,
  ) {}

  onModuleInit() {
    this.startWorker();
  }

  onModuleDestroy() {
    this.stopWorker();
  }

  startWorker() {
    if (this.workerTimer) return;
    this.logger.log(`Starting Automation Engine Worker [${this.workerId}]...`);
    this.workerTimer = setInterval(() => {
      this.pollAndProcessJobs().catch((err) => {
        this.logger.error("Error in automation worker loop:", err);
      });
    }, this.pollIntervalMs);
  }

  stopWorker() {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
      this.logger.log(`Stopped Automation Engine Worker [${this.workerId}].`);
    }
  }

  async pollAndProcessJobs() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();

      // Find queued or retrying jobs that are ready to run
      const eligibleJobs = await (this.prisma.client as any).workflowEngineJob.findMany({
        where: {
          status: { in: ["QUEUED", "RETRYING"] },
          nextRunAt: { lte: now },
        },
        orderBy: { createdAt: "asc" },
        take: this.concurrencyLimit,
      });

      if (eligibleJobs.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Process each job concurrently up to limit
      await Promise.all(eligibleJobs.map((job: any) => this.processSingleJob(job)));
    } catch (error: any) {
      this.logger.error("Error polling workflow engine jobs:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processSingleJob(job: any) {
    const now = new Date();

    // Optimistic concurrency locking
    const updated = await (this.prisma.client as any).workflowEngineJob.updateMany({
      where: {
        id: job.id,
        status: { in: ["QUEUED", "RETRYING"] },
      },
      data: {
        status: "PROCESSING",
        lockedBy: this.workerId,
        lockedAt: now,
        attempts: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      // Job was claimed by another worker
      return;
    }

    const currentAttempt = job.attempts + 1;

    // Fetch associated definition to get config
    const definition = await (this.prisma.client as any).workflowEngineDefinition.findUnique({
      where: { id: job.definitionId },
    });

    try {
      // Audit log job started
      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId: job.organizationId,
          executionId: job.executionId,
          jobId: job.id,
          action: "JOB_STARTED",
          level: "INFO",
          details: { attempt: currentAttempt, handler: job.handler, workerId: this.workerId },
        },
      });

      // Execute handler
      const result = await this.workflowHandlers.executeHandler(job.handler, {
        organizationId: job.organizationId,
        executionId: job.executionId,
        jobId: job.id,
        definitionConfig: definition?.config || {},
        payload: job.payload,
      });

      // Mark job as COMPLETED
      await (this.prisma.client as any).workflowEngineJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          lockedBy: null,
          lockedAt: null,
        },
      });

      // Check if all jobs in execution completed to mark execution COMPLETED
      await this.checkAndUpdateExecutionStatus(job.executionId, result);

      // Audit log job completed
      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId: job.organizationId,
          executionId: job.executionId,
          jobId: job.id,
          action: "JOB_COMPLETED",
          level: "INFO",
          details: { attempt: currentAttempt, result },
        },
      });
    } catch (error: any) {
      const errorMessage = error.message || "Unknown execution error";
      this.logger.error(`Job ${job.id} failed (attempt ${currentAttempt}/${job.maxAttempts}): ${errorMessage}`);

      const hasMoreAttempts = currentAttempt < job.maxAttempts;

      if (hasMoreAttempts) {
        // Exponential backoff calculation: base * 2^(attempt-1)
        const delayMs = job.backoffMs * Math.pow(2, currentAttempt - 1);
        const nextRunAt = new Date(Date.now() + delayMs);

        await (this.prisma.client as any).workflowEngineJob.update({
          where: { id: job.id },
          data: {
            status: "RETRYING",
            nextRunAt,
            lastError: errorMessage,
            lockedBy: null,
            lockedAt: null,
          },
        });

        await (this.prisma.client as any).workflowEngineAuditLog.create({
          data: {
            organizationId: job.organizationId,
            executionId: job.executionId,
            jobId: job.id,
            action: "JOB_RETRIED",
            level: "WARN",
            details: { attempt: currentAttempt, maxAttempts: job.maxAttempts, nextRunAt, error: errorMessage },
          },
        });
      } else {
        // Job completely failed
        await (this.prisma.client as any).workflowEngineJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            lastError: errorMessage,
            lockedBy: null,
            lockedAt: null,
          },
        });

        await (this.prisma.client as any).workflowEngineExecution.update({
          where: { id: job.executionId },
          data: {
            status: "FAILED",
            error: errorMessage,
            completedAt: new Date(),
          },
        });

        await (this.prisma.client as any).workflowEngineAuditLog.create({
          data: {
            organizationId: job.organizationId,
            executionId: job.executionId,
            jobId: job.id,
            action: "JOB_FAILED",
            level: "ERROR",
            details: { attempt: currentAttempt, error: errorMessage },
          },
        });
      }
    }
  }

  private async checkAndUpdateExecutionStatus(executionId: string, result: any) {
    const remainingUnfinished = await (this.prisma.client as any).workflowEngineJob.count({
      where: {
        executionId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    });

    if (remainingUnfinished === 0) {
      await (this.prisma.client as any).workflowEngineExecution.update({
        where: { id: executionId },
        data: {
          status: "COMPLETED",
          result,
          completedAt: new Date(),
        },
      });
    }
  }
}
