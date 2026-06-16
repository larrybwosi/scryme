import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RequirePermission } from "@/common/decorators/auth.decorator";
import { V2AuthGuard } from "@/auth/v2-auth.guard";
import { LoyaltyService } from "../../../application/loyalty.service";

@Controller("loyalty")
@UseGuards(V2AuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post("vouchers/redeem")
  @RequirePermission("CUSTOMERS_MANAGE")
  async redeemReward(
    @Request() req: any,
    @Body() body: { customerId: string; rewardId: string },
  ) {
    const organizationId = req.user.organizationId;
    return this.loyaltyService.redeemPointsForVoucher(
      body.customerId,
      body.rewardId,
      organizationId,
    );
  }

  @Get("customers/:id/status")
  @RequirePermission("CUSTOMERS_VIEW")
  async getCustomerStatus(
    @Request() req: any,
    @Param("id") customerId: string,
  ) {
    const organizationId = req.user.organizationId;
    return this.loyaltyService.getCustomerStatus(customerId, organizationId);
  }

  @Post("vouchers/validate")
  @RequirePermission("POS_SALE")
  async validateVoucher(
    @Request() req: any,
    @Body() body: { code: string; customerId: string },
  ) {
    const organizationId = req.user.organizationId;
    return this.loyaltyService.validateVoucher(
      body.code,
      body.customerId,
      organizationId,
    );
  }
}
