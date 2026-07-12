import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateMemberDto, UpdateMemberDto, MemberQueryDto } from '../dto/member.dto';
import { MemberRole, MembershipStatus, ApprovalRequestType, ApprovalStatus, AuditLogAction, AuditEntityType, Status } from '@repo/db';
import * as bcrypt from 'bcryptjs';
import { emitMemberCreated, emitMemberRoleChanged, emitEvent } from '@repo/windmill/server';

@Injectable()
export class MemberUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getMembers(organizationId: string, query: MemberQueryDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', role, membershipStatus, isActive, departmentId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (role) where.role = role;
    if (membershipStatus) where.membershipStatus = membershipStatus;
    if (isActive !== undefined) where.isActive = isActive;
    if (departmentId) {
      where.departmentMemberships = {
        some: { departmentId },
      };
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { phone: { contains: search, mode: 'insensitive' } },
        { cardId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // White-list sortBy to prevent injection/errors
    const allowedSortFields = ['createdAt', 'updatedAt', 'role', 'status'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [total, members] = await Promise.all([
      this.prisma.client.member.count({ where }),
      this.prisma.client.member.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [finalSortBy]: sortOrder },
      }),
    ]);

    return {
      items: members.map(m => this.mapToResponse(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMember(organizationId: string, id: string) {
    const member = await this.prisma.client.member.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        departmentMemberships: {
          include: { department: true }
        },
        customRoles: true,
        roleGroups: true,
      },
    });

    if (!member) throw new NotFoundException('Member not found');
    return this.mapToResponse(member);
  }

  private mapToResponse(member: any) {
    return {
      id: member.id,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
        image: member.user.image,
      },
      role: member.role,
      membershipStatus: member.membershipStatus,
      isActive: member.isActive,
      status: member.status,
      cardId: member.cardId,
      phone: member.phone,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      // Include extra info if available from findFirst (e.g. in getMember)
      departments: member.departmentMemberships?.map((dm: any) => ({
        id: dm.department.id,
        name: dm.department.name,
        role: dm.role
      })),
      customRoles: member.customRoles?.map((r: any) => ({ id: r.id, name: r.name })),
      roleGroups: member.roleGroups?.map((g: any) => ({ id: g.id, name: g.name })),
    };
  }

  async createMember(organizationId: string, dto: CreateMemberDto, inviterId?: string) {
    const { email, name, role, pin, cardId, departmentIds, customRoleIds, roleGroupIds, phone } = dto;

    return this.prisma.client.$transaction(async (tx) => {
      // Security: Verify related entity ownership
      if (departmentIds?.length) {
        const count = await tx.department.count({
          where: { id: { in: departmentIds }, organizationId },
        });
        if (count !== departmentIds.length) throw new BadRequestException('One or more invalid department IDs');
      }

      if (customRoleIds?.length) {
        const count = await tx.customRole.count({
          where: { id: { in: customRoleIds }, organizationId },
        });
        if (count !== customRoleIds.length) throw new BadRequestException('One or more invalid custom role IDs');
      }

      if (roleGroupIds?.length) {
        const count = await tx.roleGroup.count({
          where: { id: { in: roleGroupIds }, organizationId },
        });
        if (count !== roleGroupIds.length) throw new BadRequestException('One or more invalid role group IDs');
      }

      let user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await tx.user.create({
          data: { email, name },
        });
      }

      const existingInOrg = await tx.member.findUnique({
        where: { organizationId_userId: { organizationId, userId: user.id } },
      });

      if (existingInOrg) {
        if (existingInOrg.deletedAt) {
          // Reactivate if deleted? For enterprise, better to throw or handle explicitly.
          throw new BadRequestException('User was previously a member. Use restore flow or contact support.');
        }
        throw new BadRequestException('User is already a member of this organization');
      }

      const pinHash = pin ? await bcrypt.hash(pin, 10) : undefined;
      const finalRole = role || MemberRole.EMPLOYEE;

      // Enterprise Approval Logic (Can be extended to be dynamic based on Org Settings)
      const requiresApproval = finalRole === MemberRole.OWNER || finalRole === MemberRole.ADMIN;
      const membershipStatus = requiresApproval ? MembershipStatus.PENDING_APPROVAL : MembershipStatus.ACTIVE;
      const isActive = membershipStatus === MembershipStatus.ACTIVE;

      const member = await tx.member.create({
        data: {
          organizationId,
          userId: user.id,
          role: finalRole,
          membershipStatus,
          isActive,
          cardId,
          pinHash,
          phone,
          departmentMemberships: departmentIds ? {
            create: departmentIds.map(dId => ({
              departmentId: dId,
            }))
          } : undefined,
          customRoles: customRoleIds ? {
            connect: customRoleIds.map(id => ({ id }))
          } : undefined,
          roleGroups: roleGroupIds ? {
            connect: roleGroupIds.map(id => ({ id }))
          } : undefined,
        },
      });

      if (requiresApproval && inviterId) {
        await tx.approvalRequest.create({
          data: {
            organizationId,
            requestType: ApprovalRequestType.MEMBER_CREATION,
            relatedId: member.id,
            relatedRecordNumber: `MEM-${member.id.substring(0, 8).toUpperCase()}`,
            requesterId: inviterId,
            amount: 0,
            status: ApprovalStatus.PENDING,
          }
        });
      }

      if (!user.activeOrganizationId) {
        await tx.user.update({
          where: { id: user.id },
          data: { activeOrganizationId: organizationId },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          memberId: inviterId || member.id,
          action: AuditLogAction.CREATE,
          entityType: AuditEntityType.MEMBER,
          entityId: member.id,
          description: `Created member: ${name} (${email}). Status: ${membershipStatus}`,
          details: { role: finalRole, membershipStatus },
        }
      });

      // Windmill Event
      emitMemberCreated(organizationId, {
        memberId: member.id,
        name,
        email,
        role: finalRole,
      }).catch(err => console.error('[Windmill] MemberCreated error:', err));

      return member;
    });
  }

  async updateMember(organizationId: string, id: string, dto: UpdateMemberDto, actorId: string) {
    const { pin, departmentIds, customRoleIds, roleGroupIds } = dto;

    // Security: Verify related entity ownership
    if (departmentIds?.length) {
      const count = await this.prisma.client.department.count({
        where: { id: { in: departmentIds }, organizationId },
      });
      if (count !== departmentIds.length) throw new BadRequestException('One or more invalid department IDs');
    }

    if (customRoleIds?.length) {
      const count = await this.prisma.client.customRole.count({
        where: { id: { in: customRoleIds }, organizationId },
      });
      if (count !== customRoleIds.length) throw new BadRequestException('One or more invalid custom role IDs');
    }

    if (roleGroupIds?.length) {
      const count = await this.prisma.client.roleGroup.count({
        where: { id: { in: roleGroupIds }, organizationId },
      });
      if (count !== roleGroupIds.length) throw new BadRequestException('One or more invalid role group IDs');
    }

    const currentMember = await this.prisma.client.member.findUnique({
      where: { id, organizationId },
      include: { user: true }
    });

    if (!currentMember) throw new NotFoundException('Member not found');

    let pinHash: string | undefined;
    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    const member = await this.prisma.client.member.update({
      where: { id, organizationId },
      data: {
        name: dto.name,
        role: dto.role,
        membershipStatus: dto.membershipStatus,
        isActive: dto.isActive,
        status: dto.status,
        cardId: dto.cardId,
        phone: dto.phone,
        pinHash,
        departmentMemberships: departmentIds ? {
          deleteMany: {},
          create: departmentIds.map(dId => ({
            departmentId: dId,
          }))
        } : undefined,
        customRoles: customRoleIds ? {
          set: customRoleIds.map(id => ({ id }))
        } : undefined,
        roleGroups: roleGroupIds ? {
          set: roleGroupIds.map(id => ({ id }))
        } : undefined,
      },
    });

    // Audit Log
    const auditDetails = {
      name: dto.name,
      role: dto.role,
      membershipStatus: dto.membershipStatus,
      isActive: dto.isActive,
      status: dto.status,
      cardId: dto.cardId,
      phone: dto.phone,
    };

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.UPDATE,
        entityType: AuditEntityType.MEMBER,
        entityId: member.id,
        description: `Updated member: ${currentMember.user.name}`,
        details: auditDetails as any,
      }
    });

    // Windmill Events
    if (dto.role && dto.role !== currentMember.role) {
      emitMemberRoleChanged(organizationId, {
        memberId: member.id,
        name: currentMember.user.name,
        email: currentMember.user.email,
        previousRole: currentMember.role,
        newRole: dto.role,
      }).catch(err => console.error('[Windmill] MemberRoleChanged error:', err));
    }

    if (dto.isActive === false && currentMember.isActive === true) {
      emitEvent(organizationId, 'member.deactivated', {
        memberId: member.id,
        name: currentMember.user.name,
      }).catch(err => console.error('[Windmill] MemberDeactivated error:', err));
    }

    return member;
  }

  async deleteMember(organizationId: string, id: string, actorId: string) {
    const member = await this.prisma.client.member.update({
      where: { id, organizationId },
      data: { deletedAt: new Date(), isActive: false },
      include: { user: true }
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.DELETE,
        entityType: AuditEntityType.MEMBER,
        entityId: member.id,
        description: `Deleted member: ${member.user.name}`,
      }
    });

    emitEvent(organizationId, 'member.deleted', {
      memberId: member.id,
      name: member.user.name,
    }).catch(err => console.error('[Windmill] MemberDeleted error:', err));

    return member;
  }

  async getMemberAuditLogs(organizationId: string, id: string, query: any) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.client.auditLog.count({
        where: { organizationId, entityId: id, entityType: AuditEntityType.MEMBER },
      }),
      this.prisma.client.auditLog.findMany({
        where: { organizationId, entityId: id, entityType: AuditEntityType.MEMBER },
        orderBy: { id: 'desc' }, // Switched from createdAt to id as id usually correlates with time and avoids TS error
        skip,
        take: limit,
      }),
    ]);

    return {
      items: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateMemberStatus(organizationId: string, id: string, status: Status, actorId: string) {
    const member = await this.prisma.client.member.update({
      where: { id, organizationId },
      data: { status },
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.UPDATE,
        entityType: AuditEntityType.MEMBER,
        entityId: member.id,
        description: `Changed status to ${status}`,
      }
    });

    return member;
  }
}
