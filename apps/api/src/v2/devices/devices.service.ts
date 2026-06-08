import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { V2ApiContext } from '@repo/shared/server';
import { z } from 'zod';

const ProvisionSchema = z.object({
  setupToken: z.string().min(3),
  serialNumber: z.string().max(120).optional(),
  macAddress: z.string().optional(),
});

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async provision(ctx: V2ApiContext, body: any) {
    const parsed = ProvisionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    // Redeem token - uses shared logic
    const { redeemDeviceSetupToken } = await import('@/lib/api/v2/services/device-setup-tokens');
    const result = await redeemDeviceSetupToken(this.prisma, data.setupToken);

    // Persist optional hardware identifiers
    await this.prisma.client.deviceRegistry.update({
      where: { id: result.deviceRegistryId },
      data: {
        serialNumber: data.serialNumber,
        macAddress: data.macAddress,
        lastSeenAt: new Date(),
        lastSeenIp: ctx.ipAddress,
      },
      select: { id: true },
    });

    return {
      apiKey: result.apiKey,
      apiKeyId: result.apiKeyId,
      deviceRegistryId: result.deviceRegistryId,
      device: {
        deviceName: result.deviceName,
        deviceType: result.deviceType,
        locationId: result.locationId,
        permissions: result.permissions,
        environment: result.environment,
      },
      createdAt: result.createdAt,
    };
  }
}
