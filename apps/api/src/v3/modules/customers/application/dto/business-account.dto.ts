import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateBusinessAccountDto {
  @ApiProperty({ example: "Acme Corp" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "TAX-123456", required: false })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiProperty({ example: "loc_123", required: false })
  @IsString()
  @IsOptional()
  defaultLocationId?: string;
}
