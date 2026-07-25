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
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ServiceManagementService } from "../../application/services/service-management.service";
import { BookingService } from "../../application/services/booking.service";
import { StaffSchedulingService } from "../../application/services/staff-scheduling.service";
import { OtpService } from "../../application/services/otp.service";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus } from "@repo/db";
import {
  RequestOtpDto,
  VerifyOtpDto,
  PublicBookingDto
} from "../../application/dto/public-booking.dto";

@ApiTags("Public Services")
@Controller("public/:orgSlug/services")
@ApiParam({ name: "orgSlug", type: "string" })
@UseInterceptors(StandardResponseInterceptor)
export class PublicServicesController {
  constructor(
    private readonly serviceManagement: ServiceManagementService,
    private readonly bookingService: BookingService,
    private readonly staffScheduling: StaffSchedulingService,
    private readonly otpService: OtpService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List available services for public booking" })
  async getServices(@Req() req: any) {
    // Only return active services and specific fields for public view
    // ⚡ Bolt Optimization: Use the optimized 'getServicesRaw' method to bypass heavy and unused database joins (staff, resources, categories)
    const services = await this.serviceManagement.getServicesRaw(req.organization.id, { isActive: true });
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

  @Get(":id/availability")
  @ApiOperation({ summary: "Get available time slots for a service" })
  async getServiceAvailability(
    @Req() req: any,
    @Param("id") id: string,
    @Query("date") dateString?: string
  ) {
    const orgId = req.organization.id;
    const service = await this.serviceManagement.getServiceById(orgId, id);
    if (!service.isActive) throw new NotFoundException("Service is not available");

    const targetDate = dateString ? new Date(dateString) : new Date();
    const slots: string[] = [];
    const baseYear = targetDate.getFullYear();
    const baseMonth = targetDate.getMonth();
    const baseDay = targetDate.getDate();

    const duration = service.estimatedDuration || 30;

    for (let hour = 8; hour < 18; hour++) {
      for (const min of [0, 30]) {
        const slotStart = new Date(baseYear, baseMonth, baseDay, hour, min, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

        let staffAvailable = false;
        if (service.staff && service.staff.length > 0) {
          for (const s of service.staff) {
            const isWorking = await this.staffScheduling.isStaffAvailable(s.memberId, slotStart, slotEnd);
            if (isWorking) {
              const overlap = await this.prisma.client.serviceBooking.findFirst({
                where: {
                  staff: { some: { memberId: s.memberId } },
                  status: { in: [BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS] },
                  OR: [
                    {
                      scheduledStartTime: { lt: slotEnd },
                      scheduledEndTime: { gt: slotStart },
                    }
                  ],
                }
              });
              if (!overlap) {
                staffAvailable = true;
                break;
              }
            }
          }
        } else {
          staffAvailable = true;
        }

        if (staffAvailable) {
          slots.push(slotStart.toISOString());
        }
      }
    }

    return {
      serviceId: id,
      date: targetDate.toISOString().split("T")[0],
      availableSlots: slots,
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
