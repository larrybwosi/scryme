import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateUtilityAccountDto } from "../dto/finance.dto";

@Injectable()
export class UtilityAccountUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(organizationId: string, dto: CreateUtilityAccountDto) {
    return await this.prisma.client.utilityAccount.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async getAccounts(organizationId: string) {
    return await this.prisma.client.utilityAccount.findMany({
      where: { organizationId },
    });
  }

  async getAccount(organizationId: string, id: string) {
    // ⚡ Bolt Optimization: Replace broad include with targeted nested select block
    // to bypass over-fetching heavy relational, text, and JSON attributes (such as
    // notes, receiptUrl, tags, etc.) which reduces database I/O and payload size.
    const account = await this.prisma.client.utilityAccount.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        name: true,
        provider: true,
        accountNumber: true,
        meterNumber: true,
        type: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        expenses: {
          take: 10,
          orderBy: { expenseDate: "desc" },
          select: {
            id: true,
            expenseNumber: true,
            description: true,
            expenseDate: true,
            amount: true,
            currencyCode: true,
            exchangeRate: true,
            baseAmount: true,
            taxAmount: true,
            taxRate: true,
            paymentMethod: true,
            status: true,
            isReimbursable: true,
            isBillable: true,
            createdAt: true,
            updatedAt: true,
            categoryId: true,
            memberId: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException("Utility account not found");
    }

    return account;
  }
}
