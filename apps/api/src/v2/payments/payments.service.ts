import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { MpesaService } from "@repo/mpesa/server";
import { V2ApiContext } from "@repo/shared/server";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mpesaService: MpesaService,
  ) {}

  async getPayments(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;
    return this.prisma.client.payment.findMany({
      where: {
        organizationId,
        ...query,
      },
      include: {
        transaction: {
          select: { number: true, customer: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async validateMpesaPayment(
    ctx: V2ApiContext,
    transactionCode: string,
    saleId?: string,
  ) {
    const { organizationId, memberId } = ctx;

    // Use the injected service instance
    return this.mpesaService.validate({
      transactionCode,
      organizationId,
      saleId,
      userId: memberId,
    });
  }

  async getPayment(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const payment = await this.prisma.client.payment.findFirst({
      where: { id, organizationId },
      include: {
        transaction: true,
      },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    return payment;
  }
}
