import { Injectable } from "@nestjs/common";
import { RedisService } from "../../redis/redis.service";
import { PresenceMember } from "@repo/shared/realtime/types";

@Injectable()
export class RealtimeRedisService {
  private readonly HISTORY_PREFIX = "realtime:history:";
  private readonly PRESENCE_PREFIX = "realtime:presence:";
  private readonly LAST_STATE_PREFIX = "realtime:last_state:";
  private readonly HISTORY_TTL = 300; // 5 minutes in seconds
  private readonly MAX_HISTORY_ITEMS = 100;

  constructor(private readonly redis: RedisService) {}

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  // History with atomic LPUSH/LTRIM
  async saveMessage(channel: string, event: string, data: any) {
    const key = `${this.HISTORY_PREFIX}${channel}`;
    const message = JSON.stringify({ event, data, timestamp: Date.now() });

    await this.redis.lpush(key, message);
    await this.redis.ltrim(key, 0, this.MAX_HISTORY_ITEMS - 1);
    await this.redis.expire(key, this.HISTORY_TTL);

    // Save last state for Delta calculation
    const stateKey = `${this.LAST_STATE_PREFIX}${channel}:${event}`;
    await this.redis.setex(stateKey, this.HISTORY_TTL, data);
  }

  async getHistory(channel: string): Promise<any[]> {
    const key = `${this.HISTORY_PREFIX}${channel}`;
    const rawHistory = await this.redis.lrange(key, 0, -1);
    return rawHistory.map(raw => JSON.parse(raw)).reverse();
  }

  async getLastState(channel: string, event: string): Promise<any | null> {
    const stateKey = `${this.LAST_STATE_PREFIX}${channel}:${event}`;
    return await this.redis.get(stateKey);
  }

  // Presence with HSET/HDEL
  async enterPresence(channel: string, clientId: string, data: any = {}) {
    const key = `${this.PRESENCE_PREFIX}${channel}`;
    const member: PresenceMember = {
      clientId,
      timestamp: Date.now(),
      data,
    };

    await this.redis.hset(key, clientId, member);
    await this.redis.expire(key, 3600);
  }

  async leavePresence(channel: string, clientId: string) {
    const key = `${this.PRESENCE_PREFIX}${channel}`;
    await this.redis.hdel(key, clientId);
  }

  async getPresence(channel: string): Promise<PresenceMember[]> {
    const key = `${this.PRESENCE_PREFIX}${channel}`;
    const members = await this.redis.hgetall<PresenceMember>(key);

    if (Object.keys(members).length === 0) return [];

    const twoMinsAgo = Date.now() - 120 * 1000;
    const activeMembers: PresenceMember[] = [];
    const expiredClientIds: string[] = [];

    for (const [clientId, member] of Object.entries(members)) {
      if (member.timestamp > twoMinsAgo) {
        activeMembers.push(member);
      } else {
        expiredClientIds.push(clientId);
      }
    }

    // Cleanup expired members asynchronously to keep the read fast
    if (expiredClientIds.length > 0) {
      this.redis.hdel(key, ...expiredClientIds).catch(err => {
        console.error(
          `Failed to cleanup expired presence members for ${channel}:`,
          err,
        );
      });
    }

    return activeMembers;
  }
}
