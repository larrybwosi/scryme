import { Controller, Post, Body, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { MpesaService } from "@repo/shared/mpesa/server";
import type { FastifyRequest } from "fastify";
import { AllowPublic } from "../../../../../common/decorators/auth.decorator";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { PrismaService } from "@/prisma/prisma.service";

@ApiTags("Payments")
@Controller(":orgSlug/payments")
@UseGuards(V3AuthGuard, MultiTenancyGuard)
export class PaymentsController {
  constructor(
    private readonly mpesaService: MpesaService,
    private readonly prisma: PrismaService,
  ) {}

  @AllowPublic()
  @Post("webhooks/mpesa/stkpush/:paymentId")
  @ApiOperation({ summary: "M-Pesa STK Push Callback" })
  async handleStkCallback(
    @Req() req: FastifyRequest,
    @Param("orgSlug") orgSlug: string,
    @Param("paymentId") paymentId: string,
    @Body() payload: any,
  ) {
    this.mpesaService.validateWebhookIp(req.ip || "");
    const org = await this.prisma.client.organization.findUnique({
      where: { slug: orgSlug },
    });
    if (!org) throw new Error("Organization not found");

    return this.mpesaService.handleStkCallback(org.id, paymentId, payload);
  }
}
