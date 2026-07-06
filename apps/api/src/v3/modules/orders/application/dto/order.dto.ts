import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: "COMPLETED",
    description: "The new status of the order",
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class OrderResponseDto {
  @ApiProperty({
    description: "The unique identifier of the order",
    example: "ord_123",
  })
  id: string;

  @ApiProperty({
    description: "The current status of the order",
    example: "PENDING",
  })
  status: string;

  @ApiProperty({
    description: "The total amount of the order including taxes and discounts",
    example: 45.99,
  })
  totalAmount: number;

  @ApiProperty({
    description: "The date and time when the order was created",
    example: "2023-10-27T10:00:00.000Z",
  })
  createdAt: string;

  @ApiProperty({
    description: "The customer ID associated with the order",
    example: "cust_123",
    nullable: true,
  })
  customerId: string | null;

  @ApiProperty({
    description: "The location ID where the order was placed",
    example: "loc_123",
  })
  locationId: string;
}
