import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

export type CrmSyncJobType = "SYNC_CUSTOMER" | "SYNC_BUSINESS_ACCOUNT";

export interface CrmSyncJobData {
  type: CrmSyncJobType;
  organizationId: string;
  internalId: string;
}

@Injectable()
export class CrmSyncService {
  private readonly logger = new Logger(CrmSyncService.name);

  constructor(@InjectQueue("crm-sync") private syncQueue: Queue) {}

  async enqueueSyncCustomer(organizationId: string, customerId: string) {
    await this.syncQueue.add(
      "sync-customer",
      {
        type: "SYNC_CUSTOMER",
        organizationId,
        internalId: customerId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
      },
    );
  }

  async enqueueSyncBusinessAccount(
    organizationId: string,
    businessAccountId: string,
  ) {
    await this.syncQueue.add(
      "sync-business-account",
      {
        type: "SYNC_BUSINESS_ACCOUNT",
        organizationId,
        internalId: businessAccountId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
      },
    );
  }
}
