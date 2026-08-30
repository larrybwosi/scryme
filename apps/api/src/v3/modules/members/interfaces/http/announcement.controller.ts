import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { emitEvent } from "@repo/shared/server";
import { IsString, IsOptional } from "class-validator";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeChatApiClient } from "@repo/chat";

export class AnnouncementDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetBranchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  severity?: string;
}

@ApiTags("V3 Announcements")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/announcements")
@ApiParam({ name: "orgSlug", type: "string" })
export class AnnouncementController {
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @Permissions("announcements:write")
  @ApiOperation({ summary: "Broadcast an announcement" })
  async broadcastAnnouncement(@Request() req: any, @Body() dto: AnnouncementDto) {
    const organizationId = req.v3Context.organizationId;
    await emitEvent(organizationId, "announcement.broadcast", {
      title: dto.title,
      message: dto.message,
      targetBranchId: dto.targetBranchId,
      severity: dto.severity || "INFO",
      broadcastBy: req.v3Context.memberId,
    });

    try {
      const config = await this.prisma.client.scrymeConfiguration.findUnique({
        where: { organizationId },
      });
      if (config && config.isActive && config.workspaceSlug) {
        const severityTag = dto.severity ? `[${dto.severity.toUpperCase()}] ` : "";
        const formattedMessage = `📢 **${dto.title}** ${severityTag}\n\n${dto.message}`;
        await this.scrymeClient.sendMessage(config.workspaceSlug, "announcements", {
          content: formattedMessage,
        });
      }
    } catch (err: any) {
      // Swallowed so announcement completion isn't blocked if chat workspace is inactive
    }

    return null;
  }
}
