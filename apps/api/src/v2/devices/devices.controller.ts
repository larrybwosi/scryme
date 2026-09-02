import { Controller, Post, Body, Get, ForbiddenException, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiSecurity } from "@nestjs/swagger";
import { DevicesService } from "./devices.service";
import { PosPairingService } from "../../v3/modules/pos/application/services/pos-pairing.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiRealtimeService } from "../../common/services/realtime.service";
import { AllowPublic } from "../../common/decorators/auth.decorator";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import { type V2ApiContext } from "@repo/shared/api/v2";

@ApiTags("Devices")
@Controller("devices")
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly pairingService: PosPairingService,
    private readonly prisma: PrismaService,
    private readonly realtimeService: ApiRealtimeService,
  ) {}

  @AllowPublic()
  @Post("provision")
  @ApiOperation({ summary: "Provision a new device using a setup token" })
  async provision(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.devicesService.provision(ctx, body);
  }

  @Post("pairing/authorize")
  @ApiOperation({ summary: "Authorize temporary POS pairing session from Android App" })
  async authorizePairingSession(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    const sessionId = body?.sessionId || body?.sessionId;
    if (!sessionId) {
      throw new BadRequestException("sessionId is required");
    }

    const orgId = ctx?.organizationId || body?.organizationId;
    if (!orgId) {
      throw new BadRequestException("Organization context required");
    }

    let memberId = ctx?.memberId || body?.memberId;
    if (!memberId) {
      const activeMember = await this.prisma.client.member.findFirst({
        where: { organizationId: orgId, isActive: true },
        orderBy: { createdAt: "asc" },
      });
      if (!activeMember) {
        throw new BadRequestException("No active member found for organization");
      }
      memberId = activeMember.id;
    }

    const result = await this.pairingService.authorizeSession(
      sessionId,
      orgId,
      memberId,
      this.prisma,
      body
    );

    try {
      const session = this.pairingService.getSession(sessionId);
      const payload = {
        sessionId: session.sessionId,
        pairingCode: session.pairingCode,
        status: session.status,
        payload: result,
      };

      await this.realtimeService.publish(`pos:pairing:${session.sessionId}`, "pairing:authorized", payload);
      await this.realtimeService.publish(`pos:pairing:${session.pairingCode}`, "pairing:authorized", payload);
      await this.realtimeService.publish(`v3:pos:pairing:${session.sessionId}`, "pairing:authorized", payload);
      await this.realtimeService.publish(`v3:pos:pairing:${session.pairingCode}`, "pairing:authorized", payload);
    } catch (e: any) {
      console.error("Failed to publish socket event for v2 device pairing authorization:", e?.message || e);
    }

    return result;
  }

  @Get("me")
  @AllowPublic()
  @ApiSecurity("x-api-key")
  @ApiOperation({ summary: "Get current device information" })
  async getMe(@v2Context() ctx: V2ApiContext) {
    if (!ctx || (!ctx.deviceId && !ctx.memberId)) {
      throw new ForbiddenException("Access denied: Not authenticated as device or member.");
    }
    return {
      id: ctx.deviceId,
      name: ctx.deviceName,
      organizationId: ctx.organizationId,
      locationId: ctx.locationId,
      permissions: ctx.permissions,
    };
  }
}
