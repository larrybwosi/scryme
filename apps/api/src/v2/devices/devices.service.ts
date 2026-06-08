import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { V2ApiContext } from '@repo/shared/server';
import { z } from 'zod';

const ProvisionSchema = z.object({
  setupToken: z.string().min(10),
  serialNumber: z.string().max(120).optional(),
  macAddress: z.string().regex(/^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/).optional(),
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

    // Redeem token - uses unified shared logic
    const { redeemProvisioningToken } = await import('@repo/shared/server');
    const result = await redeemProvisioningToken(data.setupToken, this.prisma.client);

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
      device: result.device,
      organization: result.organization,
      createdAt: result.createdAt,
    };
  }
}
