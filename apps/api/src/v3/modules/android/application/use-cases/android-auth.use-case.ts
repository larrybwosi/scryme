import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import {
  AndroidEmailLoginDto,
  AndroidEmailSignUpDto,
  AndroidMemberLoginDto,
  AndroidTokenExchangeDto,
} from "../dto/android-auth.dto";

@Injectable()
export class AndroidAuthUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async loginWithEmail(dto: AndroidEmailLoginDto) {
    try {
      const response = await this.authService.auth.api.signInEmail({
        body: {
          email: dto.email,
          password: dto.password,
        },
      });

      if (!response || !response.user) {
        throw new UnauthorizedException("Invalid email or password");
      }

      const user = response.user;

      let token = response.token || response.session?.token;
      if (!token && user.id) {
        const session = await this.prisma.client.session.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { token: true },
        });
        if (session) {
          token = session.token;
        }
      }

      if (!token) {
        throw new UnauthorizedException("Session creation failed");
      }

      let orgSlug = dto.orgSlug;
      let activeOrgId = user.activeOrganizationId;

      if (orgSlug) {
        const targetOrg = await this.prisma.client.organization.findUnique({
          where: { slug: orgSlug },
          select: { id: true, slug: true },
        });
        if (targetOrg) {
          activeOrgId = targetOrg.id;
        }
      }

      let member = null;
      if (activeOrgId) {
        member = await this.prisma.client.member.findFirst({
          where: {
            organizationId: activeOrgId,
            userId: user.id,
            deletedAt: null,
          },
          include: {
            organization: true,
          },
        });
      }

      if (!member) {
        member = await this.prisma.client.member.findFirst({
          where: {
            userId: user.id,
            deletedAt: null,
          },
          include: {
            organization: true,
          },
        });
      }

      const effectiveOrgSlug = member?.organization?.slug || orgSlug || "default";
      const effectiveOrgId = member?.organizationId || activeOrgId;

      let defaultLocationId = null;
      if (effectiveOrgId) {
        const loc = await this.prisma.client.inventoryLocation.findFirst({
          where: { organizationId: effectiveOrgId, isDefault: true },
          select: { id: true },
        }) || await this.prisma.client.inventoryLocation.findFirst({
          where: { organizationId: effectiveOrgId },
          select: { id: true },
        });
        if (loc) {
          defaultLocationId = loc.id;
        }
      }

      return {
        effectiveToken: token,
        token: token,
        effectiveOrgSlug,
        orgSlug: effectiveOrgSlug,
        locationId: defaultLocationId,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
        member: member ? { id: member.id, role: member.role } : null,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(error.message || "Authentication failed");
    }
  }

  async signUpWithEmail(dto: AndroidEmailSignUpDto) {
    try {
      const response = await this.authService.auth.api.signUpEmail({
        body: {
          email: dto.email,
          password: dto.password,
          name: dto.name,
        },
      });

      if (!response || !response.user) {
        throw new BadRequestException("Registration failed");
      }

      const user = response.user;
      let token = response.token || response.session?.token;
      if (!token && user.id) {
        const session = await this.prisma.client.session.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { token: true },
        });
        if (session) {
          token = session.token;
        }
      }

      return {
        effectiveToken: token || "",
        token: token || "",
        effectiveOrgSlug: dto.orgSlug || "default",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || "Registration failed");
    }
  }

  async loginMember(orgSlug: string, apiKey: string | undefined, dto: AndroidMemberLoginDto) {
    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, slug: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organization '${orgSlug}' not found`);
    }

    if (!dto.pin && !dto.cardId) {
      throw new BadRequestException("PIN or Card ID required for member login");
    }

    const whereClause: any = {
      organizationId: organization.id,
      deletedAt: null,
    };

    if (dto.cardId) whereClause.cardId = dto.cardId;

    const member = await this.prisma.client.member.findFirst({
      where: whereClause,
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException("Invalid PIN or member card credentials");
    }

    const defaultLoc = await this.prisma.client.inventoryLocation.findFirst({
      where: { organizationId: organization.id, isDefault: true },
      select: { id: true },
    }) || await this.prisma.client.inventoryLocation.findFirst({
      where: { organizationId: organization.id },
      select: { id: true },
    });

    let token = "";
    if (member.user) {
      const session = await this.prisma.client.session.findFirst({
        where: { userId: member.user.id },
        orderBy: { createdAt: "desc" },
        select: { token: true },
      });
      if (session) {
        token = session.token;
      }
    }

    return {
      effectiveToken: token || member.id,
      effectiveMemberId: member.id,
      organizationId: organization.id,
      locationId: defaultLoc?.id || null,
      name: member.user?.name || member.id,
      email: member.user?.email || null,
      role: member.role,
    };
  }

  async exchangeToken(dto: AndroidTokenExchangeDto) {
    const client = await this.prisma.client.v3ApiClient.findFirst({
      where: {
        clientId: dto.clientId,
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    if (!client || client.clientSecret !== dto.clientSecret) {
      throw new UnauthorizedException("Invalid client credentials");
    }

    return {
      accessToken: `v3_token_${client.clientId}_${Date.now()}`,
      tokenType: "Bearer",
      expiresIn: 86400,
      organizationId: client.organizationId,
      orgSlug: client.organization.slug,
    };
  }

  async logout(user: any) {
    if (user?.id) {
      await this.prisma.client.session.deleteMany({
        where: { userId: user.id },
      });
    }
    return { success: true, message: "Logged out successfully" };
  }
}
