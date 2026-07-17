import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
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
    const rawToken = crypto.randomBytes(32).toString("hex");
    // SECURITY (Sentinel): Setup tokens are credentials. Hash them using SHA-256 to prevent compromise from database leaks.
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays || 7));

    const result = await this.prisma.client.standaloneSetupKey.create({
      data: {
        name: dto.name,
        deviceId: dto.deviceId,
        token: hashedToken,
        expiresAt,
      },
    });

    return {
      ...result,
      token: rawToken, // Return raw token to the client so it can be registered on the device
    };
  }

  async activateDevice(dto: ActivateDeviceDto) {
    // SECURITY (Sentinel): Setup tokens are hashed in the database.
    const hashedToken = crypto.createHash("sha256").update(dto.token).digest("hex");
    const setupKey = await this.prisma.client.standaloneSetupKey.findUnique({
      where: { token: hashedToken },
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
      where: { machineId: dto.machineId },
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
    // SECURITY (Sentinel): Device API keys are sensitive credentials. Hash them using SHA-256 to prevent expose on db compromise.
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyExpiresAt = new Date();
    keyExpiresAt.setFullYear(keyExpiresAt.getFullYear() + 1);

    const deviceKey = await this.prisma.client.standaloneDeviceKey.create({
      data: {
        key: hashedKey,
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
      key: rawKey, // Return raw key to the client
      expiresAt: deviceKey.expiresAt,
    };
  }

  async validateKey(key: string) {
    // SECURITY (Sentinel): Validate key by hashing it and looking up the hashed value.
    const hashedKey = crypto.createHash("sha256").update(key).digest("hex");
    const deviceKey = await this.prisma.client.standaloneDeviceKey.findUnique({
      where: { key: hashedKey },
      include: { device: true },
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
      where: { id: dto.deviceId },
    });

    if (!device) {
      throw new NotFoundException("Device not found");
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return this.prisma.client.standaloneDevice.update({
      where: { id: dto.deviceId },
      data: { organizationId: dto.organizationId },
    });
  }
}
