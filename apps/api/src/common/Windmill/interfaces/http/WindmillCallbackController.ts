import {
  Controller,
  Post,
  Body,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrismaService } from "@/prisma/prisma.service";
import type { WindmillCallbackPayload } from "@repo/windmill/server";

@ApiTags("V3 Windmill Webhooks")
@Controller("windmill")
export class WindmillCallbackController {
  private readonly logger = new Logger(WindmillCallbackController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post("callbacks")
  @ApiOperation({ summary: "Handle status callbacks from Windmill" })
  @ApiResponse({ status: 200, description: "Callback processed successfully" })
  async handleCallback(@Body() payload: WindmillCallbackPayload) {
    this.logger.log(
      `Received Windmill callback for job ${payload.jobId} (Org: ${payload.organizationId})`,
    );

    try {
      const execution = await this.prisma.client.windmillExecution.findUnique({
        where: { jobId: payload.jobId },
      });

      if (!execution) {
        throw new NotFoundException(
          `Execution for jobId ${payload.jobId} not found`,
        );
      }

      await this.prisma.client.windmillExecution.update({
        where: { jobId: payload.jobId },
        data: {
          status: payload.status as any,
          result: payload.result ?? undefined,
          error: payload.error ?? null,
          completedAt: new Date(payload.completedAt),
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error processing Windmill callback: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException("Failed to process callback");
    }
  }
}
