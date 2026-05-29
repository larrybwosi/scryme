import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PriceChangeStatus } from '@repo/db';

@Injectable()
export class ReviewPriceChangeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: {
    organizationId: string;
    requestId: string;
    memberId: string;
    status: PriceChangeStatus;
    rejectionReason?: string;
  }) {
    const { organizationId, requestId, memberId, status, rejectionReason } = params;

    const request = await this.prisma.client.priceChangeRequest.findUnique({
      where: { id: requestId, organizationId },
      include: { priceListItem: true },
    });

    if (!request) throw new NotFoundException('Price change request not found');
    if (request.status !== PriceChangeStatus.PENDING) {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    return this.prisma.client.$transaction(async tx => {
      if (status === PriceChangeStatus.APPROVED) {
        // Apply the new price
        await tx.priceListItem.update({
          where: { id: request.priceListItemId },
          data: { price: request.newPrice },
        });

        // Record in history
        await tx.priceHistory.create({
          data: {
            priceListItemId: request.priceListItemId,
            previousPrice: request.oldPrice,
            newPrice: request.newPrice,
            changeReason: `Approved from request: ${request.reason}`,
            changeType: 'APPROVAL',
            changedBy: memberId,
            metadata: {
              requestId: request.id,
              oldCost: request.oldCost,
              newCost: request.newCost,
            },
          },
        });
      }

      return tx.priceChangeRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewedBy: memberId,
          reviewedAt: new Date(),
          rejectionReason: status === PriceChangeStatus.REJECTED ? rejectionReason : undefined,
        },
      });
    });
  }
}
