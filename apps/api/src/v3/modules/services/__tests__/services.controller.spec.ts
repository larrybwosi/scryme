import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServicesController } from "../interfaces/http/services.controller";
import { CompleteBookingDto } from "../dto/service.dto";

describe("ServicesController", () => {
  let controller: ServicesController;
  let mockServiceManagement: any;
  let mockBookingService: any;
  let mockAnalyticsService: any;
  let mockStaffScheduling: any;

  beforeEach(() => {
    mockServiceManagement = {};
    mockBookingService = {
      completeBooking: vi.fn().mockResolvedValue({ id: "booking-123", status: "COMPLETED" }),
    };
    mockAnalyticsService = {};
    mockStaffScheduling = {};

    controller = new ServicesController(
      mockServiceManagement,
      mockBookingService,
      mockAnalyticsService,
      mockStaffScheduling,
    );
  });

  describe("completeBooking", () => {
    it("should pass req.v3Context.memberId to bookingService.completeBooking when v3Context is present", async () => {
      const req = {
        organization: { id: "org-100" },
        user: { id: "user-999", memberId: "member-user-fallback" },
        v3Context: { memberId: "member-v3-123" },
      };
      const dto: CompleteBookingDto = {};

      const result = await controller.completeBooking(req, "booking-123", dto);

      expect(mockBookingService.completeBooking).toHaveBeenCalledWith(
        "org-100",
        "booking-123",
        "member-v3-123",
        dto,
      );
      expect(result).toEqual({ id: "booking-123", status: "COMPLETED" });
    });

    it("should fallback to req.user.memberId when v3Context.memberId is absent", async () => {
      const req = {
        organization: { id: "org-100" },
        user: { id: "user-999", memberId: "member-user-456" },
      };
      const dto: CompleteBookingDto = {};

      await controller.completeBooking(req, "booking-123", dto);

      expect(mockBookingService.completeBooking).toHaveBeenCalledWith(
        "org-100",
        "booking-123",
        "member-user-456",
        dto,
      );
    });

    it("should fallback to req.user.id when both v3Context.memberId and user.memberId are absent", async () => {
      const req = {
        organization: { id: "org-100" },
        user: { id: "user-999" },
      };
      const dto: CompleteBookingDto = {};

      await controller.completeBooking(req, "booking-123", dto);

      expect(mockBookingService.completeBooking).toHaveBeenCalledWith(
        "org-100",
        "booking-123",
        "user-999",
        dto,
      );
    });
  });
});
