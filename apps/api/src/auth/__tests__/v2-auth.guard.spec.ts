import { V2AuthGuard } from "../v2-auth.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("V2AuthGuard", () => {
  let guard: V2AuthGuard;
  let reflector: Reflector;
  let prisma: any;
  let redis: any;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      client: {
        member: {
          findUnique: vi.fn(),
        },
      },
    };
    redis = {};
    guard = new V2AuthGuard(reflector, prisma, redis);
  });

  it("should return true when execution context is ws (WebSocket)", async () => {
    const wsContext = {
      getType: () => "ws",
      switchToHttp: () => ({
        getRequest: () => undefined,
      }),
      getHandler: () => () => {},
      getClass: () => class {},
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(wsContext);
    expect(result).toBe(true);
  });

  it("should return true when request is undefined or non-http", async () => {
    const httpContext = {
      getType: () => "http",
      switchToHttp: () => ({
        getRequest: () => undefined,
      }),
      getHandler: () => () => {},
      getClass: () => class {},
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(httpContext);
    expect(result).toBe(true);
  });

  it("should bypass /v3/ HTTP requests", async () => {
    const httpContext = {
      getType: () => "http",
      switchToHttp: () => ({
        getRequest: () => ({
          url: "/api/v3/tasks",
          headers: {},
        }),
      }),
      getHandler: () => () => {},
      getClass: () => class {},
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(httpContext);
    expect(result).toBe(true);
  });
});
