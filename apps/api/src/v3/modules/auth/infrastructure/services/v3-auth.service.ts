import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { V3AuthCoreService } from "../../../auth-core/infrastructure/services/v3-auth-core.service";

@Injectable()
export class V3AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authCore: V3AuthCoreService,
  ) {}

  async provisionDevice(token: string) {
    return this.authCore.provisionDevice(token);
  }

  async validateClient(clientId: string, clientSecret: string) {
    return this.authCore.validateClient(clientId, clientSecret);
  }

  async generateToken(client: any, member?: any) {
    return this.authCore.generateToken(client, member);
  }

  async loginMember(clientId: string, pin: string) {
    const client = await this.validateLoginClient(clientId);
    const member = await this.validateLoginMember(client.organizationId, pin);
    await this.handleMemberCheckIn(client, member);
    return this.generateToken(client, member);
  }

  private async validateLoginClient(clientId: string) {
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId },
      include: { organization: true },
    });
    if (!client) throw new UnauthorizedException("Invalid client");
    return client;
  }

  private async validateLoginMember(organizationId: string, pin: string) {
    const members = await this.prisma.client.member.findMany({
      where: {
        organizationId,
        isActive: true,
        pinHash: { not: null },
      },
    });

    for (const member of members) {
      if (member.pinHash && (await bcrypt.compare(pin, member.pinHash))) {
        return member;
      }
    }

    throw new UnauthorizedException("Invalid credentials");
  }

  private async handleMemberCheckIn(client: any, member: any) {
    const registry = await this.prisma.client.deviceRegistry.findFirst({
      where: { apiKeyId: client.id },
    });
    if (!registry) return;

    const existingLog = await this.prisma.client.attendanceLog.findFirst({
      where: { memberId: member.id, checkOutTime: null },
    });

    if (!existingLog) {
      await this.recordCheckIn(
        client.organizationId,
        member.id,
        registry.locationId,
      );
    }
  }

  private async recordCheckIn(
    organizationId: string,
    memberId: string,
    locationId: string,
  ) {
    await this.prisma.client.attendanceLog.create({
      data: {
        memberId,
        organizationId,
        checkInTime: new Date(),
        checkInLocationId: locationId,
      },
    });
    await this.prisma.client.member.update({
      where: { id: memberId },
      data: {
        isCheckedIn: true,
        lastCheckInTime: new Date(),
        currentCheckInLocationId: locationId,
      },
    });
  }

  async verifyToken(token: string) {
    return this.authCore.verifyToken(token);
  }
}
