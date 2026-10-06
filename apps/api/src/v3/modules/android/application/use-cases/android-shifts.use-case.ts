import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
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
        location: {
          select: { id: true, name: true },
        },
        breaks: true,
      },
      orderBy: { startTime: "asc" },
    });

    return shifts.map((s) => ({
      id: s.id,
      memberId: s.memberId,
      locationId: s.locationId,
      locationName: s.location?.name || "Main Location",
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      status: s.status,
      role: s.role || "STAFF",
      notes: s.notes || "",
      breaks: s.breaks.map((b) => ({
        id: b.id,
        breakType: b.breakType || "MEAL",
        startTime: b.startTime.toISOString(),
        endTime: b.endTime ? b.endTime.toISOString() : null,
        paid: b.paid,
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
        location: {
          select: { id: true, name: true },
        },
        breaks: true,
      },
      orderBy: { startTime: "asc" },
    });

    return shifts.map((s) => ({
      id: s.id,
      memberId: s.memberId,
      memberName: s.member?.user?.name || "Staff Member",
      locationId: s.locationId,
      locationName: s.location?.name || "Main Location",
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      status: s.status,
      role: s.role || "STAFF",
      notes: s.notes || "",
      breaks: s.breaks.map((b) => ({
        id: b.id,
        breakType: b.breakType || "MEAL",
        startTime: b.startTime.toISOString(),
        endTime: b.endTime ? b.endTime.toISOString() : null,
        paid: b.paid,
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

    const shift = await this.prisma.client.staffShift.create({
      data: {
        organizationId,
        memberId: targetMemberId,
        locationId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        role: dto.role || "STAFF",
        notes: dto.notes,
        status: "SCHEDULED",
      },
      include: {
        location: { select: { name: true } },
        member: { select: { user: { select: { name: true } } } },
      },
    });

    return {
      id: shift.id,
      memberId: shift.memberId,
      memberName: shift.member?.user?.name || "Staff Member",
      locationId: shift.locationId,
      locationName: shift.location?.name || "",
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime.toISOString(),
      status: shift.status,
      role: shift.role,
      notes: shift.notes || "",
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

    await this.prisma.client.shiftBreak.create({
      data: {
        shiftId,
        breakType: dto.breakType || "MEAL",
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        paid: dto.paid ?? false,
      },
    });

    return this.getOrganizationShifts(v3Context, shift.memberId)[0];
  }

  async getShiftTrades(v3Context: any, memberId?: string, status?: string) {
    const { organizationId } = v3Context;

    const where: any = { organizationId };
    if (memberId) {
      where.OR = [
        { requestingMemberId: memberId },
        { targetMemberId: memberId },
      ];
    }
    if (status) where.status = status;

    const trades = await this.prisma.client.shiftTrade.findMany({
      where,
      include: {
        shift: true,
        requestingMember: { select: { user: { select: { name: true } } } },
        targetMember: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return trades.map((t) => ({
      id: t.id,
      shiftId: t.shiftId,
      requestingMemberId: t.requestingMemberId,
      requestingMemberName: t.requestingMember?.user?.name || "Staff",
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

    const trade = await this.prisma.client.shiftTrade.create({
      data: {
        organizationId,
        shiftId: dto.shiftId,
        requestingMemberId: memberId || shift.memberId,
        targetMemberId: dto.targetMemberId,
        reason: dto.reason,
        status: "PENDING",
      },
    });

    return {
      id: trade.id,
      shiftId: trade.shiftId,
      requestingMemberId: trade.requestingMemberId,
      targetMemberId: trade.targetMemberId,
      status: trade.status,
      reason: trade.reason || "",
      createdAt: trade.createdAt.toISOString(),
    };
  }

  async processShiftTrade(v3Context: any, id: string, dto: AndroidProcessShiftTradeDto) {
    const { organizationId } = v3Context;

    const trade = await this.prisma.client.shiftTrade.findFirst({
      where: { id, organizationId },
    });

    if (!trade) {
      throw new NotFoundException(`Shift trade '${id}' not found`);
    }

    const updated = await this.prisma.client.shiftTrade.update({
      where: { id },
      data: {
        status: dto.action === "ACCEPT" ? "APPROVED" : dto.action === "REJECT" ? "REJECTED" : "CANCELLED",
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
    if (memberId) where.assignedMemberId = memberId;
    if (status) where.status = status;

    const tasks = await this.prisma.client.staffTask.findMany({
      where,
      include: {
        assignedMember: { select: { user: { select: { name: true } } } },
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
      assignedMemberId: t.assignedMemberId,
      assignedMemberName: t.assignedMember?.user?.name || null,
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
        assignedMemberId: dto.assignedMemberId || memberId,
        priority: dto.priority || "MEDIUM",
        status: "PENDING",
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assignedMemberId: task.assignedMemberId,
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
        status: dto.status || task.status,
        priority: dto.priority || task.priority,
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
