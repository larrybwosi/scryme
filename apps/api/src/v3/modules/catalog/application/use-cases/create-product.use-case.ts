import {Injectable, Inject} from "@nestjs/common";
import {IProductRepository} from "../../domain/repositories/product-repository.interface";
import {Product} from "../../domain/entities/product.entity";
import {CreateProductDto} from "../dto/product.dto";
import * as crypto from "crypto";

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(IProductRepository)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    dto: CreateProductDto & {organizationId: string},
  ): Promise<Product> {
    const product = new Product(
      crypto.randomUUID(),
      dto.name,
      dto.description || null,
      dto.organizationId,
      "placeholder-category-id",
      new Date(),
      new Date(),
    );

    return this.productRepository.save(product);
  }
}
