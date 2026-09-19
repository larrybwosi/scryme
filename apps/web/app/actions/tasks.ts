"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function getStaffTasks(params?: {
  memberId?: string;
  shiftId?: string;
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const tasks = await db.staffTask.findMany({
      where: {
        organizationId: session.organizationId,
        ...(params?.memberId ? { memberId: params.memberId } : {}),
        ...(params?.shiftId ? { shiftId: params.shiftId } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.priority ? { priority: params.priority } : {}),
      },
      include: {
        member: {
          select: {
            id: true,
            role: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
        location: { select: { id: true, name: true } },
        shift: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: tasks };
  } catch (error: any) {
    console.error("Error fetching staff tasks:", error);
    return { success: false, error: error.message || "Failed to fetch staff tasks" };
  }
}

export async function createStaffTask(data: {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  memberId?: string;
  shiftId?: string;
  locationId?: string;
  notes?: string;
  checklist?: { item: string; completed: boolean }[];
}) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    if (!data.title || !data.title.trim()) {
      return { success: false, error: "Title is required" };
    }

    const task = await db.staffTask.create({
      data: {
        organizationId: session.organizationId,
        title: data.title.trim(),
        description: data.description || null,
        priority: data.priority || "MEDIUM",
        status: "TODO",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        memberId: data.memberId || null,
        shiftId: data.shiftId || null,
        locationId: data.locationId || null,
        notes: data.notes || null,
        checklist: data.checklist ? (data.checklist as any) : null,
        createdById: session.memberId || null,
      },
      include: {
        member: {
          select: {
            id: true,
            role: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
        location: { select: { id: true, name: true } },
      },
    });

    revalidatePath("/staff/shifts");
    revalidatePath("/staff");
    return { success: true, data: task };
  } catch (error: any) {
    console.error("Error creating staff task:", error);
    return { success: false, error: error.message || "Failed to create task" };
  }
}

export async function updateStaffTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    dueDate?: string | null;
    memberId?: string | null;
    shiftId?: string | null;
    locationId?: string | null;
    notes?: string;
    checklist?: { item: string; completed: boolean }[];
  },
) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existing = await db.staffTask.findFirst({
      where: { id: taskId, organizationId: session.organizationId },
    });

    if (!existing) {
      return { success: false, error: "Task not found" };
    }

    const updated = await db.staffTask.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
        ...(data.memberId !== undefined ? { memberId: data.memberId } : {}),
        ...(data.shiftId !== undefined ? { shiftId: data.shiftId } : {}),
        ...(data.locationId !== undefined ? { locationId: data.locationId } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.checklist !== undefined ? { checklist: data.checklist as any } : {}),
      },
      include: {
        member: {
          select: {
            id: true,
            role: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
        location: { select: { id: true, name: true } },
      },
    });

    revalidatePath("/staff/shifts");
    revalidatePath("/staff");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating staff task:", error);
    return { success: false, error: error.message || "Failed to update task" };
  }
}

export async function deleteStaffTask(taskId: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existing = await db.staffTask.findFirst({
      where: { id: taskId, organizationId: session.organizationId },
    });

    if (!existing) {
      return { success: false, error: "Task not found" };
    }

    await db.staffTask.delete({ where: { id: taskId } });

    revalidatePath("/staff/shifts");
    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting staff task:", error);
    return { success: false, error: error.message || "Failed to delete task" };
  }
}
