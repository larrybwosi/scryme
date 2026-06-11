import { Injectable, UnauthorizedException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as crypto from 'crypto';
import { CreateSetupKeyDto, ActivateDeviceDto, LinkOrganizationDto } from '../../application/dto/standalone-pos.dto';

@Injectable()
export class StandalonePosService {
  constructor(private readonly prisma: PrismaService) {}

  async createSetupKey(dto: CreateSetupKeyDto) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Securely hash the token before storage to prevent plaintext exposure
    // We use SHA-256 for simple lookup on the @unique token field
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays || 7));

    const result = await this.prisma.client.standaloneSetupKey.create({
      data: {
        name: dto.name,
        deviceId: dto.deviceId,
        token: tokenHash,
        expiresAt,
      },
    });

    return { ...result, token: rawToken };
  }

  async activateDevice(dto: ActivateDeviceDto) {
    // Hash the input token to match the stored secure hash
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const setupKey = await this.prisma.client.standaloneSetupKey.findUnique({
      where: { token: tokenHash },
    });

    if (!setupKey) {
      throw new UnauthorizedException('Invalid setup token');
    }

    if (setupKey.usedAt) {
      throw new ForbiddenException('Setup token has already been used');
    }

    if (setupKey.expiresAt < new Date()) {
      throw new ForbiddenException('Setup token has expired');
    }

    // Check if machineId is already registered
    let device = await this.prisma.client.standaloneDevice.findUnique({
      where: { machineId: dto.machineId },
    });

    if (device) {
      throw new ConflictException('Device already registered');
    }

    // Create device
    device = await this.prisma.client.standaloneDevice.create({
      data: {
        name: setupKey.name,
        assignedId: setupKey.deviceId,
        machineId: dto.machineId,
        fingerprint: dto.fingerprint,
        serialNumber: dto.serialNumber,
        status: 'ACTIVE',
      },
    });

    // Create long-lived key
    const rawKey = crypto.randomBytes(16).toString('hex');
    // Securely hash the device key before storage
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyExpiresAt = new Date();
    keyExpiresAt.setFullYear(keyExpiresAt.getFullYear() + 1);

    const deviceKey = await this.prisma.client.standaloneDeviceKey.create({
      data: {
        key: keyHash,
        deviceId: device.id,
        expiresAt: keyExpiresAt,
      },
    });

    // Mark token as used
    await this.prisma.client.standaloneSetupKey.update({
      where: { id: setupKey.id },
      data: { usedAt: new Date() },
    });

    return {
      device,
      ...deviceKey,
      key: rawKey, // Return raw key for the user to store
    };
  }

  async validateKey(key: string) {
    // Hash the input key to match the stored secure hash
    // We use SHA-256 to allow direct @unique lookup without schema changes (prefix fields)
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const deviceKey = await this.prisma.client.standaloneDeviceKey.findUnique({
      where: { key: keyHash },
      include: { device: true },
    });

    if (!deviceKey || !deviceKey.isActive) {
      throw new UnauthorizedException('Invalid or inactive key');
    }

    if (deviceKey.expiresAt < new Date()) {
      throw new UnauthorizedException('Key has expired');
    }

    return {
      valid: true,
      device: deviceKey.device,
      expiresAt: deviceKey.expiresAt,
    };
  }

  async linkOrganization(dto: LinkOrganizationDto) {
    const device = await this.prisma.client.standaloneDevice.findUnique({
      where: { id: dto.deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.client.standaloneDevice.update({
      where: { id: dto.deviceId },
      data: { organizationId: dto.organizationId },
    });
  }
}
