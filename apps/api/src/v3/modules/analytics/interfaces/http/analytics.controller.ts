import {
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
  Request,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { ServiceAnalyticsService } from "../../../services/application/services/service-analytics.service";

@ApiTags("V3 Analytics")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/analytics")
@ApiParam({ name: "orgSlug", type: "string" })
export class AnalyticsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceAnalyticsService: ServiceAnalyticsService,
  ) {}

  @Get("dashboard")
  @Permissions("pos:location:read")
  @ApiOperation({ summary: "Get dashboard analytics" })
  async getDashboardAnalytics(@Request() req: any) {
    const organizationId = req.v3Context.organizationId;

    // 1. totalCheckedInNow
    const totalCheckedInNow = await this.prisma.client.member.count({
      where: { organizationId, isCheckedIn: true, deletedAt: null },
    });

    // 2. peakHours (based on the last 1000 logs)
    const logs = await this.prisma.client.attendanceLog.findMany({
      where: { organizationId },
      select: { checkInTime: true },
      take: 1000,
    });
    const hourCounts: { [hour: number]: number } = {};
    for (const log of logs) {
      const hr = new Date(log.checkInTime).getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    }
    const peakHours = Object.keys(hourCounts).map((hr) => ({
      hour: parseInt(hr),
      count: hourCounts[hr],
    })).sort((a, b) => b.count - a.count);

    // 3. branchStats
    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId, isActive: true },
      include: {
        checkInAttendanceLogs: {
          where: { checkOutTime: null },
          select: { id: true },
        },
      }
    });

    const completedLogs = await this.prisma.client.attendanceLog.findMany({
      where: { organizationId, NOT: { checkOutTime: null } },
      select: { checkInLocationId: true, durationMinutes: true },
      take: 500,
    });

    const branchStats = locations.map((loc) => {
      const activePresenceCount = loc.checkInAttendanceLogs.length;
      const locCompletedLogs = completedLogs.filter(l => l.checkInLocationId === loc.id);
      const totalDuration = locCompletedLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
      const averageDurationMinutes = locCompletedLogs.length > 0 ? (totalDuration / locCompletedLogs.length) : 0.0;
      return {
        locationId: loc.id,
        locationName: loc.name,
        activePresenceCount,
        averageDurationMinutes,
      };
    });

    return {
      totalCheckedInNow,
      peakHours,
      branchStats,
    };
  }

  @Get("utilization")
  @Permissions("pos:location:read")
  @ApiOperation({ summary: "Get resource utilization" })
  @ApiQuery({ name: "startDate", required: true, type: String })
  @ApiQuery({ name: "endDate", required: true, type: String })
  async getResourceUtilization(
    @Request() req: any,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    const organizationId = req.v3Context.organizationId;
    return this.serviceAnalyticsService.getResourceUtilization(
      organizationId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
