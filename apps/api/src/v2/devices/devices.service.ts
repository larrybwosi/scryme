import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { type V2ApiContext, provisionDeviceV2 } from "@repo/shared/server";
import { z } from "zod";

const ProvisionSchema = z.object({
  setupToken: z.string().min(3),
  serialNumber: z.string().max(120).optional().nullable(),
  macAddress: z.string().optional().nullable(),
});

// Errors thrown by provisionDeviceV2 that are the caller's fault
const AUTH_ERRORS = [
  "Invalid setup token",
  "Setup token has been revoked",
  "Setup token has already been used",
  "Setup token has expired",
] as const;

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async provision(ctx: V2ApiContext, body: unknown) {
    const parsed = ProvisionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const { setupToken, serialNumber, macAddress } = parsed.data;

    try {
      return await provisionDeviceV2(this.prisma.client, setupToken, {
        ipAddress: ctx.ipAddress,
        serialNumber: serialNumber ?? undefined,
        macAddress: macAddress ?? undefined,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Provisioning failed";

      if (AUTH_ERRORS.some(e => message.includes(e))) {
        throw new UnauthorizedException(message);
      }

      this.logger.error("Unexpected provisioning error", err);
      throw new InternalServerErrorException("Provisioning failed");
    }
  }
}
