import { Test, TestingModule } from "@nestjs/testing";
import { OrdersService } from "../orders.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V2ApiContext } from "@repo/shared/server";
import { BadRequestException } from "@nestjs/common";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              transaction: {
                findMany: vi.fn(),
                count: vi.fn(),
                findFirst: vi.fn(),
                create: vi.fn(),
              },
              productVariant: {
                findMany: vi.fn(),
              },
              $transaction: vi.fn(cb =>
                cb({
                  transaction: {
                    create: vi.fn().mockResolvedValue({
                      id: "new-id",
                      number: "ECO-000001",
                      status: "PENDING",
                      paymentStatus: "UNPAID",
                      finalTotal: 100,
                      currencyCode: "USD",
                      createdAt: new Date(),
                    }),
                  },
                }),
              ),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createOrder", () => {
    it("should throw BadRequestException for invalid input", async () => {
      const ctx: V2ApiContext = { organizationId: "org1" } as any;
      const body = {}; // Missing required fields

      await expect(service.createOrder(ctx, body)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
