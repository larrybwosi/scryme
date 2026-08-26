import { describe, it, expect, vi, beforeEach } from "vitest";
import { testWorkflow } from "../workflows";
import { db } from "@repo/db";

vi.mock("@repo/db", () => ({
  db: {
    approvalWorkflow: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    approvalWorkflowStep: {
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe("workflows service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("testWorkflow", () => {
    it("should simulate steps with AMOUNT_RANGE condition matching", async () => {
      const mockWorkflow = {
        id: "wf_1",
        organizationId: "org_1",
        steps: [
          {
            stepNumber: 1,
            name: "High Amount Step",
            allConditionsMustMatch: true,
            conditions: [
              {
                type: "AMOUNT_RANGE",
                minAmount: 100,
                maxAmount: 1000,
              },
            ],
            actions: [{ type: "ROLE" }],
          },
        ],
      };

      vi.mocked(db.approvalWorkflow.findUnique).mockResolvedValue(mockWorkflow as any);

      const resultsMatch = await testWorkflow("org_1", "wf_1", { amount: 500 });
      expect(resultsMatch).toHaveLength(1);
      expect(resultsMatch[0].executed).toBe(true);

      const resultsMismatch = await testWorkflow("org_1", "wf_1", { amount: 50 });
      expect(resultsMismatch).toHaveLength(1);
      expect(resultsMismatch[0].executed).toBe(false);
    });

    it("should simulate steps with LOCATION and EXPENSE_CATEGORY conditions", async () => {
      const mockWorkflow = {
        id: "wf_2",
        organizationId: "org_1",
        steps: [
          {
            stepNumber: 1,
            name: "Location and Category Step",
            allConditionsMustMatch: true,
            conditions: [
              {
                type: "LOCATION",
                locationId: "loc_north",
              },
              {
                type: "EXPENSE_CATEGORY",
                expenseCategoryId: "cat_travel",
              },
            ],
            actions: [{ type: "WINDMILL_SCRIPT" }],
          },
        ],
      };

      vi.mocked(db.approvalWorkflow.findUnique).mockResolvedValue(mockWorkflow as any);

      const matched = await testWorkflow("org_1", "wf_2", {
        locationId: "loc_north",
        expenseCategoryId: "cat_travel",
      });
      expect(matched[0].executed).toBe(true);

      const mismatched = await testWorkflow("org_1", "wf_2", {
        locationId: "loc_south",
        expenseCategoryId: "cat_travel",
      });
      expect(mismatched[0].executed).toBe(false);
    });

    it("should throw error if workflow is not found", async () => {
      vi.mocked(db.approvalWorkflow.findUnique).mockResolvedValue(null);
      await expect(testWorkflow("org_1", "non_existent", {})).rejects.toThrow("Workflow not found");
    });

    it("should throw error if organizationId does not match", async () => {
      vi.mocked(db.approvalWorkflow.findUnique).mockResolvedValue({
        id: "wf_1",
        organizationId: "other_org",
      } as any);

      await expect(testWorkflow("org_1", "wf_1", {})).rejects.toThrow("Unauthorized");
    });
  });
});
