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
import {
  CreateServiceDto,
  CreateServiceCategoryDto,
  CreateBookingDto,
  CompleteBookingDto
} from "../../application/dto/service.dto";

@ApiTags("V3 Services")
@ApiBearerAuth()
@Controller(":orgSlug/services")
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class ServicesController {
  constructor(
    private readonly serviceManagement: ServiceManagementService,
    private readonly bookingService: BookingService,
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

  @Post("resources")
  @Permissions("services:manage")
  @ApiOperation({ summary: "Create a service resource" })
  async createResource(@Req() req: any, @Body() dto: { name: string, type?: string }) {
    return this.serviceManagement.createResource(req.organization.id, dto);
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

  @Patch("bookings/:id/complete")
  @Permissions("services:write")
  @ApiOperation({ summary: "Complete a booking and consume materials" })
  async completeBooking(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: CompleteBookingDto
  ) {
    return this.bookingService.completeBooking(req.organization.id, id, dto);
  }
}
