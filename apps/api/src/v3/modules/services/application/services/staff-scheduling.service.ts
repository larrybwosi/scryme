import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class StaffSchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async createShift(orgId: string, memberId: string, data: { dayOfWeek: number, startTime: string, endTime: string }) {
    return this.prisma.staffShift.create({
      data: {
        ...data,
        memberId,
        organizationId: orgId,
      },
    });
  }

  async getStaffShifts(orgId: string, memberId: string) {
    return this.prisma.staffShift.findMany({
      where: { organizationId: orgId, memberId },
      include: { breaks: true },
    });
  }

  async addBreak(shiftId: string, data: { startTime: string, endTime: string, description?: string }) {
    return this.prisma.staffBreak.create({
      data: {
        ...data,
        shiftId,
      },
    });
  }

  async isStaffAvailable(memberId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const dayOfWeek = startTime.getDay();
    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    const shifts = await this.prisma.staffShift.findMany({
        where: { memberId, dayOfWeek, isActive: true },
        include: { breaks: true }
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
                return (startMinutes < breakEnd && endMinutes > breakStart);
            });

            if (!inBreak) return true;
        }
    }

    return false;
  }
}
