import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CrmSyncService } from "../../../crm/infrastructure/services/crm-sync.service";

@Injectable()
export class BusinessAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmSyncService: CrmSyncService,
  ) {}

  async createBusinessAccount(
    organizationId: string,
    data: { name: string; taxId?: string; defaultLocationId?: string },
  ) {
    // 1. Create Business Account
    const businessAccount = await this.prisma.client.businessAccount.create({
      data: {
        ...data,
        organizationId,
      },
    });

    // 2. Trigger async CRM sync
    await this.crmSyncService.enqueueSyncBusinessAccount(
      organizationId,
      businessAccount.id,
    );

    return businessAccount;
  }

  async getBusinessAccount(organizationId: string, id: string) {
    const account = await this.prisma.client.businessAccount.findFirst({
      where: { id, organizationId },
      include: {
        crmRecord: {
          include: {
            notes: {
              orderBy: { timelineDate: "desc" },
            },
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException("Business Account not found");
    }

    return account;
  }
}
