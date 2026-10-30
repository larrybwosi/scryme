import {
  Body,
  Controller,
  Delete,
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
import { ShiftsUseCase } from "../../application/use-cases/shifts.use-case";
import {
  CreateShiftDto,
  ProcessShiftTradeDto,
  RequestShiftTradeDto,
  ShiftBreakDto,
  UpdateShiftDto,
} from "../../dtos/scheduling.dto";

@ApiTags("V3 Enterprise Staff Shifts")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, PermissionsGuard)
@Controller([":orgSlug/shifts", "shifts"])
export class ShiftsController {
  constructor(private readonly shiftsUseCase: ShiftsUseCase) {}

  @Get()
  @Permissions("shifts:read")
  @ApiOperation({ summary: "Get staff shifts for organization" })
  async getStaffShifts(
    @v3Context() ctx: V3ApiContext,
    @Query("memberId") memberId?: string,
    @Query("locationId") locationId?: string,
  ) {
    return this.shiftsUseCase.getStaffShifts(ctx.organizationId, memberId, locationId);
  }

  @Post()
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Create a staff shift" })
  @ApiResponse({ status: 201, description: "Shift created successfully" })
  async createStaffShift(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateShiftDto,
  ) {
    return this.shiftsUseCase.createStaffShift(ctx.organizationId, dto);
  }

  @Patch(":shiftId")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Update staff shift details" })
  async updateStaffShift(
    @v3Context() ctx: V3ApiContext,
    @Param("shiftId") shiftId: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftsUseCase.updateStaffShift(ctx.organizationId, shiftId, dto);
  }

  @Delete(":shiftId")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Delete staff shift" })
  async deleteStaffShift(
    @v3Context() ctx: V3ApiContext,
    @Param("shiftId") shiftId: string,
  ) {
    return this.shiftsUseCase.deleteStaffShift(ctx.organizationId, shiftId);
  }

  @Post(":shiftId/breaks")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Add break to a staff shift" })
  async addStaffBreak(
    @v3Context() ctx: V3ApiContext,
    @Param("shiftId") shiftId: string,
    @Body() dto: ShiftBreakDto,
  ) {
    return this.shiftsUseCase.addStaffBreak(ctx.organizationId, shiftId, dto);
  }

  @Delete("breaks/:breakId")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Delete staff break" })
  async deleteStaffBreak(
    @v3Context() ctx: V3ApiContext,
    @Param("breakId") breakId: string,
  ) {
    return this.shiftsUseCase.deleteStaffBreak(ctx.organizationId, breakId);
  }

  @Get("trades")
  @Permissions("shifts:read")
  @ApiOperation({ summary: "Get shift trade requests" })
  async getShiftTrades(
    @v3Context() ctx: V3ApiContext,
    @Query("memberId") memberId?: string,
    @Query("status") status?: string,
  ) {
    return this.shiftsUseCase.getShiftTrades(ctx.organizationId, memberId, status);
  }

  @Post("trades")
  @Permissions("shifts:read")
  @ApiOperation({ summary: "Request a shift trade" })
  async requestShiftTrade(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: RequestShiftTradeDto,
  ) {
    if (!ctx.memberId) {
      throw new Error("Member ID required to request shift trade");
    }
    return this.shiftsUseCase.requestShiftTrade(ctx.organizationId, ctx.memberId, dto);
  }

  @Post("trades/:tradeId/process")
  @Permissions("shifts:manage")
  @ApiOperation({ summary: "Process (approve/reject/cancel) shift trade request" })
  async processShiftTrade(
    @v3Context() ctx: V3ApiContext,
    @Param("tradeId") tradeId: string,
    @Body() dto: ProcessShiftTradeDto,
  ) {
    return this.shiftsUseCase.processShiftTrade(
      ctx.organizationId,
      tradeId,
      ctx.memberId || null,
      dto,
    );
  }
}
