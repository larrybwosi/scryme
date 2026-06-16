import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY, SCOPES_KEY } from "../decorators/auth.decorator";
import { V2ApiContext } from "@repo/shared/api/v2/types";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions && !requiredScopes) {
      return true;
    }

    const { v2Context } = context.switchToHttp().getRequest<any>();

    if (requiredPermissions) {
      const hasPermission = requiredPermissions.every((permission) =>
        this.hasPermission(v2Context.permissions, permission),
      );
      if (!hasPermission) {
        throw new ForbiddenException("Insufficient permissions");
      }
    }

    if (requiredScopes) {
      const hasScope = requiredScopes.every((scope) =>
        this.hasScope(v2Context.scopes, scope),
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
