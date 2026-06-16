import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";
import {type V2ApiContext, createMemberToken} from "@repo/shared/server";
import {MemberRole, Status} from "@repo/db";
import * as bcrypt from "bcryptjs";

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembers(ctx: V2ApiContext, query: any) {
    const {organizationId} = ctx;
    const {role, isActive} = query;

    const where: any = {organizationId};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";

    return this.prisma.client.member.findMany({
      where,
      // OPTIMIZATION (Bolt ⚡): Using select instead of include to reduce payload size and exclude sensitive fields like pinHash
      select: {
        id: true,
        organizationId: true,
        userId: true,
        role: true,
        membershipStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
    });
  }

  async getMember(ctx: V2ApiContext, id: string) {
    const {organizationId} = ctx;
    const member = await this.prisma.client.member.findFirst({
      where: {id, organizationId},
      // OPTIMIZATION (Bolt ⚡): Using select instead of include to reduce payload size and exclude sensitive fields like pinHash
      select: {
        id: true,
        organizationId: true,
        userId: true,
        cardId: true,
        role: true,
        membershipStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        phone: true,
        email: true,
        address: true,
        age: true,
        gender: true,
        tags: true,
        isCheckedIn: true,
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
    });

    if (!member) throw new NotFoundException("Member not found");
    return member;
  }

  async createMember(ctx: V2ApiContext, data: any) {
    const {organizationId} = ctx;
    const {email, name, role, pin, cardId, ...otherData} = data;

    // Check if user exists or create one
    let user = await this.prisma.client.user.findUnique({
      where: {email},
    });

    if (!user) {
      user = await this.prisma.client.user.create({
        data: {email, name},
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
    const {organizationId} = ctx;
    const {pin, ...updateData} = data;

    if (pin) {
      updateData.pinHash = await bcrypt.hash(pin, 10);
    }

    return this.prisma.client.member.update({
      where: {id, organizationId},
      data: updateData,
    });
  }

  async deleteMember(ctx: V2ApiContext, id: string) {
    const {organizationId} = ctx;
    // Soft delete
    return this.prisma.client.member.update({
      where: {id, organizationId},
      data: {deletedAt: new Date(), isActive: false},
    });
  }

  async unbanMember(ctx: V2ApiContext, id: string) {
    const {organizationId} = ctx;
    return this.prisma.client.member.update({
      where: {id, organizationId},
      data: {isActive: true},
    });
  }

  async changeMemberPin(ctx: V2ApiContext, id: string, pin: string) {
    const {organizationId} = ctx;
    const pinHash = await bcrypt.hash(pin, 10);
    return this.prisma.client.member.update({
      where: {id, organizationId},
      data: {pinHash},
    });
  }

  async login(ctx: V2ApiContext, cardId: string, pin: string) {
    const {organizationId, locationId} = ctx;

    if (!locationId) {
      throw new BadRequestException("Device is not associated with a location");
    }

    const member = await this.prisma.client.member.findFirst({
      where: {
        organizationId,
        cardId,
        isActive: true,
        deletedAt: null,
      },
      // OPTIMIZATION (Bolt ⚡): Explicitly selecting only required fields for auth and response mapping.
      // pinHash is required here for bcrypt.compare but is not returned to the client.
      select: {
        id: true,
        organizationId: true,
        pinHash: true,
        role: true,
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

    if (!member || !member.pinHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPinValid = await bcrypt.compare(pin, member.pinHash);
    if (!isPinValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Perform check-in logic
    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: {memberId: member.id, checkOutTime: null},
    });

    let attendanceLogId = activeLog?.id;

    if (!activeLog) {
      await this.prisma.client.$transaction(async tx => {
        const log = await tx.attendanceLog.create({
          data: {
            organizationId,
            memberId: member.id,
            checkInTime: new Date(),
            checkInLocationId: locationId,
            notes: "Checked in via terminal login",
          },
        });

        await tx.member.update({
          where: {id: member.id},
          data: {
            isCheckedIn: true,
            lastCheckInTime: new Date(),
            currentCheckInLocationId: locationId,
            currentAttendanceLogId: log.id,
            status: Status.ONLINE,
          },
        });
        attendanceLogId = log.id;
      });
    }

    const token = await createMemberToken(
      member.id,
      organizationId,
      attendanceLogId!,
    );

    // Return non-sensitive member info formatted for POS/Bakery
    return {
      token,
      member: {
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        image: member.user.image,
        organizationId: member.organizationId,
        locationId,
      },
      restoredSession: !!activeLog,
    };
  }
}
