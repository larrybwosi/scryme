import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order-repository.interface';
import { AttachLpoDto } from '../dto/attach-lpo.dto';
import { TransactionType, TransactionStatus } from '@repo/db';

@Injectable()
export class AttachLpoUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(organizationId: string, orderId: string, dto: AttachLpoDto) {
    const order = await this.orderRepository.findById(orderId);

    if (!order || order.organizationId !== organizationId) {
      throw new NotFoundException('Order or Quote not found');
    }

    // Update LPO details
    order.lpoNumber = dto.lpoNumber;
    order.lpoDate = dto.lpoDate ? new Date(dto.lpoDate) : undefined;
    order.lpoExpiryDate = dto.lpoExpiryDate ? new Date(dto.lpoExpiryDate) : undefined;
    order.lpoUrl = dto.lpoUrl;

    // If it was a quote, mark it as accepted as per user workflow preference
    // Note: order.type is not directly on Order entity in current implementation,
    // but the DB has it. Let's assume for now we update status if it's currently a quote-like status or always if it's a quote.
    // Since we don't have 'type' in Order entity yet, let's add it or rely on status.
    // Checking TransactionStatus instead.

    if (order.status === TransactionStatus.QUOTE_SENT || order.status === TransactionStatus.DRAFT) {
        order.status = TransactionStatus.QUOTE_ACCEPTED;
    }

    const updated = await this.orderRepository.save(order);

    return updated;
  }
}
