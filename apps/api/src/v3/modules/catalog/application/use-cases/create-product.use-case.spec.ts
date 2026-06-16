import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { IProductRepository } from "../../domain/repositories/product-repository.interface";
import { CreateProductUseCase } from "./create-product.use-case";
import { Product } from "../../domain/entities/product.entity";

describe("CreateProductUseCase", () => {
  let useCase: CreateProductUseCase;
  let productRepository: any;

  beforeEach(async () => {
    productRepository = {
      save: vi.fn() as any,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
        { provide: IProductRepository, useValue: productRepository },
      ],
    }).compile();

    useCase = module.get<CreateProductUseCase>(CreateProductUseCase);
  });

  it("should create and save a product", async () => {
    const dto = {
      name: "New Product",
      description: "A great product",
      organizationId: "org-1",
      price: 10.99,
    };

    productRepository.save.mockImplementation((p: Product) =>
      Promise.resolve(p),
    );

    const result = await useCase.execute(dto);

    expect(result.name).toBe(dto.name);
    expect(result.organizationId).toBe(dto.organizationId);
    expect(productRepository.save).toHaveBeenCalled();
  });
});
