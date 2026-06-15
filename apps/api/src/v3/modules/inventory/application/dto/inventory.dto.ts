import {ApiProperty} from "@nestjs/swagger";

export class InventoryResponseDto {
  @ApiProperty({example: "inv_123"})
  id: string;

  @ApiProperty({example: "prod_123"})
  productId: string;

  @ApiProperty({example: 100})
  quantity: number;

  @ApiProperty({example: "loc_123"})
  locationId: string;
}
