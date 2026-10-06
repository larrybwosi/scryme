import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { StandardResponseInterceptor } from "../../../../common/interceptors/standard-response.interceptor";
import { AndroidShiftsUseCase } from "../../application/use-cases/android-shifts.use-case";
import {
  AndroidCreateShiftDto,
  AndroidShiftBreakDto,
  AndroidRequestShiftTradeDto,
  AndroidProcessShiftTradeDto,
  AndroidCreateTaskDto,
  AndroidUpdateTaskDto,
} from "../../application/dto/android-auth.dto";

@ApiTags("V3 Android Shifts")
@Controller("v3/android/shifts")
@UseGuards(V3AuthGuard)
@UseInterceptors(StandardResponseInterceptor)
@ApiBearerAuth()
@ApiHeader({ name: "x-org-slug", required: false })
export class AndroidShiftsController {
  constructor(private readonly androidShiftsUseCase: AndroidShiftsUseCase) {}

  @Get("me")
  @ApiOperation({ summary: "Get current member's assigned staff shifts for Android" })
  @ApiResponse({ status: 200, description: "Current member shifts retrieved" })
  async getCurrentMemberShifts(@Req() req: any) {
    return this.androidShiftsUseCase.getCurrentMemberShifts(req.v3Context);
  }

  @Get()
  @ApiOperation({ summary: "Get organization staff shifts for Android" })
  @ApiQuery({ name: "memberId", required: false })
  @ApiQuery({ name: "locationId", required: false })
  @ApiResponse({ status: 200, description: "Organization shifts retrieved" })
  async getOrganizationShifts(
    @Req() req: any,
    @Query("memberId") memberId?: string,
    @Query("locationId") locationId?: string,
  ) {
    return this.androidShiftsUseCase.getOrganizationShifts(req.v3Context, memberId, locationId);
  }

  @Post("staff/:memberId/shifts")
  @ApiOperation({ summary: "Create shift for staff member on Android" })
  @ApiResponse({ status: 201, description: "Staff shift created successfully" })
  async createStaffShift(
    @Req() req: any,
    @Param("memberId") memberId: string,
    @Body() dto: AndroidCreateShiftDto,
  ) {
    return this.androidShiftsUseCase.createStaffShift(req.v3Context, memberId, dto);
  }

  @Post(":shiftId/breaks")
  @ApiOperation({ summary: "Add break to a staff shift on Android" })
  @ApiResponse({ status: 201, description: "Shift break added" })
  async addShiftBreak(
    @Req() req: any,
    @Param("shiftId") shiftId: string,
    @Body() dto: AndroidShiftBreakDto,
  ) {
    return this.androidShiftsUseCase.addShiftBreak(req.v3Context, shiftId, dto);
  }

  @Get("trades")
  @ApiOperation({ summary: "Get shift trade requests for Android" })
  @ApiQuery({ name: "memberId", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiResponse({ status: 200, description: "Shift trades retrieved" })
  async getShiftTrades(
    @Req() req: any,
    @Query("memberId") memberId?: string,
    @Query("status") status?: string,
  ) {
    return this.androidShiftsUseCase.getShiftTrades(req.v3Context, memberId, status);
  }

  @Post("trades")
  @ApiOperation({ summary: "Request shift trade on Android" })
  @ApiResponse({ status: 201, description: "Shift trade requested" })
  async requestShiftTrade(@Req() req: any, @Body() dto: AndroidRequestShiftTradeDto) {
    return this.androidShiftsUseCase.requestShiftTrade(req.v3Context, dto);
  }

  @Post("trades/:id/process")
  @ApiOperation({ summary: "Process (accept/reject/cancel) shift trade request on Android" })
  @ApiResponse({ status: 200, description: "Shift trade processed" })
  async processShiftTrade(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AndroidProcessShiftTradeDto,
  ) {
    return this.androidShiftsUseCase.processShiftTrade(req.v3Context, id, dto);
  }

  @Get("tasks")
  @ApiOperation({ summary: "Get staff tasks for Android" })
  @ApiQuery({ name: "memberId", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiResponse({ status: 200, description: "Staff tasks retrieved" })
  async getStaffTasks(
    @Req() req: any,
    @Query("memberId") memberId?: string,
    @Query("status") status?: string,
  ) {
    return this.androidShiftsUseCase.getStaffTasks(req.v3Context, memberId, status);
  }

  @Post("tasks")
  @ApiOperation({ summary: "Create staff task on Android" })
  @ApiResponse({ status: 201, description: "Staff task created" })
  async createStaffTask(@Req() req: any, @Body() dto: AndroidCreateTaskDto) {
    return this.androidShiftsUseCase.createStaffTask(req.v3Context, dto);
  }

  @Patch("tasks/:id")
  @ApiOperation({ summary: "Update staff task on Android" })
  @ApiResponse({ status: 200, description: "Staff task updated" })
  async updateStaffTask(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AndroidUpdateTaskDto,
  ) {
    return this.androidShiftsUseCase.updateStaffTask(req.v3Context, id, dto);
  }
}
