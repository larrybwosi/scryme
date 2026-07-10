import { AuthorizationGuard } from "../authorization.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("AuthorizationGuard", () => {
  let guard: AuthorizationGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AuthorizationGuard(reflector);
  });

  function createMockContext(options: {
    isPublic?: boolean;
    requiredPermissions?: string[];
    requiredScopes?: string[];
    v2Context?: any;
  }): ExecutionContext {
    const handler = () => {};
    const controller = class {};

    vi.spyOn(reflector, "getAllAndOverride").mockImplementation((key: string) => {
      if (key === "allowPublic") return options.isPublic;
      if (key === "permissions") return options.requiredPermissions;
      if (key === "scopes") return options.requiredScopes;
      return undefined;
    });

    const mockRequest = {
      v2Context: options.v2Context,
    };

    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  }

  it("should allow access when the endpoint is marked as public", () => {
    const context = createMockContext({ isPublic: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException when neither permissions nor scopes are defined and endpoint is NOT public (fail-closed)", () => {
    const context = createMockContext({ isPublic: false });
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException("Default deny: no permissions or scopes defined for this endpoint")
    );
  });

  it("should throw ForbiddenException when security context (v2Context) is missing", () => {
    const context = createMockContext({
      requiredPermissions: ["test:permission"],
      v2Context: null,
    });
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException("Security context is missing")
    );
  });

  it("should allow access when the required permissions are granted in v2Context", () => {
    const context = createMockContext({
      requiredPermissions: ["sales:read", "pos:write"],
      v2Context: {
        permissions: ["sales:read", "pos:write"],
        scopes: [],
      },
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException when a required permission is missing", () => {
    const context = createMockContext({
      requiredPermissions: ["sales:read", "pos:write"],
      v2Context: {
        permissions: ["sales:read"],
        scopes: [],
      },
    });
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException("Insufficient permissions")
    );
  });

  it("should allow access when wildcard permissions match", () => {
    const context = createMockContext({
      requiredPermissions: ["sales:read"],
      v2Context: {
        permissions: ["sales:*"],
        scopes: [],
      },
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when global wildcard * is granted", () => {
    const context = createMockContext({
      requiredPermissions: ["sales:read"],
      v2Context: {
        permissions: ["*"],
        scopes: [],
      },
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when the required scopes are granted", () => {
    const context = createMockContext({
      requiredScopes: ["openid", "profile"],
      v2Context: {
        permissions: [],
        scopes: ["openid", "profile"],
      },
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException when a required scope is missing", () => {
    const context = createMockContext({
      requiredScopes: ["openid", "profile"],
      v2Context: {
        permissions: [],
        scopes: ["openid"],
      },
    });
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException("Insufficient scopes")
    );
  });
});
