import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class AddToCartDto {
  @ApiProperty()
  productId: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiProperty({default: 1})
  quantity: number;

  @ApiPropertyOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  customerId?: string;
}

export class RemoveFromCartDto {
  @ApiProperty()
  productId: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiPropertyOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  customerId?: string;
}

export class CartItemDto {
  @ApiProperty()
  productId: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiProperty()
  quantity: number;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({type: [CartItemDto]})
  items: CartItemDto[];

  @ApiPropertyOptional()
  customerId?: string;

  @ApiPropertyOptional()
  sessionId?: string;
}
