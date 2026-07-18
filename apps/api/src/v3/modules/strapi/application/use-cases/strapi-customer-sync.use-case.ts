import { Injectable, Logger, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  StrapiV4Provider,
  StrapiClientConfig,
} from "../../infrastructure/providers/strapi-v4.provider";
import { StrapiConnectionUseCase } from "./strapi-connection.use-case";
import { SyncDirection, SyncStatus, EntitySyncType } from "@repo/db";

export interface CustomerRegistrationDto {
  /** Strapi storefront connection ID */
  connectionId: string;
  organizationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** Storefront location slug chosen during registration, maps to an InventoryLocation */
  locationSlug?: string;
  /** Raw password — only used when pushing to Strapi Users-Permissions; never stored in Scryme */
  password?: string;
}

export interface CustomerAuthExchangeDto {
  /** JWT issued by Strapi on storefront login */
  strapiJwt: string;
  connectionId: string;
  organizationId: string;
}

export interface CustomerSyncResult {
  scrymeCustomerId: string;
  strapiCustomerId: string;
  isNew: boolean;
  locationId?: string;
}

@Injectable()
export class StrapiCustomerSyncUseCase {
  private readonly logger = new Logger(StrapiCustomerSyncUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strapiProvider: StrapiV4Provider,
    private readonly connectionUseCase: StrapiConnectionUseCase,
  ) {}

  // ──────────────────────────────────────────────────────────────────
  // REGISTER: Storefront customer registers → create in both systems
  // ──────────────────────────────────────────────────────────────────

  async registerCustomer(dto: CustomerRegistrationDto): Promise<CustomerSyncResult> {
    const { config, strapiConfig } = await this.getClientConfig(
      dto.organizationId,
      dto.connectionId,
    );

    // Resolve location from slug mapping
    const locationId = await this.resolveLocationId(
      strapiConfig,
      dto.locationSlug,
      dto.organizationId,
    );

    // Upsert in Scryme first
    let scrymeCustomer = await this.prisma.client.customer.findFirst({
      where: { organizationId: dto.organizationId, email: dto.email },
    });

    let isNew = false;
    if (!scrymeCustomer) {
      scrymeCustomer = await this.prisma.client.customer.create({
        data: {
          organizationId: dto.organizationId,
          email: dto.email,
          name: [dto.firstName, dto.lastName].filter(Boolean).join(" ") || dto.email,
          phone: dto.phone,
          ...(locationId ? { defaultLocationId: locationId } : {}),
        },
      });
      isNew = true;
    }

    // Check for existing mapping
    const existingMapping = await this.prisma.client.ecommerceCustomerMapping.findFirst({
      where: { connectionId: dto.connectionId, customerId: scrymeCustomer.id },
    });

    let strapiCustomerId: string;

    if (existingMapping) {
      strapiCustomerId = existingMapping.externalCustomerId;

      // Push any profile updates back to Strapi
      await this.strapiProvider.updateCustomer(config, Number(strapiCustomerId), {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        externalId: scrymeCustomer.id,
        organizationSlug: (await this.getOrgSlug(dto.organizationId)) ?? undefined,
      });
    } else {
      // Check if Strapi already has this email
      const existing = await this.strapiProvider.getCustomerByEmail(config, dto.email);

      if (existing) {
        strapiCustomerId = String(existing.id);
        // Patch the externalId back
        await this.strapiProvider.updateCustomer(config, existing.id, {
          externalId: scrymeCustomer.id,
        });
      } else {
        const orgSlug = await this.getOrgSlug(dto.organizationId);
        const created = await this.strapiProvider.createCustomer(config, {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          organizationSlug: orgSlug ?? undefined,
          externalId: scrymeCustomer.id,
          publishedAt: new Date().toISOString(),
        });
        strapiCustomerId = String(created.data.id);
      }

      // Create the mapping record
      await this.prisma.client.ecommerceCustomerMapping.create({
        data: {
          connectionId: dto.connectionId,
          customerId: scrymeCustomer.id,
          organizationId: dto.organizationId,
          externalCustomerId: strapiCustomerId,
          externalEmail: dto.email,
          lastSyncedAt: new Date(),
        },
      });
    }

    this.logger.log(
      `Customer ${dto.email} registered: Scryme=${scrymeCustomer.id} | Strapi=${strapiCustomerId} | new=${isNew}`,
    );

    return {
      scrymeCustomerId: scrymeCustomer.id,
      strapiCustomerId,
      isNew,
      locationId: locationId ?? undefined,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // AUTH EXCHANGE: Storefront login → validate JWT → return Scryme session
  // ──────────────────────────────────────────────────────────────────

  async exchangeToken(dto: CustomerAuthExchangeDto): Promise<{
    scrymeCustomerId: string;
    strapiCustomerId: string;
    email: string;
    locationId?: string;
  }> {
    const { config } = await this.getClientConfig(dto.organizationId, dto.connectionId);
    const strapiConfig = await this.connectionUseCase.getConfigOrThrow(dto.connectionId);

    // Use Strapi's /api/users/me to validate the JWT and get user details
    const meConfig: StrapiClientConfig = {
      ...config,
      apiToken: dto.strapiJwt, // swap token for the user's JWT
    };

    const userMe = await this.strapiProvider.listEntries<{
      id: number;
      email: string;
      username: string;
      customerId?: string;
    }>(meConfig, "users/me", {});

    // /users/me returns a single object, not a list
    const strapiUser = userMe as any;
    const email: string = strapiUser?.email ?? strapiUser?.data?.email;

    if (!email) {
      throw new Error("Strapi JWT is invalid or does not carry email claim");
    }

    // Find or create Scryme customer
    let scrymeCustomer = await this.prisma.client.customer.findFirst({
      where: { organizationId: dto.organizationId, email },
    });

    let locationId: string | undefined;

    if (!scrymeCustomer) {
      // Auto-register on first login
      const result = await this.registerCustomer({
        connectionId: dto.connectionId,
        organizationId: dto.organizationId,
        email,
        firstName: strapiUser?.firstName,
        lastName: strapiUser?.lastName,
      });
      scrymeCustomer = await this.prisma.client.customer.findUniqueOrThrow({
        where: { id: result.scrymeCustomerId },
      });
      locationId = result.locationId;
    } else {
      const mapping = await this.prisma.client.ecommerceCustomerMapping.findFirst({
        where: { connectionId: dto.connectionId, customerId: scrymeCustomer.id },
      });
      if (mapping) {
        await this.prisma.client.ecommerceCustomerMapping.update({
          where: { id: mapping.id },
          data: { lastSyncedAt: new Date() },
        });
      }
    }

    return {
      scrymeCustomerId: scrymeCustomer.id,
      strapiCustomerId: String(strapiUser?.id ?? ""),
      email,
      locationId,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // BULK OUTBOUND: Push all Scryme customers to Strapi
  // ──────────────────────────────────────────────────────────────────

  async bulkSyncOutbound(
    organizationId: string,
    connectionId: string,
    triggeredBy = "manual",
  ) {
    const { config } = await this.getClientConfig(organizationId, connectionId);

    const syncLog = await this.prisma.client.ecommerceSyncLog.create({
      data: {
        connectionId,
        organizationId,
        syncType: EntitySyncType.CUSTOMERS,
        syncDirection: SyncDirection.OUTBOUND,
        status: SyncStatus.IN_PROGRESS,
        triggeredBy,
        startedAt: new Date(),
      },
    });

    const customers = await this.prisma.client.customer.findMany({
      where: { organizationId },
    });

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const customer of customers) {
      try {
        const mapping = await this.prisma.client.ecommerceCustomerMapping.findFirst({
          where: { connectionId, customerId: customer.id },
        });

        if (mapping) {
          await this.strapiProvider.updateCustomer(config, Number(mapping.externalCustomerId), {
            email: customer.email,
            firstName: (customer as any).firstName ?? undefined,
            lastName: (customer as any).lastName ?? undefined,
            externalId: customer.id,
          });
          await this.prisma.client.ecommerceCustomerMapping.update({
            where: { id: mapping.id },
            data: { lastSyncedAt: new Date() },
          });
        } else {
          const orgSlug = await this.getOrgSlug(organizationId);
          const created = await this.strapiProvider.createCustomer(config, {
            email: customer.email,
            firstName: (customer as any).firstName ?? undefined,
            lastName: (customer as any).lastName ?? undefined,
            externalId: customer.id,
            organizationSlug: orgSlug ?? undefined,
            publishedAt: new Date().toISOString(),
          });

          await this.prisma.client.ecommerceCustomerMapping.create({
            data: {
              connectionId,
              customerId: customer.id,
              organizationId,
              externalCustomerId: String(created.data.id),
              externalEmail: customer.email,
              lastSyncedAt: new Date(),
            },
          });
        }
        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push(`Customer ${customer.id}: ${err.message}`);
        this.logger.error(`Failed to sync customer ${customer.id}: ${err.message}`);
      }
    }

    await this.prisma.client.ecommerceSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: failureCount === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIALLY_COMPLETED,
        totalItems: customers.length,
        successCount,
        failureCount,
        errors: errors.length ? errors : undefined,
        completedAt: new Date(),
      },
    });

    return { syncLogId: syncLog.id, successCount, failureCount, errors };
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────

  private async getClientConfig(organizationId: string, connectionId: string) {
    const conn = await this.connectionUseCase.getConnectionOrThrow(organizationId, connectionId);
    const strapiConfig = await this.connectionUseCase.getConfigOrThrow(connectionId);

    const config: StrapiClientConfig = {
      strapiUrl: strapiConfig.strapiUrl,
      apiToken: strapiConfig.apiToken,
      graphqlPath: strapiConfig.graphqlPath,
    };

    return { conn, config, strapiConfig };
  }

  private async resolveLocationId(
    strapiConfig: any,
    locationSlug: string | undefined,
    organizationId: string,
  ): Promise<string | null> {
    if (!locationSlug || !strapiConfig.locationMap) return null;

    const map = strapiConfig.locationMap as Record<string, string>;
    const locationId = map[locationSlug];
    if (!locationId) return null;

    // Validate the location belongs to this org
    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { id: locationId, organizationId },
    });

    return location?.id ?? null;
  }

  private async getOrgSlug(organizationId: string): Promise<string | null> {
    const org = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: { slug: true },
    });
    return org?.slug ?? null;
  }
}
