import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";

@Injectable()
export class SystemAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const session = await this.authService.auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      throw new UnauthorizedException("Authentication required");
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      throw new ForbiddenException(
        "Only system administrators can perform this action",
      );
    }

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return true;
  }
}
