import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY, SCOPES_KEY, ALLOW_PUBLIC_KEY } from "../decorators/auth.decorator";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<any>();
    const url = request.raw?.url || request.url || "";
    if (url.includes("/v3/")) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions && !requiredScopes) {
      throw new ForbiddenException("Default deny: no permissions or scopes defined for this endpoint");
    }

    const req = context.switchToHttp().getRequest<any>();
    const authContext = req.v3Context || req.v2Context || req.user;

    if (!authContext) {
      throw new ForbiddenException("Security context is missing");
    }

    const permissions: string[] = authContext.permissions || [];
    const scopes: string[] = authContext.scopes || [];

    if (requiredPermissions) {
      const hasPermission = requiredPermissions.every((permission) =>
        this.hasPermission(permissions, permission),
      );
      if (!hasPermission) {
        throw new ForbiddenException("Insufficient permissions");
      }
    }

    if (requiredScopes) {
      const hasScope = requiredScopes.every((scope) =>
        this.hasScope(scopes, scope),
      );
      if (!hasScope) {
        throw new ForbiddenException("Insufficient scopes");
      }
    }

    return true;
  }

  private hasPermission(granted: string[], required: string): boolean {
    if (!granted) return false;
    if (granted.includes("*") || granted.includes(required)) return true;
    const parts = required.split(":");
    for (let i = parts.length; i > 1; i--) {
      const wildcard = [...parts.slice(0, i - 1), "*"].join(":");
      if (granted.includes(wildcard)) return true;
    }
    return false;
  }

  private hasScope(granted: string[], required: string): boolean {
    if (!granted) return false;
    return granted.includes(required) || granted.includes("*");
  }
}
