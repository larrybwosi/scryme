import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { type V2ApiContext, provisionDeviceV2 } from '@repo/shared/server';
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

    try {
      return await provisionDeviceV2(this.prisma, data.setupToken, {
        ipAddress: ctx.ipAddress,
        serialNumber: data.serialNumber,
        macAddress: data.macAddress,
      });
    } catch (err) {
      throw new UnauthorizedException(err instanceof Error ? err.message : 'Provisioning failed');
    }
  }
}
