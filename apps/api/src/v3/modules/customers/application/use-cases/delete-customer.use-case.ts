import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class DeleteCustomerUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, customerId: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, organizationId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    try {
      // Attempt hard deletion
      await this.prisma.client.customer.delete({
        where: { id: customerId },
      });
      return { success: true, message: "Customer deleted successfully" };
    } catch (e) {
      // Fallback to deactivation/soft delete if referenced elsewhere
      await this.prisma.client.customer.update({
        where: { id: customerId },
        data: { isActive: false },
      });
      return { success: true, message: "Customer deactivated successfully" };
    }
  }
}
