import { Test, TestingModule } from "@nestjs/testing";
import { UpdateOrderStatusUseCase } from "./update-order-status.use-case";
import { Order } from "../../domain/entities/order.entity";
import { IOrderRepository } from "../../domain/repositories/order-repository.interface";
import { ApiRealtimeService } from "../../../../../common/services/realtime.service";
import { WebhookService } from "../../../webhooks/infrastructure/services/webhook.service";
import { LoyaltyService } from "../../../loyalty/application/loyalty.service";
import { InvoiceUseCase } from "../../../finance/application/use-cases/invoice.use-case";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";

describe("UpdateOrderStatusUseCase", () => {
  let useCase: UpdateOrderStatusUseCase;
  let repository: any;
  let realtimeService: any;
  let webhookService: any;
  let loyaltyService: any;
  let invoiceUseCase: any;

  beforeEach(async () => {
    repository = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    realtimeService = {
      publish: vi.fn(),
    };
    webhookService = {
      dispatch: vi.fn(),
    };
    loyaltyService = {
      calculatePointsForTransaction: vi.fn(),
      awardPoints: vi.fn(),
    };
    invoiceUseCase = {
      createInvoiceFromOrder: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrderStatusUseCase,
        { provide: IOrderRepository, useValue: repository },
        { provide: ApiRealtimeService, useValue: realtimeService },
        { provide: WebhookService, useValue: webhookService },
        { provide: LoyaltyService, useValue: loyaltyService },
        { provide: InvoiceUseCase, useValue: invoiceUseCase },
      ],
    }).compile();

    useCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
  });

  it("should update order status successfully if organization matches", async () => {
    const orgId = "org-1";
    const orderId = "order-1";
    const order = new Order(
      orderId,
      "ORD-1",
      "cust-1",
      "PENDING",
      100,
      orgId,
      "loc-1",
      new Date(),
      new Date(),
      [],
    );

    repository.findById.mockResolvedValue(order);
    repository.save.mockImplementation((o) => Promise.resolve(o));

    const result = await useCase.execute(orgId, orderId, "COMPLETED");

    expect(result.status).toBe("COMPLETED");
    expect(repository.findById).toHaveBeenCalledWith(orderId, orgId);
    expect(repository.save).toHaveBeenCalled();
  });

  it("should throw NotFoundException if organization does not match", async () => {
    const orgId = "org-1";
    const hackerOrgId = "hacker-org";
    const orderId = "order-1";

    // Repository returns null because of organization mismatch in findFirst (mocked here)
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(hackerOrgId, orderId, "COMPLETED")).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findById).toHaveBeenCalledWith(orderId, hackerOrgId);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
