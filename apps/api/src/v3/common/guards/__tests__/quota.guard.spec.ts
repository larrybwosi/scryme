import { QuotaGuard } from "../quota.guard";
import { QuotaService } from "../../services/quota.service";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";

describe("QuotaGuard", () => {
  let guard: QuotaGuard;
  let reflector: Reflector;
  let quotaService: QuotaService;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    quotaService = {
      checkQuota: jest.fn(),
    } as any;

    guard = new QuotaGuard(reflector, quotaService);
  });

  const createMockContext = (request: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as any;

  it("should allow request if no @EnforceQuota metric metadata is present", async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext({});

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should allow super admins regardless of quota limits", async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue("maxProducts");
    const context = createMockContext({
      user: { role: "SUPER_ADMIN" },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should allow request if organization quota check passes", async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue("maxProducts");
    (quotaService.checkQuota as jest.Mock).mockResolvedValue({
      allowed: true,
      limit: 100,
      current: 5,
    });

    const context = createMockContext({
      user: { role: "MEMBER" },
      organization: { id: "org-1" },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(quotaService.checkQuota).toHaveBeenCalledWith("org-1", "maxProducts");
  });

  it("should throw ForbiddenException QUOTA_EXCEEDED when quota is reached", async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue("maxProducts");
    (quotaService.checkQuota as jest.Mock).mockResolvedValue({
      allowed: false,
      limit: 100,
      current: 100,
    });

    const context = createMockContext({
      user: { role: "MEMBER" },
      organization: { id: "org-1" },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
