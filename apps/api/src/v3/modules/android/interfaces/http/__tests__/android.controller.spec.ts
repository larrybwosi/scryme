import { describe, it, expect, beforeEach, vi } from "vitest";
import { AndroidController } from "../android.controller";

describe("AndroidController", () => {
  let controller: AndroidController;
  let mockUseCase: any;

  beforeEach(() => {
    mockUseCase = {
      getMe: vi.fn(),
      switchOrganization: vi.fn(),
      registerDevice: vi.fn(),
      getDashboardSummary: vi.fn(),
    };

    controller = new AndroidController(mockUseCase as any);
  });

  it("getMe should delegate to androidUseCase.getMe", async () => {
    const req = {
      v3Context: { organizationId: "org-1", memberId: "mem-1" },
      user: { id: "usr-1" },
    };

    mockUseCase.getMe.mockResolvedValue({ user: req.user, activeOrganization: { id: "org-1" } });

    const result = await controller.getMe(req);

    expect(mockUseCase.getMe).toHaveBeenCalledWith(req.v3Context, req.user);
    expect(result.activeOrganization.id).toBe("org-1");
  });

  it("switchOrganization should delegate to androidUseCase.switchOrganization", async () => {
    const req = { v3Context: { organizationId: "org-1" }, user: { id: "usr-1" } };
    const dto = { organizationId: "org-2" };

    mockUseCase.switchOrganization.mockResolvedValue({ success: true });

    const result = await controller.switchOrganization(req, dto);

    expect(mockUseCase.switchOrganization).toHaveBeenCalledWith(req.v3Context, req.user, dto);
    expect(result.success).toBe(true);
  });

  it("registerDevice should delegate to androidUseCase.registerDevice", async () => {
    const req = { v3Context: { organizationId: "org-1", memberId: "mem-1" } };
    const dto = { deviceId: "android-dev-123" };

    mockUseCase.registerDevice.mockResolvedValue({ success: true });

    const result = await controller.registerDevice(req, dto);

    expect(mockUseCase.registerDevice).toHaveBeenCalledWith(req.v3Context, dto);
    expect(result.success).toBe(true);
  });

  it("getDashboardSummary should delegate to androidUseCase.getDashboardSummary", async () => {
    const req = { v3Context: { organizationId: "org-1" } };

    mockUseCase.getDashboardSummary.mockResolvedValue({ todaySales: { totalAmount: 100 } });

    const result = await controller.getDashboardSummary(req);

    expect(mockUseCase.getDashboardSummary).toHaveBeenCalledWith(req.v3Context);
    expect(result.todaySales.totalAmount).toBe(100);
  });
});
