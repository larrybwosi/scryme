import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { StrapiV4Provider } from "../../infrastructure/providers/strapi-v4.provider";
import {
  CreateStrapiConnectionDto,
  UpdateStrapiConnectionDto,
  StrapiConnectionResponseDto,
} from "../dto/strapi-connection.dto";
import { EcommercePlatform, SyncDirection, EntitySyncType } from "@repo/db";

@Injectable()
export class StrapiConnectionUseCase {
  private readonly logger = new Logger(StrapiConnectionUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strapiProvider: StrapiV4Provider,
  ) {}

  // ─────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────

  async create(
    organizationId: string,
    dto: CreateStrapiConnectionDto,
  ): Promise<StrapiConnectionResponseDto> {
    // Verify credentials by pinging Strapi before persisting
    let strapiVersion: string | undefined;
    try {
      const info = await this.strapiProvider.ping({
        strapiUrl: dto.strapiUrl,
        apiToken: dto.apiToken,
        graphqlPath: dto.graphqlPath,
      });
      strapiVersion = info.strapiVersion;
    } catch (err: any) {
      throw new BadRequestException(
        `Unable to reach Strapi at ${dto.strapiUrl}: ${err.message}`,
      );
    }

    // Guard: each org can have at most one connection per store URL
    const existing = await this.prisma.client.ecommerceConnection.findFirst({
      where: { organizationId, storeUrl: dto.strapiUrl },
    });
    if (existing) {
      throw new ConflictException(
        `A connection to ${dto.strapiUrl} already exists for this organisation`,
      );
    }

    const connection = await this.prisma.client.$transaction(async (tx) => {
      const conn = await tx.ecommerceConnection.create({
        data: {
          organizationId,
          name: dto.name,
          platform: EcommercePlatform.STRAPI,
          storeUrl: dto.strapiUrl,
          apiKey: dto.apiToken,
          webhookSecret: dto.webhookSecret,
          syncDirection: dto.syncDirection ?? SyncDirection.BIDIRECTIONAL,
          enabledSyncTypes: dto.enabledSyncTypes ?? [
            EntitySyncType.PRODUCTS,
            EntitySyncType.CUSTOMERS,
          ],
          autoSync: dto.autoSync ?? false,
          syncInterval: dto.syncInterval,
          defaultLocationId: dto.defaultLocationId,
          isActive: true,
        },
      });

      await tx.strapiConnectionConfig.create({
        data: {
          connectionId: conn.id,
          strapiUrl: dto.strapiUrl,
          apiToken: dto.apiToken,
          publicToken: dto.publicToken,
          webhookSecret: dto.webhookSecret,
          graphqlPath: dto.graphqlPath ?? "/graphql",
          webhooksEnabled: dto.webhooksEnabled ?? true,
          contentTypes: dto.contentTypes ?? [
            "api::product.product",
            "api::customer.customer",
          ],
          locationMap: dto.locationMap,
          strapiVersion,
        },
      });

      return conn;
    });

    this.logger.log(
      `Created Strapi connection ${connection.id} for org ${organizationId}`,
    );

    return this.toResponse(connection.id);
  }

  // ─────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────

  async update(
    organizationId: string,
    connectionId: string,
    dto: UpdateStrapiConnectionDto,
  ): Promise<StrapiConnectionResponseDto> {
    await this.getConnectionOrThrow(organizationId, connectionId);

    // If credentials changed, re-verify
    if (dto.strapiUrl || dto.apiToken) {
      const config = await this.prisma.client.strapiConnectionConfig.findUnique({
        where: { connectionId },
      });

      const testUrl = dto.strapiUrl ?? config!.strapiUrl;
      const testToken = dto.apiToken ?? config!.apiToken;

      try {
        await this.strapiProvider.ping({
          strapiUrl: testUrl,
          apiToken: testToken,
          graphqlPath: dto.graphqlPath ?? config!.graphqlPath,
        });
      } catch (err: any) {
        throw new BadRequestException(
          `Unable to reach Strapi at ${testUrl}: ${err.message}`,
        );
      }
    }

    await this.prisma.client.$transaction(async (tx) => {
      const connData: Record<string, unknown> = {};
      if (dto.name) connData.name = dto.name;
      if (dto.strapiUrl) connData.storeUrl = dto.strapiUrl;
      if (dto.apiToken) connData.apiKey = dto.apiToken;
      if (dto.webhookSecret) connData.webhookSecret = dto.webhookSecret;
      if (dto.syncDirection) connData.syncDirection = dto.syncDirection;
      if (dto.enabledSyncTypes) connData.enabledSyncTypes = dto.enabledSyncTypes;
      if (dto.autoSync !== undefined) connData.autoSync = dto.autoSync;
      if (dto.syncInterval !== undefined) connData.syncInterval = dto.syncInterval;
      if (dto.defaultLocationId) connData.defaultLocationId = dto.defaultLocationId;

      if (Object.keys(connData).length) {
        await tx.ecommerceConnection.update({
          where: { id: connectionId },
          data: connData,
        });
      }

      const cfgData: Record<string, unknown> = {};
      if (dto.strapiUrl) cfgData.strapiUrl = dto.strapiUrl;
      if (dto.apiToken) cfgData.apiToken = dto.apiToken;
      if (dto.publicToken) cfgData.publicToken = dto.publicToken;
      if (dto.webhookSecret) cfgData.webhookSecret = dto.webhookSecret;
      if (dto.graphqlPath) cfgData.graphqlPath = dto.graphqlPath;
      if (dto.webhooksEnabled !== undefined) cfgData.webhooksEnabled = dto.webhooksEnabled;
      if (dto.contentTypes) cfgData.contentTypes = dto.contentTypes;
      if (dto.locationMap) cfgData.locationMap = dto.locationMap;

      if (Object.keys(cfgData).length) {
        await tx.strapiConnectionConfig.update({
          where: { connectionId },
          data: cfgData,
        });
      }
    });

    return this.toResponse(connectionId);
  }

  // ─────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────

  async delete(organizationId: string, connectionId: string): Promise<void> {
    await this.getConnectionOrThrow(organizationId, connectionId);

    await this.prisma.client.ecommerceConnection.update({
      where: { id: connectionId },
      data: { isActive: false },
    });

    this.logger.log(`Deactivated Strapi connection ${connectionId}`);
  }

  // Hard delete (admin only)
  async hardDelete(organizationId: string, connectionId: string): Promise<void> {
    await this.getConnectionOrThrow(organizationId, connectionId);
    await this.prisma.client.ecommerceConnection.delete({ where: { id: connectionId } });
    this.logger.log(`Hard-deleted Strapi connection ${connectionId}`);
  }

  // ─────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────

  async list(organizationId: string): Promise<StrapiConnectionResponseDto[]> {
    const connections = await this.prisma.client.ecommerceConnection.findMany({
      where: {
        organizationId,
        platform: EcommercePlatform.STRAPI,
      },
      include: {
        strapiConfig: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(connections.map((c) => this.mapToResponse(c)));
  }

  // ─────────────────────────────────────────
  // GET ONE
  // ─────────────────────────────────────────

  async getOne(
    organizationId: string,
    connectionId: string,
  ): Promise<StrapiConnectionResponseDto> {
    return this.toResponse(connectionId, organizationId);
  }

  // ─────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────

  async getConnectionOrThrow(organizationId: string, connectionId: string) {
    const conn = await this.prisma.client.ecommerceConnection.findFirst({
      where: {
        id: connectionId,
        organizationId,
        platform: EcommercePlatform.STRAPI,
      },
    });
    if (!conn) {
      throw new NotFoundException(
        `Strapi connection ${connectionId} not found`,
      );
    }
    return conn;
  }

  async getConfigOrThrow(connectionId: string) {
    const config = await this.prisma.client.strapiConnectionConfig.findUnique({
      where: { connectionId },
    });
    if (!config) {
      throw new NotFoundException(
        `StrapiConnectionConfig not found for connection ${connectionId}`,
      );
    }
    return config;
  }

  private async toResponse(
    connectionId: string,
    organizationId?: string,
  ): Promise<StrapiConnectionResponseDto> {
    const conn = await this.prisma.client.ecommerceConnection.findFirst({
      where: {
        id: connectionId,
        ...(organizationId ? { organizationId } : {}),
        platform: EcommercePlatform.STRAPI,
      },
      include: { strapiConfig: true },
    });

    if (!conn) {
      throw new NotFoundException(`Strapi connection ${connectionId} not found`);
    }

    return this.mapToResponse(conn);
  }

  private mapToResponse(conn: any): StrapiConnectionResponseDto {
    const cfg = conn.strapiConfig;
    return {
      id: conn.id,
      name: conn.name,
      strapiUrl: cfg?.strapiUrl ?? conn.storeUrl,
      syncDirection: conn.syncDirection,
      enabledSyncTypes: conn.enabledSyncTypes,
      webhooksEnabled: cfg?.webhooksEnabled ?? false,
      contentTypes: cfg?.contentTypes ?? [],
      locationMap: cfg?.locationMap as Record<string, string> | undefined,
      autoSync: conn.autoSync,
      syncInterval: conn.syncInterval ?? undefined,
      defaultLocationId: conn.defaultLocationId ?? undefined,
      strapiVersion: cfg?.strapiVersion ?? undefined,
      isActive: conn.isActive,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      lastSyncAt: conn.lastSyncAt ?? undefined,
    };
  }
}
