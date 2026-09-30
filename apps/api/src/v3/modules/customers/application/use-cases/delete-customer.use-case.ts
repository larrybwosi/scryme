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
      // Threat: BOLA / IDOR Cross-Tenant Data Deletion.
      // Mitigation: Customer model lacks composite unique constraint [id, organizationId]. Prisma delete ignores non-unique fields in where clause.
      // Using deleteMany enforces SQL-level multi-tenant isolation directly on deletion.
      const result = await this.prisma.client.customer.deleteMany({
        where: { id: customerId, organizationId },
      });

      if (result.count === 0) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }

      return { success: true, message: "Customer deleted successfully" };
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }

      // Threat: BOLA / IDOR Cross-Tenant Data Mutation on Fallback Deactivation.
      // Mitigation: Use updateMany with explicit organizationId filter to ensure soft delete cannot affect foreign tenant customers.
      await this.prisma.client.customer.updateMany({
        where: { id: customerId, organizationId },
        data: { isActive: false },
      });
      return { success: true, message: "Customer deactivated successfully" };
    }
  }
}
