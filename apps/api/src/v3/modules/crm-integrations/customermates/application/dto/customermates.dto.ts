import { z } from "zod";

export const ConnectCustomermatesSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  webhookSecret: z.string().min(16, "Webhook secret must be at least 16 characters"),
  listKinds: z
    .object({
      contact: z.string().optional(),
      organization: z.string().optional(),
      deal: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});

export const RotateSecretSchema = z.object({
  webhookSecret: z.string().min(16, "Webhook secret must be at least 16 characters"),
});

export const BackfillSchema = z.object({
  resume: z.boolean().optional(),
});

export const RetryFailedSchema = z.object({
  eventIds: z.array(z.string()).optional(),
});

export type ConnectCustomermatesInput = z.infer<typeof ConnectCustomermatesSchema>;
export type RotateSecretInput = z.infer<typeof RotateSecretSchema>;
export type BackfillInput = z.infer<typeof BackfillSchema>;
export type RetryFailedInput = z.infer<typeof RetryFailedSchema>;
