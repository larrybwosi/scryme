import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { decrypt, encrypt, timingSafeMatch } from '@repo/shared/server';

@Injectable()
export class V3AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionDevice(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const setupToken = await this.prisma.client.deviceSetupToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: true,
      },
    });

    if (!setupToken) throw new UnauthorizedException('Invalid or expired setup token');

    const clientId = `pos_${crypto.randomBytes(8).toString('hex')}`;
    const rawSecret = crypto.randomBytes(32).toString('hex');

    // Hash the secret with Argon2
    const hashedSecret = await argon2.hash(rawSecret);

    // Encrypt the hash for storage
    const encryptedHash = encrypt(hashedSecret);

    const client = await this.prisma.client.v3ApiClient.create({
      data: {
        name: setupToken.deviceName,
        clientId,
        clientSecret: encryptedHash,
        organizationId: setupToken.organizationId,
        scopes: setupToken.permissions,
      },
    });

    // For Bakery app, we also need to generate a V2 API Key for now
    let v2ApiKey: string | undefined;
    let v2ApiKeyId: string | undefined;

    if (setupToken.deviceType === 'BAKERY_TERMINAL') {
      const { redeemDeviceSetupToken } = await import('../../../../../lib/api/v2/services/device-setup-tokens');
      const v2Result = await redeemDeviceSetupToken(this.prisma, token);
      v2ApiKey = v2Result.apiKey;
      v2ApiKeyId = v2Result.apiKeyId;
    } else {
      await this.prisma.client.deviceRegistry.create({
        data: {
          organizationId: setupToken.organizationId,
          apiKeyId: client.id,
          deviceName: setupToken.deviceName,
          deviceType: setupToken.deviceType,
          locationId: setupToken.locationId,
          status: 'ACTIVE',
        },
      });

      await this.prisma.client.deviceSetupToken.update({
        where: { id: setupToken.id },
        data: { usedAt: new Date(), redeemedApiKeyId: client.id },
      });
    }

    return {
      clientId,
      clientSecret: rawSecret,
      orgSlug: setupToken.organization.slug,
      apiKey: v2ApiKey,
    };
  }

  async validateClient(clientId: string, clientSecret: string) {
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId },
      include: { organization: true },
    });

    if (!client || !client.isActive) throw new UnauthorizedException('Invalid client');

    try {
      const decryptedValue = decrypt(client.clientSecret);

      // Try Argon2 first (new standard)
      try {
        if (await argon2.verify(decryptedValue, clientSecret)) {
          return client;
        }
      } catch (e) {}

      // Fallback 1: Encrypted raw secret (previous management standard)
      if (timingSafeMatch(clientSecret, decryptedValue)) {
        return client;
      }
    } catch (error) {
      // Fallback 2: Plain SHA-256 (broken transition period)
      const sha256Hash = crypto.createHash('sha256').update(clientSecret).digest('hex');
      if (timingSafeMatch(sha256Hash, client.clientSecret)) {
        return client;
      }

      // Fallback 3: Bcrypt (manual legacy entries)
      try {
        if (await bcrypt.compare(clientSecret, client.clientSecret)) {
          return client;
        }
      } catch (e) {}
    }

    throw new UnauthorizedException('Invalid client secret');

    return client;
  }

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');
    return secret;
  }

  async generateToken(client: any, member?: any) {
    const payload = this.prepareTokenPayload(client);

    if (member) {
      await this.enrichPayloadWithMember(payload, client.id, member.id);
    }

    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: member ? '12h' : '1h',
    });
  }

  private prepareTokenPayload(client: any) {
    return {
      sub: client.id,
      clientId: client.clientId,
      organizationId: client.organizationId,
      orgSlug: client.organization.slug,
      scopes: client.scopes,
      type: 'v3_client',
    } as any;
  }

  private async enrichPayloadWithMember(payload: any, clientId: string, memberId: string) {
    payload.memberId = memberId;
    payload.type = 'v3_hybrid';
    const registry = await this.prisma.client.deviceRegistry.findFirst({
      where: { apiKeyId: clientId },
    });
    if (registry) {
      payload.locationId = registry.locationId;
      payload.deviceId = registry.id;
    }
  }

  async loginMember(clientId: string, pin: string) {
    const client = await this.validateLoginClient(clientId);
    const member = await this.validateLoginMember(client.organizationId, pin);
    await this.handleMemberCheckIn(client, member);
    const accessToken = await this.generateToken(client, member);

    return {
      accessToken,
      member: {
        id: member.id,
        name: (member as any).user?.name || 'Staff',
        role: member.role,
      },
    };
  }

  private async validateLoginClient(clientId: string) {
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId },
      include: { organization: true },
    });
    if (!client) throw new UnauthorizedException('Invalid client');
    return client;
  }

  private async validateLoginMember(organizationId: string, pin: string) {
    const members = await this.prisma.client.member.findMany({
      where: {
        organizationId,
        isActive: true,
        pinHash: { not: null },
      },
    });

    for (const member of members) {
      if (member.pinHash && (await bcrypt.compare(pin, member.pinHash))) {
        return member;
      }
    }

    throw new UnauthorizedException('Invalid credentials');
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
      await this.recordCheckIn(client.organizationId, member.id, registry.locationId);
    }
  }

  private async recordCheckIn(organizationId: string, memberId: string, locationId: string) {
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
      data: { isCheckedIn: true, lastCheckInTime: new Date(), currentCheckInLocationId: locationId },
    });
  }

  async verifyToken(token: string) {
    try {
      return jwt.verify(token, this.getJwtSecret()) as any;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
