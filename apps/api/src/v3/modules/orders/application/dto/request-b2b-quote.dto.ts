import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class B2BQuoteItemDto {
  @ApiProperty()
  @IsString()
  variantId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class RequestB2BQuoteDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  businessAccountId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ type: [B2BQuoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => B2BQuoteItemDto)
  items: B2BQuoteItemDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
