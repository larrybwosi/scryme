import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

const RETENTION_DAYS = 30;

@Injectable()
export class CustomermatesRetentionService {
  private readonly logger = new Logger(CustomermatesRetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async cleanup() {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.prisma.client.integrationEvent.updateMany({
      where: {
        organizationIntegration: {
          integrationDefinition: { slug: "customermates" },
        },
        receivedAt: { lt: cutoff },
      },
      data: { payload: {} },
    });
    this.logger.log(`Cleared ${result.count} Customermates webhook payloads older than ${RETENTION_DAYS} days`);
    return { cleared: result.count };
  }
}
