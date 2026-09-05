import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
  Query,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ServiceManagementService } from "../../application/services/service-management.service";
import { BookingService } from "../../application/services/booking.service";
import { OtpService } from "../../application/services/otp.service";
import { RequestOtpDto, VerifyOtpDto, PublicBookingDto } from "../../application/dto/public-booking.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";

@ApiTags("V3 Public Services")
@Controller("public/:orgSlug/services")
@ApiParam({ name: "orgSlug", type: "string", description: "The unique organization slug" })
@UseGuards(MultiTenancyGuard)
@UseInterceptors(StandardResponseInterceptor)
export class PublicServicesController {
  constructor(
    private readonly serviceManagement: ServiceManagementService,
    private readonly bookingService: BookingService,
    private readonly otpService: OtpService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List public services",
    description: "Returns a list of all active services for the specified organization.",
    operationId: "PublicServices_ListServices",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved active services list" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Organization not found" })
  async getPublicServices(@Req() req: any) {
    // ⚡ Bolt Optimization: Eagerly loading nested relations on frequently accessed public directory listings is a major database overhead.
    // Replacing the broad include query with an optimized raw/flat method (getServicesRaw) bypasses multi-table joins,
    // drastically reducing database CPU, memory footprint, payload size, and object-serialization overhead.
    return this.serviceManagement.getServicesRaw(req.organization.id, { isActive: true });
  }

  @Get("categories")
  @ApiOperation({
    summary: "List public service categories",
    description: "Retrieves all service categories belonging to the organization.",
    operationId: "PublicServices_GetCategories",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved service categories" })
  async getPublicCategories(@Req() req: any) {
    return this.serviceManagement.getCategories(req.organization.id);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get public service details",
    description: "Fetches details of a specific service.",
    operationId: "PublicServices_GetService",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service to fetch" })
  @ApiResponse({ status: 200, description: "Returns details of the specified service" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Service not found" })
  async getPublicService(@Req() req: any, @Param("id") id: string) {
    const service = await this.serviceManagement.getServiceById(req.organization.id, id);
    if (!service || !service.isActive) {
      throw new NotFoundException("Service not found");
    }
    return service;
  }

  @Get(":id/availability")
  @ApiOperation({
    summary: "Get service slot availability",
    description: "Calculates available booking slots dynamically based on staff shifts, breaks, and overlapping booking schedules.",
    operationId: "PublicServices_GetAvailability",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the service" })
  @ApiQuery({ name: "date", type: "string", required: false, description: "Target date in YYYY-MM-DD format" })
  @ApiResponse({ status: 200, description: "Successfully generated slot availability" })
  async getServiceAvailability(
    @Req() req: any,
    @Param("id") id: string,
    @Query("date") date?: string,
  ) {
    return this.bookingService.getServiceAvailability(req.organization.id, id, date);
  }

  @Post("otp/request")
  @ApiOperation({
    summary: "Request OTP for public booking",
    description: "Generates and sends a secure OTP to the customer's email or phone number.",
    operationId: "PublicServices_RequestOtp",
  })
  @ApiBody({ type: RequestOtpDto })
  @ApiResponse({ status: 201, description: "OTP requested successfully" })
  async requestOtp(@Req() req: any, @Body() dto: RequestOtpDto) {
    return this.otpService.generateOtp(req.organization.id, dto);
  }

  @Post("otp/verify")
  @ApiOperation({
    summary: "Verify OTP for public booking",
    description: "Verifies the OTP code submitted by the customer, returning a verification ID.",
    operationId: "PublicServices_VerifyOtp",
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: "OTP verified successfully" })
  async verifyOtp(@Req() req: any, @Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(req.organization.id, dto);
  }

  @Post("bookings")
  @ApiOperation({
    summary: "Create a public booking",
    description: "Schedules a booking without requiring full authentication by validating an OTP verification ID.",
    operationId: "PublicServices_CreatePublicBooking",
  })
  @ApiBody({ type: PublicBookingDto })
  @ApiResponse({ status: 201, description: "Public booking created successfully" })
  async createPublicBooking(@Req() req: any, @Body() dto: PublicBookingDto) {
    // 1. Consume and validate verification to prevent replay attacks
    const verification = await this.otpService.validateVerification(
      req.organization.id,
      dto.verificationId,
    );

    // 2. Resolve client info from validation and submit the booking request
    const contact = verification.email || verification.phoneNumber || "";
    return this.bookingService.createBooking(req.organization.id, {
      serviceId: dto.serviceId,
      scheduledStartTime: dto.scheduledStartTime,
      customerContact: contact,
      notes: dto.notes,
    }, true);
  }
}
