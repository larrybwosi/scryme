import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
} from "@nestjs/swagger";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ServiceManagementService } from "../../application/services/service-management.service";
import { BookingService } from "../../application/services/booking.service";
import { OtpService } from "../../application/services/otp.service";
import {
  RequestOtpDto,
  VerifyOtpDto,
  PublicBookingDto
} from "../../application/dto/public-booking.dto";

@ApiTags("Public Services")
@Controller("public/:orgSlug/services")
@UseInterceptors(StandardResponseInterceptor)
export class PublicServicesController {
  constructor(
    private readonly serviceManagement: ServiceManagementService,
    private readonly bookingService: BookingService,
    private readonly otpService: OtpService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List available services for public booking" })
  async getServices(@Req() req: any) {
    // Only return active services and specific fields for public view
    const services = await this.serviceManagement.getServices(req.organization.id);
    return services.filter(s => s.isActive).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price,
        estimatedDuration: s.estimatedDuration
    }));
  }

  @Post("otp/request")
  @ApiOperation({ summary: "Request an OTP for booking" })
  async requestOtp(@Req() req: any, @Body() dto: RequestOtpDto) {
    return this.otpService.generateOtp(req.organization.id, dto);
  }

  @Post("otp/verify")
  @ApiOperation({ summary: "Verify the OTP" })
  async verifyOtp(@Req() req: any, @Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(req.organization.id, dto);
  }

  @Post("bookings")
  @ApiOperation({ summary: "Create a booking as a guest/customer" })
  async createBooking(@Req() req: any, @Body() dto: PublicBookingDto) {
    const verification = await this.otpService.validateVerification(req.organization.id, dto.verificationId);

    return this.bookingService.createBooking(req.organization.id, {
        serviceId: dto.serviceId,
        scheduledStartTime: dto.scheduledStartTime,
        notes: dto.notes,
        customerContact: verification.email || verification.phoneNumber || undefined
    } as any);
  }
}
