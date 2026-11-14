import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AndroidUpdateMemberDto, AndroidUpdateMemberStatusDto } from "../dto/android-auth.dto";

@Injectable()
export class AndroidMembersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getMembers(v3Context: any, search?: string, role?: string) {
    const { organizationId } = v3Context;

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const members = await this.prisma.client.member.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        role: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return members.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.user?.id || null,
      name: m.user?.name || "Staff Member",
      email: m.user?.email || "",
      role: m.role,
      status: m.status || "OFFLINE",
      dutyStatus: m.status || "OFFLINE",
      avatarUrl: m.user?.image || null,
    }));
  }

  async getMemberById(v3Context: any, id: string) {
    const { organizationId } = v3Context;

    const member = await this.prisma.client.member.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        role: true,
        status: true,
        cardId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    return {
      id: member.id,
      organizationId: member.organizationId,
      userId: member.user?.id || null,
      name: member.user?.name || "Staff Member",
      email: member.user?.email || "",
      role: member.role,
      status: member.status || "OFFLINE",
      dutyStatus: member.status || "OFFLINE",
      avatarUrl: member.user?.image || null,
      createdAt: member.createdAt,
    };
  }


  async getMemberOverview(v3Context: any, id: string) {
    const { organizationId } = v3Context;

    const member = await this.prisma.client.member.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        role: true,
        status: true,
        cardId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    const memberId = member.id;
    const userId = member.user?.id;

    const [tasks, checkins, auditLogs] = await Promise.all([
      this.prisma.client.staffTask.findMany({
        where: {
          organizationId,
          memberId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          checklist: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.client.attendanceLog.findMany({
        where: {
          organizationId,
          memberId,
        },
        select: {
          id: true,
          checkInTime: true,
          checkOutTime: true,
          durationMinutes: true,
          shiftStatus: true,
          verificationMethod: true,
          isLocationVerified: true,
          checkInLocation: {
            select: {
              id: true,
              name: true,
              branchCode: true,
            },
          },
        },
        orderBy: { checkInTime: 'desc' },
        take: 20,
      }),
      this.prisma.client.auditLog.findMany({
        where: {
          organizationId,
          OR: [
            { memberId },
            ...(userId ? [{ entityId: userId }] : []),
            { entityId: memberId },
          ],
        },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          status: true,
          performedAt: true,
        },
        orderBy: { id: 'desc' },
        take: 25,
      }),
    ]);

    const formattedTasks = tasks.map((t) => {
      let subtaskGroups: any[] = [];
      if (t.checklist && typeof t.checklist === 'object') {
        if (Array.isArray(t.checklist)) {
          subtaskGroups = t.checklist;
        } else if (Array.isArray((t.checklist as any).groups)) {
          subtaskGroups = (t.checklist as any).groups;
        }
      }
      return {
        id: t.id,
        title: t.title,
        description: t.description || null,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        subtaskGroups,
        notes: t.notes || null,
        createdAt: t.createdAt ? t.createdAt.toISOString() : null,
      };
    });

    const formattedCheckins = checkins.map((c) => ({
      id: c.id,
      checkInTime: c.checkInTime ? c.checkInTime.toISOString() : '',
      checkOutTime: c.checkOutTime ? c.checkOutTime.toISOString() : null,
      durationMinutes: c.durationMinutes || null,
      shiftStatus: c.shiftStatus || null,
      verificationMethod: c.verificationMethod || null,
      isLocationVerified: c.isLocationVerified || false,
      locationName: c.checkInLocation?.name || null,
      branchCode: c.checkInLocation?.branchCode || null,
    }));

    const formattedActivity = auditLogs.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      description: a.description || null,
      status: a.status,
      timestamp: a.performedAt ? a.performedAt.toISOString() : null,
    }));

    return {
      member: {
        id: member.id,
        organizationId: member.organizationId,
        userId: member.user?.id || null,
        name: member.user?.name || 'Staff Member',
        email: member.user?.email || '',
        phone: null,
        role: member.role,
        status: member.status || 'OFFLINE',
        dutyStatus: member.status || 'OFFLINE',
        avatarUrl: member.user?.image || null,
        cardId: member.cardId || null,
        createdAt: member.createdAt ? member.createdAt.toISOString() : null,
      },
      tasks: formattedTasks,
      checkins: formattedCheckins,
      activity: formattedActivity,
    };
  }

  async updateMember(v3Context: any, id: string, dto: AndroidUpdateMemberDto) {
    const { organizationId } = v3Context;

    const member = await this.prisma.client.member.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
        organizationId,
        deletedAt: null,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member '${id}' not found`);
    }

    if (dto.role) {
      await this.prisma.client.member.update({
        where: { id: member.id },
        data: { role: dto.role as any },
      });
    }

    if ((dto.name || dto.email || dto.avatarUrl) && member.userId) {
      const userData: any = {};
      if (dto.name) userData.name = dto.name;
      if (dto.email) userData.email = dto.email;
      if (dto.avatarUrl) userData.image = dto.avatarUrl;

      await this.prisma.client.user.update({
        where: { id: member.userId },
        data: userData,
      });
    }

    return this.getMemberById(v3Context, id);
  }

  async updateMemberStatus(v3Context: any, id: string, dto: AndroidUpdateMemberStatusDto) {
    const { organizationId } = v3Context;

    const member = await this.prisma.client.member.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
        organizationId,
        deletedAt: null,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member '${id}' not found`);
    }

    const newStatus = dto.dutyStatus === "ONLINE" || dto.dutyStatus === "BUSY" ? "ONLINE" : "OFFLINE";

    const updated = await this.prisma.client.member.update({
      where: { id: member.id },
      data: {
        status: newStatus as any,
      },
      include: {
        user: true,
      },
    });

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      userId: updated.userId || null,
      name: updated.user?.name || "Staff Member",
      email: updated.user?.email || "",
      role: updated.role,
      status: updated.status,
      dutyStatus: dto.dutyStatus || updated.status,
      avatarUrl: updated.user?.image || null,
    };
  }
}
