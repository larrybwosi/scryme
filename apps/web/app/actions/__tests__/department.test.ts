import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    department: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    inventoryLocation: {
      findFirst: vi.fn(),
    },
    costCenter: {
      findFirst: vi.fn(),
    },
    departmentMember: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    budget: {
      findFirst: vi.fn(),
      aggregate: vi.fn(),
    },
    purchaseApprovalChain: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
    },
    $transaction: vi.fn(callback => callback({
      budget: {
        create: vi.fn().mockResolvedValue({ id: "budget-1", name: "Q1 Budget" }),
      },
      department: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    })),
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

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  getDepartments,
  getDepartmentDetail,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addDepartmentMember,
  updateDepartmentMember,
  removeDepartmentMember,
  createDepartmentBudget,
  updateDepartmentActiveBudget,
  createDepartmentApprovalChain,
  toggleApprovalChainStatus,
} from "../department";

describe("Department Server Actions - BOLA Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDepartments", () => {
    it("should return error when unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await getDepartments();
      expect(result).toEqual({ success: false, error: "Unauthorized" });
      expect(db.department.findMany).not.toHaveBeenCalled();
    });

    it("should fetch departments scoped strictly to tenant organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findMany as any).mockResolvedValue([{ id: "dept-1", name: "Engineering" }]);

      const result = await getDepartments("Eng");
      expect(result).toEqual({ success: true, data: [{ id: "dept-1", name: "Engineering" }] });
      expect(db.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-1",
          }),
        }),
      );
    });
  });

  describe("createDepartment", () => {
    it("should reject creation if caller is not an ADMIN/OWNER", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "MEMBER" });

      const result = await createDepartment({ name: "Sales" });
      expect(result).toEqual({ success: false, error: "Forbidden: Only admins can manage departments" });
    });

    it("should reject creation if headId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue(null);
      (db.member.findFirst as any).mockResolvedValue(null);

      const result = await createDepartment({ name: "Sales", headId: "foreign-head-id" });
      expect(result).toEqual({
        success: false,
        error: "Department head not found or belongs to another organization",
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-head-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.department.create).not.toHaveBeenCalled();
    });

    it("should reject creation if locationId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue(null);
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);

      const result = await createDepartment({ name: "Sales", locationId: "foreign-loc-id" });
      expect(result).toEqual({
        success: false,
        error: "Location not found or belongs to another organization",
      });
      expect(db.department.create).not.toHaveBeenCalled();
    });

    it("should create department successfully when relational IDs belong to caller's org", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue(null);
      (db.member.findFirst as any).mockResolvedValue({ id: "valid-head-id" });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "valid-loc-id" });
      (db.costCenter.findFirst as any).mockResolvedValue({ id: "valid-cc-id" });
      (db.department.create as any).mockResolvedValue({ id: "dept-1", name: "Sales" });

      const result = await createDepartment({
        name: "Sales",
        headId: "valid-head-id",
        locationId: "valid-loc-id",
        costCenterId: "valid-cc-id",
      });

      expect(result).toEqual({ success: true, data: { id: "dept-1", name: "Sales" } });
      expect(db.department.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1",
          name: "Sales",
          headId: "valid-head-id",
          locationId: "valid-loc-id",
          costCenterId: "valid-cc-id",
        }),
      });
    });
  });

  describe("updateDepartment", () => {
    it("should reject update if department does not exist in caller's organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue(null);

      const result = await updateDepartment("foreign-dept-id", { name: "New Name" });
      expect(result).toEqual({ success: false, error: "Department not found" });
      expect(db.department.updateMany).not.toHaveBeenCalled();
    });

    it("should reject update if updated costCenterId belongs to foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue({ id: "dept-1", headId: null });
      (db.costCenter.findFirst as any).mockResolvedValue(null);

      const result = await updateDepartment("dept-1", { costCenterId: "foreign-cc-id" });
      expect(result).toEqual({
        success: false,
        error: "Cost center not found or belongs to another organization",
      });
      expect(db.department.updateMany).not.toHaveBeenCalled();
    });

    it("should execute updateMany scoped strictly by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue({ id: "dept-1", headId: null });
      (db.department.updateMany as any).mockResolvedValue({ count: 1 });
      (db.department.findFirstOrThrow as any).mockResolvedValue({ id: "dept-1", name: "Updated Dept" });

      const result = await updateDepartment("dept-1", { name: "Updated Dept" });

      expect(result).toEqual({ success: true, data: { id: "dept-1", name: "Updated Dept" } });
      expect(db.department.updateMany).toHaveBeenCalledWith({
        where: { id: "dept-1", organizationId: "org-1" },
        data: expect.objectContaining({ name: "Updated Dept" }),
      });
    });
  });

  describe("deleteDepartment", () => {
    it("should delete department using deleteMany scoped strictly by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await deleteDepartment("dept-1");
      expect(result).toEqual({ success: true });
      expect(db.department.deleteMany).toHaveBeenCalledWith({
        where: { id: "dept-1", organizationId: "org-1" },
      });
    });

    it("should return error if deleteMany count is 0 (foreign or non-existent department)", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.deleteMany as any).mockResolvedValue({ count: 0 });

      const result = await deleteDepartment("foreign-dept-1");
      expect(result).toEqual({ success: false, error: "Department not found" });
    });
  });

  describe("addDepartmentMember", () => {
    it("should reject adding member if department belongs to foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue(null);

      const result = await addDepartmentMember({
        departmentId: "foreign-dept",
        memberId: "mem-1",
        role: "MEMBER",
      });

      expect(result).toEqual({
        success: false,
        error: "Department not found or belongs to another organization",
      });
      expect(db.departmentMember.create).not.toHaveBeenCalled();
    });

    it("should reject adding member if target member belongs to foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue({ id: "dept-1" });
      (db.member.findFirst as any).mockResolvedValue(null);

      const result = await addDepartmentMember({
        departmentId: "dept-1",
        memberId: "foreign-member",
        role: "MEMBER",
      });

      expect(result).toEqual({
        success: false,
        error: "Member not found or belongs to another organization",
      });
      expect(db.departmentMember.create).not.toHaveBeenCalled();
    });
  });

  describe("updateDepartmentMember & removeDepartmentMember", () => {
    it("should reject updating member if department belongs to foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.departmentMember.findFirst as any).mockResolvedValue(null);

      const result = await updateDepartmentMember("dm-1", { role: "MANAGER" });
      expect(result).toEqual({ success: false, error: "Department member record not found" });
      expect(db.departmentMember.findFirst).toHaveBeenCalledWith({
        where: {
          id: "dm-1",
          department: { organizationId: "org-1" },
        },
        select: { id: true, departmentId: true },
      });
      expect(db.departmentMember.update).not.toHaveBeenCalled();
    });

    it("should reject removing member if department belongs to foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.departmentMember.findFirst as any).mockResolvedValue(null);

      const result = await removeDepartmentMember("dm-1");
      expect(result).toEqual({ success: false, error: "Department member record not found" });
      expect(db.departmentMember.delete).not.toHaveBeenCalled();
    });
  });

  describe("createDepartmentApprovalChain", () => {
    it("should reject chain creation if approver member belongs to foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.department.findFirst as any).mockResolvedValue({ id: "dept-1" });
      (db.member.findFirst as any).mockResolvedValue(null);

      const result = await createDepartmentApprovalChain({
        departmentId: "dept-1",
        name: "Chain 1",
        steps: [{ approverId: "foreign-approver", stepOrder: 1 }],
      });

      expect(result).toEqual({
        success: false,
        error: "Approver member foreign-approver not found or belongs to another organization",
      });
      expect(db.purchaseApprovalChain.create).not.toHaveBeenCalled();
    });
  });

  describe("toggleApprovalChainStatus", () => {
    it("should update approval chain status using updateMany scoped strictly by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
      (db.purchaseApprovalChain.updateMany as any).mockResolvedValue({ count: 1 });
      (db.purchaseApprovalChain.findFirstOrThrow as any).mockResolvedValue({ departmentId: "dept-1" });

      const result = await toggleApprovalChainStatus("chain-1", false);
      expect(result).toEqual({ success: true });
      expect(db.purchaseApprovalChain.updateMany).toHaveBeenCalledWith({
        where: { id: "chain-1", organizationId: "org-1" },
        data: { isActive: false },
      });
    });
  });
});
