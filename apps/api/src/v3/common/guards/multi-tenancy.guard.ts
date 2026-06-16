import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class MultiTenancyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isGql = context.getType() === ("graphql" as any);
    let orgSlug: string;
    let request: any;

    if (isGql) {
      const gqlContext = GqlExecutionContext.create(context);
      const args = gqlContext.getArgs();
      // Look for orgSlug in args directly or inside an 'input' object
      orgSlug = args.orgSlug || args.input?.orgSlug;
      request = gqlContext.getContext().reply.request;
    } else {
      request = context.switchToHttp().getRequest();
      orgSlug = request.params.orgSlug;
    }

    if (!orgSlug) {
      // If we still don't have orgSlug, maybe it's in the headers?
      orgSlug = request.headers["x-org-slug"] as string;
    }

    if (!orgSlug) {
      return true; // Handle non-tenant routes if any
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, slug: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with slug "${orgSlug}" not found`,
      );
    }

    request.organization = organization;
    return true;
  }
}
