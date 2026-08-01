import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "@/v3/common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { ServiceManagementService } from "../../application/services/service-management.service";
import { BookingService } from "../../application/services/booking.service";
import { ServiceAnalyticsService } from "../../application/services/service-analytics.service";
import { StaffSchedulingService } from "../../application/services/staff-scheduling.service";
import {
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  CreateServiceResourceDto,
  UpdateServiceResourceDto,
  CreateBookingDto,
  CompleteBookingDto,
} from "../../application/dto/service.dto";
import { GetShiftsQueryDto } from "../../application/dto/shift.dto";
import { BookingStatus } from "@repo/db";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";

@ApiTags("V3 Services")
@ApiBearerAuth()
@Controller(":orgSlug/services")
@ApiParam({ name: "orgSlug", type: "string", description: "The unique organization slug" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class ServicesController {
  constructor(
    private readonly serviceManagement: ServiceManagementService,
    private readonly bookingService: BookingService,
    private readonly analyticsService: ServiceAnalyticsService,
    private readonly staffScheduling: StaffSchedulingService,
  ) {}

  @Post("categories")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Create a service category" })
  @ApiBody({ type: CreateServiceCategoryDto })
  @ApiResponse({ status: 201, description: "Service category successfully created" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid category input data" })
  async createCategory(@Req() req: any, @Body() dto: CreateServiceCategoryDto) {
    return this.serviceManagement.createCategory(req.organization.id, dto);
  }

  @Get("categories")
  @Permissions("services:read")
  @ApiOperation({ summary: "List service categories" })
  @ApiResponse({ status: 200, description: "Returns a list of all service categories for the organization" })
  async getCategories(@Req() req: any) {
    return this.serviceManagement.getCategories(req.organization.id);
  }

  @Patch("categories/:id")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Update a service category" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service category to update" })
  @ApiBody({ type: UpdateServiceCategoryDto })
  @ApiResponse({ status: 200, description: "Service category successfully updated" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service category not found" })
  async updateCategory(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateServiceCategoryDto
  ) {
    return this.serviceManagement.updateCategory(req.organization.id, id, dto);
  }

  @Post("categories/:id/delete")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Delete a service category" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service category to delete" })
  @ApiResponse({ status: 200, description: "Service category successfully deleted" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service category not found" })
  async deleteCategory(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteCategory(req.organization.id, id);
  }

  @Post()
  @Permissions("services:manage")
  @ApiOperation({ summary: "Create a new service" })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({ status: 201, description: "Service successfully created" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid service input data" })
  async createService(@Req() req: any, @Body() dto: CreateServiceDto) {
    return this.serviceManagement.createService(req.organization.id, dto);
  }

  @Get()
  @Permissions("services:read")
  @ApiOperation({ summary: "List services" })
  @ApiResponse({ status: 200, description: "Returns a list of all services for the organization" })
  async getServices(@Req() req: any) {
    return this.serviceManagement.getServices(req.organization.id);
  }

  @Get("shifts/me")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get current member's shifts" })
  @ApiResponse({ status: 200, description: "Successfully retrieved shifts of the currently logged-in member" })
  async getCurrentMemberShifts(@Req() req: any) {
    const memberId = req.v3Context?.memberId;
    if (!memberId) {
      throw new UnauthorizedException("No active member session found");
    }
    return this.staffScheduling.getStaffShifts(req.v3Context.organizationId, memberId);
  }

  @Get("shifts")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get all staff shifts for the organization (useful for connected apps)" })
  @ApiResponse({ status: 200, description: "Successfully retrieved list of staff shifts matching filters" })
  async getShifts(@Req() req: any, @Query() query: GetShiftsQueryDto) {
    return this.staffScheduling.getShifts(req.v3Context.organizationId, query);
  }

  @Get(":id")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get service details" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service to fetch" })
  @ApiResponse({ status: 200, description: "Returns details of the specified service" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service not found" })
  async getService(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.getServiceById(req.organization.id, id);
  }

  @Patch(":id")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Update a service" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service to update" })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({ status: 200, description: "Service successfully updated" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service not found" })
  async updateService(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto
  ) {
    return this.serviceManagement.updateService(req.organization.id, id, dto);
  }

  @Post(":id/delete")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Delete a service" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service to delete" })
  @ApiResponse({ status: 200, description: "Service successfully deleted" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service not found" })
  async deleteService(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteService(req.organization.id, id);
  }

  @Post("resources")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Create a service resource" })
  @ApiBody({ type: CreateServiceResourceDto })
  @ApiResponse({ status: 201, description: "Service resource successfully created" })
  async createResource(@Req() req: any, @Body() dto: CreateServiceResourceDto) {
    return this.serviceManagement.createResource(req.organization.id, dto);
  }

  @Patch("resources/:id")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Update a service resource" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service resource to update" })
  @ApiBody({ type: UpdateServiceResourceDto })
  @ApiResponse({ status: 200, description: "Service resource successfully updated" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service resource not found" })
  async updateResource(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateServiceResourceDto
  ) {
    return this.serviceManagement.updateResource(req.organization.id, id, dto);
  }

  @Post("resources/:id/delete")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Delete a service resource" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service resource to delete" })
  @ApiResponse({ status: 200, description: "Service resource successfully deleted" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service resource not found" })
  async deleteResource(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteResource(req.organization.id, id);
  }

  @Get("resources")
  @Permissions("services:read")
  @ApiOperation({ summary: "List service resources" })
  @ApiResponse({ status: 200, description: "Returns a list of all service resources for the organization" })
  async getResources(@Req() req: any) {
    return this.serviceManagement.getResources(req.organization.id);
  }

  @Post("bookings")
  @Permissions("services:write")
  @ApiOperation({ summary: "Create a service booking" })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: "Service booking successfully created" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Resource/staff conflict or invalid data" })
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(req.organization.id, dto);
  }

  @Get("bookings")
  @Permissions("services:read")
  @ApiOperation({ summary: "List bookings" })
  @ApiResponse({ status: 200, description: "Returns all service bookings for the organization" })
  async getBookings(@Req() req: any) {
    return this.bookingService.getBookings(req.organization.id);
  }

  @Get("bookings/:id")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get booking details" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the booking to fetch" })
  @ApiResponse({ status: 200, description: "Returns detailed information of the service booking" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Booking not found" })
  async getBooking(@Req() req: any, @Param("id") id: string) {
    return this.bookingService.getBookingById(req.organization.id, id);
  }

  @Patch("bookings/:id/status")
  @Permissions("services:write")
  @ApiOperation({ summary: "Update booking status" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the booking to update status for" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: Object.values(BookingStatus), example: "IN_PROGRESS" }
      },
      required: ["status"]
    }
  })
  @ApiResponse({ status: 200, description: "Booking status updated successfully" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Booking not found" })
  async updateBookingStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body("status") status: BookingStatus
  ) {
    return this.bookingService.updateBookingStatus(req.organization.id, id, status);
  }

  @Patch("bookings/:id/complete")
  @Permissions("services:write")
  @ApiOperation({ summary: "Complete a booking and consume materials" })
  @ApiParam({ name: "id", type: "string", description: "The ID of the booking to complete" })
  @ApiBody({ type: CompleteBookingDto })
  @ApiResponse({ status: 200, description: "Booking completed successfully and inventory stock deducted" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Booking not found" })
  async completeBooking(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: CompleteBookingDto
  ) {
    return this.bookingService.completeBooking(req.organization.id, id, req.user.id, dto);
  }

  @Post("staff/:memberId/shifts")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Create a staff shift" })
  @ApiParam({ name: "memberId", type: "string", description: "The ID of the member to assign shift to" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        dayOfWeek: { type: "integer", minimum: 0, maximum: 6, example: 1, description: "0 for Sunday, 6 for Saturday" },
        startTime: { type: "string", example: "09:00", description: "Shift start time in HH:mm" },
        endTime: { type: "string", example: "17:00", description: "Shift end time in HH:mm" }
      },
      required: ["dayOfWeek", "startTime", "endTime"]
    }
  })
  @ApiResponse({ status: 201, description: "Staff shift successfully created" })
  async createShift(
    @Req() req: any,
    @Param("memberId") memberId: string,
    @Body() dto: { dayOfWeek: number, startTime: string, endTime: string }
  ) {
    return this.staffScheduling.createShift(req.organization.id, memberId, dto);
  }

  @Get("staff/:memberId/shifts")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get staff shifts" })
  @ApiParam({ name: "memberId", type: "string", description: "The ID of the staff member" })
  @ApiResponse({ status: 200, description: "Returns all scheduled shifts for the staff member" })
  async getStaffShifts(@Req() req: any, @Param("memberId") memberId: string) {
    return this.staffScheduling.getStaffShifts(req.organization.id, memberId);
  }

  @Post("shifts/:shiftId/breaks")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Add a break to a shift" })
  @ApiParam({ name: "shiftId", type: "string", description: "The ID of the staff shift to add a break to" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        startTime: { type: "string", example: "12:00", description: "Break start time in HH:mm" },
        endTime: { type: "string", example: "13:00", description: "Break end time in HH:mm" },
        description: { type: "string", example: "Lunch break", nullable: true }
      },
      required: ["startTime", "endTime"]
    }
  })
  @ApiResponse({ status: 201, description: "Break successfully added to shift" })
  async addBreak(
    @Req() req: any,
    @Param("shiftId") shiftId: string,
    @Body() dto: { startTime: string, endTime: string, description?: string }
  ) {
    return this.staffScheduling.addBreak(shiftId, dto);
  }

  @Post("register-customer-app")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Register a customer-facing application" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "My Booking App", description: "The name of the customer application" }
      },
      required: ["name"]
    }
  })
  @ApiResponse({ status: 201, description: "Customer-facing application registered successfully" })
  async registerCustomerApp(@Req() req: any, @Body() dto: { name: string }) {
      return this.serviceManagement.registerCustomerApp(req.organization.id, dto.name);
  }

  @Get("analytics/utilization")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get resource utilization analytics" })
  @ApiQuery({ name: "startDate", type: "string", format: "date", example: "2026-01-01" })
  @ApiQuery({ name: "endDate", type: "string", format: "date", example: "2026-01-31" })
  @ApiResponse({ status: 200, description: "Returns resource utilization statistics over the specified date range" })
  async getUtilization(
      @Req() req: any,
      @Query("startDate") startDate: string,
      @Query("endDate") endDate: string
  ) {
      return this.analyticsService.getResourceUtilization(req.organization.id, new Date(startDate), new Date(endDate));
  }

  @Get("analytics/performance")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get staff performance analytics" })
  @ApiQuery({ name: "startDate", type: "string", format: "date", example: "2026-01-01" })
  @ApiQuery({ name: "endDate", type: "string", format: "date", example: "2026-01-31" })
  @ApiResponse({ status: 200, description: "Returns staff performance analytics over the specified date range" })
  async getPerformance(
      @Req() req: any,
      @Query("startDate") startDate: string,
      @Query("endDate") endDate: string
  ) {
      return this.analyticsService.getStaffPerformance(req.organization.id, new Date(startDate), new Date(endDate));
  }

  @Get("analytics/funnel")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get booking conversion funnel analytics" })
  @ApiQuery({ name: "startDate", type: "string", format: "date", example: "2026-01-01" })
  @ApiQuery({ name: "endDate", type: "string", format: "date", example: "2026-01-31" })
  @ApiResponse({ status: 200, description: "Returns booking conversion funnel over the specified date range" })
  async getFunnel(
      @Req() req: any,
      @Query("startDate") startDate: string,
      @Query("endDate") endDate: string
  ) {
      return this.analyticsService.getBookingConversionFunnel(req.organization.id, new Date(startDate), new Date(endDate));
  }
}
