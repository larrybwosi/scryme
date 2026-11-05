import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { LoyaltyService } from "../../../application/loyalty.service";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import {
  RedeemRewardDto,
  ValidateVoucherDto,
  LoyaltyStatusResponseDto,
  UpsertLoyaltyProgramDto,
  CreateLoyaltyTierDto,
  UpdateLoyaltyTierDto,
  CreateLoyaltyRuleDto,
  UpdateLoyaltyRuleDto,
  CreateLoyaltyRewardDto,
  UpdateLoyaltyRewardDto,
  AdjustPointsDto,
  DirectRedeemPointsDto,
} from "../../../application/dto/loyalty.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { RequireModule } from "@/v3/common/decorators/module.decorator";

@ApiTags("V3 Loyalty")
@ApiBearerAuth()
@Controller(":orgSlug/loyalty")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@RequireModule("loyalty")
@UseInterceptors(StandardResponseInterceptor)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // -------------------------------------------------------------
  // PROGRAM CONFIGURATION
  // -------------------------------------------------------------

  @Get("program")
  @Permissions("loyalty:read")
  @ApiOperation({
    summary: "Get organization loyalty program configuration",
    operationId: "Loyalty_GetProgram",
  })
  async getProgram(@Req() req: any) {
    const organizationId = req.organization.id;
    return this.loyaltyService.getProgram(organizationId);
  }

  @Put("program")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Upsert loyalty program configuration",
    operationId: "Loyalty_UpsertProgram",
  })
  async upsertProgram(@Req() req: any, @Body() body: UpsertLoyaltyProgramDto) {
    const organizationId = req.organization.id;
    return this.loyaltyService.upsertProgram(organizationId, body);
  }

  // -------------------------------------------------------------
  // TIERS MANAGEMENT
  // -------------------------------------------------------------

  @Post("tiers")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Create a loyalty tier",
    operationId: "Loyalty_CreateTier",
  })
  async createTier(@Req() req: any, @Body() body: CreateLoyaltyTierDto) {
    const organizationId = req.organization.id;
    return this.loyaltyService.createTier(organizationId, body);
  }

  @Put("tiers/:id")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Update a loyalty tier",
    operationId: "Loyalty_UpdateTier",
  })
  async updateTier(
    @Req() req: any,
    @Param("id") tierId: string,
    @Body() body: UpdateLoyaltyTierDto,
  ) {
    const organizationId = req.organization.id;
    return this.loyaltyService.updateTier(tierId, organizationId, body);
  }

  @Delete("tiers/:id")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Delete a loyalty tier",
    operationId: "Loyalty_DeleteTier",
  })
  async deleteTier(@Req() req: any, @Param("id") tierId: string) {
    const organizationId = req.organization.id;
    return this.loyaltyService.deleteTier(tierId, organizationId);
  }

  // -------------------------------------------------------------
  // RULES MANAGEMENT
  // -------------------------------------------------------------

  @Post("rules")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Create a loyalty earning rule",
    operationId: "Loyalty_CreateRule",
  })
  async createRule(@Req() req: any, @Body() body: CreateLoyaltyRuleDto) {
    const organizationId = req.organization.id;
    return this.loyaltyService.createRule(organizationId, body);
  }

  @Put("rules/:id")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Update a loyalty earning rule",
    operationId: "Loyalty_UpdateRule",
  })
  async updateRule(
    @Req() req: any,
    @Param("id") ruleId: string,
    @Body() body: UpdateLoyaltyRuleDto,
  ) {
    const organizationId = req.organization.id;
    return this.loyaltyService.updateRule(ruleId, organizationId, body);
  }

  @Delete("rules/:id")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Delete a loyalty earning rule",
    operationId: "Loyalty_DeleteRule",
  })
  async deleteRule(@Req() req: any, @Param("id") ruleId: string) {
    const organizationId = req.organization.id;
    return this.loyaltyService.deleteRule(ruleId, organizationId);
  }

  // -------------------------------------------------------------
  // REWARDS MANAGEMENT
  // -------------------------------------------------------------

  @Post("rewards")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Create a loyalty reward",
    operationId: "Loyalty_CreateReward",
  })
  async createReward(@Req() req: any, @Body() body: CreateLoyaltyRewardDto) {
    const organizationId = req.organization.id;
    return this.loyaltyService.createReward(organizationId, body);
  }

  @Put("rewards/:id")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Update a loyalty reward",
    operationId: "Loyalty_UpdateReward",
  })
  async updateReward(
    @Req() req: any,
    @Param("id") rewardId: string,
    @Body() body: UpdateLoyaltyRewardDto,
  ) {
    const organizationId = req.organization.id;
    return this.loyaltyService.updateReward(rewardId, organizationId, body);
  }

  @Delete("rewards/:id")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Delete a loyalty reward",
    operationId: "Loyalty_DeleteReward",
  })
  async deleteReward(@Req() req: any, @Param("id") rewardId: string) {
    const organizationId = req.organization.id;
    return this.loyaltyService.deleteReward(rewardId, organizationId);
  }

  // -------------------------------------------------------------
  // DIRECT REDEEM & CHECKOUT
  // -------------------------------------------------------------

  @Post("redeem-direct")
  @Permissions("pos:sale")
  @ApiOperation({
    summary: "Direct pay-with-points checkout redemption",
    operationId: "Loyalty_DirectRedeem",
  })
  async directRedeem(@Req() req: any, @Body() body: DirectRedeemPointsDto) {
    const organizationId = req.organization.id;
    return this.loyaltyService.directRedeemPoints(organizationId, body);
  }

  // -------------------------------------------------------------
  // VOUCHERS & STATUS
  // -------------------------------------------------------------

  @Post("vouchers/redeem")
  @Permissions("customer:update")
  @ApiOperation({
    summary: "Redeem points for a voucher",
    operationId: "Loyalty_RedeemReward",
  })
  @ApiResponse({
    status: 201,
    description: "Points successfully redeemed for a voucher",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Insufficient points or invalid reward",
  })
  async redeemReward(@Req() req: any, @Body() body: RedeemRewardDto) {
    const organizationId = req.organization.id;
    return this.loyaltyService.redeemPointsForVoucher(
      body.customerId,
      body.rewardId,
      organizationId,
    );
  }

  @Get("customers/:id/status")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "Get customer loyalty status",
    operationId: "Loyalty_GetCustomerStatus",
  })
  @ApiResponse({
    status: 200,
    type: LoyaltyStatusResponseDto,
    description: "Customer loyalty points, tier, and rewards",
  })
  async getCustomerStatus(
    @Req() req: any,
    @Param("id") customerId: string,
  ) {
    const organizationId = req.organization.id;
    return this.loyaltyService.getCustomerStatus(customerId, organizationId);
  }

  @Post("vouchers/validate")
  @Permissions("pos:sale")
  @ApiOperation({
    summary: "Validate a voucher code",
    operationId: "Loyalty_ValidateVoucher",
  })
  @ApiResponse({ status: 200, description: "Voucher validation result" })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid or expired voucher",
  })
  async validateVoucher(@Req() req: any, @Body() body: ValidateVoucherDto) {
    const organizationId = req.organization.id;
    return this.loyaltyService.validateVoucher(
      body.code,
      body.customerId,
      organizationId,
    );
  }

  // -------------------------------------------------------------
  // MANUAL ADJUSTMENTS & AUDIT HISTORY
  // -------------------------------------------------------------

  @Post("customers/:id/adjust")
  @Permissions("loyalty:adjust")
  @ApiOperation({
    summary: "Audited manual staff loyalty points adjustment",
    operationId: "Loyalty_AdjustCustomerPoints",
  })
  async adjustPoints(
    @Req() req: any,
    @Param("id") customerId: string,
    @Body() body: AdjustPointsDto,
  ) {
    const organizationId = req.organization.id;
    const staffMemberId = req.v3Context?.memberId || req.user?.id;
    return this.loyaltyService.adjustPoints(
      customerId,
      organizationId,
      body.points,
      body.reason,
      staffMemberId,
    );
  }

  @Get("customers/:id/history")
  @Permissions("loyalty:read")
  @ApiOperation({
    summary: "Get customer loyalty transaction audit history",
    operationId: "Loyalty_GetCustomerHistory",
  })
  async getCustomerHistory(
    @Req() req: any,
    @Param("id") customerId: string,
    @Query("limit") limit?: number,
  ) {
    const organizationId = req.organization.id;
    return this.loyaltyService.getCustomerHistory(
      customerId,
      organizationId,
      limit ? Number(limit) : 50,
    );
  }

  // -------------------------------------------------------------
  // BATCH EXPIRATION & ANALYTICS
  // -------------------------------------------------------------

  @Post("process-expirations")
  @Permissions("loyalty:manage")
  @ApiOperation({
    summary: "Process point expirations for inactive accounts",
    operationId: "Loyalty_ProcessExpirations",
  })
  async processExpirations(@Req() req: any) {
    const organizationId = req.organization.id;
    return this.loyaltyService.processPointExpirations(organizationId);
  }

  @Get("analytics")
  @Permissions("loyalty:read")
  @ApiOperation({
    summary: "Get organization loyalty analytics and stats",
    operationId: "Loyalty_GetAnalytics",
  })
  async getAnalytics(@Req() req: any) {
    const organizationId = req.organization.id;
    return this.loyaltyService.getAnalytics(organizationId);
  }
}
