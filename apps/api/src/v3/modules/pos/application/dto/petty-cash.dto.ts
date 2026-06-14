import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from "class-validator";
import { PaymentMethod } from "@repo/db";

export class RegisterPettyCashDto {
  @ApiProperty({
    example: "Buy milk for coffee",
    description: "Description of the expense",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 150.5, description: "Amount of the expense" })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: "petty-cash-fund-id" })
  @IsString()
  @IsOptional()
  pettyCashFundId?: string;
}
