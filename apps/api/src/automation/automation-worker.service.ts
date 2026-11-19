import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WorkflowHandlers } from "./handlers/workflow-handlers";
import { WorkflowDagRunnerService } from "./workflow-dag-runner.service";
import type { DagResumeState } from "./workflow-dag-runner.service";

@Injectable()
export class AutomationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationWorkerService.name);
  private workerTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private concurrencyLimit = 5;
  private pollIntervalMs = 1000;
  private readonly staleLockMs = this.readPositiveInt("WORKFLOW_STALE_LOCK_MS", 5 * 60 * 1000);
  private readonly maxResumeStateBytes = this.readPositiveInt("WORKFLOW_MAX_RESUME_STATE_BYTES", 512 * 1024);
  private workerId = `worker_${Math.random().toString(36).substring(2, 9)}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowHandlers: WorkflowHandlers,
    private readonly dagRunner?: WorkflowDagRunnerService,
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
      await this.recoverStaleJobs();

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
        return;
      }

      // Process each job concurrently up to limit
      await Promise.all(
        eligibleJobs.map((job: any) =>
          this.processSingleJob(job).catch((error) => {
            this.logger.error(`Unhandled error while processing workflow job ${job.id}:`, error);
          }),
        ),
      );
    } catch (error: any) {
      this.logger.error("Error polling workflow engine jobs:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Requeues jobs whose worker died while holding the processing lock, so they
   * can be picked up again instead of staying stuck forever.
   */
  async recoverStaleJobs() {
    const cutoff = new Date(Date.now() - this.staleLockMs);

    const staleJobs = await (this.prisma.client as any).workflowEngineJob.findMany({
      where: {
        status: "PROCESSING",
        lockedAt: { lt: cutoff },
      },
      take: this.concurrencyLimit,
    });

    if (staleJobs.length === 0) return;

    const ids = staleJobs.map((job: any) => job.id);
    await (this.prisma.client as any).workflowEngineJob.updateMany({
      where: {
        id: { in: ids },
        status: "PROCESSING",
      },
      data: {
        status: "QUEUED",
        lockedBy: null,
        lockedAt: null,
        nextRunAt: new Date(),
      },
    });

    for (const job of staleJobs) {
      await this.writeAuditLog(job, "JOB_LOCK_RECOVERED", "WARN", {
        previousWorkerId: job.lockedBy,
        lockedAt: job.lockedAt,
        recoveredBy: this.workerId,
      });
    }

    this.logger.warn(`Recovered ${staleJobs.length} stale workflow job lock(s).`);
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

    const execution = await (this.prisma.client as any).workflowEngineExecution.findUnique({
      where: { id: job.executionId },
      select: { status: true },
    });

    if (execution?.status === "CANCELLED") {
      await (this.prisma.client as any).workflowEngineJob.update({
        where: { id: job.id },
        data: {
          status: "CANCELLED",
          lockedBy: null,
          lockedAt: null,
        },
      });
      await this.writeAuditLog(job, "JOB_CANCELLED", "WARN", {
        attempt: currentAttempt,
        reason: "Execution was cancelled before the job started.",
      });
      return;
    }

    // Fetch associated definition to get config
    const definition = await (this.prisma.client as any).workflowEngineDefinition.findUnique({
      where: { id: job.definitionId },
    });

    try {
      // Audit log job started
      await this.writeAuditLog(job, "JOB_STARTED", "INFO", {
        attempt: currentAttempt,
        handler: job.handler,
        workerId: this.workerId,
      });

      // Execute handler or DAG steps if visual canvas nodes are configured
      const studioNodes = (definition?.config as any)?.studio?.nodes;
      let result: any;
      if (this.dagRunner && Array.isArray(studioNodes) && studioNodes.length > 0) {
        this.logger.log(`Executing DAG steps (${studioNodes.length} nodes) for job ${job.id}`);

        const resumeState = await this.loadResumeState(job);

        result = await this.dagRunner.executeDag({
          organizationId: job.organizationId,
          executionId: job.executionId,
          jobId: job.id,
          definitionId: definition?.id,
          definitionConfig: (definition?.config as any) || {},
          payload: job.payload || {},
          isSimulation: false,
          resumeState,
        });
      } else {
        result = await this.workflowHandlers.executeHandler(job.handler, {
          organizationId: job.organizationId,
          executionId: job.executionId,
          jobId: job.id,
          definitionConfig: definition?.config || {},
          payload: job.payload,
        });
      }

      if (result?.cancelled) {
        await (this.prisma.client as any).workflowEngineJob.update({
          where: { id: job.id },
          data: {
            status: "CANCELLED",
            processedAt: new Date(),
            lockedBy: null,
            lockedAt: null,
          },
        });
        await (this.prisma.client as any).workflowEngineExecution.update({
          where: { id: job.executionId },
          data: {
            status: "CANCELLED",
            completedAt: new Date(),
          },
        });
        await this.writeAuditLog(job, "JOB_CANCELLED", "WARN", {
          attempt: currentAttempt,
          reason: result.error || "Execution cancelled by an operator.",
        });
        return;
      }

      if (result?.paused && result.resumeAt) {
        const resumeAt = new Date(result.resumeAt);
        const safeResumeAt = Number.isNaN(resumeAt.getTime()) ? new Date() : resumeAt;

        await (this.prisma.client as any).workflowEngineJob.update({
          where: { id: job.id },
          data: {
            status: "RETRYING",
            nextRunAt: safeResumeAt,
            lastError: null,
            processedAt: null,
            lockedBy: null,
            lockedAt: null,
            // A delay pause is not a failed attempt, so give the attempt back.
            attempts: job.attempts,
          },
        });

        await this.writeAuditLog(job, "JOB_PAUSED", "INFO", {
          attempt: currentAttempt,
          resumeAt: safeResumeAt.toISOString(),
          pausedSteps: result.steps?.filter((step: any) => step.status === "COMPLETED").length || 0,
        });
        return;
      }

      if (result && result.success === false) {
        throw new Error(result.error || "Workflow execution reported a failure.");
      }

      // Mark job as COMPLETED
      await (this.prisma.client as any).workflowEngineJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          lastError: null,
          lockedBy: null,
          lockedAt: null,
        },
      });

      // Check if all jobs in execution completed to mark execution COMPLETED
      await this.checkAndUpdateExecutionStatus(job.executionId, result);

      // Audit log job completed
      await this.writeAuditLog(job, "JOB_COMPLETED", "INFO", {
        attempt: currentAttempt,
        result,
      });
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown execution error";
      this.logger.error(
        `Job ${job.id} failed (attempt ${currentAttempt}/${job.maxAttempts}): ${errorMessage}`,
      );

      const latestExecution = await (this.prisma.client as any).workflowEngineExecution.findUnique({
        where: { id: job.executionId },
        select: { status: true },
      });

      if (latestExecution?.status === "CANCELLED") {
        await (this.prisma.client as any).workflowEngineJob.update({
          where: { id: job.id },
          data: {
            status: "CANCELLED",
            lastError: errorMessage,
            lockedBy: null,
            lockedAt: null,
          },
        });
        await this.writeAuditLog(job, "JOB_CANCELLED", "WARN", {
          attempt: currentAttempt,
          reason: "Execution was cancelled while the job was running.",
          error: errorMessage,
        });
        return;
      }

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

        await this.writeAuditLog(job, "JOB_RETRIED", "WARN", {
          attempt: currentAttempt,
          maxAttempts: job.maxAttempts,
          nextRunAt,
          error: errorMessage,
        });
      } else {
        // Job completely failed and enters the dead letter queue.
        await (this.prisma.client as any).workflowEngineJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            lastError: errorMessage,
            processedAt: new Date(),
            lockedBy: null,
            lockedAt: null,
          },
        });

        await (this.prisma.client as any).workflowEngineExecution.updateMany({
          where: {
            id: job.executionId,
            status: { notIn: ["CANCELLED", "COMPLETED"] },
          },
          data: {
            status: "FAILED",
            error: errorMessage,
            completedAt: new Date(),
          },
        });

        await this.writeAuditLog(job, "JOB_FAILED", "ERROR", {
          attempt: currentAttempt,
          error: errorMessage,
        });

        await this.writeAuditLog(job, "JOB_DEAD_LETTERED", "ERROR", {
          attempt: currentAttempt,
          maxAttempts: job.maxAttempts,
          error: errorMessage,
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
      await (this.prisma.client as any).workflowEngineExecution.updateMany({
        where: {
          id: executionId,
          status: { in: ["PENDING", "RUNNING"] },
        },
        data: {
          status: "COMPLETED",
          result,
          error: null,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Reads the last delay pause checkpoint for a job. Checkpoints live in the
   * audit log so resuming a delayed workflow needs no schema change.
   */
  private async loadResumeState(job: any): Promise<DagResumeState | undefined> {
    const delegate = (this.prisma.client as any).workflowEngineAuditLog;
    if (!delegate || typeof delegate.findFirst !== "function") return undefined;

    let checkpoint: any;
    try {
      checkpoint = await delegate.findFirst({
        where: {
          jobId: job.id,
          action: "DAG_PAUSED",
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      this.logger.warn(`Unable to load resume state for job ${job.id}: ${error.message}`);
      return undefined;
    }

    const resumeState = checkpoint?.details?.resumeState;
    if (!resumeState || typeof resumeState !== "object") return undefined;

    const serializedSize = Buffer.byteLength(JSON.stringify(resumeState), "utf8");
    if (serializedSize > this.maxResumeStateBytes) {
      throw new Error(
        `Resume state for job ${job.id} is ${serializedSize} bytes, above the ${this.maxResumeStateBytes} byte limit. Reduce the workflow context size before retrying.`,
      );
    }

    return resumeState as DagResumeState;
  }

  private async writeAuditLog(
    job: any,
    action: string,
    level: "INFO" | "WARN" | "ERROR",
    details: Record<string, any>,
  ) {
    await (this.prisma.client as any).workflowEngineAuditLog.create({
      data: {
        organizationId: job.organizationId,
        executionId: job.executionId,
        jobId: job.id,
        action,
        level,
        details,
      },
    });
  }

  private readPositiveInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  }
}
