import { Injectable } from "@nestjs/common";
import { RealtimeGateway } from "../../v2/realtime/realtime.gateway";
import { V3RealtimeGateway } from "../../v3/common/realtime/v3-realtime.gateway";
import { RealtimeRedisService } from "../../v2/realtime/realtime-redis.service";
import { createDelta } from "@repo/shared/realtime";

@Injectable()
export class ApiRealtimeService {
  constructor(
    private readonly v2Gateway: RealtimeGateway,
    private readonly v3Gateway: V3RealtimeGateway,
    private readonly redis: RealtimeRedisService,
  ) {}

  async publish(
    channel: string,
    event: string,
    data: any,
    options?: { delta?: boolean },
  ) {
    let finalData = data;
    let finalEvent = event;

    if (options?.delta) {
      const lastState = await this.redis.getLastState(channel, event);
      if (lastState) {
        const delta = createDelta(lastState, data);
        if (delta) {
          finalData = delta;
          finalEvent = `${event}:delta`;
        }
      }
    }

    // Save history for ALL channels in Socket.io
    await this.redis.saveMessage(channel, event, data);

    if (
      channel.startsWith("v3:") ||
      channel.includes("order:") ||
      channel.includes("inventory:")
    ) {
      this.v3Gateway.server.to(channel).emit(finalEvent, finalData);
    } else {
      this.v2Gateway.server.to(channel).emit(finalEvent, finalData);
    }
  }
}
