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
    // SECURITY (Sentinel): Explicit field whitelisting to prevent mass assignment.
    const { name, description, permissions } = dto;

    const role = await this.prisma.client.customRole.create({
      data: {
        name,
        description,
        permissions,
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
    // SECURITY (Sentinel): Find-then-update pattern for multi-tenant isolation.
    const currentRole = await this.prisma.client.customRole.findFirst({
      where: { id, organizationId },
    });

    if (!currentRole) throw new NotFoundException("Custom role not found");

    // SECURITY (Sentinel): Explicit field whitelisting to prevent mass assignment.
    const { name, description, permissions, isActive } = dto;

    const role = await this.prisma.client.customRole.update({
      where: { id: currentRole.id },
      data: {
        name,
        description,
        permissions,
        isActive,
      },
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
    // SECURITY (Sentinel): Find-then-delete pattern for multi-tenant isolation.
    const currentRole = await this.prisma.client.customRole.findFirst({
      where: { id, organizationId },
    });

    if (!currentRole) throw new NotFoundException("Custom role not found");

    const role = await this.prisma.client.customRole.delete({
      where: { id: currentRole.id },
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
    // SECURITY (Sentinel): Explicit field whitelisting to prevent mass assignment.
    const { name, description, permissions } = dto;

    const set = await this.prisma.client.permissionSet.create({
      data: {
        name,
        description,
        permissions,
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
    // SECURITY (Sentinel): Explicit field whitelisting to prevent mass assignment.
    const { name, description, permissionSetIds } = dto;

    // SECURITY (Sentinel): Validate ownership of permission sets.
    if (permissionSetIds && permissionSetIds.length > 0) {
      const count = await this.prisma.client.permissionSet.count({
        where: {
          id: { in: permissionSetIds },
          organizationId,
        },
      });

      if (count !== new Set(permissionSetIds).size) {
        throw new BadRequestException("One or more permission sets not found");
      }
    }

    const group = await this.prisma.client.roleGroup.create({
      data: {
        name,
        description,
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
    // SECURITY (Sentinel): Verify member belongs to organization.
    const currentMember = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId, deletedAt: null },
    });

    if (!currentMember) throw new NotFoundException("Member not found");

    // SECURITY (Sentinel): Validate ownership of custom roles.
    if (roleIds && roleIds.length > 0) {
      const count = await this.prisma.client.customRole.count({
        where: {
          id: { in: roleIds },
          organizationId,
        },
      });

      if (count !== new Set(roleIds).size) {
        throw new BadRequestException("One or more custom roles not found");
      }
    }

    const member = await this.prisma.client.member.update({
      where: { id: currentMember.id },
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
    // SECURITY (Sentinel): Verify member belongs to organization.
    const currentMember = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId, deletedAt: null },
    });

    if (!currentMember) throw new NotFoundException("Member not found");

    const member = await this.prisma.client.member.update({
      where: { id: currentMember.id },
      data: {
        customRoles: {
          disconnect: roleIds.map((id) => ({ id })),
        },
      },
    });

    return member;
  }
}
