import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Espresso Beans', description: 'The name of the product' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'High-quality arabica beans', description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 15.99, description: 'Base price of the product' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'SKU-123', description: 'Stock Keeping Unit' })
  @IsString()
  @IsOptional()
  sku?: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: 'prod_123' })
  id: string;

  @ApiProperty({ example: 'Espresso Beans' })
  name: string;

  @ApiProperty({ example: 15.99 })
  price: number;

  @ApiProperty({ example: 'SKU-123' })
  sku: string;
}
