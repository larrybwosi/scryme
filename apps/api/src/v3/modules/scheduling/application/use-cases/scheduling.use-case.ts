import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../../../prisma/prisma.service";
import {
  BranchCoordinatesDto,
  CreateScheduledBookingDto,
  CreateScheduleOverrideDto,
  ManualAttendanceCheckInDto,
  ManualAttendanceCheckOutDto,
  TransitionBookingDto,
} from "../../dtos/scheduling.dto";

@Injectable()
export class SchedulingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getSchedulingWorkspace(organizationId: string, from: Date, to: Date) {
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to <= from) {
      throw new BadRequestException("Invalid schedule date range");
    }

    const [
      bookings,
      overrides,
      services,
      locations,
      settings,
      tradeRequests,
      tasks,
      departments,
      attendanceLogs,
    ] = await Promise.all([
      this.prisma.client.serviceBooking.findMany({
        where: {
          organizationId,
          scheduledStartTime: { lt: to },
          scheduledEndTime: { gt: from },
        },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          staff: {
            include: {
              member: {
                select: { id: true, user: { select: { name: true, email: true, image: true } } },
              },
            },
          },
          resources: { include: { resource: { select: { id: true, name: true, type: true } } } },
        },
        orderBy: { scheduledStartTime: "asc" },
        take: 250,
      }),
      this.prisma.client.staffScheduleOverride.findMany({
        where: {
          organizationId,
          startTime: { lt: to },
          endTime: { gt: from },
        },
        include: {
          member: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
        },
        orderBy: { startTime: "asc" },
      }),
      this.prisma.client.service.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, estimatedDuration: true, price: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.client.inventoryLocation.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, branchCode: true, latitude: true, longitude: true, radiusMeters: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.client.organizationSettings.findUnique({
        where: { organizationId },
        select: { defaultTimezone: true },
      }),
      this.prisma.client.shiftTradeRequest.findMany({
        where: { organizationId },
        include: {
          requesterMember: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
          targetMember: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
          shift: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, memberId: true } },
          offeredShift: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, memberId: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.client.staffTask.findMany({
        where: { organizationId },
        include: {
          member: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
          location: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.client.department.findMany({
        where: { organizationId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.client.attendanceLog.findMany({
        where: {
          organizationId,
          checkInTime: { gte: from },
        },
        include: {
          member: {
            select: {
              id: true,
              user: { select: { name: true, email: true, image: true } },
            },
          },
          checkInLocation: { select: { id: true, name: true, branchCode: true } },
          shift: { select: { id: true, startTime: true, endTime: true } },
        },
        orderBy: { checkInTime: "desc" },
        take: 200,
      }),
    ]);

    return {
      bookings: bookings.map((item) => ({ ...item, price: item.price.toString() })),
      overrides,
      services: services.map((item) => ({ ...item, price: item.price.toString() })),
      locations,
      timezone: settings?.defaultTimezone || "UTC",
      tradeRequests,
      tasks,
      departments,
      attendanceLogs,
    };
  }

  async createScheduledBooking(
    organizationId: string,
    actorMemberId: string | undefined,
    dto: CreateScheduledBookingDto,
  ) {
    const startTime = new Date(dto.scheduledStartTime);
    if (!Number.isFinite(startTime.getTime())) {
      throw new BadRequestException("Invalid scheduled start time");
    }

    const member = await this.prisma.client.member.findFirst({
      where: { id: dto.memberId, organizationId },
      select: { id: true },
    });
    if (!member) {
      throw new BadRequestException("Staff member not found in organization");
    }

    const service = await this.prisma.client.service.findFirst({
      where: { id: dto.serviceId, organizationId },
    });
    if (!service) {
      throw new BadRequestException("Service not found in organization");
    }

    let endTime: Date;
    if (dto.scheduledEndTime) {
      endTime = new Date(dto.scheduledEndTime);
      if (!Number.isFinite(endTime.getTime()) || endTime <= startTime) {
        throw new BadRequestException("End time must be after start time");
      }
    } else {
      const durationMinutes = service.estimatedDuration || 60;
      endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    }

    let customerId: string | undefined = undefined;
    if (dto.customerEmail || dto.customerPhone || dto.customerName) {
      let existingCustomer = null;
      if (dto.customerEmail || dto.customerPhone) {
        existingCustomer = await this.prisma.client.customer.findFirst({
          where: {
            organizationId,
            OR: [
              ...(dto.customerEmail ? [{ email: dto.customerEmail }] : []),
              ...(dto.customerPhone ? [{ phone: dto.customerPhone }] : []),
            ],
          },
        });
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else if (dto.customerName || dto.customerEmail) {
        const createdCustomer = await this.prisma.client.customer.create({
          data: {
            organizationId,
            name: dto.customerName || "Walk-in Customer",
            email: dto.customerEmail || null,
            phone: dto.customerPhone || null,
          },
        });
        customerId = createdCustomer.id;
      }
    }

    const booking = await this.prisma.client.serviceBooking.create({
      data: {
        organizationId,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        pricingModel: service.pricingModel,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        locationId: dto.locationId || null,
        notes: dto.notes || null,
        customerId: customerId || null,
        status: "SCHEDULED",
        staff: {
          create: {
            memberId: dto.memberId,
            status: "ACCEPTED",
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        staff: {
          include: {
            member: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
          },
        },
        resources: { include: { resource: { select: { id: true, name: true, type: true } } } },
      },
    });

    await this.prisma.client.bookingEvent.create({
      data: {
        organizationId,
        bookingId: booking.id,
        source: "ADMIN",
        type: "CREATED",
        toStatus: "SCHEDULED",
        actorMemberId: actorMemberId || null,
      },
    });

    return {
      ...booking,
      price: booking.price.toString(),
    };
  }

  async transitionScheduledBooking(
    organizationId: string,
    bookingId: string,
    dto: TransitionBookingDto,
  ) {
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId },
    });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.revision !== dto.revision) {
      throw new ConflictException("Booking changed concurrently. Refresh and try again.");
    }

    const validTransitions: Record<string, string[]> = {
      REQUESTED: ["CANCELLED"],
      SCHEDULED: ["IN_PROGRESS", "CANCELLED", "NOSHOW"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
      NOSHOW: [],
    };

    if (!validTransitions[booking.status]?.includes(dto.status)) {
      throw new BadRequestException(`Cannot move ${booking.status} booking to ${dto.status}`);
    }

    const updated = await this.prisma.client.serviceBooking.updateMany({
      where: { id: bookingId, organizationId, revision: dto.revision },
      data: {
        status: dto.status,
        revision: { increment: 1 },
        ...(dto.status === "IN_PROGRESS" ? { actualStartTime: new Date() } : {}),
        ...(dto.status === "COMPLETED" ? { actualEndTime: new Date() } : {}),
      },
    });

    if (updated.count === 0) {
      throw new ConflictException("Booking was updated concurrently");
    }

    await this.prisma.client.bookingEvent.create({
      data: {
        organizationId,
        bookingId,
        source: "ADMIN",
        type: `STATUS_${dto.status}`,
        fromStatus: booking.status,
        toStatus: dto.status,
      },
    });

    return { success: true, bookingId, status: dto.status };
  }

  async createScheduleOverride(organizationId: string, dto: CreateScheduleOverrideDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (endTime <= startTime) {
      throw new BadRequestException("End time must follow start time");
    }

    const member = await this.prisma.client.member.findFirst({
      where: { id: dto.memberId, organizationId },
      select: { id: true },
    });
    if (!member) {
      throw new BadRequestException("Member not found in organization");
    }

    const override = await this.prisma.client.staffScheduleOverride.create({
      data: {
        organizationId,
        memberId: dto.memberId,
        type: dto.type,
        startTime,
        endTime,
        reason: dto.reason || null,
        locationId: dto.locationId || null,
      },
      include: {
        member: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });

    return override;
  }

  async recordManualAttendanceCheckIn(organizationId: string, dto: ManualAttendanceCheckInDto) {
    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { id: dto.locationId, organizationId },
    });
    if (!location) {
      throw new NotFoundException("Location not found in organization");
    }

    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: { organizationId, memberId: dto.memberId, checkOutTime: null },
    });
    if (activeLog) {
      throw new BadRequestException("Member is already checked in");
    }

    const checkInTime = new Date();
    const dayOfWeek = checkInTime.getDay();
    const candidateShifts = await this.prisma.client.staffShift.findMany({
      where: {
        organizationId,
        memberId: dto.memberId,
        isActive: true,
        dayOfWeek,
        OR: [{ locationId: dto.locationId }, { locationId: null }],
      },
    });

    let matchedShiftId: string | null = null;
    let shiftStatus: any = "UNSCHEDULED";

    if (candidateShifts.length > 0) {
      const shift = candidateShifts[0];
      matchedShiftId = shift.id;
      const [startHours, startMins] = shift.startTime.split(":").map(Number);
      const scheduledStart = new Date(checkInTime);
      scheduledStart.setHours(startHours, startMins, 0, 0);

      const diffMins = (checkInTime.getTime() - scheduledStart.getTime()) / 60000;
      if (diffMins > 15) shiftStatus = "LATE";
      else if (diffMins < -15) shiftStatus = "EARLY";
      else shiftStatus = "ON_TIME";
    }

    const log = await this.prisma.client.attendanceLog.create({
      data: {
        organizationId,
        memberId: dto.memberId,
        checkInTime,
        checkInLocationId: dto.locationId,
        shiftId: matchedShiftId,
        shiftStatus,
        verificationMethod: "MANAGER_OVERRIDE",
        isLocationVerified: true,
        notes: dto.notes || "Manual manager check-in override",
      },
    });

    await this.prisma.client.member.updateMany({
      where: { id: dto.memberId, organizationId },
      data: {
        isCheckedIn: true,
        lastCheckInTime: checkInTime,
        currentCheckInLocationId: dto.locationId,
        currentAttendanceLogId: log.id,
        status: "ONLINE",
      },
    });

    return log;
  }

  async recordManualAttendanceCheckOut(organizationId: string, dto: ManualAttendanceCheckOutDto) {
    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: { organizationId, memberId: dto.memberId, checkOutTime: null },
    });
    if (!activeLog) {
      throw new BadRequestException("Member is not checked in");
    }

    const checkOutTime = new Date();
    const durationMinutes = Math.round((checkOutTime.getTime() - activeLog.checkInTime.getTime()) / 60000);

    const log = await this.prisma.client.attendanceLog.updateMany({
      where: { id: activeLog.id, organizationId },
      data: {
        checkOutTime,
        durationMinutes,
        notes: dto.notes || activeLog.notes,
      },
    });

    await this.prisma.client.member.updateMany({
      where: { id: dto.memberId, organizationId },
      data: {
        isCheckedIn: false,
        currentCheckInLocationId: null,
        currentAttendanceLogId: null,
        status: "OFFLINE",
      },
    });

    return { success: true, memberId: dto.memberId, durationMinutes };
  }

  async updateBranchLocationCoordinates(
    organizationId: string,
    locationId: string,
    dto: BranchCoordinatesDto,
  ) {
    const updated = await this.prisma.client.inventoryLocation.updateMany({
      where: { id: locationId, organizationId },
      data: {
        latitude: dto.latitude !== undefined ? dto.latitude : undefined,
        longitude: dto.longitude !== undefined ? dto.longitude : undefined,
        radiusMeters: dto.radiusMeters !== undefined ? dto.radiusMeters : undefined,
        branchCode: dto.branchCode !== undefined ? dto.branchCode : undefined,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException("Location not found in organization");
    }

    const location = await this.prisma.client.inventoryLocation.findFirstOrThrow({
      where: { id: locationId, organizationId },
    });

    return location;
  }
}
