import { ApiProperty } from "@nestjs/swagger";

export class InventoryResponseDto {
  @ApiProperty({
    description: "The unique identifier of the inventory record",
    example: "inv_123",
  })
  id: string;

  @ApiProperty({
    description: "The unique identifier of the product",
    example: "prod_123",
  })
  productId: string;

  @ApiProperty({
    description: "The available quantity in stock",
    example: 100,
  })
  quantity: number;

  @ApiProperty({
    description: "The ID of the location where this stock is stored",
    example: "loc_123",
  })
  locationId: string;

  @ApiProperty({
    description: "The ID of the product variant",
    example: "var_123",
  })
  variantId: string;

  @ApiProperty({
    description: "The SKU of the variant for quick reference",
    example: "SKU-BLUE-L",
  })
  sku: string;

  @ApiProperty({
    description: "Reserved quantity for pending orders",
    example: 5,
  })
  reservedQuantity: number;

  @ApiProperty({
    description: "Net available quantity (total - reserved)",
    example: 95,
  })
  availableQuantity: number;
}
