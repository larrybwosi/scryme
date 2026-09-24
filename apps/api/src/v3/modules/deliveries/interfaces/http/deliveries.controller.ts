import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { DeliveriesService } from "../../application/services/deliveries.service";
import { v3Context } from "@/v3/common/decorators/v3-context.decorator";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { AuditInterceptor } from "../../../../common/interceptors/audit.interceptor";
import type { V3ApiContext } from "@repo/shared/api/v3";
import {
  CreateDeliveryPartnerDto,
  UpdateDeliveryPartnerDto,
  AdjustWalletDto,
  DispatchDeliveryDto,
  ReconcileDeliveryDto,
  AssignDriverPartnerDto,
  UpdateDeliveryStatusDto,
} from "../../dto/deliveries.dto";

@ApiTags("V3 Deliveries")
@ApiBearerAuth()
@Controller(":orgSlug/deliveries")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get("partners")
  @Permissions("orders:read")
  @ApiOperation({ summary: "Get delivery partners" })
  async getPartners(@v3Context() ctx: V3ApiContext) {
    return this.deliveriesService.getPartners(ctx.organizationId);
  }

  @Post("partners")
  @Permissions("orders:write")
  @ApiOperation({ summary: "Create delivery partner" })
  async createPartner(
    @v3Context() ctx: V3ApiContext,
    @Body() body: CreateDeliveryPartnerDto,
  ) {
    return this.deliveriesService.createPartner(ctx.organizationId, body);
  }

  @Get("partners/:id")
  @Permissions("orders:read")
  @ApiOperation({ summary: "Get delivery partner details by ID" })
  async getPartner(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.deliveriesService.getPartner(ctx.organizationId, id);
  }

  @Patch("partners/:id")
  @Permissions("orders:write")
  @ApiOperation({ summary: "Update delivery partner" })
  async updatePartner(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateDeliveryPartnerDto,
  ) {
    return this.deliveriesService.updatePartner(ctx.organizationId, id, body);
  }

  @Post("partners/:id/wallet")
  @Permissions("orders:write")
  @ApiOperation({ summary: "Adjust delivery partner wallet" })
  async adjustPartnerWallet(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: AdjustWalletDto,
  ) {
    return this.deliveriesService.adjustPartnerWallet(ctx.organizationId, id, body);
  }

  @Post("dispatch")
  @Permissions("orders:write")
  @ApiOperation({ summary: "Dispatch delivery order to driver and/or delivery partner" })
  async dispatchDelivery(
    @v3Context() ctx: V3ApiContext,
    @Body() body: DispatchDeliveryDto,
  ) {
    return this.deliveriesService.dispatchDelivery(ctx, body);
  }

  @Patch(":id/assign")
  @Permissions("orders:write")
  @ApiOperation({ summary: "Assign or re-assign internal driver or 3PL delivery partner to a delivery" })
  async assignDriverOrPartner(
    @v3Context() ctx: V3ApiContext,
    @Param("id") fulfillmentId: string,
    @Body() body: AssignDriverPartnerDto,
  ) {
    return this.deliveriesService.assignDriverOrPartner(ctx, fulfillmentId, body);
  }

  @Patch(":id/status")
  @Permissions("orders:write")
  @ApiOperation({ summary: "Update delivery state (PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED, CANCELLED, RETURNED)" })
  async updateDeliveryStatus(
    @v3Context() ctx: V3ApiContext,
    @Param("id") fulfillmentId: string,
    @Body() body: UpdateDeliveryStatusDto,
  ) {
    return this.deliveriesService.updateDeliveryStatus(ctx, fulfillmentId, body);
  }

  @Post("reconcile")
  @Permissions("orders:write")
  @ApiOperation({ summary: "Reconcile completed or failed delivery with proof of delivery (POD)" })
  async reconcileDelivery(
    @v3Context() ctx: V3ApiContext,
    @Body() body: ReconcileDeliveryDto,
  ) {
    return this.deliveriesService.reconcileDelivery(ctx, body);
  }

  @Get("active")
  @Permissions("orders:read")
  @ApiOperation({ summary: "Get all active in-progress deliveries" })
  async getActiveDeliveries(@v3Context() ctx: V3ApiContext) {
    return this.deliveriesService.getActiveDeliveries(ctx.organizationId);
  }
}
