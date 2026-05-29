import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { type V2ApiContext } from '@repo/shared/server';
import { MemberRole } from '@repo/db';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembers(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;
    const { role, isActive } = query;

    const where: any = { organizationId };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    return this.prisma.client.member.findMany({
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
    });
  }

  async getMember(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const member = await this.prisma.client.member.findFirst({
      where: { id, organizationId },
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
    });

    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async createMember(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
    const { email, name, role, pin, cardId, ...otherData } = data;

    // Check if user exists or create one
    let user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.client.user.create({
        data: { email, name },
      });
    }

    const pinHash = pin ? await bcrypt.hash(pin, 10) : undefined;

    return this.prisma.client.member.create({
      data: {
        ...otherData,
        organizationId,
        userId: user.id,
        role: role || MemberRole.EMPLOYEE,
        cardId,
        pinHash,
      },
    });
  }

  async updateMember(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    const { pin, ...updateData } = data;

    if (pin) {
      updateData.pinHash = await bcrypt.hash(pin, 10);
    }

    return this.prisma.client.member.update({
      where: { id, organizationId },
      data: updateData,
    });
  }

  async deleteMember(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    // Soft delete
    return this.prisma.client.member.update({
      where: { id, organizationId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async unbanMember(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.member.update({
      where: { id, organizationId },
      data: { isActive: true },
    });
  }

  async changeMemberPin(ctx: V2ApiContext, id: string, pin: string) {
    const { organizationId } = ctx;
    const pinHash = await bcrypt.hash(pin, 10);
    return this.prisma.client.member.update({
      where: { id, organizationId },
      data: { pinHash },
    });
  }
}
