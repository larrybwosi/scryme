import { describe, it, expect, vi, beforeEach } from "vitest";
import { WindmillCallbackController } from "../WindmillCallbackController";
import { NotFoundException } from "@nestjs/common";

describe("WindmillCallbackController Security", () => {
  let controller: WindmillCallbackController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        windmillExecution: {
          findFirst: vi.fn(),
          updateMany: vi.fn(),
        },
      },
    };
    controller = new WindmillCallbackController(mockPrisma);
  });

  it("should enforce organizationId multi-tenant isolation when looking up execution", async () => {
    const payload: any = {
      jobId: "job-123",
      organizationId: "org-tenant-1",
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    };

    mockPrisma.client.windmillExecution.findFirst.mockResolvedValue({
      id: "exec-1",
      jobId: "job-123",
      organizationId: "org-tenant-1",
    });

    mockPrisma.client.windmillExecution.updateMany.mockResolvedValue({ count: 1 });

    const result = await controller.handleCallback(payload);

    expect(mockPrisma.client.windmillExecution.findFirst).toHaveBeenCalledWith({
      where: {
        jobId: "job-123",
        organizationId: "org-tenant-1",
      },
    });

    expect(mockPrisma.client.windmillExecution.updateMany).toHaveBeenCalledWith({
      where: {
        jobId: "job-123",
        organizationId: "org-tenant-1",
      },
      data: expect.objectContaining({
        status: "COMPLETED",
      }),
    });

    expect(result).toEqual({ success: true });
  });

  it("should throw NotFoundException if execution does not belong to the payload organizationId", async () => {
    const payload: any = {
      jobId: "job-123",
      organizationId: "org-tenant-attacker",
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    };

    mockPrisma.client.windmillExecution.findFirst.mockResolvedValue(null);

    await expect(controller.handleCallback(payload)).rejects.toThrow(
      NotFoundException,
    );

    expect(mockPrisma.client.windmillExecution.findFirst).toHaveBeenCalledWith({
      where: {
        jobId: "job-123",
        organizationId: "org-tenant-attacker",
      },
    });
  });
});
