import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreatePettyCashFundDto,
  TopUpPettyCashFundDto,
} from "../dto/finance.dto";
import { Prisma, PettyCashTransactionType } from "@repo/db";

@Injectable()
export class PettyCashUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async createFund(organizationId: string, dto: CreatePettyCashFundDto) {
    return await this.prisma.client.$transaction(async (tx) => {
      // 🛡️ Sentinel: IDOR Prevention - Verify the responsible member belongs to the organization
      const memberCount = await tx.member.count({
        where: { id: dto.responsibleMemberId, organizationId },
      });

      if (memberCount === 0) {
        throw new ForbiddenException(
          "The responsible member does not belong to this organization or does not exist",
        );
      }

      const fund = await tx.pettyCashFund.create({
        data: {
          name: dto.name,
          floatAmount: new Prisma.Decimal(dto.floatAmount),
          amount: new Prisma.Decimal(dto.floatAmount),
          responsibleMemberId: dto.responsibleMemberId,
          organizationId: organizationId,
          currencyCode: dto.currencyCode || "KES",
        },
      });

      await tx.pettyCashTransaction.create({
        data: {
          fundId: fund.id,
          type: PettyCashTransactionType.TOP_UP,
          amount: new Prisma.Decimal(dto.floatAmount),
          description: "Initial float setup",
          memberId: dto.responsibleMemberId,
        },
      });

      return fund;
    });
  }

  async topUpFund(
    organizationId: string,
    fundId: string,
    dto: TopUpPettyCashFundDto,
    memberId: string,
  ) {
    return await this.prisma.client.$transaction(async (tx) => {
      const fund = await tx.pettyCashFund.findFirst({
        where: { id: fundId, organizationId },
      });

      if (!fund) {
        throw new NotFoundException("Petty cash fund not found");
      }

      const updatedFund = await tx.pettyCashFund.update({
        where: { id: fundId },
        data: {
          amount: { increment: new Prisma.Decimal(dto.amount) },
        },
      });

      await tx.pettyCashTransaction.create({
        data: {
          fundId,
          type: PettyCashTransactionType.TOP_UP,
          amount: new Prisma.Decimal(dto.amount),
          description: dto.description || "Fund top-up",
          memberId,
        },
      });

      return updatedFund;
    });
  }

  async getFunds(organizationId: string) {
    return await this.prisma.client.pettyCashFund.findMany({
      where: { organizationId },
      // ⚡ Bolt Optimization: Use targeted select to prevent over-fetching
      // of large relation trees while ensuring all scalar fields are present.
      select: {
        id: true,
        name: true,
        amount: true,
        floatAmount: true,
        currencyCode: true,
        organizationId: true,
        responsibleMemberId: true,
        locationId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        responsibleMember: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getFundById(organizationId: string, fundId: string) {
    const fund = await this.prisma.client.pettyCashFund.findFirst({
      where: { id: fundId, organizationId },
      // ⚡ Bolt Optimization: Use targeted select to prevent over-fetching
      // of large relation trees while ensuring all scalar fields are present.
      select: {
        id: true,
        name: true,
        amount: true,
        floatAmount: true,
        currencyCode: true,
        organizationId: true,
        responsibleMemberId: true,
        locationId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        responsibleMember: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!fund) {
      throw new NotFoundException("Petty cash fund not found");
    }

    return fund;
  }

  async getFundTransactions(organizationId: string, fundId: string) {
    const fund = await this.prisma.client.pettyCashFund.findFirst({
      where: { id: fundId, organizationId },
    });

    if (!fund) {
      throw new NotFoundException("Petty cash fund not found");
    }

    return await this.prisma.client.pettyCashTransaction.findMany({
      where: { fundId },
      // ⚡ Bolt Optimization: Use targeted select to prevent over-fetching
      // of large relation trees while ensuring all scalar fields are present.
      select: {
        id: true,
        fundId: true,
        type: true,
        amount: true,
        description: true,
        memberId: true,
        createdAt: true,
        member: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
