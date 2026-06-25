import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../../../prisma/prisma.service";
import {
  CreatePartnerDto,
  UpdatePartnerDto,
  PartnerWalletActionDto,
} from "../dto/partner.dto";
import { WalletTxType } from "@repo/db";

@Injectable()
export class DeliveryPartnerUseCase {
  constructor(private prisma: PrismaService) {}

  // fallow-ignore-next-line unused-class-members
  async createPartner(organizationId: string, dto: CreatePartnerDto) {
    return this.prisma.client.deliveryPartner.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  // fallow-ignore-next-line unused-class-members
  async getPartners(organizationId: string) {
    return this.prisma.client.deliveryPartner.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { drivers: true, transactions: true },
        },
      },
    });
  }

  async getPartner(organizationId: string, id: string) {
    const partner = await this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
      include: {
        drivers: true,
        walletLogs: {
          take: 50,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!partner) throw new NotFoundException("Delivery partner not found");
    return partner;
  }

  // fallow-ignore-next-line unused-class-members
  async updatePartner(
    organizationId: string,
    id: string,
    dto: UpdatePartnerDto,
  ) {
    const partner = await this.getPartner(organizationId, id);
    return this.prisma.client.deliveryPartner.update({
      where: { id: partner.id },
      data: dto,
    });
  }

  // fallow-ignore-next-line unused-class-members
  async adjustWallet(
    organizationId: string,
    partnerId: string,
    dto: PartnerWalletActionDto,
    type: WalletTxType = WalletTxType.ADJUSTMENT,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      const partner = await tx.deliveryPartner.findFirst({
        where: { id: partnerId, organizationId },
      });

      if (!partner) throw new NotFoundException("Delivery partner not found");

      const newBalance = Number(partner.walletBalance) + dto.amount;
      if (newBalance < 0 && type === WalletTxType.WITHDRAWAL) {
        throw new BadRequestException("Insufficient wallet balance");
      }

      await tx.deliveryPartner.update({
        where: { id: partnerId },
        data: { walletBalance: newBalance },
      });

      return tx.partnerWalletLog.create({
        data: {
          partnerId,
          amount: dto.amount,
          balanceAfter: newBalance,
          transactionType: type,
          notes: dto.notes,
        },
      });
    });
  }
}
