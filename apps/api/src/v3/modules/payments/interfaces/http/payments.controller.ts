import { Controller, Post, Body, Param, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { MpesaService } from "@repo/shared/mpesa/server";
import type { FastifyRequest } from "fastify";
import { AllowPublic } from "../../../../../common/decorators/auth.decorator";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import { StandardResponseInterceptor } from "../../../../common/interceptors/standard-response.interceptor";
import { PrismaService } from "@/prisma/prisma.service";
import { CheckoutUseCase } from "../../application/use-cases/checkout.use-case";
import { CheckoutDto, CheckoutResponseDto } from "../../application/dto/checkout.dto";
import { ApiErrorResponseDto } from "../../../../common/dto/response.dto";

@ApiTags("Payments")
@ApiBearerAuth()
@Controller(":orgSlug/payments")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
export class PaymentsController {
  constructor(
    private readonly mpesaService: MpesaService,
    private readonly prisma: PrismaService,
    private readonly checkoutUseCase: CheckoutUseCase,
  ) {}

  @Post("checkout")
  @Permissions("order:create")
  @ApiOperation({
    summary: "Process customer checkout and initiate payment",
    operationId: "Payments_Checkout",
  })
  @ApiResponse({
    status: 201,
    type: CheckoutResponseDto,
    description: "Checkout processed and payment initiated",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input or empty cart",
  })
  async checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    return this.checkoutUseCase.execute(req.organization.id, dto);
  }

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
