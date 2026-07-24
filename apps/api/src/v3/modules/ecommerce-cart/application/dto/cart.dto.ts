import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AddToCartDto {
  @ApiPropertyOptional()
  productId?: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiPropertyOptional()
  serviceId?: string;

  @ApiPropertyOptional()
  bookingDetails?: any; // Holds { scheduledStartTime, staffIds, resourceIds, notes }

  @ApiProperty({ default: 1 })
  quantity: number;

  @ApiPropertyOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  customerId?: string;
}

export class RemoveFromCartDto {
  @ApiPropertyOptional()
  productId?: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiPropertyOptional()
  serviceId?: string;

  @ApiPropertyOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  customerId?: string;
}

export class CartItemDto {
  @ApiPropertyOptional()
  productId?: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiPropertyOptional()
  serviceId?: string;

  @ApiPropertyOptional()
  bookingDetails?: any;

  @ApiProperty()
  quantity: number;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: [CartItemDto] })
  items: CartItemDto[];

  @ApiPropertyOptional()
  customerId?: string;

  @ApiPropertyOptional()
  sessionId?: string;
}
