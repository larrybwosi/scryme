import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { decrypt, timingSafeMatch } from '@repo/shared/server';

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
    });

    if (!setupToken) throw new UnauthorizedException('Invalid or expired setup token');

    const clientId = `pos_${crypto.randomBytes(8).toString('hex')}`;
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const hashedSecret = await bcrypt.hash(rawSecret, 10);

    const client = await this.prisma.client.v3ApiClient.create({
      data: {
        name: setupToken.deviceName,
        clientId,
        clientSecret: hashedSecret,
        organizationId: setupToken.organizationId,
        scopes: setupToken.permissions,
      },
    });

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

    return { clientId, clientSecret: rawSecret };
  }

  async validateClient(clientId: string, clientSecret: string) {
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId },
      include: { organization: true },
    });

    if (!client || !client.isActive) throw new UnauthorizedException('Invalid client');

    try {
      const decryptedSecret = decrypt(client.clientSecret);
      const isSecretValid = timingSafeMatch(clientSecret, decryptedSecret);
      if (!isSecretValid) throw new UnauthorizedException('Invalid client secret');
    } catch (error) {
      // Fallback to bcrypt if decryption fails (for transition period if any)
      const isSecretValid = await bcrypt.compare(clientSecret, client.clientSecret);
      if (!isSecretValid) throw new UnauthorizedException('Invalid client secret');
    }

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
