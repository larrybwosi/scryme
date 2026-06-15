import {ApiProperty} from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from "class-validator";
import {Type} from "class-transformer";

export class SaleItemDto {
  @ApiProperty({example: "var_123"})
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({example: 2})
  @IsNumber()
  quantity: number;

  @ApiProperty({
    example: 15.99,
    description: "Client provided price (validated against DB)",
  })
  @IsNumber()
  unitPrice: number;
}

export class SalePaymentDto {
  @ApiProperty({example: "CASH"})
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({example: 31.98})
  @IsNumber()
  amount: number;

  @ApiProperty({required: false})
  @IsString()
  @IsOptional()
  reference?: string;
}

export class ProcessSaleDto {
  @ApiProperty({type: [SaleItemDto]})
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({type: [SalePaymentDto]})
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => SalePaymentDto)
  payments: SalePaymentDto[];

  @ApiProperty({example: 0, required: false})
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({example: "+1234567890", required: false})
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({example: "Quick sale", required: false})
  @IsString()
  @IsOptional()
  notes?: string;
}
