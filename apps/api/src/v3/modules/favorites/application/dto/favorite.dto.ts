import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty, IsString, IsOptional} from "class-validator";

export class FavoriteDto {
  @ApiProperty({example: "prod_123"})
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({example: "cust_123", required: false})
  @IsString()
  @IsOptional()
  customerId?: string;
}

export class FavoriteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  createdAt: Date;
}
