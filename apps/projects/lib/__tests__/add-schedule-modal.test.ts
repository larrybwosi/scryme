import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../api";

vi.mock("../auth-client", () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: { token: "test-token", activeOrganizationId: "org-1", activeOrganizationSlug: "org-slug" },
        user: { id: "user-1" },
      },
    }),
  },
}));

vi.mock("../urls", () => ({
  getResolvedApiUrl: vi.fn().mockReturnValue("http://localhost:3002"),
}));

describe("Schedule and Shift Overlap Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates shift conflict detection accurately for overlapping intervals", () => {
    const existingShifts = [
      {
        id: "shift-1",
        memberId: "mem-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
    ];

    const shiftDifferentDay = {
      memberId: "mem-1",
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "17:00",
    };

    const hasConflict1 = existingShifts.some((s) => {
      if (!s.isActive) return false;
      if (s.memberId === shiftDifferentDay.memberId && s.dayOfWeek === shiftDifferentDay.dayOfWeek) {
        const [s1, sm1] = s.startTime.split(":").map(Number);
        const [s2, sm2] = s.endTime.split(":").map(Number);
        const [n1, nm1] = shiftDifferentDay.startTime.split(":").map(Number);
        const [n2, nm2] = shiftDifferentDay.endTime.split(":").map(Number);
        return Math.max(n1 * 60 + nm1, s1 * 60 + sm1) < Math.min(n2 * 60 + nm2, s2 * 60 + sm2);
      }
      return false;
    });

    expect(hasConflict1).toBe(false);

    const shiftOverlapping = {
      memberId: "mem-1",
      dayOfWeek: 1,
      startTime: "12:00",
      endTime: "18:00",
    };

    const hasConflict2 = existingShifts.some((s) => {
      if (!s.isActive) return false;
      if (s.memberId === shiftOverlapping.memberId && s.dayOfWeek === shiftOverlapping.dayOfWeek) {
        const [s1, sm1] = s.startTime.split(":").map(Number);
        const [s2, sm2] = s.endTime.split(":").map(Number);
        const [n1, nm1] = shiftOverlapping.startTime.split(":").map(Number);
        const [n2, nm2] = shiftOverlapping.endTime.split(":").map(Number);
        return Math.max(n1 * 60 + nm1, s1 * 60 + sm1) < Math.min(n2 * 60 + nm2, s2 * 60 + sm2);
      }
      return false;
    });

    expect(hasConflict2).toBe(true);
  });

  it("calls /v3/scheduling/bookings when scheduling a service booking", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        id: "bkg-123",
        serviceName: "Standard Service",
        status: "CONFIRMED",
      },
    });

    const payload = {
      memberId: "mem-1",
      serviceId: "srv-standard",
      scheduledStartTime: "2026-10-20T10:00:00.000Z",
      customerName: "Jane Doe",
      customerPhone: "+254700000000",
    };

    const res = await apiClient.post("/v3/scheduling/bookings", payload);
    expect(res.data.id).toBe("bkg-123");
    expect(postSpy).toHaveBeenCalledWith("/v3/scheduling/bookings", payload);
  });
});
