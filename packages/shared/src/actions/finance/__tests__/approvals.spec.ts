import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeApprovalDecisionCore } from "../approvals";
import { db } from "@repo/db";

vi.mock("@repo/db", () => {
  return {
    db: {
      approvalRequest: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      approvalDecision: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      expense: {
        update: vi.fn(),
      },
      purchase: {
        update: vi.fn(),
      },
    },
  };
});

describe("makeApprovalDecisionCore IDOR & Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw 'Request not found' when organizationId does not match (IDOR prevention)", async () => {
    // Simulate Prisma findFirst returning null because organizationId doesn't match
    vi.mocked(db.approvalRequest.findFirst).mockResolvedValue(null);

    await expect(
      makeApprovalDecisionCore("org_attacker", "member_1", {
        requestId: "req_victim_123",
        status: "APPROVED",
      }),
    ).rejects.toThrow("Request not found");

    expect(db.approvalRequest.findFirst).toHaveBeenCalledWith({
      where: {
        id: "req_victim_123",
        organizationId: "org_attacker",
      },
      include: expect.any(Object),
    });
  });

  it("should successfully process approval decision when organizationId matches", async () => {
    const mockRequest: any = {
      id: "req_123",
      organizationId: "org_authorized",
      currentStep: 1,
      requestType: "EXPENSE",
      relatedId: "exp_123",
      workflow: null,
    };

    vi.mocked(db.approvalRequest.findFirst).mockResolvedValue(mockRequest);
    vi.mocked(db.approvalDecision.findFirst).mockResolvedValue(null);
    vi.mocked(db.approvalDecision.create).mockResolvedValue({ id: "dec_1" } as any);
    vi.mocked(db.approvalRequest.update).mockResolvedValue(mockRequest);
    vi.mocked(db.expense.update).mockResolvedValue({ id: "exp_123" } as any);

    const result = await makeApprovalDecisionCore("org_authorized", "member_1", {
      requestId: "req_123",
      status: "APPROVED",
      comments: "LGTM",
    });

    expect(db.approvalRequest.findFirst).toHaveBeenCalledWith({
      where: {
        id: "req_123",
        organizationId: "org_authorized",
      },
      include: expect.any(Object),
    });

    expect(result.finalStatus).toBe("APPROVED");
  });
});
