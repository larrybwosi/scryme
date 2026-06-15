import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";
import * as crypto from "crypto";
import {
  CreateSetupKeyDto,
  ActivateDeviceDto,
  LinkOrganizationDto,
} from "../../application/dto/standalone-pos.dto";

@Injectable()
export class StandalonePosService {
  constructor(private readonly prisma: PrismaService) {}

  async createSetupKey(dto: CreateSetupKeyDto) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays || 7));

    return this.prisma.client.standaloneSetupKey.create({
      data: {
        name: dto.name,
        deviceId: dto.deviceId,
        token,
        expiresAt,
      },
    });
  }

  async activateDevice(dto: ActivateDeviceDto) {
    const setupKey = await this.prisma.client.standaloneSetupKey.findUnique({
      where: {token: dto.token},
    });

    if (!setupKey) {
      throw new UnauthorizedException("Invalid setup token");
    }

    if (setupKey.usedAt) {
      throw new ForbiddenException("Setup token has already been used");
    }

    if (setupKey.expiresAt < new Date()) {
      throw new ForbiddenException("Setup token has expired");
    }

    // Check if machineId is already registered
    let device = await this.prisma.client.standaloneDevice.findUnique({
      where: {machineId: dto.machineId},
    });

    if (device) {
      throw new ConflictException("Device already registered");
    }

    // Create device
    device = await this.prisma.client.standaloneDevice.create({
      data: {
        name: setupKey.name,
        assignedId: setupKey.deviceId,
        machineId: dto.machineId,
        fingerprint: dto.fingerprint,
        serialNumber: dto.serialNumber,
        status: "ACTIVE",
      },
    });

    // Create long-lived key
    const rawKey = crypto.randomBytes(16).toString("hex");
    const keyExpiresAt = new Date();
    keyExpiresAt.setFullYear(keyExpiresAt.getFullYear() + 1);

    const deviceKey = await this.prisma.client.standaloneDeviceKey.create({
      data: {
        key: rawKey,
        deviceId: device.id,
        expiresAt: keyExpiresAt,
      },
    });

    // Mark token as used
    await this.prisma.client.standaloneSetupKey.update({
      where: {id: setupKey.id},
      data: {usedAt: new Date()},
    });

    return {
      device,
      key: deviceKey.key,
      expiresAt: deviceKey.expiresAt,
    };
  }

  async validateKey(key: string) {
    const deviceKey = await this.prisma.client.standaloneDeviceKey.findUnique({
      where: {key},
      include: {device: true},
    });

    if (!deviceKey || !deviceKey.isActive) {
      throw new UnauthorizedException("Invalid or inactive key");
    }

    if (deviceKey.expiresAt < new Date()) {
      throw new UnauthorizedException("Key has expired");
    }

    return {
      valid: true,
      device: deviceKey.device,
      expiresAt: deviceKey.expiresAt,
    };
  }

  async linkOrganization(dto: LinkOrganizationDto) {
    const device = await this.prisma.client.standaloneDevice.findUnique({
      where: {id: dto.deviceId},
    });

    if (!device) {
      throw new NotFoundException("Device not found");
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: {id: dto.organizationId},
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return this.prisma.client.standaloneDevice.update({
      where: {id: dto.deviceId},
      data: {organizationId: dto.organizationId},
    });
  }
}
