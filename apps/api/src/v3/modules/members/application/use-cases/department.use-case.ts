import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentQueryDto,
  AddDepartmentMemberDto,
} from "../dto/department.dto";
import { AuditLogAction, AuditEntityType } from "@repo/db";

@Injectable()
export class DepartmentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getDepartments(organizationId: string, query: DepartmentQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [total, items] = await Promise.all([
      this.prisma.client.department.count({ where }),
      this.prisma.client.department.findMany({
        where,
        include: {
          head: {
            include: { user: { select: { name: true } } },
          },
          _count: { select: { departmentMembers: true } },
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDepartment(organizationId: string, id: string) {
    const department = await this.prisma.client.department.findFirst({
      where: { id, organizationId },
      include: {
        head: { include: { user: { select: { name: true, email: true } } } },
        departmentMembers: {
          include: {
            member: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!department) throw new NotFoundException("Department not found");
    return department;
  }

  async createDepartment(
    organizationId: string,
    dto: CreateDepartmentDto,
    actorId: string,
  ) {
    const department = await this.prisma.client.department.create({
      data: {
        ...dto,
        organizationId,
      },
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.CREATE,
        entityType: AuditEntityType.ORGANIZATION, // Fallback to ORGANIZATION if DEPARTMENT is missing
        entityId: department.id,
        description: `Created department: ${department.name}`,
      },
    });

    return department;
  }

  async updateDepartment(
    organizationId: string,
    id: string,
    dto: UpdateDepartmentDto,
    actorId: string,
  ) {
    const department = await this.prisma.client.department.update({
      where: { id, organizationId },
      data: dto,
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.UPDATE,
        entityType: AuditEntityType.ORGANIZATION,
        entityId: department.id,
        description: `Updated department: ${department.name}`,
      },
    });

    return department;
  }

  async deleteDepartment(organizationId: string, id: string, actorId: string) {
    const department = await this.prisma.client.department.delete({
      where: { id, organizationId },
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.DELETE,
        entityType: AuditEntityType.ORGANIZATION,
        entityId: department.id,
        description: `Deleted department: ${department.name}`,
      },
    });

    return department;
  }

  async addMemberToDepartment(
    organizationId: string,
    departmentId: string,
    dto: AddDepartmentMemberDto,
    actorId: string,
  ) {
    // Verify department and member belong to org
    const [dept, member] = await Promise.all([
      this.prisma.client.department.findFirst({
        where: { id: departmentId, organizationId },
      }),
      this.prisma.client.member.findFirst({
        where: { id: dto.memberId, organizationId },
      }),
    ]);

    if (!dept) throw new NotFoundException("Department not found");
    if (!member) throw new NotFoundException("Member not found");

    const membership = await this.prisma.client.departmentMember.upsert({
      where: {
        departmentId_memberId: {
          departmentId,
          memberId: dto.memberId,
        },
      },
      update: {
        role: dto.role,
        canApproveExpenses: dto.canApproveExpenses,
        canManageBudget: dto.canManageBudget,
      },
      create: {
        departmentId,
        memberId: dto.memberId,
        role: dto.role,
        canApproveExpenses: dto.canApproveExpenses,
        canManageBudget: dto.canManageBudget,
      },
    });

    return membership;
  }

  async removeMemberFromDepartment(
    organizationId: string,
    departmentId: string,
    memberId: string,
    actorId: string,
  ) {
    await this.prisma.client.departmentMember.delete({
      where: {
        departmentId_memberId: {
          departmentId,
          memberId,
        },
      },
    });

    return { success: true };
  }
}
