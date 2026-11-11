import { Injectable } from "@nestjs/common";
import { V3RealtimeGateway } from "../../v3/common/realtime/v3-realtime.gateway";
import { RealtimeRedisService } from "../../v3/common/realtime/realtime-redis.service";
import { createDelta } from "@repo/shared/realtime";

@Injectable()
export class ApiRealtimeService {
  constructor(
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

    if (this.v3Gateway?.server) {
      this.v3Gateway.server.to(channel).emit(finalEvent, finalData);
    }
  }
}
