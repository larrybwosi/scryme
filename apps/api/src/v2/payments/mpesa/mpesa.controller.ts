import { Controller, Post, Body, Param, Req, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { MpesaService } from "@repo/mpesa/server";
import type { MpesaTriggerInput } from "@repo/mpesa/server";
import type { FastifyRequest } from "fastify";
import {
  AllowPublic,
  RequirePermission,
} from "../../../common/decorators/auth.decorator";
import { v2Context } from "../../../common/decorators/v2-context.decorator";
import type { V2ApiContext } from "@repo/shared/api/v2/types/context";

@ApiTags("M-Pesa")
@Controller("payments/mpesa")
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post("stkpush")
  @ApiOperation({ summary: "Initiate M-Pesa STK Push" })
  @ApiResponse({ status: 200, description: "STK Push initiated successfully" })
  async initiateStkPush(
    @v2Context() ctx: V2ApiContext,
    @Body() input: MpesaTriggerInput & { userId?: string },
  ) {
    // Enforce organizationId from context to prevent IDOR
    const sanitizedInput = {
      ...input,
      organizationId: ctx.organizationId,
      userId: ctx.memberId || input.userId || "system",
    };
    return this.mpesaService.initiateStkPush(sanitizedInput);
  }

  @AllowPublic()
  @Post("webhooks/stkpush/:organizationId/:paymentId")
  @ApiOperation({ summary: "M-Pesa STK Push Callback" })
  async handleStkCallback(
    @Req() req: FastifyRequest,
    @Param("organizationId") organizationId: string,
    @Param("paymentId") paymentId: string,
    @Body() payload: any,
  ) {
    this.mpesaService.validateWebhookIp(req.ip || "");
    await this.mpesaService.handleStkCallback(
      organizationId,
      paymentId,
      payload,
    );
    return { received: true };
  }

  @AllowPublic()
  @Post("webhooks/c2b/validation")
  @ApiOperation({ summary: "M-Pesa C2B Validation Webhook" })
  async handleC2BValidation(@Req() req: FastifyRequest, @Body() payload: any) {
    this.mpesaService.validateWebhookIp(req.ip || "");
    return this.mpesaService.handleC2BValidation(payload);
  }

  @AllowPublic()
  @Post("webhooks/c2b/confirmation")
  @ApiOperation({ summary: "M-Pesa C2B Confirmation Webhook" })
  async handleC2BConfirmation(
    @Req() req: FastifyRequest,
    @Body() payload: any,
  ) {
    this.mpesaService.validateWebhookIp(req.ip || "");
    return this.mpesaService.handleC2BConfirmation(payload);
  }

  @Get("verify/:transactionId")
  @RequirePermission("sale:read:location")
  @ApiOperation({ summary: "Verify M-Pesa Payment Status" })
  @ApiResponse({ status: 200, description: "Payment status retrieved" })
  async verifyPayment(
    @v2Context() ctx: V2ApiContext,
    @Param("transactionId") transactionId: string,
  ) {
    return this.mpesaService.verifyPayment(transactionId, ctx.organizationId);
  }

  @Get("search-unclaimed")
  @RequirePermission("product:manage:stock")
  @ApiOperation({ summary: "Search for unclaimed M-Pesa payments" })
  async searchUnclaimed(
    @v2Context() ctx: V2ApiContext,
    @Req() req: FastifyRequest & { query: { q: string } },
  ) {
    const query = (req.query as any).q || "";
    return this.mpesaService.searchUnclaimedPayments(ctx.organizationId, query);
  }

  @Post("claim")
  @RequirePermission("product:manage:stock")
  @ApiOperation({ summary: "Claim an unclaimed M-Pesa payment" })
  async claimPayment(
    @v2Context() ctx: V2ApiContext,
    @Body()
    body: {
      unclaimedPaymentId: string;
      transactionId: string;
    },
  ) {
    return this.mpesaService.claimPayment(
      ctx.organizationId,
      body.unclaimedPaymentId,
      body.transactionId,
      ctx.memberId || "system",
    );
  }

  @Post("verify-safaricom")
  @RequirePermission("product:manage:stock")
  @ApiOperation({ summary: "Verify transaction code with Safaricom" })
  async verifySafaricom(
    @v2Context() ctx: V2ApiContext,
    @Body() body: { transactionCode: string },
  ) {
    return this.mpesaService.verifyWithSafaricom(
      ctx.organizationId,
      body.transactionCode,
    );
  }
}
