import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  Req,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ServiceManagementService } from "../../application/services/service-management.service";
import { BookingService } from "../../application/services/booking.service";
import { OtpService } from "../../application/services/otp.service";
import { PrismaService } from "@/prisma/prisma.service";
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
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List available services for public booking" })
  async getServices(@Req() req: any) {
    // Only return active services and specific fields for public view
    const services = await this.serviceManagement.getServices(req.organization.id, { isActive: true });
    return services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price,
        estimatedDuration: s.estimatedDuration,
        categoryId: s.categoryId
    }));
  }

  @Get("categories")
  @ApiOperation({ summary: "List service categories publicly" })
  async getCategories(@Req() req: any) {
    const categories = await this.serviceManagement.getCategories(req.organization.id);
    return categories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        parentId: c.parentId
    }));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get service details publicly" })
  async getService(@Req() req: any, @Param("id") id: string) {
    const service = await this.serviceManagement.getServiceById(req.organization.id, id);
    if (!service.isActive) throw new NotFoundException("Service is not available");

    return {
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        estimatedDuration: service.estimatedDuration,
        categoryId: service.categoryId,
        categoryName: service.category?.name,
        staff: service.staff.map(s => ({
            id: s.memberId,
            name: s.member?.user?.name || "Staff"
        }))
    };
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

  @Get("me/bookings")
  @UseGuards(V3AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my bookings (authenticated customer)" })
  async getMyBookings(@Req() req: any) {
      if (!req.customer) {
          throw new Error("Customer context required");
      }
      return this.prisma.client.serviceBooking.findMany({
          where: {
              organizationId: req.organization.id,
              customerId: req.customer.id
          },
          include: { service: true }
      });
  }
}
