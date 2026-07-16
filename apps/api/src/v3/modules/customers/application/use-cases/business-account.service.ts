import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CrmSyncService } from "../../../crm/infrastructure/services/crm-sync.service";
import { CreateBusinessAccountDto } from "../dto/business-account.dto";

@Injectable()
export class BusinessAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmSyncService: CrmSyncService,
  ) {}

  async createBusinessAccount(
    organizationId: string,
    dto: CreateBusinessAccountDto,
  ) {
    // SECURITY (Sentinel): Verify location ownership if provided
    if (dto.defaultLocationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: dto.defaultLocationId, organizationId },
        select: { id: true },
      });

      if (!location) {
        throw new NotFoundException("Location not found");
      }
    }

    // 1. Create Business Account
    const businessAccount = await this.prisma.client.businessAccount.create({
      data: {
        name: dto.name,
        taxId: dto.taxId,
        defaultLocationId: dto.defaultLocationId,
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
