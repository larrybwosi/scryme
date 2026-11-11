import { describe, it, expect, beforeEach, vi } from "vitest";
import { V3HealthController } from "../health.controller";
import { PrismaService } from "@/prisma/prisma.service";

describe("V3HealthController", () => {
  let controller: V3HealthController;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      client: {
        $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      },
    } as any;
    controller = new V3HealthController(prisma);
  });

  it("should return healthy status on basic check", async () => {
    const res = await controller.getHealth();
    expect(res.status).toBe("healthy");
    expect(res.timestamp).toBeDefined();
  });

  it("should return pong on ping", async () => {
    const res = await controller.ping();
    expect(res.message).toBe("pong");
  });

  it("should return enhanced system health", async () => {
    const res = await controller.getEnhanced();
    expect(["healthy", "degraded"]).toContain(res.status);
    expect(res.checks.database.status).toBe("healthy");
  });
});
