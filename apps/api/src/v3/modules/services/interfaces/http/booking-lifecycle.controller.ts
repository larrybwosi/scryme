import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { BookingLifecycleService } from "../../application/services/booking-lifecycle.service";
import { BookingConflictDetectionService } from "../../application/services/booking-conflict-detection.service";
import { BookingTaskGeneratorService } from "../../application/services/booking-task-generator.service";
import { PrismaService } from "@/prisma/prisma.service";
import {
  TransitionBookingStatusDto,
  CheckBookingConflictsDto,
  UpdateChecklistItemDto,
  CreateChecklistTemplateDto,
  GenerateBookingTasksRequestDto,
  AssignBookingStaffDto,
} from "../../application/dto/booking-lifecycle.dto";

@ApiTags("V3 Bookings Management & Lifecycle")
@Controller("bookings")
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
export class BookingLifecycleController {
  constructor(
    private readonly lifecycleService: BookingLifecycleService,
    private readonly conflictDetector: BookingConflictDetectionService,
    private readonly taskGenerator: BookingTaskGeneratorService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("conflicts/check")
  @Permissions("services:read")
  @ApiOperation({ summary: "Check for booking conflicts (staff schedule, overlapping shifts, room capacity, customer double-booking)" })
  async checkConflicts(@Req() req: any, @Body() body: CheckBookingConflictsDto) {
    const orgId = req.organization?.id;
    return this.conflictDetector.detectConflicts({
      orgId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      staffMemberIds: body.staffMemberIds,
      customerId: body.customerId,
      locationId: body.locationId,
      excludeBookingId: body.excludeBookingId,
    });
  }

  @Get()
  @Permissions("services:read")
  @ApiOperation({ summary: "List organization bookings for projects and control dashboards" })
  async listBookings(
    @Req() req: any,
    @Query("status") status?: string,
    @Query("limit") limit = "50",
    @Query("offset") offset = "0",
  ) {
    const orgId = req.organization?.id;
    return this.prisma.client.serviceBooking.findMany({
      where: {
        organizationId: orgId,
        ...(status && status !== "ALL" ? { status: status as any } : {}),
      },
      include: {
        service: true,
        customer: true,
        location: true,
        staff: {
          include: {
            member: {
              include: { user: { select: { name: true, email: true, image: true } } },
            },
          },
        },
        bookingTasks: {
          include: {
            checklistItems: {
              include: {
                completedBy: {
                  include: { user: { select: { name: true } } },
                },
              },
              orderBy: { order: "asc" },
            },
            assignedTo: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        checklistItems: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { scheduledStartTime: "desc" },
      take: Math.min(parseInt(limit, 10) || 50, 100),
      skip: parseInt(offset, 10) || 0,
    });
  }

  @Get(":id")
  @Permissions("services:read")
  @ApiOperation({ summary: "Get detailed booking information with tasks and checklist items" })
  async getBookingDetail(@Req() req: any, @Param("id") id: string) {
    const orgId = req.organization?.id;
    return this.prisma.client.serviceBooking.findFirst({
      where: { id, organizationId: orgId },
      include: {
        service: true,
        customer: true,
        location: true,
        staff: {
          include: {
            member: {
              include: { user: { select: { name: true, email: true, image: true } } },
            },
          },
        },
        bookingTasks: {
          include: {
            checklistItems: {
              include: {
                completedBy: {
                  include: { user: { select: { name: true } } },
                },
              },
              orderBy: { order: "asc" },
            },
            assignedTo: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        checklistItems: {
          orderBy: { order: "asc" },
        },
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  @Post(":id/lifecycle/transition")
  @Permissions("services:write")
  @ApiOperation({ summary: "Transition booking lifecycle status with soft conflict checks and override capability" })
  async transitionStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: TransitionBookingStatusDto,
  ) {
    const orgId = req.organization?.id;
    const actorMemberId = req.user?.memberId || req.user?.id;
    return this.lifecycleService.transitionStatus({
      orgId,
      bookingId: id,
      targetStatus: body.status,
      actorMemberId,
      reason: body.reason,
      staffMemberIds: body.staffMemberIds,
      overrideConflict: body.overrideConflict,
    });
  }

  @Post(":id/staff/assign")
  @Permissions("services:write")
  @ApiOperation({ summary: "Assign or reassign staff to a booking with conflict verification" })
  async assignStaff(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: AssignBookingStaffDto,
  ) {
    const orgId = req.organization?.id;
    const actorMemberId = req.user?.memberId || req.user?.id;
    return this.lifecycleService.assignStaff({
      orgId,
      bookingId: id,
      staffMemberIds: body.staffMemberIds,
      actorMemberId,
      reason: body.reason,
      overrideConflict: body.overrideConflict,
    });
  }

  @Post(":id/tasks/generate")
  @Permissions("services:write")
  @ApiOperation({ summary: "Generate operational tasks and checklist items for a booking" })
  async generateTasks(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: GenerateBookingTasksRequestDto = {},
  ) {
    const orgId = req.organization?.id;
    return this.taskGenerator.generateTasksForBooking({
      orgId,
      bookingId: id,
      assigneeMemberId: body.assigneeMemberId,
      projectId: body.projectId,
    });
  }

  @Put(":id/checklist/:itemId")
  @Permissions("services:write")
  @ApiOperation({ summary: "Update checklist item completion state and evaluate task/booking completion" })
  async updateChecklistItem(
    @Req() req: any,
    @Param("id") bookingId: string,
    @Param("itemId") itemId: string,
    @Body() body: UpdateChecklistItemDto,
  ) {
    const orgId = req.organization?.id;
    const memberId = req.user?.memberId || req.user?.id;
    return this.lifecycleService.updateChecklistItem({
      orgId,
      bookingId,
      itemId,
      isCompleted: body.isCompleted,
      memberId,
    });
  }

  @Get("templates/checklist")
  @Permissions("services:read")
  @ApiOperation({ summary: "List checklist templates for services" })
  async listChecklistTemplates(@Req() req: any, @Query("serviceId") serviceId?: string) {
    const orgId = req.organization?.id;
    return this.prisma.client.checklistTemplate.findMany({
      where: {
        organizationId: orgId,
        ...(serviceId ? { serviceId } : {}),
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
        service: {
          select: { id: true, name: true, sku: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("templates/checklist")
  @Permissions("services:write")
  @ApiOperation({ summary: "Create a new checklist template for booked services" })
  async createChecklistTemplate(@Req() req: any, @Body() body: CreateChecklistTemplateDto) {
    const orgId = req.organization?.id;
    return this.prisma.client.checklistTemplate.create({
      data: {
        organizationId: orgId,
        serviceId: body.serviceId,
        title: body.title,
        description: body.description,
        isActive: true,
        items: body.items && body.items.length > 0 ? {
          create: body.items.map((item, idx) => ({
            title: item.title,
            description: item.description,
            stage: item.stage,
            isRequired: item.isRequired ?? true,
            order: item.order ?? idx,
          })),
        } : undefined,
      },
      include: { items: true },
    });
  }
}
