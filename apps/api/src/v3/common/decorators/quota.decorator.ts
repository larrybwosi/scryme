import { SetMetadata } from "@nestjs/common";

export const ENFORCE_QUOTA_KEY = "enforce_quota";

export type QuotaMetric =
  | "maxUsers"
  | "maxProducts"
  | "maxLocations"
  | "maxOrdersPerMonth"
  | "maxWebhookSubscriptions"
  | "maxWorkflowEngineDefinitions"
  | "maxStorageGB"
  | "maxApiRequestsPerDay"
  | "maxCustomDomains";

export const EnforceQuota = (metric: QuotaMetric) => SetMetadata(ENFORCE_QUOTA_KEY, metric);
