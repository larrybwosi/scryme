import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import type { V2ApiContext } from "@repo/shared/api/v2/types/context";

const CACHE_TTL = 600;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private resolveUserId(ctx: V2ApiContext, id: string): string | null {
    if (id === "me") return ctx.userId || null;
    return id;
  }

  async getProfile(ctx: V2ApiContext, id: string) {
    const userId = this.resolveUserId(ctx, id);
    if (!userId) throw new ForbiddenException();

    const cacheKey = `v2:user:profile:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    try {
      // Stubbing for now
      const result = {
        id: userId,
        name: "User",
        email: null,
        erpCustomerId: null,
        transactions: [],
      };

      await this.redis.setex(cacheKey, CACHE_TTL, result);
      return result;
    } catch (error) {
      throw new InternalServerErrorException("Failed to fetch profile");
    }
  }

  async updateProfile(ctx: V2ApiContext, id: string, body: any) {
    const userId = this.resolveUserId(ctx, id);
    if (!userId) throw new ForbiddenException();

    return { id: userId, ...body };
  }

  async sync(ctx: V2ApiContext, id: string) {
    return { success: true };
  }

  async getCart(ctx: V2ApiContext, id: string) {
    return { items: [] };
  }

  async addToCart(ctx: V2ApiContext, id: string, body: any) {
    return { success: true };
  }

  async removeFromCart(
    ctx: V2ApiContext,
    id: string,
    productId: string,
    removeEntirely: boolean,
  ) {
    return { success: true };
  }

  async getTransactions(ctx: V2ApiContext, id: string, query: any) {
    return [];
  }

  async getMembers(ctx: V2ApiContext) {
    return [];
  }

  async getMember(ctx: V2ApiContext, id: string) {
    return null;
  }

  async createMember(ctx: V2ApiContext, data: any) {
    return { id: "stub" };
  }

  async updateMember(ctx: V2ApiContext, id: string, data: any) {
    return { id };
  }

  async deleteMember(ctx: V2ApiContext, id: string) {
    return { success: true };
  }

  async unbanMember(ctx: V2ApiContext, id: string) {
    return { success: true };
  }

  async changeMemberPin(ctx: V2ApiContext, id: string, data: any) {
    return { success: true };
  }
}
