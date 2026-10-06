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
        id,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
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
      name: member.user?.name || "Staff Member",
      email: member.user?.email || "",
      role: member.role,
      status: member.status || "OFFLINE",
      dutyStatus: member.status || "OFFLINE",
      avatarUrl: member.user?.image || null,
      createdAt: member.createdAt,
    };
  }

  async updateMember(v3Context: any, id: string, dto: AndroidUpdateMemberDto) {
    const { organizationId } = v3Context;

    const member = await this.prisma.client.member.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!member) {
      throw new NotFoundException(`Member '${id}' not found`);
    }

    if (dto.role) {
      await this.prisma.client.member.update({
        where: { id },
        data: { role: dto.role as any },
      });
    }

    if (dto.name && member.userId) {
      await this.prisma.client.user.update({
        where: { id: member.userId },
        data: { name: dto.name },
      });
    }

    return this.getMemberById(v3Context, id);
  }

  async updateMemberStatus(v3Context: any, id: string, dto: AndroidUpdateMemberStatusDto) {
    const { organizationId } = v3Context;

    const member = await this.prisma.client.member.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!member) {
      throw new NotFoundException(`Member '${id}' not found`);
    }

    const newStatus = dto.dutyStatus === "ONLINE" || dto.dutyStatus === "BUSY" ? "ONLINE" : "OFFLINE";

    const updated = await this.prisma.client.member.update({
      where: { id },
      data: {
        status: newStatus as any,
      },
      include: {
        user: true,
      },
    });

    return {
      id: updated.id,
      name: updated.user?.name || "Staff Member",
      email: updated.user?.email || "",
      role: updated.role,
      status: updated.status,
      dutyStatus: dto.dutyStatus || updated.status,
    };
  }
}
