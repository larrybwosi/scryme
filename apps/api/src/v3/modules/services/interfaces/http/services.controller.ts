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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
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
import { BookingStatus } from "@repo/db";

@ApiTags("V3 Services")
@ApiBearerAuth()
@Controller(":orgSlug/services")
@ApiParam({ name: "orgSlug", type: "string" })
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
  async createCategory(@Req() req: any, @Body() dto: CreateServiceCategoryDto) {
    return this.serviceManagement.createCategory(req.organization.id, dto);
  }

  @Get("categories")
  @Permissions("services:read")
  @ApiOperation({ summary: "List service categories" })
  async getCategories(@Req() req: any) {
    return this.serviceManagement.getCategories(req.organization.id);
  }

  @Patch("categories/:id")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Update a service category" })
  async updateCategory(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateServiceCategoryDto
  ) {
    return this.serviceManagement.updateCategory(req.organization.id, id, dto);
  }

  @Post("categories/:id/delete") // Using POST instead of DELETE to avoid issues with some clients/proxies, or following existing patterns if any
  @Permissions("services:manage")
  @ApiOperation({ summary: "Delete a service category" })
  async deleteCategory(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteCategory(req.organization.id, id);
  }

  @Post()
  @Permissions("services:manage")
  @ApiOperation({ summary: "Create a new service" })
  async createService(@Req() req: any, @Body() dto: CreateServiceDto) {
    return this.serviceManagement.createService(req.organization.id, dto);
  }

  @Get()
  @Permissions("services:read")
  @ApiOperation({ summary: "List services" })
  async getServices(@Req() req: any) {
    return this.serviceManagement.getServices(req.organization.id);
  }

  @Get(":id")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get service details" })
  async getService(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.getServiceById(req.organization.id, id);
  }

  @Patch(":id")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Update a service" })
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
  async deleteService(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteService(req.organization.id, id);
  }

  @Post("resources")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Create a service resource" })
  async createResource(@Req() req: any, @Body() dto: CreateServiceResourceDto) {
    return this.serviceManagement.createResource(req.organization.id, dto);
  }

  @Patch("resources/:id")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Update a service resource" })
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
  async deleteResource(@Req() req: any, @Param("id") id: string) {
    return this.serviceManagement.deleteResource(req.organization.id, id);
  }

  @Get("resources")
  @Permissions("services:read")
  @ApiOperation({ summary: "List service resources" })
  async getResources(@Req() req: any) {
    return this.serviceManagement.getResources(req.organization.id);
  }

  @Post("bookings")
  @Permissions("services:write")
  @ApiOperation({ summary: "Create a service booking" })
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(req.organization.id, dto);
  }

  @Get("bookings")
  @Permissions("services:read")
  @ApiOperation({ summary: "List bookings" })
  async getBookings(@Req() req: any) {
    return this.bookingService.getBookings(req.organization.id);
  }

  @Get("bookings/:id")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get booking details" })
  async getBooking(@Req() req: any, @Param("id") id: string) {
    return this.bookingService.getBookingById(req.organization.id, id);
  }

  @Patch("bookings/:id/status")
  @Permissions("services:write")
  @ApiOperation({ summary: "Update booking status" })
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
  async getStaffShifts(@Req() req: any, @Param("memberId") memberId: string) {
    return this.staffScheduling.getStaffShifts(req.organization.id, memberId);
  }

  @Post("shifts/:shiftId/breaks")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Add a break to a shift" })
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
  async registerCustomerApp(@Req() req: any, @Body() dto: { name: string }) {
      return this.serviceManagement.registerCustomerApp(req.organization.id, dto.name);
  }

  @Get("analytics/utilization")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get resource utilization analytics" })
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
  async getFunnel(
      @Req() req: any,
      @Query("startDate") startDate: string,
      @Query("endDate") endDate: string
  ) {
      return this.analyticsService.getBookingConversionFunnel(req.organization.id, new Date(startDate), new Date(endDate));
  }
}
