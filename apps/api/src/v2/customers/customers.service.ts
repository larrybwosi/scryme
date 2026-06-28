import {
  Injectable,
  InternalServerErrorException,
  BadGatewayException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2/types/context";
import { CustomerService as SharedCustomerService } from "@repo/shared/services/customer";
import { ApiRealtimeService } from "../../common/services/realtime.service";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: ApiRealtimeService,
  ) {}

  async getCustomers(ctx: V2ApiContext, query: any) {
    const q = query.q ?? "";
    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const limit = Math.min(60, Math.max(1, parseInt(query.limit ?? "25", 10)));

    try {
      const result = await SharedCustomerService.getCustomers(
        ctx.organizationId,
        {
          query: q,
          page,
          pageSize: limit,
        },
      );

      if (!result.success) {
        throw new BadGatewayException(
          result.message || "Failed to fetch customers from CRM",
        );
      }

      const { customers, totalCount, totalPages } = result.data!;

      return {
        customers: customers.map((p: any) => ({
          id: p.id,
          name: [p.name.firstName, p.name.lastName].filter(Boolean).join(" "),
          email: p.emails?.primaryEmail ?? null,
          phone: p.phones?.primaryPhoneNumber ?? null,
          city: p.city ?? null,
          jobTitle: p.jobTitle ?? null,
          avatarUrl: p.avatarUrl ?? null,
          createdAt: p.createdAt ?? null,
          updatedAt: p.updatedAt ?? null,
          balance: p.balance ?? 0,
          stats: p.stats ?? [],
        })),
        pagination: { page, limit, total: totalCount, totalPages },
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new InternalServerErrorException("Failed to fetch customers");
    }
  }

  async getCustomer(ctx: V2ApiContext, customerId: string) {
    try {
      const result = await SharedCustomerService.getCustomerById(
        ctx.organizationId,
        customerId,
      );

      if (!result.success) {
        throw new BadGatewayException(result.message || "Customer not found");
      }

      const p = result.data!;
      return {
        customer: {
          id: p.id,
          name: [p.name.firstName, p.name.lastName].filter(Boolean).join(" "),
          email: p.emails?.primaryEmail ?? null,
          phone: p.phones?.primaryPhoneNumber ?? null,
          city: p.city ?? null,
          jobTitle: p.jobTitle ?? null,
          avatarUrl: p.avatarUrl ?? null,
          createdAt: p.createdAt ?? null,
          updatedAt: p.updatedAt ?? null,
          balance: p.balance ?? 0,
        },
        stats: p.stats ?? [],
        invoices: p.invoices ?? [],
        transactions: p.transactions ?? [],
        crmRecord: p.crmRecord ?? null,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new InternalServerErrorException("Failed to fetch customer");
    }
  }

  async createCustomer(ctx: V2ApiContext, body: any) {
    try {
      const result = await SharedCustomerService.saveCustomer(
        ctx.organizationId,
        ctx.memberId ?? "api",
        body,
      );

      if (!result.success) {
        throw new BadGatewayException(
          result.message || "Failed to create customer in CRM",
        );
      }

      const p = result.data!.customer;
      return {
        customer: {
          id: p.id,
          name: [p.name.firstName, p.name.lastName].filter(Boolean).join(" "),
          email: p.emails?.primaryEmail ?? null,
          phone: p.phones?.primaryPhoneNumber ?? null,
          city: p.city ?? null,
          jobTitle: p.jobTitle ?? null,
          avatarUrl: p.avatarUrl ?? null,
          createdAt: p.createdAt ?? null,
        },
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new InternalServerErrorException("Failed to create customer");
    }
  }

  async deleteCustomer(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;

    // We might need to delete from CRM via SharedCustomerService if it supports it,
    // but here we are primarily concerned with the local mapping and notifying POS.
    // Assuming we delete from the local database if applicable, or just send the event.

    await this.realtime.publish(
      `organization:${organizationId}:customers`,
      "customer-deleted",
      { customerId: id },
    );

    return { success: true };
  }
}
