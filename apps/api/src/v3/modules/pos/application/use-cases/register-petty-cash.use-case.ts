import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { V3ApiContext } from "@repo/shared/api/v2";
import { RegisterPettyCashDto } from "../dto/petty-cash.dto";
import { ExpenseUseCase } from "../../../finance/application/use-cases/expense.use-case";
import { PettyCashUseCase } from "../../../finance/application/use-cases/petty-cash.use-case";

@Injectable()
export class RegisterPettyCashUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expenseUseCase: ExpenseUseCase,
    private readonly pettyCashUseCase: PettyCashUseCase,
  ) {}

  async execute(ctx: V3ApiContext, dto: RegisterPettyCashDto) {
    const { organizationId, memberId, locationId } = ctx;

    // 1. Ensure "Petty Cash" category exists
    let category = await this.prisma.client.expenseCategory.findFirst({
      where: {
        organizationId,
        name: { equals: "Petty Cash", mode: "insensitive" },
      },
    });

    if (!category) {
      category = await this.prisma.client.expenseCategory.create({
        data: {
          name: "Petty Cash",
          organizationId,
          isActive: true,
        },
      });
    }

    // 2. Identify the petty cash fund for this location (or organization default)
    let fundId = dto.pettyCashFundId;
    if (!fundId) {
      // Try to find a fund specifically for this location
      let fund = null;
      if (locationId) {
        fund = await this.prisma.client.pettyCashFund.findFirst({
          where: {
            organizationId,
            locationId,
            isActive: true,
          },
        });
      }

      // Fallback to any active fund if location-specific one is not found
      if (!fund) {
        fund = await this.prisma.client.pettyCashFund.findFirst({
          where: {
            organizationId,
            isActive: true,
          },
        });
      }
      fundId = fund?.id;
    }

    if (!fundId) {
      throw new NotFoundException(
        "No active petty cash fund found for this organization.",
      );
    }

    // 3. Register the expense
    return this.expenseUseCase.createExpense(organizationId, memberId!, {
      description: dto.description,
      amount: dto.amount,
      categoryId: category.id,
      paymentMethod: dto.paymentMethod,
      pettyCashFundId: fundId,
      locationId: locationId || undefined,
      expenseDate: new Date().toISOString(),
      receiptUrl: dto.receiptUrl,
    });
  }

  async getFunds(ctx: V3ApiContext) {
    const { organizationId, locationId } = ctx;

    if (locationId) {
      const funds = await this.prisma.client.pettyCashFund.findMany({
        where: {
          organizationId,
          locationId,
          isActive: true,
        },
      });
      if (funds.length > 0) return funds;
    }

    return this.pettyCashUseCase.getFunds(organizationId);
  }

  async getRecentTransactions(ctx: V3ApiContext, limit = 10) {
    const { organizationId, locationId } = ctx;

    const where: any = {
      fund: {
        organizationId,
      },
    };

    if (locationId) {
      where.fund.locationId = locationId;
    }

    return this.prisma.client.pettyCashTransaction.findMany({
      where,
      include: {
        member: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }
}
