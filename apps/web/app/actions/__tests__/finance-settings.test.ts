import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    member: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    inventoryLocation: {
      findFirst: vi.fn(),
    },
    expenseCategory: {
      findFirst: vi.fn(),
    },
    budget: {
      findFirst: vi.fn(),
    },
    approvalWorkflow: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    approvalWorkflowStep: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    costCenter: {
      findMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    budgetAlert: {
      findMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(db)),
  },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  createApprovalWorkflow,
  updateApprovalWorkflow,
  deleteApprovalWorkflow,
  upsertCostCenter,
  upsertBudgetAlert,
} from "../finance-settings";

describe("Finance Settings Server Actions - BOLA/IDOR Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupAuth(role = "ADMIN", orgId = "org-1", memberId = "mem-1") {
    (getServerAuth as any).mockResolvedValue({
      organizationId: orgId,
      memberId: memberId,
    });
    (db.member.findUnique as any).mockResolvedValue({
      id: memberId,
      role: role,
    });
  }

  describe("createApprovalWorkflow", () => {
    it("should reject creation if location condition belongs to another organization", async () => {
      setupAuth();
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);

      await expect(
        createApprovalWorkflow({
          name: "Expense Workflow",
          triggerEvent: "EXPENSE_CREATED",
          steps: [
            {
              name: "Step 1",
              stepNumber: 1,
              allConditionsMustMatch: true,
              conditions: [{ type: "LOCATION" as any, locationId: "foreign-loc-id" }],
              actions: [],
            },
          ],
        }),
      ).rejects.toThrow("Location condition not found or belongs to another organization");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-loc-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.approvalWorkflow.create).not.toHaveBeenCalled();
    });

    it("should reject creation if approver member belongs to another organization", async () => {
      setupAuth();
      (db.member.findFirst as any).mockResolvedValue(null);

      await expect(
        createApprovalWorkflow({
          name: "Expense Workflow",
          triggerEvent: "EXPENSE_CREATED",
          steps: [
            {
              name: "Step 1",
              stepNumber: 1,
              allConditionsMustMatch: true,
              conditions: [],
              actions: [
                {
                  type: "SPECIFIC_MEMBER" as any,
                  specificMemberId: "foreign-member-id",
                  approvalMode: "ANY_ONE" as any,
                },
              ],
            },
          ],
        }),
      ).rejects.toThrow("Approver member not found or belongs to another organization");

      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-member-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.approvalWorkflow.create).not.toHaveBeenCalled();
    });
  });

  describe("updateApprovalWorkflow", () => {
    it("should reject update if workflow does not exist or belongs to another org", async () => {
      setupAuth();
      (db.approvalWorkflow.findFirst as any).mockResolvedValue(null);

      await expect(
        updateApprovalWorkflow("workflow-1", { name: "Updated Workflow" }),
      ).rejects.toThrow("Workflow not found or belongs to another organization");

      expect(db.approvalWorkflow.findFirst).toHaveBeenCalledWith({
        where: { id: "workflow-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.approvalWorkflowStep.deleteMany).not.toHaveBeenCalled();
    });

    it("should update workflow using updateMany scoped by id and organizationId", async () => {
      setupAuth();
      (db.approvalWorkflow.findFirst as any).mockResolvedValue({ id: "workflow-1" });
      (db.approvalWorkflow.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await updateApprovalWorkflow("workflow-1", {
        name: "Updated Workflow",
        description: "New desc",
        triggerEvent: "EXPENSE_CREATED",
        isActive: true,
        steps: [],
      });

      expect(result).toEqual({ success: true });
      expect(db.approvalWorkflowStep.deleteMany).toHaveBeenCalledWith({
        where: { approvalWorkflowId: "workflow-1", workflow: { organizationId: "org-1" } },
      });
      expect(db.approvalWorkflow.updateMany).toHaveBeenCalledWith({
        where: { id: "workflow-1", organizationId: "org-1" },
        data: expect.objectContaining({
          name: "Updated Workflow",
        }),
      });
    });
  });

  describe("deleteApprovalWorkflow", () => {
    it("should throw error if workflow does not exist in tenant during deletion", async () => {
      setupAuth();
      (db.approvalWorkflow.deleteMany as any).mockResolvedValue({ count: 0 });

      await expect(deleteApprovalWorkflow("foreign-workflow-1")).rejects.toThrow(
        "Workflow not found or belongs to another organization",
      );

      expect(db.approvalWorkflow.deleteMany).toHaveBeenCalledWith({
        where: { id: "foreign-workflow-1", organizationId: "org-1" },
      });
    });

    it("should delete workflow using deleteMany scoped by id and organizationId", async () => {
      setupAuth();
      (db.approvalWorkflow.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await deleteApprovalWorkflow("workflow-1");
      expect(result).toEqual({ success: true });
      expect(db.approvalWorkflow.deleteMany).toHaveBeenCalledWith({
        where: { id: "workflow-1", organizationId: "org-1" },
      });
    });
  });

  describe("upsertCostCenter", () => {
    it("should update cost center using updateMany scoped by id and organizationId", async () => {
      setupAuth();
      (db.costCenter.updateMany as any).mockResolvedValue({ count: 1 });
      (db.costCenter.findFirstOrThrow as any).mockResolvedValue({
        id: "cc-1",
        name: "IT Dept",
        code: "CC-IT",
      });

      const result = await upsertCostCenter({
        id: "cc-1",
        name: "IT Dept",
        code: "CC-IT",
      });

      expect(result).toEqual({ id: "cc-1", name: "IT Dept", code: "CC-IT" });
      expect(db.costCenter.updateMany).toHaveBeenCalledWith({
        where: { id: "cc-1", organizationId: "org-1" },
        data: expect.objectContaining({
          name: "IT Dept",
          code: "CC-IT",
        }),
      });
    });

    it("should throw error on update if cost center belongs to another organization", async () => {
      setupAuth();
      (db.costCenter.updateMany as any).mockResolvedValue({ count: 0 });

      await expect(
        upsertCostCenter({
          id: "foreign-cc",
          name: "Foreign CC",
          code: "CC-FOREIGN",
        }),
      ).rejects.toThrow("Cost center not found or belongs to another organization");
    });
  });

  describe("upsertBudgetAlert", () => {
    it("should reject budget alert if budgetId belongs to another organization", async () => {
      setupAuth();
      (db.budget.findFirst as any).mockResolvedValue(null);

      await expect(
        upsertBudgetAlert({
          budgetId: "foreign-budget-id",
          threshold: 80,
          recipients: ["user@example.com"],
        }),
      ).rejects.toThrow("Budget not found or belongs to another organization");

      expect(db.budget.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-budget-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.budgetAlert.create).not.toHaveBeenCalled();
    });

    it("should update budget alert using updateMany scoped by id and organizationId", async () => {
      setupAuth();
      (db.budget.findFirst as any).mockResolvedValue({ id: "budget-1" });
      (db.budgetAlert.updateMany as any).mockResolvedValue({ count: 1 });
      (db.budgetAlert.findFirstOrThrow as any).mockResolvedValue({
        id: "alert-1",
        budgetId: "budget-1",
        threshold: 85,
      });

      const result = await upsertBudgetAlert({
        id: "alert-1",
        budgetId: "budget-1",
        threshold: 85,
        recipients: ["admin@example.com"],
      });

      expect(result).toEqual({ id: "alert-1", budgetId: "budget-1", threshold: 85 });
      expect(db.budgetAlert.updateMany).toHaveBeenCalledWith({
        where: { id: "alert-1", organizationId: "org-1" },
        data: expect.objectContaining({
          budgetId: "budget-1",
          threshold: 85,
        }),
      });
    });
  });
});
