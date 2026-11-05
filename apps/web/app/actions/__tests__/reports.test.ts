import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
  getOrganizationContext: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    reportSettings: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    member: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    report: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    inventoryLocation: {
      findMany: vi.fn(),
    },
    department: {
      findMany: vi.fn(),
    },
    workflowEngineDefinition: {
      findMany: vi.fn(),
    },
  },
}));

import { getOrganizationContext } from "../auth";
import { prisma } from "@repo/db";
import {
  getReportSettingsAction,
  updateReportSettingsAction,
  getReportsListAction,
  getReportLocationsAndDepartmentsAction,
  triggerTestReportAction,
} from "../reports";

describe("reports server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error if context is missing organizationId", async () => {
    (getOrganizationContext as any).mockResolvedValue(null);
    await expect(getReportSettingsAction()).rejects.toThrow("Unauthorized");
  });

  it("should return existing report settings", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.reportSettings.findUnique as any).mockResolvedValue({
      id: "rs-1",
      organizationId: "org-1",
      formats: ["HTML", "MARKDOWN"],
      summaryPeriodDays: 7,
      workflowEnabled: true,
    });

    const res = await getReportSettingsAction();
    expect(res.id).toBe("rs-1");
    expect(res.formats).toContain("HTML");
    expect(res.summaryPeriodDays).toBe(7);
    expect(res.workflowEnabled).toBe(true);
  });

  it("should update report settings successfully", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.reportSettings.findUnique as any).mockResolvedValue({
      id: "rs-1",
      organizationId: "org-1",
    });
    (prisma.reportSettings.update as any).mockResolvedValue({
      id: "rs-1",
      formats: ["PDF", "CSV"],
      workflowEnabled: true,
      workflowKey: "f/dealio/sales_report",
      minRevenueThreshold: 1000,
    });

    const res = await updateReportSettingsAction({
      formats: ["PDF", "CSV"],
      workflowEnabled: true,
      workflowKey: "f/dealio/sales_report",
      minRevenueThreshold: 1000,
    });

    expect(res.success).toBe(true);
    expect(res.settings.workflowEnabled).toBe(true);
    expect(res.settings.minRevenueThreshold).toBe(1000);
  });

  it("should fetch report locations and workflows meta", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.inventoryLocation.findMany as any).mockResolvedValue([{ id: "loc-1", name: "Main Store", type: "STORE" }]);
    (prisma.department.findMany as any).mockResolvedValue([{ id: "dept-1", name: "Kitchen" }]);
    (prisma.workflowEngineDefinition.findMany as any).mockResolvedValue([{ id: "wf-1", key: "report_flow", name: "Report Flow" }]);

    const res = await getReportLocationsAndDepartmentsAction();
    expect(res.locations).toHaveLength(1);
    expect(res.departments).toHaveLength(1);
    expect(res.workflows).toHaveLength(1);
  });

  it("should trigger test report and log generated report record", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.member.findFirst as any).mockResolvedValue({ id: "mem-1" });
    (prisma.report.create as any).mockResolvedValue({
      id: "rep-1",
      organizationId: "org-1",
      type: "SALES_WEEKLY",
      summary: "Weekly sales report",
    });

    // Mock fetch failure to test fallback generation
    global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    const res = await triggerTestReportAction({ days: 7 });
    expect(res.success).toBe(true);
    expect(res.data.id).toBe("rep-1");
  });
});
