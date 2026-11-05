import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AndroidUpdateCustomerDto } from "../dto/android-auth.dto";

@Injectable()
export class AndroidCustomerUseCase {
  constructor(private readonly prisma: PrismaService) {}

  private mapCustomerToDto(c: any) {
    return {
      id: c.id,
      name: c.name || "Customer",
      email: c.email || null,
      phone: c.phone || null,
      company: c.company || null,
      customerType: c.customerType || "INDIVIDUAL",
      loyaltyPoints: c.loyaltyPoints ? Number(c.loyaltyPoints) : 0,
      isActive: c.isActive ?? true,
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getCustomers(v3Context: any, search?: string, limit = 50, offset = 0) {
    const { organizationId } = v3Context;

    const where: any = {
      organizationId,
      ...(search && search.trim().length > 0
        ? {
            OR: [
              { name: { contains: search.trim(), mode: "insensitive" } },
              { email: { contains: search.trim(), mode: "insensitive" } },
              { phone: { contains: search.trim(), mode: "insensitive" } },
              { company: { contains: search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const customers = await this.prisma.client.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        customerType: true,
        loyaltyPoints: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      customers: customers.map((c) => this.mapCustomerToDto(c)),
    };
  }

  async getCustomerDetails(v3Context: any, id: string) {
    const { organizationId } = v3Context;

    const customer = await this.prisma.client.customer.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        customerType: true,
        loyaltyPoints: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer '${id}' not found`);
    }

    return this.mapCustomerToDto(customer);
  }

  async getCustomerTransactions(v3Context: any, customerId: string, limit = 20) {
    const { organizationId } = v3Context;

    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer '${customerId}' not found`);
    }

    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        organizationId,
        customerId,
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        transactionNumber: tx.id.slice(-8).toUpperCase(),
        totalAmount: Number(tx.finalTotal),
        currencyCode: tx.currencyCode || "USD",
        status: tx.cancelledAt ? "CANCELLED" : tx.completedAt ? "COMPLETED" : "CONFIRMED",
        cashierName: tx.member?.user?.name || "Staff",
        createdAt: tx.createdAt.toISOString(),
      })),
    };
  }

  async updateCustomer(v3Context: any, id: string, dto: AndroidUpdateCustomerDto) {
    const { organizationId } = v3Context;

    const customer = await this.prisma.client.customer.findFirst({
      where: { id, organizationId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer '${id}' not found`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.company !== undefined) data.company = dto.company;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    await this.prisma.client.customer.updateMany({
      where: { id, organizationId },
      data,
    });

    const updated = await this.prisma.client.customer.findFirstOrThrow({
      where: { id, organizationId },
    });

    return this.mapCustomerToDto(updated);
  }
}
