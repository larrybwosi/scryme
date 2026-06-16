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
  @ApiProperty({ example: "ord_123" })
  id: string;

  @ApiProperty({ example: "PENDING" })
  status: string;

  @ApiProperty({ example: 45.99 })
  totalAmount: number;

  @ApiProperty({ example: "2023-10-27T10:00:00.000Z" })
  createdAt: string;
}
