import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import {
  AssignmentResponseDto,
  BookingTransitionDto,
  CalendarQueryDto,
  CreateScheduleOverrideDto,
  RescheduleBookingDto,
} from "../../application/dto/scheduling.dto";
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
  @ApiOperation({
    summary: "Create a service category",
    description: "Creates a new category for grouping services under the organization. Supports nested hierarchies via parentId.",
    operationId: "Services_CreateCategory",
  })
  @ApiBody({ type: CreateServiceCategoryDto })
  @ApiResponse({ status: 201, description: "Service category successfully created" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid category input data" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async createCategory(@Req() req: any, @Body() dto: CreateServiceCategoryDto) {
    return this.serviceManagement.createCategory(req.organization.id, dto);
  }

  @Get("categories")
  @Permissions("services:read")
  @ApiOperation({
    summary: "List service categories",
    description: "Retrieves all service categories belonging to the organization, including nested subcategories.",
    operationId: "Services_GetCategories",
  })
  @ApiResponse({ status: 200, description: "Returns a list of all service categories for the organization" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getCategories(@Req() req: any) {
    return this.serviceManagement.getCategories(req.organization.id);
  }

  @Patch("categories/:id")
  @Permissions("services:manage")
  @ApiOperation({
    summary: "Update a service category",
    description: "Updates an existing service category with new name, description, or parent association.",
    operationId: "Services_UpdateCategory",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service category to update" })
  @ApiBody({ type: UpdateServiceCategoryDto })
  @ApiResponse({ status: 200, description: "Service category successfully updated" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid update data" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
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
  @ApiOperation({
    summary: "Delete a service category",
    description: "Deletes a service category from the organization. Child items or assigned services will be detached or rejected.",
    operationId: "Services_DeleteCategory",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service category to delete" })
  @ApiResponse({ status: 200, description: "Service category successfully deleted" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service category not found" })
  async deleteCategory(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteCategory(req.organization.id, id);
  }

  @Post()
  @Permissions("services:manage")
  @ApiOperation({
    summary: "Create a new service",
    description: "Registers a new bookable service under the organization. Includes specifications for pricing model, estimated duration, buffer times, assigned staff, and optional Bill of Materials (BOM).",
    operationId: "Services_CreateService",
  })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({ status: 201, description: "Service successfully created" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid service input data" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async createService(@Req() req: any, @Body() dto: CreateServiceDto) {
    return this.serviceManagement.createService(req.organization.id, dto);
  }

  @Get()
  @Permissions("services:read")
  @ApiOperation({
    summary: "List services",
    description: "Returns a complete list of all services registered under the organization, including their categories, pricing, and configurations.",
    operationId: "Services_GetServices",
  })
  @ApiResponse({ status: 200, description: "Returns a list of all services for the organization" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getServices(@Req() req: any) {
    return this.serviceManagement.getServices(req.organization.id);
  }

  @Get("shifts/me")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get current member's shifts",
    description: "Retrieves the scheduled shifts, working days, and break timelines for the currently authenticated staff member.",
    operationId: "Services_GetCurrentMemberShifts",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved shifts of the currently logged-in member" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized or no active member session found" })
  async getCurrentMemberShifts(@Req() req: any) {
    const memberId = req.v3Context?.memberId;
    if (!memberId) {
      throw new UnauthorizedException("No active member session found");
    }
    return this.staffScheduling.getStaffShifts(req.v3Context.organizationId, memberId);
  }

  @Get("shifts")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get all staff shifts for the organization",
    description: "Lists scheduled staff shifts across the entire organization. Can be filtered by date ranges, branches, or active status.",
    operationId: "Services_GetShifts",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved list of staff shifts matching filters" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getShifts(@Req() req: any, @Query() query: GetShiftsQueryDto) {
    return this.staffScheduling.getShifts(req.v3Context.organizationId, query);
  }

  @Get(":id")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get service details",
    description: "Fetches detailed information about a specific service by database ID or slug, including its full category details, pricing models, assigned staff/resources, and Bill of Materials.",
    operationId: "Services_GetService",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID or slug of the service to fetch" })
  @ApiResponse({ status: 200, description: "Returns details of the specified service" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service not found" })
  async getService(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.getServiceById(req.organization.id, id);
  }

  @Get(":id/availability")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get service slot availability",
    description: "Calculates available booking slots dynamically based on staff shifts, breaks, and overlapping booking schedules.",
    operationId: "Services_GetAvailability",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service" })
  @ApiQuery({ name: "date", type: "string", required: false, description: "Target date in YYYY-MM-DD format" })
  @ApiResponse({ status: 200, description: "Successfully generated slot availability" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service not found" })
  async getServiceAvailability(
    @Req() req: any,
    @Param("id") id: string,
    @Query("date") date?: string,
  ) {
    return this.bookingService.getServiceAvailability(req.organization.id, id, date);
  }

  @Patch(":id")
  @Permissions("services:manage")
  @ApiOperation({
    summary: "Update a service",
    description: "Updates service details like price, duration, active status, assigned staff, resources, or Bill of Materials.",
    operationId: "Services_UpdateService",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service to update" })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({ status: 200, description: "Service successfully updated" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid update payload" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
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
  @ApiOperation({
    summary: "Delete a service",
    description: "Deletes a service from the catalog. Associated future bookings will be cancelled or locked.",
    operationId: "Services_DeleteService",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service to delete" })
  @ApiResponse({ status: 200, description: "Service successfully deleted" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service not found" })
  async deleteService(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteService(req.organization.id, id);
  }

  @Post("resources")
  @Permissions("services:manage")
  @ApiOperation({
    summary: "Create a service resource",
    description: "Registers a reusable asset or room (e.g. baking oven, massage table, treatment room) required to complete specific services.",
    operationId: "Services_CreateResource",
  })
  @ApiBody({ type: CreateServiceResourceDto })
  @ApiResponse({ status: 201, description: "Service resource successfully created" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid resource payload" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async createResource(@Req() req: any, @Body() dto: CreateServiceResourceDto) {
    return this.serviceManagement.createResource(req.organization.id, dto);
  }

  @Patch("resources/:id")
  @Permissions("services:manage")
  @ApiOperation({
    summary: "Update a service resource",
    description: "Modifies the parameters or active status of a registered service resource.",
    operationId: "Services_UpdateResource",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service resource to update" })
  @ApiBody({ type: UpdateServiceResourceDto })
  @ApiResponse({ status: 200, description: "Service resource successfully updated" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid update payload" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
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
  @ApiOperation({
    summary: "Delete a service resource",
    description: "Permanently removes a service resource from the organization. Cannot be deleted if assigned to active, uncompleted bookings.",
    operationId: "Services_DeleteResource",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service resource to delete" })
  @ApiResponse({ status: 200, description: "Service resource successfully deleted" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service resource not found" })
  async deleteResource(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteResource(req.organization.id, id);
  }

  @Get("resources")
  @Permissions("services:read")
  @ApiOperation({
    summary: "List service resources",
    description: "Fetches all reusable service resources and physical rooms/assets registered under the organization.",
    operationId: "Services_GetResources",
  })
  @ApiResponse({ status: 200, description: "Returns a list of all service resources for the organization" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getResources(@Req() req: any) {
    return this.serviceManagement.getResources(req.organization.id);
  }

  @Post("bookings")
  @Permissions("services:write")
  @ApiOperation({
    summary: "Create a service booking",
    description: "Schedules a new booking for a specific service. Automatically verifies availability, checking for double-bookings on assigned staff shifts and required resources.",
    operationId: "Services_CreateBooking",
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: "Service booking successfully created" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Resource/staff conflict or invalid data" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(req.organization.id, dto);
  }

  @Get("bookings")
  @Permissions("services:read")
  @ApiOperation({
    summary: "List bookings",
    description: "Returns all service bookings scheduled for the organization. Supports filtering by date and state.",
    operationId: "Services_GetBookings",
  })
  @ApiResponse({ status: 200, description: "Returns all service bookings for the organization" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getBookings(@Req() req: any, @Query() query: CalendarQueryDto) {
    return this.bookingService.getBookings(req.organization.id, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      memberId: query.memberId,
      locationId: query.locationId,
      status: query.status,
      limit: query.limit,
      cursor: query.cursor,
    });
  }

  @Get("bookings/:id")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get booking details",
    description: "Retrieves complete, detailed information for a single booking, including customer profile, scheduled timeline, assigned staff/resources, and required materials.",
    operationId: "Services_GetBooking",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the booking to fetch" })
  @ApiResponse({ status: 200, description: "Returns detailed information of the service booking" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Booking not found" })
  async getBooking(@Req() req: any, @Param("id") id: string) {
    return this.bookingService.getBookingById(req.organization.id, id);
  }

  @Patch("bookings/:id/status")
  @Permissions("services:write")
  @ApiOperation({
    summary: "Update booking status",
    description: "Updates the workflow status of a booking (e.g. PENDING, CONFIRMED, IN_PROGRESS, CANCELLED).",
    operationId: "Services_UpdateBookingStatus",
  })
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
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid status transition" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Booking not found" })
  async updateBookingStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: BookingTransitionDto
  ) {
    return this.bookingService.updateBookingStatus(
      req.organization.id,
      id,
      dto.status,
      dto.revision,
      req.v3Context?.memberId,
      undefined,
      dto.reason,
    );
  }

  @Patch("bookings/:id/complete")
  @Permissions("services:write")
  @ApiOperation({
    summary: "Complete a booking and consume materials",
    description: "Completes an active booking, records actual duration, and triggers material stock deduction from inventory based on the Bill of Materials (BOM).",
    operationId: "Services_CompleteBooking",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the booking to complete" })
  @ApiBody({ type: CompleteBookingDto })
  @ApiResponse({ status: 200, description: "Booking completed successfully and inventory stock deducted" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid completion payload or insufficient inventory" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Booking not found" })
  async completeBooking(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: CompleteBookingDto
  ) {
    return this.bookingService.completeBooking(req.organization.id, id, req.user.id, dto);
  }

  @Patch("bookings/:id/reschedule")
  @Permissions("services:write")
  @ApiOperation({ summary: "Reschedule and optionally reassign a booking", operationId: "Services_RescheduleBooking" })
  async rescheduleBooking(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingService.rescheduleBooking(
      req.organization.id,
      id,
      {
        ...dto,
        scheduledStartTime: new Date(dto.scheduledStartTime),
        scheduledEndTime: dto.scheduledEndTime ? new Date(dto.scheduledEndTime) : undefined,
      },
      req.v3Context?.memberId,
    );
  }

  @Patch("bookings/:id/assignment")
  @Permissions("services:write")
  @ApiOperation({ summary: "Accept or decline a staff assignment", operationId: "Services_RespondToAssignment" })
  async respondToAssignment(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AssignmentResponseDto,
  ) {
    return this.bookingService.respondToAssignment(
      req.organization.id,
      id,
      req.v3Context.memberId,
      dto.response as any,
      dto.revision,
      dto.reason,
    );
  }

  @Get("calendar/coverage")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get booking and roster coverage", operationId: "Services_GetCoverage" })
  async getCoverage(@Req() req: any, @Query() query: CalendarQueryDto) {
    return this.staffScheduling.getCoverage(
      req.organization.id,
      new Date(query.from),
      new Date(query.to),
      query.locationId,
    );
  }

  @Get("schedule/overrides")
  @Permissions("services:read")
  @ApiOperation({ summary: "List leave and schedule overrides", operationId: "Services_GetScheduleOverrides" })
  async getScheduleOverrides(@Req() req: any, @Query() query: CalendarQueryDto) {
    return this.staffScheduling.getOverrides(
      req.organization.id,
      new Date(query.from),
      new Date(query.to),
      query.memberId,
    );
  }

  @Post("staff/:memberId/overrides")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Create leave or a one-off schedule override", operationId: "Services_CreateScheduleOverride" })
  async createScheduleOverride(
    @Req() req: any,
    @Param("memberId") memberId: string,
    @Body() dto: CreateScheduleOverrideDto,
  ) {
    return this.staffScheduling.createOverride(req.organization.id, memberId, {
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      approvedById: req.v3Context?.memberId,
    });
  }

  @Delete("schedule/overrides/:id")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Delete a schedule override", operationId: "Services_DeleteScheduleOverride" })
  async deleteScheduleOverride(@Req() req: any, @Param("id") id: string) {
    return this.staffScheduling.deleteOverride(req.organization.id, id);
  }

  @Post("bookings/recurrence/:recurrenceId/cancel")
  @Permissions("services:write")
  @ApiOperation({
    summary: "Cancel recurring booking series",
    description: "Cancels all scheduled and requested future bookings belonging to a recurring booking series.",
    operationId: "Services_CancelBookingSeries",
  })
  @ApiParam({ name: "recurrenceId", type: "string", description: "The recurrence rule ID of the booking series" })
  @ApiResponse({ status: 200, description: "Booking series cancelled successfully" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async cancelBookingSeries(
    @Req() req: any,
    @Param("recurrenceId") recurrenceId: string,
  ) {
    return this.bookingService.cancelBookingSeries(req.organization.id, recurrenceId);
  }

  @Post("staff/:memberId/shifts")
  @Permissions("services:manage")
  @ApiOperation({
    summary: "Create a staff shift",
    description: "Schedules a regular or one-off work shift for a staff member, defining working days and daily duration boundaries.",
    operationId: "Services_CreateShift",
  })
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
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid shift boundaries" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async createShift(
    @Req() req: any,
    @Param("memberId") memberId: string,
    @Body() dto: { dayOfWeek: number, startTime: string, endTime: string }
  ) {
    return this.staffScheduling.createShift(req.organization.id, memberId, dto);
  }

  @Get("staff/:memberId/shifts")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get staff shifts",
    description: "Returns all scheduled shifts, active days, and regular working timelines configured for a specific staff member.",
    operationId: "Services_GetStaffShifts",
  })
  @ApiParam({ name: "memberId", type: "string", description: "The ID of the staff member" })
  @ApiResponse({ status: 200, description: "Returns all scheduled shifts for the staff member" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Staff member not found" })
  async getStaffShifts(@Req() req: any, @Param("memberId") memberId: string) {
    return this.staffScheduling.getStaffShifts(req.organization.id, memberId);
  }

  @Post("shifts/:shiftId/breaks")
  @Permissions("services:manage")
  @ApiOperation({
    summary: "Add a break to a shift",
    description: "Defines a non-working rest window (e.g. lunch break) within an existing staff shift, blocking bookings during this interval.",
    operationId: "Services_AddBreak",
  })
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
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Break time falls outside shift range" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Shift not found" })
  async addBreak(
    @Req() req: any,
    @Param("shiftId") shiftId: string,
    @Body() dto: { startTime: string, endTime: string, description?: string }
  ) {
    return this.staffScheduling.addBreak(req.organization.id, shiftId, dto);
  }

  @Post("register-customer-app")
  @Permissions("services:manage")
  @ApiOperation({
    summary: "Register a customer-facing application",
    description: "Registers a customer-facing external app or portal, returning credentials to support customer-driven bookings.",
    operationId: "Services_RegisterCustomerApp",
  })
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
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid application details" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async registerCustomerApp(@Req() req: any, @Body() dto: { name: string }) {
      return this.serviceManagement.registerCustomerApp(req.organization.id, dto.name);
  }

  @Get("analytics/utilization")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get resource utilization analytics",
    description: "Calculates the booking density and utilization ratios for physical rooms and resources over a specified date range.",
    operationId: "Services_GetUtilization",
  })
  @ApiQuery({ name: "startDate", type: "string", format: "date", example: "2026-01-01" })
  @ApiQuery({ name: "endDate", type: "string", format: "date", example: "2026-01-31" })
  @ApiResponse({ status: 200, description: "Returns resource utilization statistics over the specified date range" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getUtilization(
      @Req() req: any,
      @Query("startDate") startDate: string,
      @Query("endDate") endDate: string
  ) {
      return this.analyticsService.getResourceUtilization(req.organization.id, new Date(startDate), new Date(endDate));
  }

  @Get("analytics/performance")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get staff performance analytics",
    description: "Analyzes booking completion rates, average booking duration, and overall rating/reputation of staff members.",
    operationId: "Services_GetPerformance",
  })
  @ApiQuery({ name: "startDate", type: "string", format: "date", example: "2026-01-01" })
  @ApiQuery({ name: "endDate", type: "string", format: "date", example: "2026-01-31" })
  @ApiResponse({ status: 200, description: "Returns staff performance analytics over the specified date range" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getPerformance(
      @Req() req: any,
      @Query("startDate") startDate: string,
      @Query("endDate") endDate: string
  ) {
      return this.analyticsService.getStaffPerformance(req.organization.id, new Date(startDate), new Date(endDate));
  }

  @Get("analytics/funnel")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get booking conversion funnel analytics",
    description: "Provides granular data showing user journeys from search -> selection -> scheduling -> payment completion inside booking portals.",
    operationId: "Services_GetFunnel",
  })
  @ApiQuery({ name: "startDate", type: "string", format: "date", example: "2026-01-01" })
  @ApiQuery({ name: "endDate", type: "string", format: "date", example: "2026-01-31" })
  @ApiResponse({ status: 200, description: "Returns booking conversion funnel over the specified date range" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getFunnel(
      @Req() req: any,
      @Query("startDate") startDate: string,
      @Query("endDate") endDate: string
  ) {
      return this.analyticsService.getBookingConversionFunnel(req.organization.id, new Date(startDate), new Date(endDate));
  }
}
