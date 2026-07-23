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
    /**
     * OPTIMIZATION (Bolt ⚡): Replaced broad Prisma 'include' with a targeted 'select' block.
     * Including the entire 'expenses' relation with heavy fields (like 'notes', 'tags',
     * or 'receiptUrl') introduces significant database I/O, network payload, and NestJS
     * serialization overhead. Pruning these fields and selecting only essential list-view
     * attributes significantly improves execution speed and reduces memory pressure.
     */
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
            amount: true,
            status: true,
            expenseDate: true,
            paymentMethod: true,
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
