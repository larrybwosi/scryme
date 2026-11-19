import { z } from "zod";

const jsonObject = z.record(z.string(), z.unknown());

export const CreateWorkflowDefinitionSchema = z.object({
  key: z.string().trim().min(1).max(190),
  name: z.string().trim().min(1).max(190),
  description: z.string().max(2000).optional(),
  triggerType: z.enum(["EVENT", "WEBHOOK", "SCHEDULED", "MANUAL"]).optional(),
  config: jsonObject.optional(),
  isActive: z.boolean().optional(),
});

export const TriggerWorkflowSchema = z
  .object({
    key: z.string().trim().min(1).max(190).optional(),
    path: z.string().trim().min(1).max(190).optional(),
    payload: jsonObject.optional(),
    inputs: jsonObject.optional(),
    correlationId: z.string().trim().min(1).max(190).optional(),
  })
  .refine((value) => Boolean(value.key || value.path), {
    message: "A workflow key or path is required.",
    path: ["key"],
  });

export const SimulateWorkflowSchema = z
  .object({
    key: z.string().trim().min(1).max(190).optional(),
    path: z.string().trim().min(1).max(190).optional(),
    config: jsonObject.optional(),
    payload: jsonObject.optional(),
    inputs: jsonObject.optional(),
  })
  .refine((value) => Boolean(value.key || value.path || value.config), {
    message: "A workflow key, path, or inline config is required.",
    path: ["key"],
  });

export const ReplayWorkflowSchema = z.object({
  executionId: z.string().trim().min(1).max(190),
  overridePayload: jsonObject.optional(),
});

export const CreateWebhookSchema = z.object({
  name: z.string().trim().min(1).max(190),
  direction: z.enum(["INCOMING", "OUTGOING"]).optional(),
  endpointUrl: z.string().trim().min(1).max(2048),
  secret: z.string().max(500).optional(),
  headers: jsonObject.optional(),
  definitionId: z.string().trim().min(1).max(190).optional(),
});

export const ProvisionWorkflowSchema = z.object({
  path: z.string().trim().min(1).max(190),
  settings: jsonObject.optional(),
});

export const ProvisionDefinitionsSchema = z
  .object({
    customConfigs: z.record(z.string(), jsonObject).optional(),
  })
  .default({});

export const CancelWorkflowSchema = z.object({
  jobId: z.string().trim().min(1).max(190),
});

export const RetryJobSchema = z.object({
  jobId: z.string().trim().min(1).max(190),
});

export const HitlActionSchema = z.object({
  action: z.string().trim().min(1).max(190),
  batchId: z.string().trim().min(1).max(190).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateWorkflowDefinitionDto = z.infer<typeof CreateWorkflowDefinitionSchema>;
export type TriggerWorkflowDto = z.infer<typeof TriggerWorkflowSchema>;
export type SimulateWorkflowDto = z.infer<typeof SimulateWorkflowSchema>;
export type ReplayWorkflowDto = z.infer<typeof ReplayWorkflowSchema>;
export type CreateWebhookDto = z.infer<typeof CreateWebhookSchema>;
export type ProvisionWorkflowDto = z.infer<typeof ProvisionWorkflowSchema>;
export type ProvisionDefinitionsDto = z.infer<typeof ProvisionDefinitionsSchema>;
export type CancelWorkflowDto = z.infer<typeof CancelWorkflowSchema>;
export type RetryJobDto = z.infer<typeof RetryJobSchema>;
export type HitlActionDto = z.infer<typeof HitlActionSchema>;
