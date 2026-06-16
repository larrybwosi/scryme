import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { V3AuthCoreService } from "../../modules/auth-core/infrastructure/services/v3-auth-core.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ModuleRef } from "@nestjs/core";

@Injectable()
export class V3AuthGuard implements CanActivate {
  private v3AuthService: V3AuthCoreService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
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

    if (!this.v3AuthService) {
      this.v3AuthService = this.moduleRef.get(V3AuthCoreService, {
        strict: false,
      });
    }

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
