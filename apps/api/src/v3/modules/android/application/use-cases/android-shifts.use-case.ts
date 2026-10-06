import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TaskPriority, TaskStatus, ShiftTradeStatus } from "@repo/db";
import {
  AndroidCreateShiftDto,
  AndroidShiftBreakDto,
  AndroidRequestShiftTradeDto,
  AndroidProcessShiftTradeDto,
  AndroidCreateTaskDto,
  AndroidUpdateTaskDto,
} from "../dto/android-auth.dto";

@Injectable()
export class AndroidShiftsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentMemberShifts(v3Context: any) {
    const { organizationId, memberId } = v3Context;
    if (!memberId) {
      return [];
    }

    const shifts = await this.prisma.client.staffShift.findMany({
      where: {
        organizationId,
        memberId,
      },
      include: {
        breaks: true,
      },
      orderBy: { dayOfWeek: "asc" },
    });

    return shifts.map((s) => ({
      id: s.id,
      memberId: s.memberId,
      locationId: s.locationId,
      locationName: "Main Location",
      startTime: s.startTime,
      endTime: s.endTime,
      dayOfWeek: s.dayOfWeek,
      status: s.isActive ? "ACTIVE" : "INACTIVE",
      role: s.roleTags?.[0] || "STAFF",
      notes: "",
      breaks: s.breaks.map((b) => ({
        id: b.id,
        breakType: "MEAL",
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    }));
  }

  async getOrganizationShifts(v3Context: any, memberId?: string, locationId?: string) {
    const { organizationId } = v3Context;

    const where: any = { organizationId };
    if (memberId) where.memberId = memberId;
    if (locationId) where.locationId = locationId;

    const shifts = await this.prisma.client.staffShift.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
          },
        },
        breaks: true,
      },
      orderBy: { dayOfWeek: "asc" },
    });

    return shifts.map((s) => ({
      id: s.id,
      memberId: s.memberId,
      memberName: s.member?.user?.name || "Staff Member",
      locationId: s.locationId,
      locationName: "Main Location",
      startTime: s.startTime,
      endTime: s.endTime,
      dayOfWeek: s.dayOfWeek,
      status: s.isActive ? "ACTIVE" : "INACTIVE",
      role: s.roleTags?.[0] || "STAFF",
      notes: "",
      breaks: s.breaks.map((b) => ({
        id: b.id,
        breakType: "MEAL",
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    }));
  }

  async createStaffShift(v3Context: any, targetMemberId: string, dto: AndroidCreateShiftDto) {
    const { organizationId } = v3Context;

    let locationId = dto.locationId || v3Context.locationId;
    if (!locationId) {
      const defaultLoc = await this.prisma.client.inventoryLocation.findFirst({
        where: { organizationId, isDefault: true },
        select: { id: true },
      }) || await this.prisma.client.inventoryLocation.findFirst({
        where: { organizationId },
        select: { id: true },
      });
      locationId = defaultLoc?.id;
    }

    if (!locationId) {
      throw new BadRequestException("No location available to create shift");
    }

    const startDate = new Date(dto.startTime);
    const dayOfWeek = startDate.getDay();
    const startTimeStr = startDate.toTimeString().slice(0, 5);
    const endDate = new Date(dto.endTime);
    const endTimeStr = endDate.toTimeString().slice(0, 5);

    const shift = await this.prisma.client.staffShift.create({
      data: {
        organizationId,
        memberId: targetMemberId,
        locationId,
        dayOfWeek,
        startTime: startTimeStr,
        endTime: endTimeStr,
        roleTags: dto.role ? [dto.role] : ["STAFF"],
        isActive: true,
      },
      include: {
        member: { select: { user: { select: { name: true } } } },
      },
    });

    return {
      id: shift.id,
      memberId: shift.memberId,
      memberName: shift.member?.user?.name || "Staff Member",
      locationId: shift.locationId,
      locationName: "Main Location",
      startTime: shift.startTime,
      endTime: shift.endTime,
      dayOfWeek: shift.dayOfWeek,
      status: shift.isActive ? "ACTIVE" : "INACTIVE",
      role: shift.roleTags?.[0] || "STAFF",
      notes: dto.notes || "",
      breaks: [],
    };
  }

  async addShiftBreak(v3Context: any, shiftId: string, dto: AndroidShiftBreakDto) {
    const { organizationId } = v3Context;

    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: shiftId, organizationId },
    });

    if (!shift) {
      throw new NotFoundException(`Shift '${shiftId}' not found`);
    }

    const startBreak = new Date(dto.startTime).toTimeString().slice(0, 5);
    const endBreak = dto.endTime ? new Date(dto.endTime).toTimeString().slice(0, 5) : startBreak;

    await this.prisma.client.staffBreak.create({
      data: {
        shiftId,
        startTime: startBreak,
        endTime: endBreak,
        description: dto.breakType || "MEAL",
      },
    });

    return (await this.getOrganizationShifts(v3Context, shift.memberId))[0];
  }

  async getShiftTrades(v3Context: any, memberId?: string, status?: string) {
    const { organizationId } = v3Context;

    const where: any = { organizationId };
    if (memberId) {
      where.OR = [
        { requesterMemberId: memberId },
        { targetMemberId: memberId },
      ];
    }
    if (status) where.status = status as ShiftTradeStatus;

    const trades = await this.prisma.client.shiftTradeRequest.findMany({
      where,
      include: {
        requesterMember: { select: { user: { select: { name: true } } } },
        targetMember: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return trades.map((t) => ({
      id: t.id,
      shiftId: t.shiftId,
      requestingMemberId: t.requesterMemberId,
      requestingMemberName: t.requesterMember?.user?.name || "Staff",
      targetMemberId: t.targetMemberId,
      targetMemberName: t.targetMember?.user?.name || "Staff",
      status: t.status,
      reason: t.reason || "",
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async requestShiftTrade(v3Context: any, dto: AndroidRequestShiftTradeDto) {
    const { organizationId, memberId } = v3Context;

    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: dto.shiftId, organizationId },
    });

    if (!shift) {
      throw new NotFoundException(`Shift '${dto.shiftId}' not found`);
    }

    const trade = await this.prisma.client.shiftTradeRequest.create({
      data: {
        organizationId,
        shiftId: dto.shiftId,
        requesterMemberId: memberId || shift.memberId,
        targetMemberId: dto.targetMemberId,
        reason: dto.reason,
        status: ShiftTradeStatus.PENDING,
      },
    });

    return {
      id: trade.id,
      shiftId: trade.shiftId,
      requestingMemberId: trade.requesterMemberId,
      targetMemberId: trade.targetMemberId,
      status: trade.status,
      reason: trade.reason || "",
      createdAt: trade.createdAt.toISOString(),
    };
  }

  async processShiftTrade(v3Context: any, id: string, dto: AndroidProcessShiftTradeDto) {
    const { organizationId } = v3Context;

    const trade = await this.prisma.client.shiftTradeRequest.findFirst({
      where: { id, organizationId },
    });

    if (!trade) {
      throw new NotFoundException(`Shift trade '${id}' not found`);
    }

    const newStatus = dto.action === "ACCEPT" ? ShiftTradeStatus.APPROVED : dto.action === "REJECT" ? ShiftTradeStatus.REJECTED : ShiftTradeStatus.CANCELLED;

    const updated = await this.prisma.client.shiftTradeRequest.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    return {
      id: updated.id,
      shiftId: updated.shiftId,
      status: updated.status,
    };
  }

  async getStaffTasks(v3Context: any, memberId?: string, status?: string) {
    const { organizationId } = v3Context;

    const where: any = { organizationId };
    if (memberId) where.memberId = memberId;
    if (status) where.status = status as TaskStatus;

    const tasks = await this.prisma.client.staffTask.findMany({
      where,
      include: {
        member: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      status: t.status,
      priority: t.priority || "MEDIUM",
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      assignedMemberId: t.memberId,
      assignedMemberName: t.member?.user?.name || null,
    }));
  }

  async createStaffTask(v3Context: any, dto: AndroidCreateTaskDto) {
    const { organizationId, memberId } = v3Context;

    const task = await this.prisma.client.staffTask.create({
      data: {
        organizationId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        memberId: dto.assignedMemberId || memberId,
        priority: (dto.priority as TaskPriority) || TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assignedMemberId: task.memberId,
    };
  }

  async updateStaffTask(v3Context: any, id: string, dto: AndroidUpdateTaskDto) {
    const { organizationId } = v3Context;

    const task = await this.prisma.client.staffTask.findFirst({
      where: { id, organizationId },
    });

    if (!task) {
      throw new NotFoundException(`Task '${id}' not found`);
    }

    const updated = await this.prisma.client.staffTask.update({
      where: { id },
      data: {
        title: dto.title || task.title,
        description: dto.description ?? task.description,
        status: (dto.status as TaskStatus) || task.status,
        priority: (dto.priority as TaskPriority) || task.priority,
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description || "",
      status: updated.status,
      priority: updated.priority,
    };
  }
}
