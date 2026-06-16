import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import { ably, type V2ApiContext } from "@repo/shared/server";

@ApiTags("Realtime")
@Controller("realtime")
export class RealtimeController {
  @Post("auth")
  @ApiOperation({ summary: "Ably token authentication for v2 API" })
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

      const provider = process.env.REALTIME_PROVIDER || "ably";

      const paymentChannel = `organization:${organizationId}:payments`;
      const notificationChannel = `organization:${organizationId}:notifications`;
      const inventoryChannel = `organization:${organizationId}:inventory`;
      const ordersChannel = `organization:${organizationId}:orders`;

      const capability: any = {
        [paymentChannel]: ["subscribe", "publish", "history"],
        [notificationChannel]: ["subscribe", "publish", "history"],
        [inventoryChannel]: ["subscribe", "publish", "history"],
        [ordersChannel]: ["subscribe", "publish", "history"],
        "channel:*": ["subscribe", "publish", "history"],
      };

      // Add POS specific channel if we have a location
      if (ctx.locationId) {
        capability[`pos:${ctx.locationId}:sales`] = [
          "subscribe",
          "publish",
          "history",
        ];
      }

      let tokenRequest: any = null;
      if (provider === "ably") {
        tokenRequest = await ably.auth.requestToken({
          clientId,
          capability: JSON.stringify(capability),
          ttl: 3600 * 1000,
          timestamp: Date.now(),
        });
      } else {
        // Socket.io simplified auth for now
        tokenRequest = {
          token: "socketio-placeholder-token",
          clientId,
        };
      }

      return {
        tokenRequest,
        provider,
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
