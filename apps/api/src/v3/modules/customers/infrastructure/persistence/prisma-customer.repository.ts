import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ICustomerRepository } from "../../domain/repositories/customer-repository.interface";
import { Customer } from "../../domain/entities/customer.entity";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  private readonly logger = new Logger(PrismaCustomerRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByOrganization(
    organizationId: string,
    pagination?: PaginationQueryDto,
  ): Promise<Customer[]> {
    const customers = await this.prisma.client.customer.findMany({
      where: { organizationId },
      take: pagination?.limit || 10,
      skip: pagination?.offset || 0,
      orderBy: { createdAt: "desc" },
      // ⚡ Bolt Optimization: Use targeted select to prevent over-fetching
      // of large or sensitive fields (like deliveryNotes, tags, pinnedLocation, etc.) in lists.
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

    return customers.map(
      (c) =>
        new Customer(
          c.id,
          c.name,
          c.email,
          c.phone,
          c.organizationId,
          c.createdAt,
          c.updatedAt,
        ),
    );
  }

  async findById(id: string): Promise<Customer | null> {
    const c = await this.prisma.client.customer.findUnique({
      where: { id },
      // ⚡ Bolt Optimization: Targeted select for scalar fields
      // to reduce database payload and serialization overhead.
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

    if (!c) return null;

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

  async save(customer: Customer): Promise<Customer> {
    const c = await this.prisma.client.customer.upsert({
      where: { id: customer.id },
      update: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      create: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        organizationId: customer.organizationId,
      },
      // ⚡ Bolt Optimization: Targeted select for the returned record
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
