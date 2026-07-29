import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Customer } from "../../domain/entities/customer.entity";

@Injectable()
export class GetCustomerByIdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, customerId: string): Promise<Customer> {
    const c = await this.prisma.client.customer.findFirst({
      where: { id: customerId, organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!c) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return new Customer(
      c.id,
      c.name,
      c.email,
      c.phone,
      c.organizationId,
      c.createdAt,
      c.updatedAt,
    );
  }
}
