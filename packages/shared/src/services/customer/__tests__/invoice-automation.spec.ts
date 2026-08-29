import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Declare hoisted mock objects using vi.hoisted
const { mockPrisma, mockNotify, mockRunAutomation } = vi.hoisted(() => {
  return {
    mockPrisma: {
      organization: {
        findMany: vi.fn(),
      },
      invoice: {
        findMany: vi.fn(),
      },
      customer: {
        findFirst: vi.fn(),
      },
      businessAccount: {
        findFirst: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      workflowEngineDefinition: {
        findUnique: vi.fn().mockResolvedValue({ id: "def-1" }),
        create: vi.fn().mockResolvedValue({ id: "def-1" }),
      },
      workflowEngineExecution: {
        create: vi.fn().mockResolvedValue({ id: "exec-1" }),
      },
      workflowEngineJob: {
        create: vi.fn().mockResolvedValue({ id: "job-1" }),
      },
    },
    mockNotify: vi.fn().mockResolvedValue({ id: "notif-123" }),
    mockRunAutomation: vi.fn().mockResolvedValue({ status: "success" }),
  };
});

vi.mock("@repo/db", () => ({
  prisma: mockPrisma,
  db: mockPrisma,
}));

vi.mock("@repo/notifications", () => ({
  NotificationEngine: class {
    notify = mockNotify;
  },
}));

vi.mock("../../automation", () => ({
  runAutomation: mockRunAutomation,
}));

import { InvoiceAutomationService } from "../invoice-automation.service";

describe("InvoiceAutomationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process organization invoice reminders concurrently and run reminders for matched schedule", async () => {
    const mockOrg1 = { id: "org-1", name: "Org 1" };
    const mockOrg2 = { id: "org-2", name: "Org 2" };

    mockPrisma.organization.findMany.mockResolvedValue([mockOrg1, mockOrg2]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 0 days overdue (today)
    const dueDateSchedule0 = new Date(today.getTime());
    // 3 days overdue
    const dueDateSchedule3 = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

    const mockInvoicesOrg1 = [
      {
        id: "inv-1",
        customer: "cust-1",
        grandTotal: 100,
        dueDate: dueDateSchedule0,
        status: "PENDING",
      },
      {
        id: "inv-2",
        customer: "cust-2",
        grandTotal: 200,
        dueDate: dueDateSchedule3,
        status: "SUBMITTED",
      },
    ];

    mockPrisma.invoice.findMany.mockResolvedValue(mockInvoicesOrg1);

    mockPrisma.customer.findFirst.mockImplementation(({ where }: any) => {
      if (where.OR && where.OR[0].id === "cust-1") {
        return Promise.resolve({ id: "cust-1", email: "cust1@test.com", name: "Customer One" });
      }
      if (where.OR && where.OR[0].id === "cust-2") {
        return Promise.resolve({ id: "cust-2", email: "cust2@test.com", name: "Customer Two" });
      }
      return Promise.resolve(null);
    });

    mockPrisma.businessAccount.findFirst.mockResolvedValue(null);

    mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
      if (where.email === "cust1@test.com") {
        return Promise.resolve({ id: "user-1", email: "cust1@test.com" });
      }
      if (where.email === "cust2@test.com") {
        return Promise.resolve({ id: "user-2", email: "cust2@test.com" });
      }
      return Promise.resolve(null);
    });

    await InvoiceAutomationService.runCustomerInvoiceReminders();

    // Verify organization lookup
    expect(mockPrisma.organization.findMany).toHaveBeenCalledTimes(1);

    // Verify invoice queries were executed for both orgs
    expect(mockPrisma.invoice.findMany).toHaveBeenCalledTimes(2);

    // Verify summary notifications were triggered via Windmill for overdue summary
    expect(mockRunAutomation).toHaveBeenCalledTimes(2);

    // Verify notification engine calls for customer reminders
    expect(mockNotify).toHaveBeenCalledTimes(4); // 2 orgs x 2 invoices
  });
});
