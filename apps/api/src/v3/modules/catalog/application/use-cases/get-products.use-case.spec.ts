import {describe, it, expect, beforeEach, vi} from "vitest";
import {Test, TestingModule} from "@nestjs/testing";
import {IProductRepository} from "../../domain/repositories/product-repository.interface";
import {GetProductsUseCase} from "./get-products.use-case";
import {Product} from "../../domain/entities/product.entity";

describe("GetProductsUseCase", () => {
  let useCase: GetProductsUseCase;
  let repository: any;

  beforeEach(async () => {
    repository = {
      findByOrganization: vi.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsUseCase,
        {provide: IProductRepository, useValue: repository},
      ],
    }).compile();

    useCase = module.get<GetProductsUseCase>(GetProductsUseCase);
  });

  it("should return products for an organization", async () => {
    const orgId = "org-1";
    const products = [
      new Product(
        "1",
        "Prod 1",
        "Desc",
        orgId,
        "cat-1",
        new Date(),
        new Date(),
      ),
    ];
    repository.findByOrganization.mockResolvedValue(products);

    const result = await useCase.execute(orgId, {limit: 10, offset: 0});
    expect(result).toEqual(products);
    expect(repository.findByOrganization).toHaveBeenCalledWith(orgId, {
      limit: 10,
      offset: 0,
    });
  });
});
