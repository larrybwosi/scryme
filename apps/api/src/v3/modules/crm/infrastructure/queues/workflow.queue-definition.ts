import { Queue } from "bullmq";
import IORedis from "ioredis";
import { IWorkflowQueue } from "../../domain/interfaces/workflow-queue.interface";

const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);

export const workflowQueue = new Queue("workflow-queue", {
  connection: redisConnection as any,
}) as any as IWorkflowQueue;

export { redisConnection };
