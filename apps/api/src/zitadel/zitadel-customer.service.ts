import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RecordService, SchemaService } from "@repo/shared/crm/server";
import { CrmActivityService } from "./crm-activity.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class ZitadelCustomerService {
  private readonly logger = new Logger(ZitadelCustomerService.name);
  private readonly crmRecordService: RecordService;
  private readonly crmSchemaService: SchemaService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: CrmActivityService,
    private readonly redis: RedisService,
  ) {
    this.crmRecordService = new RecordService(
      this.prisma.client as any,
      this.activityLogger,
      this.redis,
    );
    this.crmSchemaService = new SchemaService(
      this.prisma.client as any,
      this.redis,
    );
  }

  async syncCustomer(
    organizationId: string,
    zitadelUserId: string,
    jwtPayload: any,
  ) {
    try {
      // 1. Check for existing mapping (to CRM Record)
      const mapping = await this.prisma.client.externalMapping.findFirst({
        where: {
          organizationId,
          provider: "ZITADEL",
          externalId: zitadelUserId,
          entityType: "CRM_RECORD",
        },
      });

      if (mapping) {
        return mapping.internalId!;
      }

      // 2. Register New Customer in CRM
      this.logger.log(
        `Registering new CRM customer for Zitadel user ${zitadelUserId} in org ${organizationId}`,
      );

      // Get person object definition
      let personObj = await this.crmSchemaService.getObjectByName(
        organizationId,
        "person",
      );
      if (!personObj) {
        await this.crmSchemaService.seedStandardObjects(organizationId);
        personObj = await this.crmSchemaService.getObjectByName(
          organizationId,
          "person",
        );
      }

      if (!personObj) throw new Error('Failed to ensure "person" CRM object');

      const email = jwtPayload.email || jwtPayload.preferred_username;
      const firstName =
        jwtPayload.given_name || jwtPayload.name?.split(" ")[0] || "Zitadel";
      const lastName =
        jwtPayload.family_name ||
        jwtPayload.name?.split(" ").slice(1).join(" ") ||
        "User";

      const record = await this.prisma.client.$transaction(async (tx) => {
        const txRecordService = new RecordService(
          tx as any,
          this.activityLogger,
          this.redis,
        );

        const newRecord = await txRecordService.createRecord({
          organizationId,
          objectId: personObj!.id,
          data: {
            firstName,
            lastName,
            email,
          },
        });

        await tx.externalMapping.create({
          data: {
            organizationId,
            internalId: newRecord.id,
            externalId: zitadelUserId,
            provider: "ZITADEL",
            entityType: "CRM_RECORD",
          },
        });

        return newRecord;
      });

      return record.id;
    } catch (error: any) {
      this.logger.error(
        `Failed to sync Zitadel customer to CRM: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
