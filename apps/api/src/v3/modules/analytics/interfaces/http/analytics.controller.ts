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

    /**
     * OPTIMIZATION (Bolt ⚡): Parallelized database queries via Promise.all and pre-grouped
     * completed logs using an in-memory Map. This collapses 4 sequential database queries
     * into a single parallelized roundtrip, and optimizes the loop's nested search
     * complexity from O(N * M) down to O(N + M) constant-time lookups.
     */
    const [totalCheckedInNow, logs, locations, completedLogs] = await Promise.all([
      // 1. totalCheckedInNow
      this.prisma.client.member.count({
        where: { organizationId, isCheckedIn: true, deletedAt: null },
      }),

      // 2. peakHours (based on the last 1000 logs)
      this.prisma.client.attendanceLog.findMany({
        where: { organizationId },
        select: { checkInTime: true },
        take: 1000,
      }),

      // 3. branchStats: locations
      this.prisma.client.inventoryLocation.findMany({
        where: { organizationId, isActive: true },
        include: {
          checkInAttendanceLogs: {
            where: { checkOutTime: null },
            select: { id: true },
          },
        },
      }),

      // 4. branchStats: completedLogs
      this.prisma.client.attendanceLog.findMany({
        where: { organizationId, NOT: { checkOutTime: null } },
        select: { checkInLocationId: true, durationMinutes: true },
        take: 500,
      }),
    ]);

    const hourCounts: { [hour: number]: number } = {};
    for (const log of logs) {
      const hr = new Date(log.checkInTime).getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    }
    const peakHours = Object.keys(hourCounts)
      .map((hr) => ({
        hour: parseInt(hr),
        count: hourCounts[hr],
      }))
      .sort((a, b) => b.count - a.count);

    // Pre-group completedLogs by checkInLocationId for O(1) lookup
    const completedLogsByLocation = new Map<string, typeof completedLogs>();
    for (const log of completedLogs) {
      if (log.checkInLocationId) {
        let list = completedLogsByLocation.get(log.checkInLocationId);
        if (!list) {
          list = [];
          completedLogsByLocation.set(log.checkInLocationId, list);
        }
        list.push(log);
      }
    }

    const branchStats = locations.map((loc) => {
      const activePresenceCount = loc.checkInAttendanceLogs.length;
      const locCompletedLogs = completedLogsByLocation.get(loc.id) || [];
      const totalDuration = locCompletedLogs.reduce(
        (sum, log) => sum + (log.durationMinutes || 0),
        0,
      );
      const averageDurationMinutes =
        locCompletedLogs.length > 0 ? totalDuration / locCompletedLogs.length : 0.0;
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
