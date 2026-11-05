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

  async getUnifiedCalendarEvents(
    organizationId: string,
    filter: { from?: string; to?: string; categories?: string; projectId?: string },
  ) {
    const fromDate = filter.from ? new Date(filter.from) : new Date(Date.now() - 30 * 86400000);
    const toDate = filter.to ? new Date(filter.to) : new Date(Date.now() + 60 * 86400000);

    const categoryList = filter.categories
      ? filter.categories.split(",").map((c) => c.trim().toLowerCase())
      : ["tasks", "production", "deliveries", "crm", "shifts"];

    const includeTasks = categoryList.includes("tasks") || categoryList.includes("all");
    const includeProduction = categoryList.includes("production") || categoryList.includes("all");
    const includeDeliveries = categoryList.includes("deliveries") || categoryList.includes("all");
    const includeCrm = categoryList.includes("crm") || categoryList.includes("all");
    const includeShifts = categoryList.includes("shifts") || categoryList.includes("all");

    // Parallelize queries across domains concurrently using Promise.all
    const [tasks, milestones, batches, fulfillments, crmFollowUps, shifts] = await Promise.all([
      includeTasks
        ? this.prisma.client.task.findMany({
            where: {
              organizationId,
              ...(filter.projectId ? { projectId: filter.projectId } : {}),
              OR: [
                { dueDate: { gte: fromDate, lte: toDate } },
                { startDate: { gte: fromDate, lte: toDate } },
                { dueDate: null, startDate: null },
              ],
            },
            include: {
              project: { select: { id: true, name: true, key: true } },
              assignees: {
                include: {
                  member: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
                },
              },
            },
            take: 200,
            orderBy: { dueDate: "asc" },
          })
        : Promise.resolve([]),

      includeTasks
        ? this.prisma.client.projectMilestone.findMany({
            where: {
              organizationId,
              ...(filter.projectId ? { projectId: filter.projectId } : {}),
              dueDate: { gte: fromDate, lte: toDate },
            },
            include: {
              project: { select: { id: true, name: true, key: true } },
            },
            take: 100,
            orderBy: { dueDate: "asc" },
          })
        : Promise.resolve([]),

      includeProduction
        ? this.prisma.client.batch.findMany({
            where: {
              organizationId,
              scheduledStartAt: { gte: fromDate, lte: toDate },
            },
            include: {
              recipe: { select: { id: true, name: true, category: true } },
              leadBaker: { select: { id: true, member: { select: { user: { select: { name: true, email: true } } } } } },
              task: { select: { id: true, title: true, projectId: true } },
            },
            take: 100,
            orderBy: { scheduledStartAt: "asc" },
          })
        : Promise.resolve([]),

      includeDeliveries
        ? this.prisma.client.fulfillment.findMany({
            where: {
              transaction: { organizationId },
              createdAt: { gte: fromDate, lte: toDate },
            },
            include: {
              driver: { select: { id: true, name: true, phone: true } },
              transaction: { select: { id: true, customer: { select: { name: true, phone: true } } } },
              pickupLocation: { select: { id: true, name: true } },
            },
            take: 100,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      includeCrm
        ? this.prisma.client.crmFollowUp.findMany({
            where: {
              organizationId,
              dueDate: { gte: fromDate, lte: toDate },
            },
            include: {
              record: { select: { id: true, data: true, objectDefinition: { select: { name: true } } } },
              assignedTo: { select: { id: true, user: { select: { name: true, email: true } } } },
              location: { select: { id: true, name: true } },
            },
            take: 100,
            orderBy: { dueDate: "asc" },
          })
        : Promise.resolve([]),

      includeShifts
        ? this.prisma.client.staffShift.findMany({
            where: {
              organizationId,
              isActive: true,
            },
            include: {
              member: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
            },
            take: 100,
          })
        : Promise.resolve([]),
    ]);

    // Format all domain entities into a unified calendar event shape
    const events: any[] = [];

    // 1. User Tasks
    for (const t of tasks) {
      const start = t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
      const end = t.dueDate ? new Date(t.dueDate) : new Date(start.getTime() + (t.estimatedHours || 1) * 3600000);

      events.push({
        id: `task-${t.id}`,
        rawId: t.id,
        category: "task",
        title: t.title,
        status: t.status,
        priority: t.priority,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        projectId: t.projectId,
        projectName: t.project?.name,
        projectKey: t.project?.key,
        code: t.taskKey,
        assignees: (t.assignees || []).map((a: any) => ({
          id: a.member?.id,
          name: a.member?.user?.name || "Assignee",
          email: a.member?.user?.email,
          image: a.member?.user?.image,
        })),
        details: {
          description: t.description,
          estimatedHours: t.estimatedHours,
        },
      });
    }

    // 2. Project Milestones
    for (const m of milestones) {
      const date = new Date(m.dueDate);
      events.push({
        id: `milestone-${m.id}`,
        rawId: m.id,
        category: "milestone",
        title: m.title,
        status: m.status,
        startAt: date.toISOString(),
        endAt: date.toISOString(),
        projectId: m.projectId,
        projectName: m.project?.name,
        details: {
          description: m.description,
        },
      });
    }

    // 3. Production Batches / Schedules
    for (const b of batches) {
      const start = new Date(b.scheduledStartAt);
      const durationMinutes = b.duration || 120;
      const end = b.completedAt
        ? new Date(b.completedAt)
        : new Date(start.getTime() + durationMinutes * 60000);

      events.push({
        id: `production-${b.id}`,
        rawId: b.id,
        category: "production",
        title: `${b.recipe?.name || "Production Batch"} (${b.plannedQuantity})`,
        status: b.status,
        priority: b.runType === "ON_DEMAND" ? "HIGH" : "MEDIUM",
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        code: b.batchNumber,
        assignees: b.leadBaker
          ? [
              {
                id: b.leadBaker.id,
                name: b.leadBaker.member?.user?.name || "Lead Baker",
                email: b.leadBaker.member?.user?.email,
              },
            ]
          : [],
        details: {
          recipeName: b.recipe?.name,
          recipeCategory: b.recipe?.category,
          plannedQuantity: b.plannedQuantity?.toString(),
          actualQuantity: b.actualQuantity?.toString(),
          runType: b.runType,
          orderReference: b.orderReference,
          notes: b.notes,
        },
      });
    }

    // 4. Logistics & Deliveries
    for (const f of fulfillments) {
      const dispatchDate = new Date(f.createdAt);
      const deliveryWindowEnd = new Date(dispatchDate.getTime() + 180 * 60000); // 3-hour fulfillment window

      events.push({
        id: `delivery-${f.id}`,
        rawId: f.id,
        category: "delivery",
        title: `Delivery: ${f.transaction?.customer?.name || f.trackingNumber || "Order #" + f.transactionId.slice(-6)}`,
        status: f.status,
        priority: f.status === "FAILED" ? "URGENT" : "MEDIUM",
        startAt: dispatchDate.toISOString(),
        endAt: deliveryWindowEnd.toISOString(),
        code: f.trackingNumber || `DLV-${f.id.slice(-6)}`,
        assignees: f.driver
          ? [
              {
                id: f.driver.id,
                name: f.driver.name,
                phone: f.driver.phone,
              },
            ]
          : [],
        details: {
          type: f.type,
          carrier: f.carrier,
          receivedBy: f.receivedBy,
          isReconciled: f.isReconciled,
          deliveryNotes: f.deliveryNotes,
          pickupLocation: f.pickupLocation?.name,
          customerName: f.transaction?.customer?.name,
          customerPhone: f.transaction?.customer?.phone,
        },
      });
    }

    // 5. CRM Customer Follow-Ups
    for (const fu of crmFollowUps) {
      const due = new Date(fu.dueDate);
      const end = new Date(due.getTime() + 60 * 60000);

      events.push({
        id: `crm-${fu.id}`,
        rawId: fu.id,
        category: "crm",
        title: `[${fu.type}] ${fu.title} - ${((fu.record?.data as any)?.name || (fu.record?.data as any)?.first_name || fu.title)}`,
        status: fu.status,
        priority: fu.priority,
        startAt: due.toISOString(),
        endAt: end.toISOString(),
        code: `CRM-${fu.type}`,
        assignees: fu.assignedTo
          ? [
              {
                id: fu.assignedTo.id,
                name: fu.assignedTo.user?.name || "Rep",
                email: fu.assignedTo.user?.email,
              },
            ]
          : [],
        details: {
          followUpType: fu.type,
          description: fu.description,
          recordObject: fu.record?.objectDefinition?.name,
          locationName: fu.location?.name,
          isRecurring: fu.isRecurring,
          completedAt: fu.completedAt,
        },
      });
    }

    // 6. Staff Shifts (Project recurring weekly shifts across current range)
    if (shifts.length > 0) {
      const curDate = new Date(fromDate);
      curDate.setHours(0, 0, 0, 0);

      // Max scan 45 days to prevent loop explosion
      const maxDays = Math.min(45, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000));
      for (let i = 0; i < maxDays; i++) {
        const loopDate = new Date(curDate.getTime() + i * 86400000);
        const dayOfWeek = loopDate.getDay();

        const matchingShifts = shifts.filter((s: any) => s.dayOfWeek === dayOfWeek);
        for (const s of matchingShifts) {
          const [startHours, startMins] = (s.startTime || "09:00").split(":").map(Number);
          const [endHours, endMins] = (s.endTime || "17:00").split(":").map(Number);

          const shiftStart = new Date(loopDate);
          shiftStart.setHours(startHours, startMins, 0, 0);

          const shiftEnd = new Date(loopDate);
          shiftEnd.setHours(endHours, endMins, 0, 0);

          events.push({
            id: `shift-${s.id}-${loopDate.toISOString().slice(0, 10)}`,
            rawId: s.id,
            category: "shift",
            title: `Shift: ${s.member?.user?.name || "Staff"} (${s.startTime} - ${s.endTime})`,
            status: s.isActive ? "ACTIVE" : "INACTIVE",
            priority: "LOW",
            startAt: shiftStart.toISOString(),
            endAt: shiftEnd.toISOString(),
            assignees: [
              {
                id: s.member?.id,
                name: s.member?.user?.name || "Staff",
                email: s.member?.user?.email,
                image: s.member?.user?.image,
              },
            ],
            details: {
              locationId: s.locationId,
              departmentId: s.departmentId,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            },
          });
        }
      }
    }

    return {
      range: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      counts: {
        total: events.length,
        tasks: events.filter((e) => e.category === "task").length,
        production: events.filter((e) => e.category === "production").length,
        deliveries: events.filter((e) => e.category === "delivery").length,
        crm: events.filter((e) => e.category === "crm").length,
        shifts: events.filter((e) => e.category === "shift").length,
      },
      events,
    };
  }

  async updateUnifiedEventStatus(
    organizationId: string,
    eventId: string,
    dto: { category: "task" | "production" | "delivery" | "crm" | "shift"; status: string; scheduledDate?: string; notes?: string },
    actorMemberId?: string,
  ) {
    const rawId = eventId.includes("-") ? eventId.split("-")[1] : eventId;

    switch (dto.category) {
      case "task": {
        const updateData: any = { status: dto.status as any };
        if (dto.scheduledDate) {
          updateData.dueDate = new Date(dto.scheduledDate);
        }
        const updated = await this.prisma.client.task.updateMany({
          where: { id: rawId, organizationId },
          data: updateData,
        });
        if (updated.count === 0) throw new NotFoundException("Task not found");
        return { success: true, category: "task", id: rawId, status: dto.status };
      }

      case "production": {
        const updateData: any = { status: dto.status as any };
        if (dto.scheduledDate) {
          updateData.scheduledStartAt = new Date(dto.scheduledDate);
        }
        if (dto.status === "COMPLETED") {
          updateData.completedAt = new Date();
        } else if (dto.status === "IN_PROGRESS") {
          updateData.startedAt = new Date();
        }
        const updated = await this.prisma.client.batch.updateMany({
          where: { id: rawId, organizationId },
          data: updateData,
        });
        if (updated.count === 0) throw new NotFoundException("Production batch not found");
        return { success: true, category: "production", id: rawId, status: dto.status };
      }

      case "delivery": {
        const updated = await this.prisma.client.fulfillment.updateMany({
          where: { id: rawId, transaction: { organizationId } },
          data: {
            status: dto.status as any,
            ...(dto.notes ? { deliveryNotes: dto.notes } : {}),
          },
        });
        if (updated.count === 0) throw new NotFoundException("Delivery fulfillment not found");
        return { success: true, category: "delivery", id: rawId, status: dto.status };
      }

      case "crm": {
        const updateData: any = { status: dto.status as any };
        if (dto.scheduledDate) {
          updateData.dueDate = new Date(dto.scheduledDate);
        }
        if (dto.status === "COMPLETED") {
          updateData.completedAt = new Date();
        }
        const updated = await this.prisma.client.crmFollowUp.updateMany({
          where: { id: rawId, organizationId },
          data: updateData,
        });
        if (updated.count === 0) throw new NotFoundException("CRM follow-up not found");
        return { success: true, category: "crm", id: rawId, status: dto.status };
      }

      case "shift": {
        const updated = await this.prisma.client.staffShift.updateMany({
          where: { id: rawId, organizationId },
          data: {
            isActive: dto.status === "ACTIVE",
          },
        });
        if (updated.count === 0) throw new NotFoundException("Staff shift not found");
        return { success: true, category: "shift", id: rawId, status: dto.status };
      }

      default:
        throw new BadRequestException("Unsupported event category");
    }
  }

}
