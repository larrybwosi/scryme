import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import {
  CreateInvitationDto,
  InvitationQueryDto,
  AcceptInvitationDto,
} from "../dto/invitation.dto";
import { InvitationStatus, AuditLogAction, AuditEntityType } from "@repo/db";
import { v4 as uuidv4 } from "uuid";
import { emitEvent } from "@repo/windmill/server";

@Injectable()
export class InvitationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getInvitations(organizationId: string, query: InvitationQueryDto) {
    const { page = 1, limit = 10, status, email } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (status) where.status = status;
    if (email) where.email = { contains: email, mode: "insensitive" };

    const [total, items] = await Promise.all([
      this.prisma.client.invitation.count({ where }),
      this.prisma.client.invitation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createInvitation(
    organizationId: string,
    dto: CreateInvitationDto,
    inviterId: string,
    inviterUserId: string,
  ) {
    const { email, role, expiresAt, ...otherData } = dto;

    // Check if already a member
    const existingMember = await this.prisma.client.member.findFirst({
      where: { organizationId, user: { email }, deletedAt: null },
    });
    if (existingMember)
      throw new BadRequestException("User is already a member");

    // Check if pending invitation exists
    const existingInvite = await this.prisma.client.invitation.findFirst({
      where: { organizationId, email, status: InvitationStatus.PENDING },
    });
    if (existingInvite)
      throw new BadRequestException("Invitation already sent to this email");

    const token = uuidv4();
    const expiryDate = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    const invitation = await this.prisma.client.invitation.create({
      data: {
        organizationId,
        email,
        role,
        token,
        expiresAt: expiryDate,
        inviterId: inviterUserId,
        ...otherData,
      },
    });

    // Audit Log
    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: inviterId,
        action: AuditLogAction.CREATE,
        entityType: AuditEntityType.MEMBER,
        entityId: invitation.id,
        description: `Sent invitation to ${email} with role ${role}`,
      },
    });

    // Windmill Event for Email Sending
    emitEvent(organizationId, "member.invitation.created", {
      invitationId: invitation.id,
      email,
      role,
      token,
      expiresAt: invitation.expiresAt,
    }).catch((err) =>
      console.error("[Windmill] InvitationCreated error:", err),
    );

    return invitation;
  }

  async revokeInvitation(organizationId: string, id: string, actorId: string) {
    const invitation = await this.prisma.client.invitation.findFirst({
      where: { id, organizationId, status: InvitationStatus.PENDING },
    });

    if (!invitation)
      throw new NotFoundException("Pending invitation not found");

    const updated = await this.prisma.client.invitation.update({
      where: { id },
      data: { status: InvitationStatus.DECLINED },
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.DELETE,
        entityType: AuditEntityType.MEMBER,
        entityId: updated.id,
        description: `Revoked invitation for ${(invitation as any).email}`,
      },
    });

    return updated;
  }

  async acceptInvitation(dto: AcceptInvitationDto, userId: string) {
    const invitation = await this.prisma.client.invitation.findUnique({
      where: { token: dto.token },
      include: { organization: true },
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException("Invalid or expired invitation");
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.client.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException("Invitation has expired");
    }

    // Logic to convert invitation to member
    return this.prisma.client.$transaction(async (tx) => {
      // Create member
      const member = await tx.member.create({
        data: {
          organizationId: invitation.organizationId,
          userId: userId,
          role: invitation.role,
          isActive: true,
          membershipStatus: "ACTIVE",
          departmentMemberships:
            invitation.departmentIds && invitation.departmentIds.length > 0
              ? {
                  create: invitation.departmentIds.map((dId) => ({
                    departmentId: dId,
                  })),
                }
              : undefined,
          customRoles:
            invitation.customRoleIds && invitation.customRoleIds.length > 0
              ? {
                  connect: invitation.customRoleIds.map((id) => ({ id })),
                }
              : undefined,
          roleGroups:
            invitation.roleGroupIds && invitation.roleGroupIds.length > 0
              ? {
                  connect: invitation.roleGroupIds.map((id) => ({ id })),
                }
              : undefined,
        },
      });

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      });

      // Update user's active org
      await tx.user.update({
        where: { id: userId },
        data: { activeOrganizationId: invitation.organizationId },
      });

      // Clear session cache
      await this.redis.del(`session-cache:${userId}`);

      return member;
    });
  }
}
