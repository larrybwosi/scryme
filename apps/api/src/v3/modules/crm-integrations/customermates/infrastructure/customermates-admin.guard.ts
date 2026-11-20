import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class CustomermatesAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId: string | undefined = request.v3Context?.organizationId;
    const memberId: string | undefined = request.v3Context?.memberId;

    if (!organizationId) throw new ForbiddenException("Organization not identified");

    if (request.v3Context?.authType === "v3_client") {
      return true;
    }
    if (!memberId) throw new ForbiddenException("Only organization admins can manage integrations");

    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId, deletedAt: null, isActive: true },
      select: { role: true },
    });
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      throw new ForbiddenException("Only organization admins can manage integrations");
    }
    return true;
  }
}
