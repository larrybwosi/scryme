import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { ZitadelCustomerService } from "./zitadel-customer.service";

@Processor("zitadel-sync")
export class ZitadelProcessor extends WorkerHost {
  private readonly logger = new Logger(ZitadelProcessor.name);

  constructor(private readonly zitadelCustomerService: ZitadelCustomerService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { organizationId, zitadelUserId, jwtPayload } = job.data;
    this.logger.log(
      `Processing Zitadel sync for user ${zitadelUserId} in org ${organizationId}`,
    );

    try {
      await this.zitadelCustomerService.syncCustomer(
        organizationId,
        zitadelUserId,
        jwtPayload,
      );
    } catch (error: any) {
      this.logger.error(`Failed to process Zitadel sync job: ${error.message}`);
      throw error;
    }
  }
}
