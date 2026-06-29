import { Controller, Body, Post } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import { RequirePermission } from "../../common/decorators/auth.decorator";
import type { V2ApiContext } from "@repo/shared/api/v2/types/context";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("validate")
  @RequirePermission("payment:manage")
  @ApiOperation({ summary: "Validate an M-Pesa payment" })
  async validate(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.paymentsService.validateMpesaPayment(
      ctx,
      body.transactionCode,
      body.saleId,
    );
  }
}
