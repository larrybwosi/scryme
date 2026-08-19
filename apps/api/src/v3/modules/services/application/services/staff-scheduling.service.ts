import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class StaffSchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async createShift(
    orgId: string,
    memberId: string,
    data: { dayOfWeek: number; startTime: string; endTime: string },
  ) {
    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId: orgId },
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    return this.prisma.client.staffShift.create({
      data: {
        ...data,
        memberId,
        organizationId: orgId,
      },
    });
  }

  async getStaffShifts(orgId: string, memberId: string) {
    return this.prisma.client.staffShift.findMany({
      where: { organizationId: orgId, memberId },
      include: { breaks: true },
    });
  }

  async getShifts(
    orgId: string,
    filters: { memberId?: string; dayOfWeek?: number; isActive?: boolean },
  ) {
    const where: any = { organizationId: orgId };

    if (filters.memberId) {
      where.memberId = filters.memberId;
    }

    if (filters.dayOfWeek !== undefined) {
      where.dayOfWeek = filters.dayOfWeek;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.client.staffShift.findMany({
      where,
      include: {
        breaks: true,
        member: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async addBreak(
    orgId: string,
    shiftId: string,
    data: { startTime: string; endTime: string; description?: string },
  ) {
    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: shiftId, organizationId: orgId },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    return this.prisma.client.staffBreak.create({
      data: {
        ...data,
        shiftId,
      },
    });
  }

  async isStaffAvailable(
    memberId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<boolean> {
    const dayOfWeek = startTime.getDay();
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    /**
     * OPTIMIZATION (Bolt ⚡): Replaced broad Prisma 'include' with a targeted 'select' block.
     * Retrieving the entire staffShift and nested breaks objects fetches unnecessary columns
     * (e.g., description, timestamps, and relational fields). This precise select limits
     * database I/O, network transfer, and object serialization/deserialization overhead.
     */
    const shifts = await this.prisma.client.staffShift.findMany({
      where: { memberId, dayOfWeek, isActive: true },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        breaks: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (shifts.length === 0) return false;

    // Check if within any shift and not within any break
    for (const shift of shifts) {
      const shiftStart = timeToMinutes(shift.startTime);
      const shiftEnd = timeToMinutes(shift.endTime);

      if (startMinutes >= shiftStart && endMinutes <= shiftEnd) {
        const inBreak = shift.breaks.some(b => {
          const breakStart = timeToMinutes(b.startTime);
          const breakEnd = timeToMinutes(b.endTime);
          return startMinutes < breakEnd && endMinutes > breakStart;
        });

        if (!inBreak) return true;
      }
    }

    return false;
  }
}
