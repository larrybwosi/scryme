import {Test, TestingModule} from "@nestjs/testing";
import {GetOrdersUseCase} from "./get-orders.use-case";
import {Order} from "../../domain/entities/order.entity";
import {IOrderRepository} from "../../domain/repositories/order-repository.interface";
import {PaginationQueryDto} from "@/v3/common/utils/pagination";
import {describe, it, expect, beforeEach, vi} from "vitest";

describe("GetOrdersUseCase", () => {
  let useCase: GetOrdersUseCase;
  let repository: any;

  beforeEach(async () => {
    repository = {
      findByOrganization: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrdersUseCase,
        {provide: IOrderRepository, useValue: repository},
      ],
    }).compile();

    useCase = module.get<GetOrdersUseCase>(GetOrdersUseCase);
  });

  it("should return paginated orders for an organization", async () => {
    const orgId = "org-1";
    const orders = [
      new Order(
        "1",
        "ORD-1",
        "cust-1",
        "PENDING",
        100,
        orgId,
        "loc-1",
        new Date(),
        new Date(),
        [],
      ),
    ];
    const paginatedResponse = {
      data: orders,
      total: 1,
      limit: 10,
      offset: 0,
    };
    repository.findByOrganization.mockResolvedValue(paginatedResponse);

    const query: PaginationQueryDto = {limit: 10, offset: 0};
    const result = await useCase.execute(orgId, query);

    expect(result).toEqual(paginatedResponse);
    expect(repository.findByOrganization).toHaveBeenCalledWith(orgId, query);
  });
});
