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
  Optional,
  Inject,
  forwardRef,
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
import {
  RequestOtpDto,
  VerifyOtpDto,
  PublicBookingDto,
  PublicBookingPaymentOption,
} from "../../application/dto/public-booking.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { MpesaService } from "@repo/shared/mpesa/server";
import { PaymentMethod } from "@repo/db";
import { Decimal } from "decimal.js";

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
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => MpesaService))
    private readonly mpesaService?: MpesaService,
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
    // Eagerly loading nested relations on frequently accessed public directory listings is a major database overhead.
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
    const booking = await this.bookingService.createBooking(
      req.organization.id,
      {
        serviceId: dto.serviceId,
        scheduledStartTime: dto.scheduledStartTime,
        scheduledEndTime: dto.scheduledEndTime,
        locationId: dto.locationId,
        customerContact: contact,
        notes: dto.notes,
      },
      true,
    );

    // 3. Automatically link an Order Transaction for unified billing & payment tracking
    const service = await this.prisma.client.service.findFirst({
      where: { id: dto.serviceId, organizationId: req.organization.id },
      include: {
        taxRates: {
          include: { taxRate: true },
        },
      },
    });

    let orderId: string | undefined;
    let paymentId: string | undefined;
    let paymentStatus = "Booking confirmed. Pay at venue upon arrival.";
    let mpesaResponse: any = null;

    if (service) {
      const srvPrice = new Decimal(service.price ? service.price.toString() : 0);
      let srvTax = new Decimal(0);
      if (service.taxRates) {
        for (const tr of service.taxRates) {
          srvTax = srvTax.add(srvPrice.mul(tr.taxRate.rate));
        }
      }
      const finalTotal = srvPrice.add(srvTax);

      // Create transaction for booking
      const orderNumber = `SRV-${Date.now()}`;
      const transaction = await this.prisma.client.transaction.create({
        data: {
          organization: { connect: { id: req.organization.id } },
          number: orderNumber,
          type: "SERVICE_BOOKING" as any,
          channel: "ECOMMERCE_STORE",
          status: "PENDING_CONFIRMATION",
          customer: booking.customerId
            ? { connect: { id: booking.customerId } }
            : undefined,
          location: dto.locationId
            ? { connect: { id: dto.locationId } }
            : undefined,
          subtotal: srvPrice,
          discountTotal: 0,
          taxTotal: srvTax,
          shippingTotal: 0,
          finalTotal,
          baseCurrencyTotal: finalTotal,
          notes: dto.notes,
        },
      });

      orderId = transaction.id;

      // Create Service Item and link Booking to Transaction
      await Promise.all([
        this.prisma.client.transactionServiceItem.create({
          data: {
            transactionId: transaction.id,
            serviceId: service.id,
            bookingId: booking.id,
            serviceName: service.name,
            sku: service.sku,
            quantity: 1,
            unitPrice: srvPrice,
            subtotal: srvPrice,
            taxAmount: srvTax,
            lineTotal: finalTotal,
          },
        }),
        this.prisma.client.serviceBooking.update({
          where: { id: booking.id },
          data: { transactionId: transaction.id },
        }),
      ]);

      // Handle optional immediate payment (e.g. M-Pesa STK Push)
      const paymentOption = dto.paymentOption || PublicBookingPaymentOption.PAY_AT_VENUE;
      const isMpesa =
        paymentOption === PublicBookingPaymentOption.MPESA &&
        (dto.phoneNumber || verification.phoneNumber);

      const payment = await this.prisma.client.payment.create({
        data: {
          organizationId: req.organization.id,
          transactionId: transaction.id,
          amount: transaction.finalTotal,
          method: isMpesa ? PaymentMethod.MPESA : PaymentMethod.OTHER,
          status: "PENDING",
        },
      });

      paymentId = payment.id;

      if (isMpesa && this.mpesaService) {
        const phone = dto.phoneNumber || verification.phoneNumber!;
        mpesaResponse = await this.mpesaService.initiateStkPush({
          organizationId: req.organization.id,
          transactionId: transaction.id,
          paymentId: payment.id,
          amount: Number(transaction.finalTotal),
          phoneNumber: phone,
        });
        paymentStatus = mpesaResponse?.CustomerMessage || "M-Pesa STK push initiated";
      }
    }

    return {
      ...booking,
      orderId,
      paymentId,
      paymentStatus,
      merchantRequestID: mpesaResponse?.MerchantRequestID,
      checkoutRequestID: mpesaResponse?.CheckoutRequestID,
    };
  }
}
