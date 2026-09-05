"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

async function checkShiftManagementPermission(session: any) {
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const role = session.role as string;
  if (role === "OWNER" || role === "ADMIN") {
    return { success: true };
  }

  if (role === "MANAGER") {
    const settings = await db.organizationSettings.findUnique({
      where: { organizationId: session.organizationId },
      select: { managersCanManageShifts: true },
    });

    if (settings?.managersCanManageShifts) {
      return { success: true };
    }
    return {
      success: false,
      error: "Forbidden: Manager shift management is disabled",
    };
  }

  return { success: false, error: "Forbidden: Insufficient permissions" };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

async function validateShiftOverlap(
  memberId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeShiftId?: string,
) {
  const existingShifts = await db.staffShift.findMany({
    where: {
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
    return { success: false, error: "End time must be after start time" };
  }

  for (const s of existingShifts) {
    const sStart = toMinutes(s.startTime);
    const sEnd = toMinutes(s.endTime);

    // Overlap condition: (newStart < sEnd && sStart < newEnd)
    if (newStart < sEnd && sStart < newEnd) {
      return {
        success: false,
        error: `Overlaps with existing active shift (${s.startTime} - ${s.endTime})`,
      };
    }
  }

  return { success: true };
}

async function validateBreak(
  shiftId: string,
  startTime: string,
  endTime: string,
  excludeBreakId?: string,
) {
  const shift = await db.staffShift.findUnique({
    where: { id: shiftId },
    include: { breaks: true },
  });

  if (!shift) {
    return { success: false, error: "Shift not found" };
  }

  const sStart = toMinutes(shift.startTime);
  const sEnd = toMinutes(shift.endTime);
  const bStart = toMinutes(startTime);
  const bEnd = toMinutes(endTime);

  if (bEnd <= bStart) {
    return { success: false, error: "Break end time must be after start time" };
  }

  if (bStart < sStart || bEnd > sEnd) {
    return {
      success: false,
      error: `Break must be within the shift duration (${shift.startTime} - ${shift.endTime})`,
    };
  }

  for (const b of shift.breaks) {
    if (excludeBreakId && b.id === excludeBreakId) continue;
    const existingStart = toMinutes(b.startTime);
    const existingEnd = toMinutes(b.endTime);

    if (bStart < existingEnd && existingStart < bEnd) {
      return {
        success: false,
        error: `Break overlaps with another break (${b.startTime} - ${b.endTime})`,
      };
    }
  }

  return { success: true };
}

export async function getStaffShifts(memberId?: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const shifts = await db.staffShift.findMany({
      where: {
        organizationId: session.organizationId,
        ...(memberId ? { memberId } : {}),
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
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    return { success: true, data: shifts };
  } catch (error: any) {
    console.error("Error getting shifts:", error);
    return { success: false, error: error.message || "Failed to fetch shifts" };
  }
}

export async function createStaffShift(data: {
  memberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}) {
  const session = await getServerAuth();
  const permission = await checkShiftManagementPermission(session);
  if (!permission.success) return permission;

  try {
    // Validate that member belongs to organization
    const member = await db.member.findFirst({
      where: { id: data.memberId, organizationId: session!.organizationId },
    });

    if (!member) {
      return { success: false, error: "Member not found in organization" };
    }

    if (data.isActive !== false) {
      const overlap = await validateShiftOverlap(
        data.memberId,
        data.dayOfWeek,
        data.startTime,
        data.endTime,
      );
      if (!overlap.success) return overlap;
    }

    const shift = await db.staffShift.create({
      data: {
        memberId: data.memberId,
        organizationId: session!.organizationId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive !== false,
      },
    });

    revalidatePath("/staff");
    revalidatePath(`/staff/${data.memberId}`);
    return { success: true, data: shift };
  } catch (error: any) {
    console.error("Error creating shift:", error);
    return { success: false, error: error.message || "Failed to create shift" };
  }
}

export async function updateStaffShift(
  shiftId: string,
  data: {
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    isActive?: boolean;
  },
) {
  const session = await getServerAuth();
  const permission = await checkShiftManagementPermission(session);
  if (!permission.success) return permission;

  try {
    const shift = await db.staffShift.findFirst({
      where: { id: shiftId, organizationId: session!.organizationId },
    });

    if (!shift) {
      return { success: false, error: "Shift not found" };
    }

    const mergedDayOfWeek = data.dayOfWeek !== undefined ? data.dayOfWeek : shift.dayOfWeek;
    const mergedStartTime = data.startTime !== undefined ? data.startTime : shift.startTime;
    const mergedEndTime = data.endTime !== undefined ? data.endTime : shift.endTime;
    const mergedIsActive = data.isActive !== undefined ? data.isActive : shift.isActive;

    if (mergedIsActive) {
      const overlap = await validateShiftOverlap(
        shift.memberId,
        mergedDayOfWeek,
        mergedStartTime,
        mergedEndTime,
        shiftId,
      );
      if (!overlap.success) return overlap;
    }

    // Also check if existing breaks still fit inside updated shift hours
    if (data.startTime !== undefined || data.endTime !== undefined) {
      const breaks = await db.staffBreak.findMany({
        where: { shiftId },
      });

      const sStart = toMinutes(mergedStartTime);
      const sEnd = toMinutes(mergedEndTime);

      for (const b of breaks) {
        const bStart = toMinutes(b.startTime);
        const bEnd = toMinutes(b.endTime);

        if (bStart < sStart || bEnd > sEnd) {
          return {
            success: false,
            error: `Shift times cannot be updated because break (${b.startTime} - ${b.endTime}) would fall outside the new shift duration.`,
          };
        }
      }
    }

    const updated = await db.staffShift.update({
      where: { id: shiftId },
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive,
      },
    });

    revalidatePath("/staff");
    revalidatePath(`/staff/${shift.memberId}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating shift:", error);
    return { success: false, error: error.message || "Failed to update shift" };
  }
}

export async function deleteStaffShift(shiftId: string) {
  const session = await getServerAuth();
  const permission = await checkShiftManagementPermission(session);
  if (!permission.success) return permission;

  try {
    const shift = await db.staffShift.findFirst({
      where: { id: shiftId, organizationId: session!.organizationId },
    });

    if (!shift) {
      return { success: false, error: "Shift not found" };
    }

    await db.staffShift.delete({
      where: { id: shiftId },
    });

    revalidatePath("/staff");
    revalidatePath(`/staff/${shift.memberId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting shift:", error);
    return { success: false, error: error.message || "Failed to delete shift" };
  }
}

export async function addStaffBreak(
  shiftId: string,
  data: {
    startTime: string;
    endTime: string;
    description?: string;
  },
) {
  const session = await getServerAuth();
  const permission = await checkShiftManagementPermission(session);
  if (!permission.success) return permission;

  try {
    const shift = await db.staffShift.findFirst({
      where: { id: shiftId, organizationId: session!.organizationId },
    });

    if (!shift) {
      return { success: false, error: "Shift not found" };
    }

    const check = await validateBreak(shiftId, data.startTime, data.endTime);
    if (!check.success) return check;

    const b = await db.staffBreak.create({
      data: {
        shiftId,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description || null,
      },
    });

    revalidatePath("/staff");
    revalidatePath(`/staff/${shift.memberId}`);
    return { success: true, data: b };
  } catch (error: any) {
    console.error("Error adding break:", error);
    return { success: false, error: error.message || "Failed to add break" };
  }
}

export async function getSchedulingWorkspace(from: string, to: string) {
  const session = await getServerAuth();
  if (!session?.organizationId) return { success: false, error: "Unauthorized" };

  const start = new Date(from);
  const end = new Date(to);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    return { success: false, error: "Invalid schedule date range" };
  }

  try {
    const [bookings, overrides, services, locations, settings] = await Promise.all([
      db.serviceBooking.findMany({
        where: {
          organizationId: session.organizationId,
          scheduledStartTime: { lt: end },
          scheduledEndTime: { gt: start },
        },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          staff: { include: { member: { select: { id: true, user: { select: { name: true, email: true, image: true } } } } } },
          resources: { include: { resource: { select: { id: true, name: true, type: true } } } },
        },
        orderBy: { scheduledStartTime: "asc" },
        take: 250,
      }),
      db.staffScheduleOverride.findMany({
        where: {
          organizationId: session.organizationId,
          startTime: { lt: end },
          endTime: { gt: start },
        },
        include: { member: { select: { id: true, user: { select: { name: true, email: true, image: true } } } } },
        orderBy: { startTime: "asc" },
      }),
      db.service.findMany({
        where: { organizationId: session.organizationId, isActive: true },
        select: { id: true, name: true, estimatedDuration: true, price: true },
        orderBy: { name: "asc" },
      }),
      db.inventoryLocation.findMany({
        where: { organizationId: session.organizationId, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.organizationSettings.findUnique({
        where: { organizationId: session.organizationId },
        select: { defaultTimezone: true },
      }),
    ]);
    return {
      success: true,
      data: {
        bookings: bookings.map(item => ({ ...item, price: item.price.toString() })),
        overrides,
        services: services.map(item => ({ ...item, price: item.price.toString() })),
        locations,
        timezone: settings?.defaultTimezone || "UTC",
      },
    };
  } catch (error: any) {
    console.error("Error loading scheduling workspace:", error);
    return { success: false, error: error.message || "Failed to load scheduling workspace" };
  }
}

export async function transitionScheduledBooking(
  bookingId: string,
  revision: number,
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NOSHOW",
) {
  const session = await getServerAuth();
  const permission = await checkShiftManagementPermission(session);
  if (!permission.success) return permission;

  const booking = await db.serviceBooking.findFirst({
    where: { id: bookingId, organizationId: session!.organizationId },
  });
  if (!booking) return { success: false, error: "Booking not found" };
  if (booking.revision !== revision) return { success: false, error: "Booking changed. Refresh and try again." };

  const validTransitions: Record<string, string[]> = {
    REQUESTED: ["CANCELLED"],
    SCHEDULED: ["IN_PROGRESS", "CANCELLED", "NOSHOW"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
    NOSHOW: [],
  };
  if (!validTransitions[booking.status]?.includes(status)) {
    return { success: false, error: `Cannot move ${booking.status} booking to ${status}` };
  }

  const updated = await db.serviceBooking.updateMany({
    where: { id: bookingId, organizationId: session!.organizationId, revision },
    data: {
      status,
      revision: { increment: 1 },
      ...(status === "IN_PROGRESS" ? { actualStartTime: new Date() } : {}),
      ...(status === "COMPLETED" ? { actualEndTime: new Date() } : {}),
    },
  });
  if (!updated.count) return { success: false, error: "Booking was updated concurrently" };
  await db.bookingEvent.create({
    data: {
      organizationId: session!.organizationId,
      bookingId,
      source: "ADMIN",
      type: `STATUS_${status}`,
      fromStatus: booking.status,
      toStatus: status,
    },
  });
  revalidatePath("/staff/shifts");
  return { success: true };
}

export async function createScheduleOverride(data: {
  memberId: string;
  type: "WORKING" | "UNAVAILABLE" | "LEAVE" | "BLACKOUT";
  startTime: string;
  endTime: string;
  reason?: string;
  locationId?: string;
}) {
  const session = await getServerAuth();
  const permission = await checkShiftManagementPermission(session);
  if (!permission.success) return permission;
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  if (endTime <= startTime) return { success: false, error: "End must follow start" };
  const member = await db.member.findFirst({
    where: { id: data.memberId, organizationId: session!.organizationId },
    select: { id: true },
  });
  if (!member) return { success: false, error: "Member not found" };
  const override = await db.staffScheduleOverride.create({
    data: { ...data, startTime, endTime, organizationId: session!.organizationId },
  });
  revalidatePath("/staff/shifts");
  return { success: true, data: override };
}

export async function deleteStaffBreak(breakId: string) {
  const session = await getServerAuth();
  const permission = await checkShiftManagementPermission(session);
  if (!permission.success) return permission;

  try {
    const b = await db.staffBreak.findUnique({
      where: { id: breakId },
      include: {
        shift: {
          select: {
            organizationId: true,
            memberId: true,
          },
        },
      },
    });

    if (!b || b.shift.organizationId !== session!.organizationId) {
      return { success: false, error: "Break not found" };
    }

    await db.staffBreak.delete({
      where: { id: breakId },
    });

    revalidatePath("/staff");
    revalidatePath(`/staff/${b.shift.memberId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting break:", error);
    return { success: false, error: error.message || "Failed to delete break" };
  }
}
