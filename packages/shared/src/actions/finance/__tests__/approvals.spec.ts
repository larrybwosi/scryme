import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitForApprovalCore, makeApprovalDecisionCore } from "../approvals";
import { db } from "@repo/db";

vi.mock("@repo/db", () => {
  return {
    db: {
      approvalWorkflow: {
        findFirst: vi.fn(),
      },
      approvalRequest: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      approvalDecision: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      expense: {
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      purchase: {
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      member: {
        findMany: vi.fn(),
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

    expect(db.expense.updateMany).toHaveBeenCalledWith({
      where: {
        id: "exp_123",
        organizationId: "org_authorized",
      },
      data: { status: "APPROVED" },
    });

    expect(result.finalStatus).toBe("APPROVED");
  });

  it("should throw error during submitForApprovalCore when related expense does not belong to organizationId", async () => {
    vi.mocked(db.approvalWorkflow.findFirst).mockResolvedValue(null);
    vi.mocked(db.approvalRequest.create).mockResolvedValue({ id: "req_new_1" } as any);
    vi.mocked(db.member.findMany).mockResolvedValue([]);
    vi.mocked(db.expense.findFirst).mockResolvedValue(null);

    await expect(
      submitForApprovalCore("org_attacker", "member_1", {
        relatedId: "exp_victim_999",
        type: "EXPENSE",
        amount: 100,
        relatedRecordNumber: "EXP-001",
      }),
    ).rejects.toThrow("Expense not found or unauthorized");

    expect(db.expense.findFirst).toHaveBeenCalledWith({
      where: {
        id: "exp_victim_999",
        organizationId: "org_attacker",
      },
      select: { id: true },
    });
  });

  it("should successfully submit for approval and update status via updateMany when expense exists for tenant", async () => {
    vi.mocked(db.approvalWorkflow.findFirst).mockResolvedValue(null);
    vi.mocked(db.approvalRequest.create).mockResolvedValue({ id: "req_new_2" } as any);
    vi.mocked(db.member.findMany).mockResolvedValue([{ id: "admin_1" }] as any);
    vi.mocked(db.expense.findFirst).mockResolvedValue({ id: "exp_100" } as any);
    vi.mocked(db.expense.updateMany).mockResolvedValue({ count: 1 } as any);

    const request = await submitForApprovalCore("org_authorized", "member_1", {
      relatedId: "exp_100",
      type: "EXPENSE",
      amount: 250,
      relatedRecordNumber: "EXP-002",
    });

    expect(request.id).toBe("req_new_2");
    expect(db.expense.updateMany).toHaveBeenCalledWith({
      where: {
        id: "exp_100",
        organizationId: "org_authorized",
      },
      data: { status: "PENDING_APPROVAL", approvalRequestId: "req_new_2" },
    });
  });
});
