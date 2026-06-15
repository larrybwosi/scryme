import {Queue, Worker, Job} from "bullmq";
import IORedis from "ioredis";
import {WorkflowExecutionEngine} from "../../application/services/workflow-engine.service";

const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);

export const workflowQueue = new Queue("workflow-queue", {
  connection: redisConnection as any,
});

export const workflowWorker = new Worker(
  "workflow-queue",
  async (job: Job) => {
    const {instanceId} = job.data;
    const engine = new WorkflowExecutionEngine();

    console.log(`[BULLMQ] Processing workflow instance: ${instanceId}`);

    // We mark it as running again before resuming
    const {db} = await import("@repo/db");
    await db.campaignWorkflowInstance.update({
      where: {id: instanceId},
      data: {status: "RUNNING"},
    });

    await engine.executeNextNodes(instanceId);
  },
  {connection: redisConnection as any},
);
