import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { v3Context } from "../../../../common/decorators/v3-context.decorator";
import type { V3ApiContext } from "@repo/shared/api/v3";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import { SchedulingUseCase } from "../../application/use-cases/scheduling.use-case";
import {
  BranchCoordinatesDto,
  CreateScheduledBookingDto,
  CreateScheduleOverrideDto,
  ManualAttendanceCheckInDto,
  ManualAttendanceCheckOutDto,
  TransitionBookingDto,
} from "../../dtos/scheduling.dto";

@ApiTags("V3 Enterprise Scheduling Workspace")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, PermissionsGuard)
@Controller([":orgSlug/scheduling", "scheduling"])
export class SchedulingController {
  constructor(private readonly schedulingUseCase: SchedulingUseCase) {}

  @Get("workspace")
  @Permissions("shifts:read")
  @ApiOperation({ summary: "Get scheduling workspace data for date range" })
  async getSchedulingWorkspace(
    @v3Context() ctx: V3ApiContext,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 86400000);
    return this.schedulingUseCase.getSchedulingWorkspace(ctx.organizationId, fromDate, toDate);
  }

  @Post("bookings")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Create scheduled service booking" })
  @ApiResponse({ status: 201, description: "Booking created successfully" })
  async createScheduledBooking(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateScheduledBookingDto,
  ) {
    return this.schedulingUseCase.createScheduledBooking(ctx.organizationId, ctx.memberId, dto);
  }

  @Patch("bookings/:bookingId/status")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Transition status of scheduled booking" })
  async transitionScheduledBooking(
    @v3Context() ctx: V3ApiContext,
    @Param("bookingId") bookingId: string,
    @Body() dto: TransitionBookingDto,
  ) {
    return this.schedulingUseCase.transitionScheduledBooking(ctx.organizationId, bookingId, dto);
  }

  @Post("overrides")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Create schedule override" })
  async createScheduleOverride(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateScheduleOverrideDto,
  ) {
    return this.schedulingUseCase.createScheduleOverride(ctx.organizationId, dto);
  }

  @Post("attendance/check-in")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Record manual attendance check-in override" })
  async recordManualAttendanceCheckIn(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: ManualAttendanceCheckInDto,
  ) {
    return this.schedulingUseCase.recordManualAttendanceCheckIn(ctx.organizationId, dto);
  }

  @Post("attendance/check-out")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Record manual attendance check-out override" })
  async recordManualAttendanceCheckOut(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: ManualAttendanceCheckOutDto,
  ) {
    return this.schedulingUseCase.recordManualAttendanceCheckOut(ctx.organizationId, dto);
  }

  @Patch("locations/:locationId/coordinates")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Update branch location GPS coordinates and geofence radius" })
  async updateBranchLocationCoordinates(
    @v3Context() ctx: V3ApiContext,
    @Param("locationId") locationId: string,
    @Body() dto: BranchCoordinatesDto,
  ) {
    return this.schedulingUseCase.updateBranchLocationCoordinates(
      ctx.organizationId,
      locationId,
      dto,
    );
  }
}
