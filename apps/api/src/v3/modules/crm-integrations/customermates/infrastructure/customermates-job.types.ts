export const CUSTOMERMATES_QUEUE_NAME = "customermates";

export type CustomermatesJobName =
  | "apply-event"
  | "writeback"
  | "backfill-page"
  | "retry-failed"
  | "reconcile"
  | "cleanup";

export interface CustomermatesJobData {
  organizationId: string;
  integrationId?: string;
  eventId?: string;
  mappingId?: string;
  changes?: { name?: string; email?: string; phone?: string };
  idempotencyKey?: string;
  typeId?: string;
  page?: number;
  eventIds?: string[];
  source?: "webhook" | "backfill" | "reconcile" | "retry";
}
