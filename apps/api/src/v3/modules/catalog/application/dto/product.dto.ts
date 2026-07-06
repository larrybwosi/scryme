import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateProductDto {
  @ApiProperty({
    example: "Espresso Beans",
    description: "The name of the product",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "High-quality arabica beans",
    description: "Product description",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 15.99, description: "Base price of the product" })
  @IsNumber()
  price: number;

  @ApiProperty({ example: "SKU-123", description: "Stock Keeping Unit" })
  @IsString()
  @IsOptional()
  sku?: string;
}

export class ProductResponseDto {
  @ApiProperty({
    description: "The unique identifier of the product",
    example: "prod_123",
  })
  id: string;

  @ApiProperty({
    description: "The name of the product",
    example: "Espresso Beans",
  })
  name: string;

  @ApiProperty({
    description: "The base price of the product",
    example: 15.99,
  })
  price: number;

  @ApiProperty({
    description: "The primary SKU of the product",
    example: "SKU-123",
  })
  sku: string;

  @ApiProperty({
    description: "A short description of the product",
    example: "High-quality arabica beans",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "The date and time when the product was created",
    example: "2023-10-27T10:00:00.000Z",
  })
  createdAt: string;

  @ApiProperty({
    description: "Whether the product is currently active and sellable",
    example: true,
  })
  isActive: boolean;
}
