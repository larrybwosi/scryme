import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { AttendanceUseCase } from "../../application/use-cases/attendance.use-case";
import {
  CheckInDto,
  CheckOutDto,
  AttendanceQueryDto,
} from "../../application/dto/attendance.dto";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";

@ApiTags("V3 Member Attendance")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/members/attendance")
export class AttendanceController {
  constructor(private readonly attendanceUseCase: AttendanceUseCase) {}

  @Get("logs")
  @Permissions("attendance:read")
  @ApiOperation({ summary: "List attendance logs" })
  async getLogs(@Request() req: any, @Query() query: AttendanceQueryDto) {
    return this.attendanceUseCase.getAttendanceLogs(
      req.v3Context.organizationId,
      query,
    );
  }

  @Post("check-in")
  @Permissions("attendance:write")
  @ApiOperation({ summary: "Check-in the current member" })
  async checkIn(@Request() req: any, @Body() dto: CheckInDto) {
    const memberId = req.v3Context.memberId;
    if (!memberId) throw new Error("Member context required for check-in");
    return this.attendanceUseCase.checkIn(
      req.v3Context.organizationId,
      memberId,
      dto,
    );
  }

  @Post("check-out")
  @Permissions("attendance:write")
  @ApiOperation({ summary: "Check-out the current member" })
  async checkOut(@Request() req: any, @Body() dto: CheckOutDto) {
    const memberId = req.v3Context.memberId;
    if (!memberId) throw new Error("Member context required for check-out");
    return this.attendanceUseCase.checkOut(
      req.v3Context.organizationId,
      memberId,
      dto,
    );
  }

  @Get(":memberId/status")
  @Permissions("attendance:read")
  @ApiOperation({ summary: "Get status of a specific member" })
  async getStatus(@Request() req: any, @Param("memberId") memberId: string) {
    return this.attendanceUseCase.getMemberStatus(
      req.v3Context.organizationId,
      memberId,
    );
  }
}
