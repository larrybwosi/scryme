import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam
} from "@nestjs/swagger";
import { LoyaltyService } from "../../../application/loyalty.service";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import {
  RedeemRewardDto,
  ValidateVoucherDto,
  LoyaltyStatusResponseDto,
} from "../../../application/dto/loyalty.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";

@ApiTags("V3 Loyalty")
@ApiBearerAuth()
@Controller(":orgSlug/loyalty")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

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
}
