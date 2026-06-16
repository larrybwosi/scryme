import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
} from "class-validator";

export class UpdateSupplierProductDto {
  @ApiPropertyOptional({ description: "New cost price" })
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ description: "Supplier-specific SKU" })
  @IsString()
  @IsOptional()
  supplierSku?: string;

  @ApiPropertyOptional({
    description: "Is this the preferred supplier for this product/variant?",
  })
  @IsBoolean()
  @IsOptional()
  isPreferred?: boolean;
}
