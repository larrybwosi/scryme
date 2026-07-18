import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "@/v3/common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { StrapiConnectionUseCase } from "../../application/use-cases/strapi-connection.use-case";
import { StrapiProductSyncUseCase } from "../../application/use-cases/strapi-product-sync.use-case";
import { StrapiCustomerSyncUseCase } from "../../application/use-cases/strapi-customer-sync.use-case";
import { StrapiWebhookService } from "../../infrastructure/services/strapi-webhook.service";
import {
  CreateStrapiConnectionDto,
  UpdateStrapiConnectionDto,
  StrapiConnectionResponseDto,
  TriggerSyncDto,
} from "../../application/dto/strapi-connection.dto";
import { SyncDirection } from "@repo/db";

@ApiTags("V3 Strapi Integration")
@ApiBearerAuth()
@Controller(":orgSlug/strapi")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class StrapiConnectionController {
  constructor(
    private readonly connectionUseCase: StrapiConnectionUseCase,
    private readonly productSyncUseCase: StrapiProductSyncUseCase,
    private readonly customerSyncUseCase: StrapiCustomerSyncUseCase,
    private readonly webhookService: StrapiWebhookService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // Connection CRUD
  // ─────────────────────────────────────────────────────────────────

  @Post("connections")
  @Permissions("integrations:strapi:create")
  @ApiOperation({
    summary: "Create a new Strapi connection for this organisation",
    operationId: "Strapi_CreateConnection",
  })
  @ApiResponse({ status: 201, type: StrapiConnectionResponseDto })
  async create(
    @Req() req: any,
    @Body() dto: CreateStrapiConnectionDto,
  ): Promise<StrapiConnectionResponseDto> {
    return this.connectionUseCase.create(req.organization.id, dto);
  }

  @Get("connections")
  @Permissions("integrations:strapi:read")
  @ApiOperation({
    summary: "List all Strapi connections for this organisation",
    operationId: "Strapi_ListConnections",
  })
  @ApiResponse({ status: 200, type: [StrapiConnectionResponseDto] })
  async list(@Req() req: any): Promise<StrapiConnectionResponseDto[]> {
    return this.connectionUseCase.list(req.organization.id);
  }

  @Get("connections/:connectionId")
  @Permissions("integrations:strapi:read")
  @ApiOperation({
    summary: "Get a single Strapi connection",
    operationId: "Strapi_GetConnection",
  })
  @ApiParam({ name: "connectionId", type: String })
  @ApiResponse({ status: 200, type: StrapiConnectionResponseDto })
  async getOne(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
  ): Promise<StrapiConnectionResponseDto> {
    return this.connectionUseCase.getOne(req.organization.id, connectionId);
  }

  @Patch("connections/:connectionId")
  @Permissions("integrations:strapi:update")
  @ApiOperation({
    summary: "Update a Strapi connection",
    operationId: "Strapi_UpdateConnection",
  })
  @ApiParam({ name: "connectionId", type: String })
  @ApiResponse({ status: 200, type: StrapiConnectionResponseDto })
  async update(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
    @Body() dto: UpdateStrapiConnectionDto,
  ): Promise<StrapiConnectionResponseDto> {
    return this.connectionUseCase.update(req.organization.id, connectionId, dto);
  }

  @Delete("connections/:connectionId")
  @Permissions("integrations:strapi:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Deactivate a Strapi connection",
    operationId: "Strapi_DeleteConnection",
  })
  @ApiParam({ name: "connectionId", type: String })
  async delete(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
  ): Promise<void> {
    return this.connectionUseCase.delete(req.organization.id, connectionId);
  }

  // ─────────────────────────────────────────────────────────────────
  // Manual sync triggers
  // ─────────────────────────────────────────────────────────────────

  @Post("connections/:connectionId/sync")
  @Permissions("integrations:strapi:sync")
  @ApiOperation({
    summary: "Trigger a manual sync for products and/or customers",
    operationId: "Strapi_TriggerSync",
  })
  @ApiParam({ name: "connectionId", type: String })
  async triggerSync(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
    @Body() dto: TriggerSyncDto,
  ) {
    const results: Record<string, unknown> = {};
    const orgId = req.organization.id;
    const dir = dto.direction ?? SyncDirection.BIDIRECTIONAL;

    for (const syncType of dto.syncTypes) {
      if (syncType === "PRODUCTS") {
        if (dir === SyncDirection.OUTBOUND || dir === SyncDirection.BIDIRECTIONAL) {
          results["products.outbound"] = await this.productSyncUseCase.syncOutbound(
            orgId,
            connectionId,
            `manual:${req.user?.memberId ?? "unknown"}`,
          );
        }
        if (dir === SyncDirection.INBOUND || dir === SyncDirection.BIDIRECTIONAL) {
          results["products.inbound"] = await this.productSyncUseCase.syncInbound(
            orgId,
            connectionId,
            `manual:${req.user?.memberId ?? "unknown"}`,
          );
        }
      }

      if (syncType === "CUSTOMERS") {
        if (dir === SyncDirection.OUTBOUND || dir === SyncDirection.BIDIRECTIONAL) {
          results["customers.outbound"] = await this.customerSyncUseCase.bulkSyncOutbound(
            orgId,
            connectionId,
            `manual:${req.user?.memberId ?? "unknown"}`,
          );
        }
      }
    }

    return results;
  }

  @Post("connections/:connectionId/sync/queue")
  @Permissions("integrations:strapi:sync")
  @ApiOperation({
    summary: "Enqueue a background sync job",
    operationId: "Strapi_EnqueueSync",
  })
  @ApiParam({ name: "connectionId", type: String })
  async enqueueSync(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
    @Body() dto: TriggerSyncDto,
  ) {
    const jobs: string[] = [];
    const orgId = req.organization.id;
    const triggeredBy = `manual:${req.user?.memberId ?? "unknown"}`;
    const dir = dto.direction ?? SyncDirection.BIDIRECTIONAL;

    for (const syncType of dto.syncTypes) {
      if (syncType === "PRODUCTS") {
        if (dir === SyncDirection.OUTBOUND || dir === SyncDirection.BIDIRECTIONAL) {
          jobs.push(
            await this.webhookService.enqueueSyncJob(
              "strapi.product.sync.outbound",
              connectionId,
              orgId,
              triggeredBy,
            ),
          );
        }
        if (dir === SyncDirection.INBOUND || dir === SyncDirection.BIDIRECTIONAL) {
          jobs.push(
            await this.webhookService.enqueueSyncJob(
              "strapi.product.sync.inbound",
              connectionId,
              orgId,
              triggeredBy,
            ),
          );
        }
      }

      if (syncType === "CUSTOMERS") {
        if (dir === SyncDirection.OUTBOUND || dir === SyncDirection.BIDIRECTIONAL) {
          jobs.push(
            await this.webhookService.enqueueSyncJob(
              "strapi.customer.sync.outbound",
              connectionId,
              orgId,
              triggeredBy,
            ),
          );
        }
      }
    }

    return { queued: true, jobIds: jobs };
  }

  // ─────────────────────────────────────────────────────────────────
  // Logs
  // ─────────────────────────────────────────────────────────────────

  @Get("connections/:connectionId/webhook-logs")
  @Permissions("integrations:strapi:read")
  @ApiOperation({
    summary: "Get recent webhook event logs for a Strapi connection",
    operationId: "Strapi_GetWebhookLogs",
  })
  @ApiParam({ name: "connectionId", type: String })
  async getWebhookLogs(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
  ) {
    await this.connectionUseCase.getConnectionOrThrow(
      req.organization.id,
      connectionId,
    );
    return this.webhookService.getWebhookLogs(req.organization.id, connectionId);
  }

  @Get("connections/:connectionId/sync-logs")
  @Permissions("integrations:strapi:read")
  @ApiOperation({
    summary: "Get recent sync logs for a Strapi connection",
    operationId: "Strapi_GetSyncLogs",
  })
  @ApiParam({ name: "connectionId", type: String })
  async getSyncLogs(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
  ) {
    await this.connectionUseCase.getConnectionOrThrow(
      req.organization.id,
      connectionId,
    );
    return this.webhookService.getSyncLogs(req.organization.id, connectionId);
  }

  // ─────────────────────────────────────────────────────────────────
  // Customer auth exchange endpoint
  // ─────────────────────────────────────────────────────────────────

  @Post("connections/:connectionId/customers/exchange-token")
  @Permissions("integrations:strapi:read")
  @ApiOperation({
    summary: "Exchange a Strapi storefront JWT for a Scryme customer session",
    operationId: "Strapi_ExchangeCustomerToken",
  })
  @ApiParam({ name: "connectionId", type: String })
  async exchangeToken(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
    @Body() body: { strapiJwt: string },
  ) {
    return this.customerSyncUseCase.exchangeToken({
      strapiJwt: body.strapiJwt,
      connectionId,
      organizationId: req.organization.id,
    });
  }

  @Post("connections/:connectionId/customers/register")
  @Permissions("integrations:strapi:read")
  @ApiOperation({
    summary: "Register a storefront customer in both Strapi and Scryme",
    operationId: "Strapi_RegisterCustomer",
  })
  @ApiParam({ name: "connectionId", type: String })
  async registerCustomer(
    @Req() req: any,
    @Param("connectionId") connectionId: string,
    @Body()
    body: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      locationSlug?: string;
    },
  ) {
    return this.customerSyncUseCase.registerCustomer({
      connectionId,
      organizationId: req.organization.id,
      ...body,
    });
  }
}
