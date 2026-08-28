import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { AllowPublic } from "@/common/decorators/auth.decorator";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { RequireMember } from "@/v3/common/decorators/require-member.decorator";
import { v3Context } from "@/v3/common/decorators/v3-context.decorator";
import { type V3ApiContext } from "@repo/shared/api/v2";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { PosPairingService } from "../../application/services/pos-pairing.service";
import { PrismaService } from "@/prisma/prisma.service";

@ApiTags("V3 POS Pairing")
@Controller("pos/pairing")
@UseInterceptors(StandardResponseInterceptor)
export class PosPairingController {
  constructor(
    private readonly pairingService: PosPairingService,
    private readonly prisma: PrismaService
  ) {}

  @AllowPublic()
  @Post("session")
  @ApiOperation({
    summary: "Request a temporary pairing session for unprovisioned POS device",
    operationId: "POS_CreatePairingSession",
  })
  @ApiResponse({ status: 201, description: "Pairing session created" })
  async createSession() {
    return this.pairingService.createSession();
  }

  @AllowPublic()
  @Get("session/:sessionId/status")
  @ApiOperation({
    summary: "Poll pairing session status",
    operationId: "POS_GetPairingSessionStatus",
  })
  @ApiResponse({ status: 200, description: "Pairing session status" })
  async getSessionStatus(@Param("sessionId") sessionId: string) {
    return this.pairingService.getSession(sessionId);
  }

  @Post("session/:sessionId/authorize")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Authorize a temporary POS pairing session from Android App",
    operationId: "POS_AuthorizePairingSession",
  })
  @ApiResponse({ status: 200, description: "Pairing session authorized" })
  async authorizeSession(
    @Param("sessionId") sessionId: string,
    @v3Context() ctx: V3ApiContext,
    @Body()
    body?: {
      locationId?: string;
      deviceName?: string;
      deviceType?: string;
    }
  ) {
    if (!ctx.organizationId || !ctx.memberId) {
      throw new BadRequestException("Organization and member context required");
    }

    return this.pairingService.authorizeSession(
      sessionId,
      ctx.organizationId,
      ctx.memberId,
      this.prisma,
      body
    );
  }
}
