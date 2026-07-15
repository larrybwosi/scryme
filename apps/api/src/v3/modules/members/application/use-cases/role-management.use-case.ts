import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateCustomRoleDto,
  UpdateCustomRoleDto,
  CustomRoleQueryDto,
  CreatePermissionSetDto,
  CreateRoleGroupDto,
} from "../dto/role-management.dto";
import { AuditLogAction, AuditEntityType } from "@repo/db";

@Injectable()
export class RoleManagementUseCase {
  constructor(private readonly prisma: PrismaService) {}

  // --- Custom Roles ---

  async getCustomRoles(organizationId: string, query: CustomRoleQueryDto) {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (isActive !== undefined) where.isActive = isActive;

    const [total, items] = await Promise.all([
      this.prisma.client.customRole.count({ where }),
      this.prisma.client.customRole.findMany({
        where,
        /**
         * ⚡ Bolt Optimization: Use targeted select for list view to reduce database load
         * and network payload size by excluding the potentially large 'permissions' array.
         */
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          isSystemRole: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
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

  async createCustomRole(
    organizationId: string,
    dto: CreateCustomRoleDto,
    actorId: string,
  ) {
    const role = await this.prisma.client.customRole.create({
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
        entityType: AuditEntityType.ROLE, // Using ROLE as it exists in AuditEntityType
        entityId: role.id,
        description: `Created custom role: ${role.name}`,
      },
    });

    return role;
  }

  async updateCustomRole(
    organizationId: string,
    id: string,
    dto: UpdateCustomRoleDto,
    actorId: string,
  ) {
    const role = await this.prisma.client.customRole.update({
      where: { id, organizationId },
      data: dto,
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.UPDATE,
        entityType: AuditEntityType.ROLE,
        entityId: role.id,
        description: `Updated custom role: ${role.name}`,
      },
    });

    return role;
  }

  async deleteCustomRole(organizationId: string, id: string, actorId: string) {
    const role = await this.prisma.client.customRole.delete({
      where: { id, organizationId },
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.DELETE,
        entityType: AuditEntityType.ROLE,
        entityId: role.id,
        description: `Deleted custom role: ${role.name}`,
      },
    });

    return role;
  }

  // --- Permission Sets ---

  /**
   * ⚡ Bolt Optimization: Use targeted select for permission sets list.
   */
  async getPermissionSets(organizationId: string) {
    return this.prisma.client.permissionSet.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async createPermissionSet(
    organizationId: string,
    dto: CreatePermissionSetDto,
    actorId: string,
  ) {
    const set = await this.prisma.client.permissionSet.create({
      data: {
        ...dto,
        organizationId,
      },
    });

    return set;
  }

  // --- Role Groups ---
  async getRoleGroups(organizationId: string) {
    return this.prisma.client.roleGroup.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { permissionSets: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async createRoleGroup(
    organizationId: string,
    dto: CreateRoleGroupDto,
    actorId: string,
  ) {
    const { permissionSetIds, ...data } = dto;
    const group = await this.prisma.client.roleGroup.create({
      data: {
        ...data,
        organizationId,
        permissionSets: permissionSetIds
          ? {
              connect: permissionSetIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });

    return group;
  }

  // --- Member Assignments ---

  async assignRolesToMember(
    organizationId: string,
    memberId: string,
    roleIds: string[],
    actorId: string,
  ) {
    const member = await this.prisma.client.member.update({
      where: { id: memberId, organizationId },
      data: {
        customRoles: {
          connect: roleIds.map((id) => ({ id })),
        },
      },
    });

    return member;
  }

  async removeRolesFromMember(
    organizationId: string,
    memberId: string,
    roleIds: string[],
    actorId: string,
  ) {
    const member = await this.prisma.client.member.update({
      where: { id: memberId, organizationId },
      data: {
        customRoles: {
          disconnect: roleIds.map((id) => ({ id })),
        },
      },
    });

    return member;
  }
}
