import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { env } from "@repo/env";
import * as bcrypt from "bcryptjs";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { provisionDeviceV3 } from "@repo/shared/lib";
import { RedisService } from "@/redis/redis.service";
import { validateV3ApiSecret } from "@repo/shared/actions";

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

  async validateClient(clientId: string, clientSecret?: string) {
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId },
      include: { organization: true },
    });

    if (!client || !client.isActive) {
      throw new UnauthorizedException("Invalid client credentials");
    }

    if (clientSecret) {
      let isSecretValid = false;
      try {
        isSecretValid = await validateV3ApiSecret(clientId, clientSecret);
      } catch {
        isSecretValid = false;
      }

      if (!isSecretValid) {
        throw new UnauthorizedException("Invalid client credentials");
      }
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
      where: {
        OR: [
          { v3ApiClientId: clientId },
          { apiKeyId: clientId },
        ],
      },
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

  private async verifyHash(
    hash: string | null | undefined,
    secret: string,
  ): Promise<boolean> {
    if (!hash || !secret) return false;
    try {
      if (hash.startsWith("$argon2")) {
        return await argon2.verify(hash, secret);
      }
      return await bcrypt.compare(secret, hash);
    } catch {
      return false;
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
    const accessToken = await this.generateToken(client, member);
    const memberUser = (member as any).user;
    return {
      token: accessToken,
      accessToken,
      member: {
        id: member.id,
        name: memberUser?.name || (member as any).name || "Staff Member",
        role: member.role,
        cardId: member.cardId,
      },
    };
  }

  private async validateLoginClient(clientId: string) {
    const parsedClientId = clientId.includes(".") ? clientId.split(".")[0] : clientId;
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId: parsedClientId },
      include: { organization: true },
    });
    if (!client || !client.isActive) throw new UnauthorizedException("Invalid client credentials");
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

    // Optimization: If cardId is provided, use lookup
    if (cardId) {
      const cleanCardId = cardId.trim();
      let member = await this.prisma.client.member.findUnique({
        where: { organizationId_cardId: { organizationId, cardId: cleanCardId } },
        include: { user: true },
      });

      if (!member && typeof this.prisma.client.member.findFirst === "function") {
        member = await this.prisma.client.member.findFirst({
          where: {
            organizationId,
            cardId: { equals: cleanCardId, mode: "insensitive" },
          },
          include: { user: true },
        });
      }

      // SECURITY (Sentinel): Mitigate timing attacks and cardId/member enumeration side-channels by always
      // performing a cryptographically heavy check on a valid dummy PIN hash if member or pinHash is missing.
      const dummyPinHash = "$2b$10$vI8tYnK6YKMH3O84S4eXQuKBLN3F3k4pXFmF0a.a2H88tM8vO6PzO";
      const pinHashToCompare = member?.pinHash || dummyPinHash;
      let isPinValid = await this.verifyHash(pinHashToCompare, pin);
      if (!isPinValid && member?.user?.password) {
        isPinValid = await this.verifyHash(member.user.password, pin);
      }

      if (
        member &&
        member.isActive &&
        isPinValid
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
          deletedAt: null,
        },
        include: { user: true },
        take: MAX_MEMBERS_TO_CHECK + 1,
      });

      if (members.length > MAX_MEMBERS_TO_CHECK) {
        throw new UnauthorizedException("Invalid credentials");
      }

      let checkedCount = 0;
      for (const member of members) {
        let isPinValid = await this.verifyHash(member.pinHash, pin);
        if (!isPinValid && member.user?.password) {
          isPinValid = await this.verifyHash(member.user.password, pin);
        }

        if (isPinValid) {
          await this.redis.del(rateLimitKey);
          return member;
        }
        checkedCount++;
      }
    }

    // Track failed attempts
    const newCount = await this.redis.incr(rateLimitKey);
    const validCount = typeof newCount === "number" && !isNaN(newCount) ? newCount : 1;
    if (validCount === 1) {
      await this.redis.expire(rateLimitKey, LOCKOUT_DURATION_SECONDS);
    }

    throw new UnauthorizedException(
      `Invalid credentials. ${Math.max(0, MAX_PIN_ATTEMPTS - validCount)} attempts remaining.`,
    );
  }

  private async handleMemberCheckIn(client: any, member: any) {
    const registry = await this.prisma.client.deviceRegistry.findFirst({
      where: {
        OR: [
          { v3ApiClientId: client.id },
          { apiKeyId: client.id },
        ],
      },
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
