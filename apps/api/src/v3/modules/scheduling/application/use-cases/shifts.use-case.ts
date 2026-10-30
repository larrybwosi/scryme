import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../../../prisma/prisma.service";
import { FirebaseMessagingService } from "@/common/firebase/firebase-messaging.service";
import {
  CreateShiftDto,
  ProcessShiftTradeDto,
  RequestShiftTradeDto,
  ShiftBreakDto,
  UpdateShiftDto,
} from "../../dtos/scheduling.dto";

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

@Injectable()
export class ShiftsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseMessagingService: FirebaseMessagingService,
  ) {}

  private async validateShiftOverlap(
    organizationId: string,
    memberId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeShiftId?: string,
  ) {
    const existingShifts = await this.prisma.client.staffShift.findMany({
      where: {
        organizationId,
        memberId,
        dayOfWeek,
        isActive: true,
        ...(excludeShiftId ? { NOT: { id: excludeShiftId } } : {}),
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    if (newEnd <= newStart) {
      throw new BadRequestException("End time must be after start time");
    }

    for (const s of existingShifts) {
      const sStart = toMinutes(s.startTime);
      const sEnd = toMinutes(s.endTime);

      if (newStart < sEnd && sStart < newEnd) {
        throw new BadRequestException(
          `Overlaps with existing active shift (${s.startTime} - ${s.endTime})`,
        );
      }
    }
  }

  private async validateBreak(
    organizationId: string,
    shiftId: string,
    startTime: string,
    endTime: string,
    excludeBreakId?: string,
  ) {
    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: shiftId, organizationId },
      include: { breaks: true },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    const sStart = toMinutes(shift.startTime);
    const sEnd = toMinutes(shift.endTime);
    const bStart = toMinutes(startTime);
    const bEnd = toMinutes(endTime);

    if (bEnd <= bStart) {
      throw new BadRequestException("Break end time must be after start time");
    }

    if (bStart < sStart || bEnd > sEnd) {
      throw new BadRequestException(
        `Break must be within the shift duration (${shift.startTime} - ${shift.endTime})`,
      );
    }

    for (const b of shift.breaks) {
      if (excludeBreakId && b.id === excludeBreakId) continue;
      const existingStart = toMinutes(b.startTime);
      const existingEnd = toMinutes(b.endTime);

      if (bStart < existingEnd && existingStart < bEnd) {
        throw new BadRequestException(
          `Break overlaps with another break (${b.startTime} - ${b.endTime})`,
        );
      }
    }
  }

  async getStaffShifts(organizationId: string, memberId?: string, locationId?: string) {
    return this.prisma.client.staffShift.findMany({
      where: {
        organizationId,
        ...(memberId ? { memberId } : {}),
        ...(locationId ? { locationId } : {}),
      },
      include: {
        breaks: true,
        member: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async createStaffShift(organizationId: string, dto: CreateShiftDto) {
    const member = await this.prisma.client.member.findFirst({
      where: { id: dto.memberId, organizationId },
    });
    if (!member) {
      throw new BadRequestException("Member not found in organization");
    }

    if (dto.isActive !== false) {
      await this.validateShiftOverlap(
        organizationId,
        dto.memberId,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
      );
    }

    if (dto.locationId) {
      const loc = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: dto.locationId, organizationId },
      });
      if (!loc) {
        throw new BadRequestException("Location not found or belongs to another organization");
      }
    }

    if (dto.departmentId) {
      const dept = await this.prisma.client.department.findFirst({
        where: { id: dto.departmentId, organizationId },
      });
      if (!dept) {
        throw new BadRequestException("Department not found or belongs to another organization");
      }
    }

    const shift = await this.prisma.client.staffShift.create({
      data: {
        memberId: dto.memberId,
        organizationId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isActive: dto.isActive !== false,
        locationId: dto.locationId || null,
        departmentId: dto.departmentId || null,
        roleTags: dto.roleTags || [],
      },
      include: {
        breaks: true,
        member: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
      },
    });

    this.firebaseMessagingService
      .sendToMembers([dto.memberId], {
        title: "New Shift Assigned",
        body: `Shift scheduled for day ${dto.dayOfWeek} (${dto.startTime} - ${dto.endTime})`,
        data: {
          eventType: "SHIFT_ASSIGNED",
          shiftId: shift.id,
          organizationId,
        },
      })
      .catch(() => {});

    return shift;
  }

  async updateStaffShift(organizationId: string, shiftId: string, dto: UpdateShiftDto) {
    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: shiftId, organizationId },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    const mergedDayOfWeek = dto.dayOfWeek !== undefined ? dto.dayOfWeek : shift.dayOfWeek;
    const mergedStartTime = dto.startTime !== undefined ? dto.startTime : shift.startTime;
    const mergedEndTime = dto.endTime !== undefined ? dto.endTime : shift.endTime;
    const mergedIsActive = dto.isActive !== undefined ? dto.isActive : shift.isActive;

    if (dto.locationId) {
      const loc = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: dto.locationId, organizationId },
      });
      if (!loc) {
        throw new BadRequestException("Location not found or belongs to another organization");
      }
    }

    if (dto.departmentId) {
      const dept = await this.prisma.client.department.findFirst({
        where: { id: dto.departmentId, organizationId },
      });
      if (!dept) {
        throw new BadRequestException("Department not found or belongs to another organization");
      }
    }

    if (mergedIsActive) {
      await this.validateShiftOverlap(
        organizationId,
        shift.memberId,
        mergedDayOfWeek,
        mergedStartTime,
        mergedEndTime,
        shiftId,
      );
    }

    if (dto.startTime !== undefined || dto.endTime !== undefined) {
      const breaks = await this.prisma.client.staffBreak.findMany({
        where: { shiftId },
      });

      const sStart = toMinutes(mergedStartTime);
      const sEnd = toMinutes(mergedEndTime);

      for (const b of breaks) {
        const bStart = toMinutes(b.startTime);
        const bEnd = toMinutes(b.endTime);

        if (bStart < sStart || bEnd > sEnd) {
          throw new BadRequestException(
            `Shift times cannot be updated because break (${b.startTime} - ${b.endTime}) would fall outside the new shift duration.`,
          );
        }
      }
    }

    await this.prisma.client.staffShift.updateMany({
      where: { id: shiftId, organizationId },
      data: {
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isActive: dto.isActive,
        ...(dto.locationId !== undefined ? { locationId: dto.locationId } : {}),
        ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
        ...(dto.roleTags !== undefined ? { roleTags: dto.roleTags } : {}),
      },
    });

    const updated = await this.prisma.client.staffShift.findFirstOrThrow({
      where: { id: shiftId, organizationId },
      include: { breaks: true },
    });

    return updated;
  }

  async deleteStaffShift(organizationId: string, shiftId: string) {
    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: shiftId, organizationId },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    await this.prisma.client.staffShift.deleteMany({
      where: { id: shiftId, organizationId },
    });

    return { success: true, id: shiftId };
  }

  async addStaffBreak(organizationId: string, shiftId: string, dto: ShiftBreakDto) {
    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: shiftId, organizationId },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    await this.validateBreak(organizationId, shiftId, dto.startTime, dto.endTime);

    const breakItem = await this.prisma.client.staffBreak.create({
      data: {
        shiftId,
        startTime: dto.startTime,
        endTime: dto.endTime,
        description: dto.description || null,
      },
    });

    return breakItem;
  }

  async deleteStaffBreak(organizationId: string, breakId: string) {
    const b = await this.prisma.client.staffBreak.findFirst({
      where: {
        id: breakId,
        shift: { organizationId },
      },
    });

    if (!b) {
      throw new NotFoundException("Break not found");
    }

    await this.prisma.client.staffBreak.deleteMany({
      where: {
        id: breakId,
        shift: { organizationId },
      },
    });

    return { success: true, id: breakId };
  }

  async getShiftTrades(organizationId: string, memberId?: string, status?: string) {
    const where: any = { organizationId };

    if (memberId) {
      where.OR = [{ requesterMemberId: memberId }, { targetMemberId: memberId }];
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.client.shiftTradeRequest.findMany({
      where,
      include: {
        requesterMember: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
        targetMember: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
        shift: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, memberId: true } },
        offeredShift: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, memberId: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async requestShiftTrade(
    organizationId: string,
    requesterMemberId: string,
    dto: RequestShiftTradeDto,
  ) {
    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: dto.shiftId, organizationId },
    });
    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    if (shift.memberId !== requesterMemberId) {
      throw new ForbiddenException("You can only trade or swap your own shifts");
    }

    if (dto.offeredShiftId) {
      const offered = await this.prisma.client.staffShift.findFirst({
        where: { id: dto.offeredShiftId, organizationId },
      });
      if (!offered) {
        throw new NotFoundException("Offered shift not found");
      }
    }

    const trade = await this.prisma.client.shiftTradeRequest.create({
      data: {
        organizationId,
        requesterMemberId,
        targetMemberId: dto.targetMemberId || null,
        shiftId: dto.shiftId,
        offeredShiftId: dto.offeredShiftId || null,
        type: dto.type || "SWAP",
        reason: dto.reason || null,
        status: "PENDING",
      },
      include: {
        requesterMember: { select: { id: true, user: { select: { name: true, email: true } } } },
        targetMember: { select: { id: true, user: { select: { name: true, email: true } } } },
        shift: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
      },
    });

    return trade;
  }

  async processShiftTrade(
    organizationId: string,
    tradeId: string,
    approverMemberId: string | null,
    dto: ProcessShiftTradeDto,
  ) {
    const trade = await this.prisma.client.shiftTradeRequest.findFirst({
      where: { id: tradeId, organizationId },
      include: { shift: true, offeredShift: true },
    });

    if (!trade) {
      throw new NotFoundException("Shift trade request not found");
    }

    if (dto.action === "CANCEL") {
      await this.prisma.client.shiftTradeRequest.updateMany({
        where: { id: tradeId, organizationId },
        data: { status: "CANCELLED" },
      });
      return { success: true, status: "CANCELLED" };
    }

    if (dto.action === "REJECT") {
      await this.prisma.client.shiftTradeRequest.updateMany({
        where: { id: tradeId, organizationId },
        data: { status: "REJECTED", approvedById: approverMemberId },
      });
      return { success: true, status: "REJECTED" };
    }

    if (dto.action === "APPROVE") {
      if (trade.type === "SWAP" && trade.offeredShift && trade.targetMemberId) {
        await this.prisma.client.$transaction([
          this.prisma.client.staffShift.updateMany({
            where: { id: trade.shiftId, organizationId },
            data: { memberId: trade.targetMemberId },
          }),
          this.prisma.client.staffShift.updateMany({
            where: { id: trade.offeredShiftId!, organizationId },
            data: { memberId: trade.requesterMemberId },
          }),
          this.prisma.client.shiftTradeRequest.updateMany({
            where: { id: tradeId, organizationId },
            data: { status: "APPROVED", approvedById: approverMemberId },
          }),
        ]);
      } else if (trade.targetMemberId) {
        await this.prisma.client.$transaction([
          this.prisma.client.staffShift.updateMany({
            where: { id: trade.shiftId, organizationId },
            data: { memberId: trade.targetMemberId },
          }),
          this.prisma.client.shiftTradeRequest.updateMany({
            where: { id: tradeId, organizationId },
            data: { status: "APPROVED", approvedById: approverMemberId },
          }),
        ]);
      } else {
        await this.prisma.client.shiftTradeRequest.updateMany({
          where: { id: tradeId, organizationId },
          data: { status: "APPROVED", approvedById: approverMemberId },
        });
      }

      return { success: true, status: "APPROVED" };
    }

    throw new BadRequestException("Invalid action");
  }
}
