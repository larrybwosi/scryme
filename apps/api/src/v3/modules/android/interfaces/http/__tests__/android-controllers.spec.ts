import { describe, it, expect, beforeEach, vi } from "vitest";
import { AndroidAuthController } from "../android-auth.controller";
import { AndroidMembersController } from "../android-members.controller";
import { AndroidShiftsController } from "../android-shifts.controller";
import { AndroidBranchController } from "../android-branch.controller";
import { AndroidPosController } from "../android-pos.controller";

describe("Android Controller Suite", () => {
  describe("AndroidAuthController", () => {
    let controller: AndroidAuthController;
    let mockAuthUseCase: any;
    let mockAndroidUseCase: any;

    beforeEach(() => {
      mockAuthUseCase = {
        loginWithEmail: vi.fn(),
        signUpWithEmail: vi.fn(),
        logout: vi.fn(),
      };
      mockAndroidUseCase = {
        getMe: vi.fn(),
        switchOrganization: vi.fn(),
      };
      controller = new AndroidAuthController(mockAuthUseCase, mockAndroidUseCase);
    });

    it("login should call androidAuthUseCase.loginWithEmail", async () => {
      const dto = { email: "test@scryme.com", password: "password123" };
      mockAuthUseCase.loginWithEmail.mockResolvedValue({ effectiveToken: "token_123" });

      const res = await controller.login(dto);

      expect(mockAuthUseCase.loginWithEmail).toHaveBeenCalledWith(dto);
      expect(res.effectiveToken).toBe("token_123");
    });

    it("signup should call androidAuthUseCase.signUpWithEmail", async () => {
      const dto = { email: "new@scryme.com", password: "password123", name: "New User" };
      mockAuthUseCase.signUpWithEmail.mockResolvedValue({ effectiveToken: "token_456" });

      const res = await controller.signup(dto);

      expect(mockAuthUseCase.signUpWithEmail).toHaveBeenCalledWith(dto);
      expect(res.effectiveToken).toBe("token_456");
    });

    it("getMe should delegate to androidUseCase.getMe", async () => {
      const req = { v3Context: { organizationId: "org-1" }, user: { id: "usr-1" } };
      mockAndroidUseCase.getMe.mockResolvedValue({ user: req.user });

      const res = await controller.getMe(req);

      expect(mockAndroidUseCase.getMe).toHaveBeenCalledWith(req.v3Context, req.user);
      expect(res.user.id).toBe("usr-1");
    });

    it("logout should delegate to androidAuthUseCase.logout", async () => {
      const req = { user: { id: "usr-1" } };
      mockAuthUseCase.logout.mockResolvedValue({ success: true });

      const res = await controller.logout(req);

      expect(mockAuthUseCase.logout).toHaveBeenCalledWith(req.user);
      expect(res.success).toBe(true);
    });
  });

  describe("AndroidMembersController", () => {
    let controller: AndroidMembersController;
    let mockUseCase: any;

    beforeEach(() => {
      mockUseCase = {
        getMembers: vi.fn(),
        getMemberById: vi.fn(),
        updateMember: vi.fn(),
        updateMemberStatus: vi.fn(),
      };
      controller = new AndroidMembersController(mockUseCase);
    });

    it("getMembers should delegate to members use case", async () => {
      const req = { v3Context: { organizationId: "org-1" } };
      mockUseCase.getMembers.mockResolvedValue([{ id: "mem-1" }]);

      const res = await controller.getMembers(req, "searchStr", "OWNER");

      expect(mockUseCase.getMembers).toHaveBeenCalledWith(req.v3Context, "searchStr", "OWNER");
      expect(res).toHaveLength(1);
    });

    it("updateStatus should update member status", async () => {
      const req = { v3Context: { organizationId: "org-1" } };
      const dto = { dutyStatus: "ONLINE" };
      mockUseCase.updateMemberStatus.mockResolvedValue({ id: "mem-1", dutyStatus: "ONLINE" });

      const res = await controller.updateStatus(req, "mem-1", dto);

      expect(mockUseCase.updateMemberStatus).toHaveBeenCalledWith(req.v3Context, "mem-1", dto);
      expect(res.dutyStatus).toBe("ONLINE");
    });
  });

  describe("AndroidShiftsController", () => {
    let controller: AndroidShiftsController;
    let mockUseCase: any;

    beforeEach(() => {
      mockUseCase = {
        getCurrentMemberShifts: vi.fn(),
        getOrganizationShifts: vi.fn(),
        createStaffShift: vi.fn(),
        addShiftBreak: vi.fn(),
        getShiftTrades: vi.fn(),
        requestShiftTrade: vi.fn(),
        processShiftTrade: vi.fn(),
        getStaffTasks: vi.fn(),
        createStaffTask: vi.fn(),
        updateStaffTask: vi.fn(),
      };
      controller = new AndroidShiftsController(mockUseCase);
    });

    it("getCurrentMemberShifts should delegate to shifts use case", async () => {
      const req = { v3Context: { organizationId: "org-1", memberId: "mem-1" } };
      mockUseCase.getCurrentMemberShifts.mockResolvedValue([{ id: "shift-1" }]);

      const res = await controller.getCurrentMemberShifts(req);

      expect(mockUseCase.getCurrentMemberShifts).toHaveBeenCalledWith(req.v3Context);
      expect(res).toHaveLength(1);
    });

    it("createStaffTask should delegate task creation", async () => {
      const req = { v3Context: { organizationId: "org-1" } };
      const dto = { title: "Clean registers" };
      mockUseCase.createStaffTask.mockResolvedValue({ id: "task-1", title: dto.title });

      const res = await controller.createStaffTask(req, dto);

      expect(mockUseCase.createStaffTask).toHaveBeenCalledWith(req.v3Context, dto);
      expect(res.title).toBe("Clean registers");
    });
  });

  describe("AndroidBranchController", () => {
    let controller: AndroidBranchController;
    let mockUseCase: any;

    beforeEach(() => {
      mockUseCase = {
        getBranchLocations: vi.fn(),
        getBranchDetails: vi.fn(),
      };
      controller = new AndroidBranchController(mockUseCase);
    });

    it("getBranchLocations should delegate to branch use case", async () => {
      const req = { v3Context: { organizationId: "org-1" } };
      mockUseCase.getBranchLocations.mockResolvedValue({ locations: [{ id: "loc-1" }] });

      const res = await controller.getBranchLocations(req);

      expect(mockUseCase.getBranchLocations).toHaveBeenCalledWith(req.v3Context);
      expect(res.locations).toHaveLength(1);
    });
  });

  describe("AndroidPosController", () => {
    let controller: AndroidPosController;
    let mockUseCase: any;

    beforeEach(() => {
      mockUseCase = {
        loginMember: vi.fn(),
        exchangeToken: vi.fn(),
        pairPosDevice: vi.fn(),
        authorizePosPairingSession: vi.fn(),
      };
      controller = new AndroidPosController(mockUseCase);
    });

    it("loginMember should delegate to pos use case", async () => {
      const req = { v3Context: { organizationId: "org-1" } };
      const dto = { pin: "1234" };
      mockUseCase.loginMember.mockResolvedValue({ effectiveToken: "token_pos" });

      const res = await controller.loginMember(req, "test-org", dto);

      expect(mockUseCase.loginMember).toHaveBeenCalledWith(req.v3Context, dto, "test-org");
      expect(res.effectiveToken).toBe("token_pos");
    });
  });
});
