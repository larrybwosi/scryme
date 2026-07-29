import { AdminController } from "../admin.controller";
import { AdminService } from "../../../infrastructure/services/admin.service";
import { BadRequestException } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("AdminController", () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    banUser: vi.fn(),
  };

  beforeEach(() => {
    adminService = mockAdminService as any;
    controller = new AdminController(adminService);
    vi.clearAllMocks();
  });

  describe("banUser", () => {
    it("should allow banning another user", async () => {
      const req = {
        user: { id: "caller-admin-id" },
      };
      const dto = { banReason: "test" };

      mockAdminService.banUser.mockResolvedValue({ id: "target-user-id", banned: true });

      const result = await controller.banUser(req, "target-user-id", dto);

      expect(result).toEqual({ id: "target-user-id", banned: true });
      expect(mockAdminService.banUser).toHaveBeenCalledWith("target-user-id", dto);
    });

    it("should throw BadRequestException on self-ban attempt", async () => {
      const req = {
        user: { id: "admin-user-id" },
      };
      const dto = { banReason: "test" };

      await expect(
        controller.banUser(req, "admin-user-id", dto)
      ).rejects.toThrow(new BadRequestException("You cannot ban yourself"));

      expect(mockAdminService.banUser).not.toHaveBeenCalled();
    });
  });
});
