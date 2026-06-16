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
    const account = await this.prisma.client.utilityAccount.findFirst({
      where: { id, organizationId },
      include: {
        expenses: {
          take: 10,
          orderBy: { expenseDate: "desc" },
        },
      },
    });

    if (!account) {
      throw new NotFoundException("Utility account not found");
    }

    return account;
  }
}
