import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import { type V2ApiContext } from "@repo/shared/api/v2";

@ApiTags("Realtime")
@Controller("realtime")
export class RealtimeController {
  @Post("auth")
  @ApiOperation({ summary: "Socket.IO token authentication for v2 API" })
  async auth(
    @v2Context() ctx: V2ApiContext,
    @Headers("authorization") authHeader: string = "",
    @Headers("x-device-key") deviceKey: string = "",
    @Headers("x-device-id") deviceId: string = "",
  ) {
    try {
      const { organizationId, memberId, deviceId: ctxDeviceId } = ctx;

      if (!organizationId) {
        throw new UnauthorizedException({
          error: "Missing organization context",
          code: "MISSING_ORG_CONTEXT",
        });
      }

      // Use either the memberId or the deviceId as the clientId
      const clientId = memberId || ctxDeviceId || "anonymous";

      const paymentChannel = `organization:${organizationId}:payments`;
      const notificationChannel = `organization:${organizationId}:notifications`;
      const inventoryChannel = `organization:${organizationId}:inventory`;
      const ordersChannel = `organization:${organizationId}:orders`;

      const tokenRequest = {
        token: "socketio-placeholder-token",
        clientId,
      };

      return {
        tokenRequest,
        provider: "socketio",
        channels: {
          payments: paymentChannel,
          notifications: notificationChannel,
          inventory: inventoryChannel,
          orders: ordersChannel,
          pos: ctx.locationId ? `pos:${ctx.locationId}:sales` : undefined,
        },
        ttl: 3600,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error("[v2/realtime/auth] Error:", error);
      throw new InternalServerErrorException({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
