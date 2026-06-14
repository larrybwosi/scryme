import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { V3AuthService } from "../../modules/auth/infrastructure/services/v3-auth.service";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class V3AuthGuard implements CanActivate {
  constructor(
    private readonly v3AuthService: V3AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authorization header",
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = await this.v3AuthService.verifyToken(token);

    if (payload.type !== "v3_client" && payload.type !== "v3_hybrid") {
      throw new UnauthorizedException("Invalid token type");
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { id: payload.organizationId },
    });

    if (!organization) {
      throw new UnauthorizedException("Organization not found");
    }

    // Verify orgSlug in URL matches the token if present
    const orgSlugHeader = request.headers["x-org-slug"];
    const orgSlugFromUrl =
      request.params.orgSlug ||
      (Array.isArray(orgSlugHeader) ? orgSlugHeader[0] : orgSlugHeader);

    if (orgSlugFromUrl && orgSlugFromUrl !== organization.slug) {
      throw new UnauthorizedException("Organization slug mismatch");
    }

    // Set V3 Context
    request.v3Context = {
      clientId: payload.clientId,
      organizationId: payload.organizationId,
      orgSlug: payload.orgSlug,
      scopes: payload.scopes,
      organization,
      memberId: payload.memberId,
      deviceId: payload.deviceId,
      locationId: payload.locationId,
      authType: payload.type,
    };

    // Also set req.organization for MultiTenancyGuard compatibility if needed
    request.organization = organization;

    return true;
  }
}
