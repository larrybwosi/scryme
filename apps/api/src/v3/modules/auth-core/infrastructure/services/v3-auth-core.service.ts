import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { env } from "@repo/env";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { decrypt } from "@repo/shared/api/v2";
import { timingSafeMatch } from "@repo/shared/api/v2";
import { provisionDeviceV3 } from "@repo/shared/lib";
import { RedisService } from "@/redis/redis.service";

@Injectable()
export class V3AuthCoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async provisionDevice(token: string) {
    try {
      return await provisionDeviceV3(this.prisma, token);
    } catch (err) {
      throw new UnauthorizedException(
        err instanceof Error ? err.message : "Provisioning failed",
      );
    }
  }

  async validateClient(clientId: string, clientSecret: string) {
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId },
      include: { organization: true },
    });

    if (!client || !client.isActive)
      throw new UnauthorizedException("Invalid client");

    try {
      const decryptedSecret = decrypt(client.clientSecret);
      const isSecretValid = timingSafeMatch(clientSecret, decryptedSecret);
      if (!isSecretValid)
        throw new UnauthorizedException("Invalid client secret");
    } catch (error) {
      const isSecretValid = await bcrypt.compare(
        clientSecret,
        client.clientSecret,
      );
      if (!isSecretValid)
        throw new UnauthorizedException("Invalid client secret");
    }

    return client;
  }

  private getJwtSecret(): string {
    return env.JWT_SECRET;
  }

  async generateToken(client: any, member?: any) {
    const payload = this.prepareTokenPayload(client);

    if (member) {
      await this.enrichPayloadWithMember(payload, client.id, member.id);
    }

    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: member ? "12h" : "1h",
      algorithm: "HS256",
    });
  }

  private prepareTokenPayload(client: any) {
    return {
      sub: client.id,
      clientId: client.clientId,
      organizationId: client.organizationId,
      orgSlug: client.organization.slug,
      businessAccountId: client.businessAccountId,
      scopes: client.scopes,
      type: "v3_client",
    } as any;
  }

  private async enrichPayloadWithMember(
    payload: any,
    clientId: string,
    memberId: string,
  ) {
    payload.memberId = memberId;

    const member = await this.prisma.client.member.findUnique({
      where: { id: memberId },
      select: { userId: true },
    });
    if (member) {
      payload.userId = member.userId;
    }

    payload.type = "v3_hybrid";
    const registry = await this.prisma.client.deviceRegistry.findFirst({
      where: { apiKeyId: clientId },
    });
    if (registry) {
      payload.locationId = registry.locationId;
      payload.deviceId = registry.id;
    }
  }

  async verifyToken(token: string) {
    try {
      return jwt.verify(token, this.getJwtSecret(), {
        algorithms: ["HS256"],
      }) as any;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  async loginMember(clientId: string, pin: string, cardId?: string) {
    const client = await this.validateLoginClient(clientId);
    const member = await this.validateLoginMember(
      client.organizationId,
      pin,
      cardId,
      client.clientId,
    );
    await this.handleMemberCheckIn(client, member);
    return this.generateToken(client, member);
  }

  private async validateLoginClient(clientId: string) {
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId },
      include: { organization: true },
    });
    if (!client) throw new UnauthorizedException("Invalid client");
    return client;
  }

  private async validateLoginMember(
    organizationId: string,
    pin: string,
    cardId?: string,
    clientId?: string,
  ) {
    const MAX_PIN_ATTEMPTS = 3;
    const LOCKOUT_DURATION_SECONDS = 900; // 15 minutes

    const rateLimitKey = `v3_pin_attempts:${organizationId}:${clientId || "global"}`;
    const currentAttempts = (await this.redis.get<number>(rateLimitKey)) || 0;

    if (currentAttempts >= MAX_PIN_ATTEMPTS) {
      const ttl = await this.redis.ttl(rateLimitKey);
      const minutesLeft = Math.ceil(ttl / 60);
      throw new UnauthorizedException(
        `Account locked. Try again in ${minutesLeft} minutes.`,
      );
    }

    // Optimization: If cardId is provided, use O(1) lookup
    if (cardId) {
      const member = await this.prisma.client.member.findUnique({
        where: { organizationId_cardId: { organizationId, cardId } },
      });

      if (
        member &&
        member.isActive &&
        member.pinHash &&
        (await bcrypt.compare(pin, member.pinHash))
      ) {
        await this.redis.del(rateLimitKey);
        return member;
      }
    } else {
      // Security: Limit the number of members to check to prevent DoS via expensive bcrypt loops.
      // Organizations with > 100 members should use a more specific identifier for login.
      const MAX_MEMBERS_TO_CHECK = 100;

      const members = await this.prisma.client.member.findMany({
        where: {
          organizationId,
          isActive: true,
          pinHash: { not: null },
        },
        take: MAX_MEMBERS_TO_CHECK + 1,
      });

      let checkedCount = 0;
      for (const member of members) {
        if (checkedCount >= MAX_MEMBERS_TO_CHECK) {
          throw new UnauthorizedException("Invalid credentials");
        }

        if (member.pinHash && (await bcrypt.compare(pin, member.pinHash))) {
          await this.redis.del(rateLimitKey);
          return member;
        }
        checkedCount++;
      }
    }

    // Track failed attempts
    const newCount = await this.redis.incr(rateLimitKey);
    if (newCount === 1) {
      await this.redis.expire(rateLimitKey, LOCKOUT_DURATION_SECONDS);
    }

    throw new UnauthorizedException(
      `Invalid credentials. ${MAX_PIN_ATTEMPTS - newCount} attempts remaining.`,
    );
  }

  private async handleMemberCheckIn(client: any, member: any) {
    const registry = await this.prisma.client.deviceRegistry.findFirst({
      where: { apiKeyId: client.id },
    });
    if (!registry) return;

    const existingLog = await this.prisma.client.attendanceLog.findFirst({
      where: { memberId: member.id, checkOutTime: null },
    });

    if (!existingLog) {
      await this.recordCheckIn(
        client.organizationId,
        member.id,
        registry.locationId,
      );
    }
  }

  private async recordCheckIn(
    organizationId: string,
    memberId: string,
    locationId: string,
  ) {
    await this.prisma.client.attendanceLog.create({
      data: {
        memberId,
        organizationId,
        checkInTime: new Date(),
        checkInLocationId: locationId,
      },
    });
    await this.prisma.client.member.update({
      where: { id: memberId },
      data: {
        isCheckedIn: true,
        lastCheckInTime: new Date(),
        currentCheckInLocationId: locationId,
      },
    });
  }
}